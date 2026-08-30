/**
 * packages/matching-core/src/trace.ts
 *
 * Policy gate e montagem do Recommendation Trace.
 *
 * O ponto desta camada: um score nunca é publicado direto. Ele passa por um
 * portão que pode liberar, mandar para revisão humana ou bloquear. E o que
 * sai não é um número, é um artefato imutável que permite reconstruir, três
 * meses depois, por que aquilo foi mostrado.
 */
import { createHash } from 'node:crypto';
import type {
  Candidato, Empresa, Vaga, ResultadoMatch, DecisaoPolitica,
  RecommendationTrace, Versoes, Evidencia,
} from '../../contracts/src/index.ts';
import type { Politica } from '../../recommendation-policy/src/index.ts';

/* ══════════════════════════════ policy gate ═════════════════════════════ */

export function avaliarPoliticas(
  r: ResultadoMatch,
  politica: Politica,
): DecisaoPolitica[] {
  const d: DecisaoPolitica[] = [];
  const conf = politica.confianca;

  if (r.confidence < conf.minima_para_publicar) {
    d.push({
      policyId: 'confianca.minima',
      outcome: 'block',
      reasonCode: 'CONFIANCA_ABAIXO_DO_MINIMO',
    });
  } else if (r.confidence < conf.revisar_abaixo_de) {
    d.push({
      policyId: 'confianca.revisao',
      outcome: 'review',
      reasonCode: 'CONFIANCA_EM_FAIXA_DE_REVISAO',
    });
  } else {
    d.push({ policyId: 'confianca.minima', outcome: 'allow', reasonCode: 'CONFIANCA_OK' });
  }

  // Score alto apoiado em lacuna obrigatória é o falso positivo mais caro:
  // gera entrevista que não deveria existir, dos dois lados.
  const furou = r.tecnico.evidencias.some((e) => e.reasonCode === 'REQ_OBRIGATORIO_AUSENTE');
  if (furou && r.total >= 60) {
    d.push({
      policyId: 'coerencia.obrigatorio',
      outcome: 'review',
      reasonCode: 'TOTAL_ALTO_COM_OBRIGATORIO_AUSENTE',
    });
  }

  return d;
}

export const desfechoFinal = (d: DecisaoPolitica[]): 'allow' | 'review' | 'block' =>
  d.some((x) => x.outcome === 'block') ? 'block'
    : d.some((x) => x.outcome === 'review') ? 'review'
      : 'allow';

/* ═══════════════════════════ hash determinístico ════════════════════════ */

/** JSON canônico: chaves ordenadas em qualquer profundidade. */
export function canonico(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonico).join(',')}]`;
  const o = v as Record<string, unknown>;
  const partes = Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonico(o[k])}`);
  return `{${partes.join(',')}}`;
}

export function hashEntrada(
  candidato: Candidato, vaga: Vaga, empresa: Empresa, versoes: Versoes,
): string {
  return createHash('sha256')
    .update(canonico({ candidato, vaga, empresa, versoes }))
    .digest('hex')
    .slice(0, 32);
}

/* ══════════════════════════════ montagem ════════════════════════════════ */

export type EntradaTrace = {
  recommendationId: string;
  candidato: Candidato;
  vaga: Vaga;
  empresa: Empresa;
  resultado: ResultadoMatch;
  politica: Politica;
  versoes: Pick<Versoes, 'embedding' | 'reranker'>;
  /** injetado, nunca lido do relógio: o motor precisa ser determinístico */
  generatedAt: string;
  validadeHoras?: number;
};

export function montarTrace(e: EntradaTrace): RecommendationTrace {
  const versions: Versoes = {
    candidateProfile: e.candidato.versao,
    vacancy: e.vaga.versao,
    taxonomy: e.politica.taxonomy_version,
    featureSchema: e.politica.feature_schema_version,
    embedding: e.versoes.embedding,
    reranker: e.versoes.reranker,
    policy: e.politica.policy_version,
    explanation: e.politica.explanation_version,
  };

  const evidence: Evidencia[] = [
    ...e.resultado.tecnico.evidencias,
    ...e.resultado.cultural.evidencias,
    ...e.resultado.contexto.evidencias,
  ];

  const geradoEm = new Date(e.generatedAt);
  const expira = new Date(geradoEm.getTime() + (e.validadeHoras ?? 72) * 3600_000);

  return Object.freeze({
    recommendationId: e.recommendationId,
    candidateId: e.candidato.id,
    vacancyId: e.vaga.id,
    scores: {
      technical: e.resultado.tecnico.nota,
      culture: e.resultado.cultural.nota,
      context: e.resultado.contexto.nota,
      total: e.resultado.total,
      confidence: e.resultado.confidence,
    },
    evidence,
    policyDecisions: avaliarPoliticas(e.resultado, e.politica),
    versions,
    generatedAt: e.generatedAt,
    expiresAt: expira.toISOString(),
    inputHash: hashEntrada(e.candidato, e.vaga, e.empresa, versions),
  });
}
