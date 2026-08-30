/**
 * Casos do ADR 001 e comportamento do Recommendation Trace.
 *
 * Enquanto propriedades.test.ts afirma o que vale para qualquer entrada,
 * este arquivo trava os NÚMEROS concretos e as regras de modelagem. Se um
 * teste daqui falhar, a pergunta é "a regra mudou de propósito?". Se sim, o
 * ADR muda junto, na mesma entrega. Nunca afrouxe a asserção para passar.
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { carregar, POLITICA_ATUAL, pesosDe, listar } from '../../recommendation-policy/src/index.ts';
import { evaluate, fitTecnico, fitCultural, fitContexto } from '../src/engine.ts';
import { montarTrace, avaliarPoliticas, desfechoFinal } from '../src/trace.ts';
import { EIXO_IDS } from '../../contracts/src/index.ts';
import { CANDIDATO, EMPRESA, VAGA_RH, VAGA_FIN, eixos, sv, rotulo, AGORA } from './fixtures.ts';

const politica = carregar(POLITICA_ATUAL);
const base = { candidato: CANDIDATO, vaga: VAGA_RH, empresa: EMPRESA, politica, rotuloSkill: rotulo };

/* ═══════════════════════════ modelagem (ADR 001) ════════════════════════ */

test('ADR · candidato e empresa respondem exatamente os mesmos eixos', () => {
  const doModelo = politica.eixos.map((e) => e.id).sort();
  assert.deepStrictEqual(Object.keys(CANDIDATO.eixos).sort(), [...EIXO_IDS].sort());
  assert.deepStrictEqual(Object.keys(EMPRESA.eixos).sort(), [...EIXO_IDS].sort());
  assert.deepStrictEqual(doModelo, [...EIXO_IDS].sort());
});

test('ADR · empresa não declara competência de cargo', () => {
  // Competência descreve a vaga, não a empresa. Se este teste falhar, alguém
  // reintroduziu o viés de origem que o ADR 001 removeu: a empresa passa a
  // ser descrita pela primeira vaga que abriu.
  for (const chave of ['requisitos', 'competencias', 'skills']) {
    assert.ok(!(chave in EMPRESA), `empresa voltou a declarar "${chave}"`);
  }
  assert.ok('requisitos' in VAGA_RH, 'a vaga é quem declara requisito');
});

test('ADR · toda nota vem acompanhada de evidência', () => {
  const r = evaluate(base);
  for (const dim of ['tecnico', 'cultural', 'contexto'] as const) {
    assert.ok(r[dim].evidencias.length > 0, `${dim} sem evidência`);
    for (const e of r[dim].evidencias) {
      assert.ok(e.reasonCode.length > 0);
      assert.ok(e.humano.length > 10, `evidência sem texto legível: ${e.reasonCode}`);
    }
  }
});

test('ADR · pesos vêm da família do cargo, não de constante global', () => {
  assert.ok(pesosDe(politica, 'Tecnologia').tecnico > pesosDe(politica, 'Liderança').tecnico);
  assert.ok(pesosDe(politica, 'Liderança').cultural > pesosDe(politica, 'Tecnologia').cultural);
  assert.deepStrictEqual(pesosDe(politica, 'FamiliaInexistente'), politica.pesos_por_familia._padrao);
});

/* ═══════════════════════════ baseline numérico ══════════════════════════ */

test('baseline · candidato canônico na vaga de RH', () => {
  const r = evaluate(base);
  const w = pesosDe(politica, 'Gente');
  const esperado = Math.round(r.tecnico.nota * w.tecnico + r.cultural.nota * w.cultural
    + r.contexto.nota * w.contexto);
  assert.strictEqual(r.total, esperado, 'total não fecha com as três notas e os pesos');
  assert.strictEqual(r.tecnico.nota, 67);
  assert.strictEqual(r.cultural.nota, 93);
  assert.strictEqual(r.contexto.nota, 100);
  assert.strictEqual(r.total, 84);
});

/**
 * A suíte inteira roda contra POLITICA_ATUAL, então uma versão nova entra
 * testada por construção. O que ela NÃO cobre sozinha é a pergunta que
 * importa numa troca de versão: o baseline se mexeu?
 *
 * Este teste responde isso comparando as versões publicadas entre si. Uma
 * política nova pode acrescentar família à vontade; no dia em que ela tocar
 * num eixo, no decaimento ou nos pesos de "Gente", o ADR 001 muda de número
 * e a mudança tem que ser deliberada, não descoberta em produção.
 */
test('baseline · sobrevive à troca de versão de política', () => {
  const versoes = listar().sort();
  assert.ok(versoes.length >= 2, 'precisa de duas versões para a comparação valer');

  const notas = versoes.map((v) => {
    const r = evaluate({ ...base, politica: carregar(v) });
    return { v, tecnico: r.tecnico.nota, cultural: r.cultural.nota,
      contexto: r.contexto.nota, total: r.total };
  });

  const referencia = { tecnico: 67, cultural: 93, contexto: 100, total: 84 };
  for (const n of notas) {
    assert.deepStrictEqual(
      { tecnico: n.tecnico, cultural: n.cultural, contexto: n.contexto, total: n.total },
      referencia,
      `${n.v} move o baseline do ADR 001`,
    );
  }
});

/** Família nova entra sem passar por validar()? Não: mas o erro só aparece
 *  quando alguém a usa. Este teste cobre todas as publicadas de uma vez. */
test('política · toda versão publicada tem famílias coerentes', () => {
  for (const v of listar()) {
    const p = carregar(v);
    assert.strictEqual(p.policy_version, v,
      `${v}.json declara policy_version "${p.policy_version}"`);
    assert.ok(p.taxonomy_version && p.feature_schema_version && p.explanation_version,
      `${v} sem alguma das versões que o trace carrega`);
    for (const [familia, w] of Object.entries(p.pesos_por_familia)) {
      const soma = w.tecnico + w.cultural + w.contexto;
      assert.ok(Math.abs(soma - 1) < 1e-9, `${v}: família "${familia}" soma ${soma}`);
    }
  }
});

test('baseline · empresa idêntica ao candidato dá fit cultural 100', () => {
  const espelho = { ...EMPRESA, eixos: CANDIDATO.eixos };
  assert.strictEqual(fitCultural({ ...base, empresa: espelho }).nota, 100);
});

test('baseline · cobrir tudo em nível máximo dá técnico 100', () => {
  const completo = { ...CANDIDATO, competencias: VAGA_RH.requisitos.map((x) => ({
    skillId: x.skillId, nivel: sv(3 as 1 | 2 | 3) })) };
  assert.strictEqual(fitTecnico({ ...base, candidato: completo }).nota, 100);
});

test('baseline · vaga BR aceita qualquer UF', () => {
  const remota = { ...VAGA_RH, uf: 'BR', modelo: 'remoto' as const };
  const longe = { ...CANDIDATO, uf: sv('AM'),
    modelos: sv<Array<'presencial'|'hibrido'|'remoto'>>(['remoto']) };
  assert.ok(fitContexto({ ...base, vaga: remota, candidato: longe }).nota >= 70);
});

test('baseline · pretensão tem margem de 15% antes de cair de vez', () => {
  const teto = VAGA_RH.faixaMax;
  const n = (p: number) => fitContexto({ ...base,
    candidato: { ...CANDIDATO, pretensao: sv(p) } }).nota;
  assert.ok(n(teto) > n(teto * 1.1));
  assert.ok(n(teto * 1.1) > n(teto * 1.6));
});

/* ═══════════════════════════ confiança e fontes ═════════════════════════ */

test('confiança · dado extraído de documento vale menos que confirmado pela pessoa', () => {
  const extraido = { ...CANDIDATO,
    eixos: eixos(Object.fromEntries(EIXO_IDS.map((id) => [id, CANDIDATO.eixos[id].value])) as never,
      'document', 1) };
  const a = evaluate(base).confidence;
  const b = evaluate({ ...base, candidato: extraido }).confidence;
  assert.ok(b < a, `extração deveria valer menos: confirmado ${a}, extraído ${b}`);
});

test('confiança · do conjunto é a menor das dimensões, não a média', () => {
  const fraco = { ...CANDIDATO, competencias: CANDIDATO.competencias.map((c) => ({
    ...c, nivel: { ...c.nivel, source: 'document' as const, confidence: 0.4 } })) };
  const r = evaluate({ ...base, candidato: fraco });
  const menor = Math.min(r.tecnico.confidence, r.cultural.confidence, r.contexto.confidence);
  assert.strictEqual(r.confidence, menor);
});

/* ═══════════════════════════════ policy gate ════════════════════════════ */

test('gate · confiança abaixo do mínimo bloqueia a publicação', () => {
  const duvidoso = { ...CANDIDATO, competencias: CANDIDATO.competencias.map((c) => ({
    ...c, nivel: { ...c.nivel, source: 'document' as const, confidence: 0.3 } })) };
  const r = evaluate({ ...base, candidato: duvidoso });
  const d = avaliarPoliticas(r, politica);
  assert.strictEqual(desfechoFinal(d), 'block');
  assert.ok(d.some((x) => x.reasonCode === 'CONFIANCA_ABAIXO_DO_MINIMO'));
});

test('gate · score alto com obrigatório ausente vai para revisão humana', () => {
  // Falso positivo mais caro do sistema: gera entrevista que não deveria existir.
  const vagaFolgada = { ...VAGA_FIN, familia: 'Gente',
    requisitos: [
      { skillId: 's01', peso: 1, obrigatorio: false },
      { skillId: 's02', peso: 1, obrigatorio: false },
      { skillId: 's99', peso: 1, obrigatorio: true },
    ] };
  const r = evaluate({ ...base, vaga: vagaFolgada });
  const d = avaliarPoliticas(r, politica);
  if (r.total >= 60) {
    assert.ok(d.some((x) => x.reasonCode === 'TOTAL_ALTO_COM_OBRIGATORIO_AUSENTE'));
    assert.strictEqual(desfechoFinal(d), 'review');
  }
});

test('gate · caso saudável libera', () => {
  assert.strictEqual(desfechoFinal(avaliarPoliticas(evaluate(base), politica)), 'allow');
});

/* ══════════════════════════ Recommendation Trace ════════════════════════ */

test('trace · carrega todas as oito versões do pipeline', () => {
  const t = montarTrace({ recommendationId: 'rec-1', candidato: CANDIDATO, vaga: VAGA_RH,
    empresa: EMPRESA, resultado: evaluate(base), politica,
    versoes: { embedding: 'embed-v3', reranker: 'baseline' }, generatedAt: AGORA });
  for (const chave of ['candidateProfile', 'vacancy', 'taxonomy', 'featureSchema',
                       'embedding', 'reranker', 'policy', 'explanation'] as const) {
    assert.ok(t.versions[chave], `versão "${chave}" ausente no trace`);
  }
});

test('trace · é imutável', () => {
  const t = montarTrace({ recommendationId: 'rec-2', candidato: CANDIDATO, vaga: VAGA_RH,
    empresa: EMPRESA, resultado: evaluate(base), politica,
    versoes: { embedding: 'embed-v3', reranker: 'baseline' }, generatedAt: AGORA });
  assert.throws(() => { (t as never as Record<string, unknown>).recommendationId = 'outro'; });
});

test('trace · expira e o prazo é derivado do generatedAt injetado', () => {
  const t = montarTrace({ recommendationId: 'rec-3', candidato: CANDIDATO, vaga: VAGA_RH,
    empresa: EMPRESA, resultado: evaluate(base), politica,
    versoes: { embedding: 'embed-v3', reranker: 'baseline' },
    generatedAt: AGORA, validadeHoras: 24 });
  assert.strictEqual(t.generatedAt, AGORA);
  assert.strictEqual(t.expiresAt, '2026-09-02T12:00:00.000Z');
});

/* ═══════════════════════════════ política ═══════════════════════════════ */

test('política · é congelada em runtime', () => {
  assert.throws(() => { (politica as never as Record<string, unknown>).policy_version = 'x'; });
});

test('política · a versão atual está publicada no diretório', () => {
  assert.ok(listar().includes(POLITICA_ATUAL));
});
