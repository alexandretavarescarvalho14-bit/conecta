/**
 * packages/matching-core/src/engine.ts
 *
 * Baseline determinístico. Propriedades garantidas (seção 7):
 *   função pura · sem rede · sem relógio implícito · sem banco
 *   mesmo input e mesmas versões produzem o mesmo resultado
 *
 * O motor devolve dimensões com evidência, não números soltos. A explicação
 * viaja junto no tipo de propósito: quando o reranker aprendido entrar, ele
 * herda a mesma assinatura e continua obrigado a explicar.
 */
import type {
  Candidato, Empresa, Vaga, Dimensao, Evidencia, ResultadoMatch, EixoId,
} from '../../contracts/src/index.ts';
import { EIXO_IDS } from '../../contracts/src/index.ts';
import type { Politica } from '../../recommendation-policy/src/index.ts';
import { pesosDe } from '../../recommendation-policy/src/index.ts';
import { projetar, confiancaDe, eixosNumericos } from './features.ts';

export type MatchInput = {
  candidato: Candidato;
  vaga: Vaga;
  empresa: Empresa;
  politica: Politica;
  /** rótulos legíveis de skill, só para a explicação. Não afeta o cálculo. */
  rotuloSkill?: (id: string) => string;
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/* ═════════════════════════════ fit técnico ══════════════════════════════ */

export function fitTecnico(i: MatchInput): Dimensao {
  const { candidato, vaga, politica } = i;
  const rot = i.rotuloSkill ?? ((id: string) => id);
  const evidencias: Evidencia[] = [];

  if (!vaga.requisitos.length) {
    return {
      nota: 60,
      confidence: 0.3,
      evidencias: [{
        kind: 'constraint', featureId: 'vaga.requisitos', reasonCode: 'REQ_AUSENTE',
        humano: 'A vaga não declarou requisitos, então o técnico não pôde ser avaliado.',
      }],
    };
  }

  const tem = new Map(candidato.competencias.map((c) => [c.skillId, c]));
  let ganho = 0;
  let total = 0;
  let furouObrigatorio = false;

  for (const r of vaga.requisitos) {
    total += r.peso;
    const c = tem.get(r.skillId);
    if (!c) {
      if (r.obrigatorio) furouObrigatorio = true;
      evidencias.push({
        kind: 'gap',
        featureId: 'skill.nivel',
        reasonCode: r.obrigatorio ? 'REQ_OBRIGATORIO_AUSENTE' : 'REQ_AUSENTE',
        contribution: -r.peso / total,
        humano: r.obrigatorio
          ? `Requisito obrigatório ausente: ${rot(r.skillId)}.`
          : `Requisito desejável ausente: ${rot(r.skillId)}.`,
      });
      continue;
    }
    const parcial = r.peso * Math.min(1, c.nivel.value / 3);
    ganho += parcial;
    evidencias.push({
      kind: 'strength',
      featureId: 'skill.nivel',
      sourceRef: c.nivel.evidenceRef,
      reasonCode: 'REQ_COBERTO',
      contribution: parcial,
      humano: `${rot(r.skillId)} em nível ${c.nivel.value} de 3.`,
    });
  }

  let nota = Math.round((ganho / total) * 100);

  // Teto, não média. Se o obrigatório virasse mais um peso, um candidato forte
  // em quatro requisitos e zerado no único obrigatório sairia com ~70 e passaria
  // despercebido. A lacuna crítica não pode se diluir.
  if (furouObrigatorio && politica.requisito_obrigatorio.modo === 'cap') {
    nota = Math.min(nota, politica.requisito_obrigatorio.nota_maxima);
    evidencias.push({
      kind: 'constraint',
      featureId: 'politica.requisito_obrigatorio',
      reasonCode: 'TETO_APLICADO',
      humano: `Nota limitada a ${politica.requisito_obrigatorio.nota_maxima} por requisito obrigatório não atendido.`,
    });
  }

  const confidence = confiancaDe(
    candidato.competencias.map((c) => c.nivel),
    politica,
  );

  return { nota: clamp(nota), confidence, evidencias };
}

/* ════════════════════════════ fit cultural ══════════════════════════════ */

export function fitCultural(i: MatchInput): Dimensao {
  const { candidato, empresa, politica } = i;
  const cand = eixosNumericos(candidato.eixos);
  const emp = eixosNumericos(empresa.eixos);
  const fator = politica.cultural.fator_decaimento;

  const porEixo = politica.eixos.map((e) => {
    const d = Math.abs((cand[e.id as EixoId] ?? 50) - (emp[e.id as EixoId] ?? 50));
    const ponto = Math.max(0, 1 - d / (e.tolerancia * fator));
    return { e, d, ponto };
  });

  const nota = Math.round(
    (porEixo.reduce((a, x) => a + x.ponto, 0) / porEixo.length) * 100,
  );

  const ordenado = [...porEixo].sort((a, b) => a.ponto - b.ponto);
  const evidencias: Evidencia[] = ordenado.slice(0, 3).map((x) => ({
    kind: x.d > x.e.tolerancia ? 'gap' : 'strength',
    featureId: `eixo.${x.e.id}`,
    reasonCode: x.d > x.e.tolerancia ? 'EIXO_FORA_TOLERANCIA' : 'EIXO_ALINHADO',
    contribution: x.ponto / porEixo.length,
    humano: x.d > x.e.tolerancia
      ? `${x.e.nome}: ${x.d} pontos de distância, acima da tolerância de ${x.e.tolerancia}.`
      : `${x.e.nome}: ${x.d} pontos de distância, dentro da tolerância de ${x.e.tolerancia}.`,
  }));

  const confidence = confiancaDe(
    [...EIXO_IDS.map((id) => candidato.eixos[id]), ...EIXO_IDS.map((id) => empresa.eixos[id])],
    politica,
  );

  return { nota: clamp(nota), confidence, evidencias };
}

/* ════════════════════════════ fit contexto ══════════════════════════════ */

export function fitContexto(i: MatchInput): Dimensao {
  const { candidato, vaga, politica } = i;
  const c = politica.contexto;
  const evidencias: Evidencia[] = [];
  const notas: number[] = [];

  const okLocal = vaga.uf === 'BR' || candidato.uf.value === vaga.uf;
  notas.push(okLocal ? c.localidade.compativel : c.localidade.incompativel);
  evidencias.push({
    kind: okLocal ? 'strength' : 'constraint',
    featureId: 'contexto.uf',
    reasonCode: okLocal ? 'LOCAL_OK' : 'LOCAL_DIVERGENTE',
    humano: okLocal
      ? 'Localidade compatível.'
      : `Vaga em ${vaga.uf}, candidato em ${candidato.uf.value}.`,
  });

  const okModelo = candidato.modelos.value.includes(vaga.modelo);
  notas.push(okModelo ? c.modelo.compativel : c.modelo.incompativel);
  evidencias.push({
    kind: okModelo ? 'strength' : 'constraint',
    featureId: 'contexto.modelo',
    reasonCode: okModelo ? 'MODELO_OK' : 'MODELO_DIVERGENTE',
    humano: okModelo
      ? `Modelo ${vaga.modelo} está nas preferências.`
      : `Modelo ${vaga.modelo} fora das preferências declaradas.`,
  });

  if (candidato.pretensao) {
    const p = candidato.pretensao.value;
    const teto = vaga.faixaMax;
    const margem = teto * (1 + c.pretensao.tolerancia_relativa);
    const nota = p <= teto ? c.pretensao.dentro : p <= margem ? c.pretensao.margem : c.pretensao.fora;
    notas.push(nota);
    evidencias.push({
      kind: nota === c.pretensao.dentro ? 'strength' : 'constraint',
      featureId: 'contexto.pretensao',
      reasonCode: nota === c.pretensao.dentro ? 'PRETENSAO_OK'
        : nota === c.pretensao.margem ? 'PRETENSAO_MARGEM' : 'PRETENSAO_FORA',
      humano: nota === c.pretensao.dentro
        ? 'Pretensão dentro da faixa.'
        : `Pretensão acima do teto da faixa (${teto}).`,
    });
  }

  const confidence = confiancaDe(
    [candidato.uf, candidato.modelos, ...(candidato.pretensao ? [candidato.pretensao] : [])],
    politica,
  );

  return {
    nota: clamp(Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)),
    confidence,
    evidencias,
  };
}

/* ═══════════════════════════════ composição ═════════════════════════════ */

export function evaluate(i: MatchInput): ResultadoMatch {
  // Passagem obrigatória pela projeção: é o que garante que feature proibida
  // não chega ao cálculo, mesmo quando o motor for chamado por um caminho novo.
  projetar({ candidato: i.candidato, empresa: i.empresa, vaga: i.vaga }, i.politica);

  const tecnico = fitTecnico(i);
  const cultural = fitCultural(i);
  const contexto = fitContexto(i);
  const w = pesosDe(i.politica, i.vaga.familia);

  const total = Math.round(
    tecnico.nota * w.tecnico + cultural.nota * w.cultural + contexto.nota * w.contexto,
  );

  // Confiança do conjunto é a MENOR das dimensões, não a média: uma dimensão
  // apoiada em dado fraco contamina a recomendação inteira, e média esconderia.
  const confidence = Math.min(tecnico.confidence, cultural.confidence, contexto.confidence);

  return { tecnico, cultural, contexto, total: clamp(total), confidence, pesos: w };
}
