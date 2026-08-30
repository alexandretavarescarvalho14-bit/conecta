/**
 * packages/recommendation-policy
 *
 * Pesos, tolerâncias e thresholds são artefato versionado, não constante de
 * código. O motivo é concreto: front-end, API, job offline e avaliação
 * histórica precisam ler exatamente os mesmos números. Enquanto isso vivia
 * dentro do JavaScript da página, cada superfície podia divergir em silêncio,
 * e reconstruir um score de três meses atrás era impossível.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EixoId, Fonte } from '../../contracts/src/index.ts';

export type EixoPolitica = {
  id: EixoId;
  grupo: 'Cultura' | 'Rotina' | 'Perfil';
  nome: string;
  poloA: string;
  poloB: string;
  /** menor = eixo mais duro; distância dói mais rápido */
  tolerancia: number;
};

export type Pesos = { tecnico: number; cultural: number; contexto: number };

export type Politica = {
  policy_version: string;
  taxonomy_version: string;
  feature_schema_version: string;
  explanation_version: string;
  eixos: EixoPolitica[];
  pesos_por_familia: Record<string, Pesos>;
  requisito_obrigatorio: { modo: 'cap' | 'zero' | 'peso'; nota_maxima: number };
  cultural: { fator_decaimento: number };
  contexto: {
    localidade: { compativel: number; incompativel: number };
    modelo: { compativel: number; incompativel: number };
    pretensao: { dentro: number; margem: number; fora: number; tolerancia_relativa: number };
  };
  confianca: {
    minima_para_publicar: number;
    revisar_abaixo_de: number;
    peso_fonte: Record<Fonte, number>;
  };
  features: { allowlist: string[]; denylist: string[] };
};

export class ErroPolitica extends Error {}

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'policies');

/** Congela em profundidade: política mutável em runtime é score irreprodutível. */
function congelar<T>(o: T): T {
  if (o && typeof o === 'object') {
    Object.values(o as Record<string, unknown>).forEach(congelar);
    Object.freeze(o);
  }
  return o;
}

export function validar(p: Politica): Politica {
  if (p.eixos.length !== 14) {
    throw new ErroPolitica(`política declara ${p.eixos.length} eixos, esperado 14`);
  }
  for (const e of p.eixos) {
    if (e.tolerancia <= 0) throw new ErroPolitica(`eixo ${e.id} sem tolerância positiva`);
  }
  for (const [familia, w] of Object.entries(p.pesos_por_familia)) {
    const soma = w.tecnico + w.cultural + w.contexto;
    if (Math.abs(soma - 1) > 1e-9) {
      throw new ErroPolitica(`pesos de "${familia}" somam ${soma}, esperado 1`);
    }
  }
  if (!p.pesos_por_familia._padrao) {
    throw new ErroPolitica('política sem "_padrao": família desconhecida ficaria sem peso');
  }
  const sobreposto = p.features.allowlist.filter((f) => p.features.denylist.includes(f));
  if (sobreposto.length) {
    throw new ErroPolitica(`feature em allow e deny ao mesmo tempo: ${sobreposto.join(', ')}`);
  }
  return p;
}

const cache = new Map<string, Politica>();

export function carregar(versao: string): Politica {
  const emCache = cache.get(versao);
  if (emCache) return emCache;
  let bruto: string;
  try {
    bruto = readFileSync(join(DIR, `${versao}.json`), 'utf8');
  } catch {
    throw new ErroPolitica(
      `política "${versao}" não encontrada. Disponíveis: ${listar().join(', ')}`,
    );
  }
  const p = congelar(validar(JSON.parse(bruto) as Politica));
  cache.set(versao, p);
  return p;
}

export function listar(): string[] {
  return readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
}

export const POLITICA_ATUAL = 'policy-2026.10.0';

export function pesosDe(p: Politica, familia: string): Pesos {
  return p.pesos_por_familia[familia] ?? p.pesos_por_familia._padrao;
}
