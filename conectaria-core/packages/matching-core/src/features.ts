/**
 * packages/matching-core/src/features.ts
 *
 * Projeção de entidades para o vetor de features que o motor consome.
 *
 * A razão desta camada existir separada do motor: é aqui, e só aqui, que se
 * garante que feature proibida nunca chega ao cálculo. Se a checagem morasse
 * dentro do engine, cada caminho novo de entrada precisaria lembrar de fazer
 * a verificação, e um dia alguém esqueceria. Aqui é passagem obrigatória.
 */
import type {
  Candidato, Empresa, Vaga, EixoId, SourcedValue, Fonte,
} from '../../contracts/src/index.ts';
import { EIXO_IDS, exigirEixosCompletos } from '../../contracts/src/index.ts';
import type { Politica } from '../../recommendation-policy/src/index.ts';

export class ErroFeatureProibida extends Error {}

export type Feature = {
  id: string;
  valor: number | string | string[];
  fonte: Fonte;
  confidence: number;
};

export type VetorFeatures = {
  featureSchemaVersion: string;
  porId: Map<string, Feature>;
};

function nova<T extends number | string | string[]>(
  id: string, v: SourcedValue<T>,
): Feature {
  return { id, valor: v.value, fonte: v.source, confidence: v.confidence };
}

/**
 * Monta o vetor e valida contra a política. Duas garantias:
 *  1. nada da denylist entra, nem por acidente de nome;
 *  2. nada fora da allowlist entra, o que impede feature nova aparecer
 *     no modelo sem ninguém ter aprovado.
 */
export function projetar(
  entidade: { candidato?: Candidato; empresa?: Empresa; vaga?: Vaga },
  politica: Politica,
): VetorFeatures {
  const porId = new Map<string, Feature>();
  const deny = new Set(politica.features.denylist);
  const allow = new Set(politica.features.allowlist);

  const por = (f: Feature) => {
    if (deny.has(f.id)) {
      throw new ErroFeatureProibida(
        `feature "${f.id}" está na denylist da política ${politica.policy_version}. ` +
        'Ver seção 13.1: proxy de característica protegida não entra no modelo.',
      );
    }
    if (!allow.has(f.id)) {
      throw new ErroFeatureProibida(
        `feature "${f.id}" não está na allowlist da política ${politica.policy_version}. ` +
        'Feature entra por lista positiva; adicione à política e versione.',
      );
    }
    porId.set(f.id, f);
  };

  const { candidato, empresa, vaga } = entidade;

  if (candidato) {
    exigirEixosCompletos(candidato.eixos, `candidato ${candidato.id}`);
    for (const id of EIXO_IDS) por(nova(`eixo.${id}`, candidato.eixos[id]));
    por(nova('contexto.uf', candidato.uf));
    por(nova('contexto.modelo', candidato.modelos));
    if (candidato.pretensao) por(nova('contexto.pretensao', candidato.pretensao));
    for (const c of candidato.competencias) {
      // skill.nivel é uma família de features; o id do skill vai no valor,
      // não no id da feature, para a allowlist não crescer a cada skill nova.
      const f = nova('skill.nivel', c.nivel);
      porId.set(`skill.nivel:${c.skillId}`, { ...f, id: 'skill.nivel' });
    }
  }

  if (empresa) {
    exigirEixosCompletos(empresa.eixos, `empresa ${empresa.id}`);
    for (const id of EIXO_IDS) por(nova(`eixo.${id}`, empresa.eixos[id]));
  }

  if (vaga) {
    por({ id: 'vaga.familia', valor: vaga.familia, fonte: 'company', confidence: 1 });
    por({ id: 'vaga.faixa', valor: vaga.faixaMax, fonte: 'company', confidence: 1 });
  }

  return { featureSchemaVersion: politica.feature_schema_version, porId };
}

/**
 * Confiança agregada de um conjunto de valores, ponderada pela fonte.
 *
 * Um perfil montado por extração de currículo (`document`, peso 0.7) vale
 * menos que o mesmo perfil confirmado pela pessoa (`user`, peso 1.0). É isso
 * que impede a plataforma de tratar inferência como fato por acidente.
 */
export function confiancaDe(
  valores: Array<SourcedValue<unknown>>,
  politica: Politica,
): number {
  if (!valores.length) return 0;
  const soma = valores.reduce((acc, v) => {
    const pesoFonte = politica.confianca.peso_fonte[v.source] ?? 0.5;
    return acc + Math.max(0, Math.min(1, v.confidence)) * pesoFonte;
  }, 0);
  return soma / valores.length;
}

export function eixosNumericos(e: Record<EixoId, SourcedValue<number>>): Record<EixoId, number> {
  const saida = {} as Record<EixoId, number>;
  for (const id of EIXO_IDS) saida[id] = e[id].value;
  return saida;
}
