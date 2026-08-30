/**
 * Fixtures determinísticas. O candidato canônico é o mesmo do ADR 001:
 * RH sênior em Recife, usado como baseline em todos os testes.
 */
import type { Candidato, Empresa, Vaga, Eixos, EixoId, SourcedValue, Fonte }
  from '../../contracts/src/index.ts';
import { EIXO_IDS } from '../../contracts/src/index.ts';

export const AGORA = '2026-09-01T12:00:00.000Z';

export function sv<T>(value: T, source: Fonte = 'user', confidence = 1): SourcedValue<T> {
  return { value, source, confidence, observedAt: AGORA, confirmedAt: AGORA };
}

export function eixos(v: Partial<Record<EixoId, number>>, fonte: Fonte = 'user', conf = 1): Eixos {
  const saida = {} as Eixos;
  for (const id of EIXO_IDS) saida[id] = sv(v[id] ?? 50, fonte, conf);
  return saida;
}

export const CANDIDATO: Candidato = {
  id: 'cand-001', versao: 'prof-v1',
  uf: sv('PE'),
  modelos: sv<Array<'presencial'|'hibrido'|'remoto'>>(['presencial', 'hibrido']),
  pretensao: sv(9500),
  competencias: [
    { skillId: 's01', nivel: sv(3) },
    { skillId: 's02', nivel: sv(3) },
    { skillId: 's06', nivel: sv(2) },
  ],
  eixos: eixos({ ritmo:58, autonomia:82, formal:30, erro:66, decisao:72, colab:54,
                 previsib:52, presenca:20, interrup:58, escopo:70,
                 senior:78, espec:40, dados:58, relacional:64 }),
};

export const EMPRESA: Empresa = {
  id: 'emp-aurora', versao: 'emp-v1',
  eixos: eixos({ ritmo:64, autonomia:78, formal:34, erro:62, decisao:70, colab:58,
                 previsib:56, presenca:14, interrup:66, escopo:74,
                 senior:76, espec:38, dados:52, relacional:68 }, 'company'),
};

export const VAGA_RH: Vaga = {
  id: 'vaga-001', versao: 'vaga-v1', empresaId: 'emp-aurora',
  familia: 'Gente', uf: 'PE', modelo: 'presencial',
  faixaMin: 9000, faixaMax: 11000,
  requisitos: [
    { skillId: 's01', peso: 3, obrigatorio: true },
    { skillId: 's02', peso: 3, obrigatorio: true },
    { skillId: 's06', peso: 2, obrigatorio: false },
    { skillId: 's07', peso: 2, obrigatorio: false },
    { skillId: 's03', peso: 1, obrigatorio: false },
  ],
};

export const VAGA_FIN: Vaga = {
  id: 'vaga-004', versao: 'vaga-v1', empresaId: 'emp-aurora',
  familia: 'Financeiro', uf: 'PE', modelo: 'hibrido',
  faixaMin: 3400, faixaMax: 4100,
  requisitos: [
    { skillId: 's10', peso: 3, obrigatorio: true },
    { skillId: 's12', peso: 2, obrigatorio: true },
  ],
};

export const ROTULOS: Record<string, string> = {
  s01: 'Processo seletivo', s02: 'Avaliação de desempenho', s03: 'Clima e engajamento',
  s06: 'Operação de varejo', s07: 'Gestão de equipe',
  s10: 'Conciliação financeira', s12: 'Excel avançado',
};
export const rotulo = (id: string) => ROTULOS[id] ?? id;

/** PRNG determinístico: teste de propriedade precisa ser reproduzível. */
export function prng(semente: number) {
  let s = semente >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
