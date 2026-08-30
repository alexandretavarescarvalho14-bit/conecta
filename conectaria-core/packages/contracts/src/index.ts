/**
 * packages/contracts
 *
 * Tipos compartilhados entre domínio, API, jobs e avaliação offline.
 * Sem dependência, sem import de framework: o domínio não conhece web,
 * banco, fila nem SDK de IA (regra de dependência, seção 6.3).
 */

/* ══════════════════════════ 1 · fatos e inferências ══════════════════════ */

export type Fonte = 'user' | 'conversation' | 'document' | 'company' | 'curator';

/**
 * Todo dado que entra no match carrega de onde veio e quanta confiança tem.
 *
 * A regra que este tipo existe para impor: IA sugere, pessoa confirma.
 * Um valor com `source: 'document'` e sem `confirmedAt` é candidato a fato,
 * não fato. O motor pondera confiança justamente para não tratar extração
 * automática como verdade por acidente.
 */
export type SourcedValue<T> = {
  value: T;
  source: Fonte;
  /** ponteiro para a evidência, respeitando controle de acesso. Nunca o documento bruto. */
  evidenceRef?: string;
  /** 0 a 1 */
  confidence: number;
  extractorVersion?: string;
  observedAt: string;
  confirmedAt?: string;
  expiresAt?: string;
};

export const confirmado = <T>(v: SourcedValue<T>): boolean =>
  v.source === 'user' || v.source === 'company' || v.source === 'curator' || !!v.confirmedAt;

/* ══════════════════════════ 2 · eixos ════════════════════════════════════ */

export const EIXO_IDS = [
  'ritmo', 'autonomia', 'formal', 'erro', 'decisao', 'colab',
  'previsib', 'presenca', 'interrup', 'escopo',
  'senior', 'espec', 'dados', 'relacional',
] as const;

export type EixoId = (typeof EIXO_IDS)[number];
export type Eixos = Record<EixoId, SourcedValue<number>>;

/* ══════════════════════════ 3 · entidades ════════════════════════════════ */

export type Nivel = 1 | 2 | 3;
export type Peso = 1 | 2 | 3;
export type Familia = string;

export type Competencia = {
  skillId: string;
  nivel: SourcedValue<Nivel>;
  anos?: number;
};

export type Requisito = {
  skillId: string;
  peso: Peso;
  obrigatorio: boolean;
};

export type Empresa = {
  id: string;
  versao: string;
  eixos: Eixos;
};

export type Vaga = {
  id: string;
  versao: string;
  empresaId: string;
  familia: Familia;
  uf: string;            // 'BR' quando remoto nacional
  modelo: 'presencial' | 'hibrido' | 'remoto';
  faixaMin: number;
  faixaMax: number;
  requisitos: Requisito[];
};

export type Candidato = {
  id: string;
  versao: string;
  uf: SourcedValue<string>;
  modelos: SourcedValue<Array<'presencial' | 'hibrido' | 'remoto'>>;
  pretensao?: SourcedValue<number>;
  competencias: Competencia[];
  eixos: Eixos;
};

/* ══════════════════════════ 4 · resultado ════════════════════════════════ */

export type TipoEvidencia = 'strength' | 'gap' | 'constraint';

export type Evidencia = {
  kind: TipoEvidencia;
  featureId: string;
  sourceRef?: string;
  contribution?: number;
  reasonCode: string;
  /** texto pronto para interface, derivado do reasonCode e dos dados */
  humano: string;
};

export type Dimensao = {
  nota: number;          // 0 a 100
  confidence: number;    // 0 a 1
  evidencias: Evidencia[];
};

export type ResultadoMatch = {
  tecnico: Dimensao;
  cultural: Dimensao;
  contexto: Dimensao;
  total: number;
  confidence: number;
  pesos: { tecnico: number; cultural: number; contexto: number };
};

/* ══════════════════════════ 5 · policy gate ══════════════════════════════ */

export type Desfecho = 'allow' | 'review' | 'block';

export type DecisaoPolitica = {
  policyId: string;
  outcome: Desfecho;
  reasonCode: string;
};

/* ══════════════════════════ 6 · Recommendation Trace ═════════════════════ */

export type Versoes = {
  candidateProfile: string;
  vacancy: string;
  taxonomy: string;
  featureSchema: string;
  embedding: string;
  reranker: string;
  policy: string;
  explanation: string;
};

/**
 * Imutável. Recálculo gera uma recomendação nova e expira a anterior;
 * nunca sobrescreve, senão perde-se a capacidade de reconstruir por que
 * algo foi exibido no passado.
 */
export type RecommendationTrace = {
  recommendationId: string;
  candidateId: string;
  vacancyId: string;
  scores: {
    technical: number;
    culture: number;
    context: number;
    total: number;
    confidence: number;
  };
  evidence: Evidencia[];
  policyDecisions: DecisaoPolitica[];
  versions: Versoes;
  generatedAt: string;
  expiresAt: string;
  /** hash canônico da entrada mais versões. Mesma entrada, mesmo hash. */
  inputHash: string;
};

/* ══════════════════════════ 7 · validação mínima ═════════════════════════ */

export class ErroContrato extends Error {}

export function exigirEixosCompletos(e: Eixos, quem: string): void {
  for (const id of EIXO_IDS) {
    const v = e[id];
    if (!v) throw new ErroContrato(`${quem}: eixo "${id}" ausente`);
    if (v.value < 0 || v.value > 100) {
      throw new ErroContrato(`${quem}: eixo "${id}" fora de 0..100 (${v.value})`);
    }
    if (v.confidence < 0 || v.confidence > 1) {
      throw new ErroContrato(`${quem}: eixo "${id}" com confidence fora de 0..1`);
    }
  }
}
