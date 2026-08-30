/**
 * Testes de propriedade, seção 7.2 do documento de evolução técnica.
 *
 * Diferente de teste de exemplo, propriedade afirma algo que precisa valer
 * para QUALQUER entrada. Rodam sobre entradas geradas por PRNG semeado, então
 * são reproduzíveis: falha aqui sempre falha de novo com a mesma semente.
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { carregar, validar, POLITICA_ATUAL } from '../../recommendation-policy/src/index.ts';
import { evaluate, fitTecnico, fitCultural } from '../src/engine.ts';
import { projetar, ErroFeatureProibida } from '../src/features.ts';
import { hashEntrada, montarTrace, canonico } from '../src/trace.ts';
import { EIXO_IDS } from '../../contracts/src/index.ts';
import type { EixoId } from '../../contracts/src/index.ts';
import { CANDIDATO, EMPRESA, VAGA_RH, VAGA_FIN, eixos, sv, rotulo, prng, AGORA } from './fixtures.ts';

const politica = carregar(POLITICA_ATUAL);
const base = { candidato: CANDIDATO, vaga: VAGA_RH, empresa: EMPRESA, politica, rotuloSkill: rotulo };
const AMOSTRAS = 250;

/* ── P1 · toda nota entre 0 e 100 ─────────────────────────────────────── */

test('P1 · toda nota fica entre 0 e 100, em qualquer entrada', () => {
  const r = prng(20260901);
  for (let n = 0; n < AMOSTRAS; n++) {
    const alea = {} as Partial<Record<EixoId, number>>;
    for (const id of EIXO_IDS) alea[id] = Math.floor(r() * 101);
    const res = evaluate({
      ...base,
      candidato: { ...CANDIDATO, eixos: eixos(alea), pretensao: sv(Math.floor(r() * 30000)) },
    });
    for (const [rot, v] of [['tec', res.tecnico.nota], ['cul', res.cultural.nota],
                            ['ctx', res.contexto.nota], ['total', res.total]] as const) {
      assert.ok(v >= 0 && v <= 100, `${rot} saiu da faixa na amostra ${n}: ${v}`);
    }
    assert.ok(res.confidence >= 0 && res.confidence <= 1);
  }
});

/* ── P2 · pesos somam 1 em toda família ───────────────────────────────── */

test('P2 · os pesos de toda família somam 1', () => {
  for (const [familia, w] of Object.entries(politica.pesos_por_familia)) {
    const soma = w.tecnico + w.cultural + w.contexto;
    assert.ok(Math.abs(soma - 1) < 1e-9, `${familia} soma ${soma}`);
  }
});

/* ── P3 · monotonicidade técnica ──────────────────────────────────────── */

test('P3 · aumentar a cobertura técnica nunca reduz o fit técnico', () => {
  const r = prng(7);
  for (let n = 0; n < AMOSTRAS; n++) {
    const todos = VAGA_RH.requisitos.map((x) => x.skillId);
    const quantos = Math.floor(r() * todos.length);
    const subset = todos.slice(0, quantos);
    const menor = { ...CANDIDATO, competencias: subset.map((s) => ({ skillId: s, nivel: sv(2 as 1|2|3) })) };
    const maior = { ...CANDIDATO, competencias: todos.slice(0, quantos + 1)
      .map((s) => ({ skillId: s, nivel: sv(2 as 1|2|3) })) };
    const a = fitTecnico({ ...base, candidato: menor }).nota;
    const b = fitTecnico({ ...base, candidato: maior }).nota;
    assert.ok(b >= a, `cobertura ${quantos}→${quantos + 1} reduziu de ${a} para ${b}`);
  }
});

test('P3b · aumentar o nível de uma competência nunca reduz o fit técnico', () => {
  for (const nivel of [1, 2, 3] as const) {
    const c = { ...CANDIDATO, competencias: VAGA_RH.requisitos.map((x) => ({
      skillId: x.skillId, nivel: sv(nivel),
    })) };
    const nota = fitTecnico({ ...base, candidato: c }).nota;
    if (nivel > 1) assert.ok(nota >= (globalThis as any).__anterior);
    (globalThis as any).__anterior = nota;
  }
});

/* ── P4 · monotonicidade cultural ─────────────────────────────────────── */

test('P4 · aumentar a distância cultural nunca aumenta o fit cultural', () => {
  const r = prng(99);
  for (let n = 0; n < 120; n++) {
    const id = EIXO_IDS[Math.floor(r() * EIXO_IDS.length)];
    const atual = CANDIDATO.eixos[id].value;
    const empresaV = EMPRESA.eixos[id].value;
    // afasta do valor da empresa, na direção que tem espaço
    const dir = atual >= empresaV ? 1 : -1;
    const perto = { ...CANDIDATO.eixos, [id]: sv(atual) };
    const longe = { ...CANDIDATO.eixos, [id]: sv(Math.max(0, Math.min(100, atual + dir * 25))) };
    const a = fitCultural({ ...base, candidato: { ...CANDIDATO, eixos: perto } }).nota;
    const b = fitCultural({ ...base, candidato: { ...CANDIDATO, eixos: longe } }).nota;
    assert.ok(b <= a, `afastar ${id} aumentou o fit de ${a} para ${b}`);
  }
});

test('P4b · eixo de baixa tolerância dói mais que eixo tolerante', () => {
  const duro = politica.eixos.reduce((a, b) => (a.tolerancia <= b.tolerancia ? a : b));
  const mole = politica.eixos.reduce((a, b) => (a.tolerancia >= b.tolerancia ? a : b));
  const desloca = (id: string) => {
    const v = CANDIDATO.eixos[id as EixoId].value;
    return { ...CANDIDATO.eixos, [id]: sv(v >= 50 ? v - 40 : v + 40) };
  };
  const comDuro = fitCultural({ ...base, candidato: { ...CANDIDATO, eixos: desloca(duro.id) } }).nota;
  const comMole = fitCultural({ ...base, candidato: { ...CANDIDATO, eixos: desloca(mole.id) } }).nota;
  assert.ok(comDuro < comMole,
    `${duro.nome} (tol ${duro.tolerancia}) deveria doer mais que ${mole.nome} (tol ${mole.tolerancia})`);
});

/* ── P5 · portão do requisito obrigatório ─────────────────────────────── */

test('P5 · requisito obrigatório ausente aplica o portão configurado', () => {
  const teto = politica.requisito_obrigatorio.nota_maxima;
  const semNada = { ...CANDIDATO, competencias: [{ skillId: 's01', nivel: sv(3 as 1|2|3) }] };
  const d = fitTecnico({ ...base, vaga: VAGA_FIN, candidato: semNada });
  assert.ok(d.nota <= teto, `teto de ${teto} furou: ${d.nota}`);
  assert.ok(d.evidencias.some((e) => e.reasonCode === 'REQ_OBRIGATORIO_AUSENTE'));
  assert.ok(d.evidencias.some((e) => e.reasonCode === 'TETO_APLICADO'));
});

test('P5b · o portão é teto e não zero: quem cobre parte ainda pontua', () => {
  const parcial = { ...CANDIDATO, competencias: [{ skillId: 's10', nivel: sv(3 as 1|2|3) }] };
  const nenhum = { ...CANDIDATO, competencias: [] };
  const a = fitTecnico({ ...base, vaga: VAGA_FIN, candidato: parcial }).nota;
  const b = fitTecnico({ ...base, vaga: VAGA_FIN, candidato: nenhum }).nota;
  assert.ok(a > b, `cobrir 1 de 2 obrigatórios deveria valer mais que 0: ${a} vs ${b}`);
});

/* ── P6 · determinismo ────────────────────────────────────────────────── */

test('P6 · mesma entrada e mesmas versões produzem o mesmo resultado e hash', () => {
  const versoes = { embedding: 'embed-v3', reranker: 'baseline' };
  const t1 = montarTrace({ recommendationId: 'r1', candidato: CANDIDATO, vaga: VAGA_RH,
    empresa: EMPRESA, resultado: evaluate(base), politica, versoes, generatedAt: AGORA });
  const t2 = montarTrace({ recommendationId: 'r2', candidato: CANDIDATO, vaga: VAGA_RH,
    empresa: EMPRESA, resultado: evaluate(base), politica, versoes, generatedAt: AGORA });
  assert.strictEqual(t1.inputHash, t2.inputHash);
  assert.deepStrictEqual(t1.scores, t2.scores);
});

test('P6b · mudar qualquer versão muda o hash', () => {
  const v = { candidateProfile: 'p1', vacancy: 'v1', taxonomy: 't1', featureSchema: 'f1',
    embedding: 'e1', reranker: 'r1', policy: 'pol1', explanation: 'x1' };
  const h1 = hashEntrada(CANDIDATO, VAGA_RH, EMPRESA, v);
  const h2 = hashEntrada(CANDIDATO, VAGA_RH, EMPRESA, { ...v, policy: 'pol2' });
  assert.notStrictEqual(h1, h2);
});

test('P6c · JSON canônico independe da ordem das chaves', () => {
  assert.strictEqual(canonico({ b: 1, a: { d: 2, c: 3 } }), canonico({ a: { c: 3, d: 2 }, b: 1 }));
});

/* ── P7 · feature proibida nunca chega ao vetor ───────────────────────── */

test('P7 · adicionar feature proibida à allowlist é rejeitado na validação da política', () => {
  // Primeira linha de defesa: não dá para liberar um atributo protegido
  // simplesmente colocando o id na allowlist. A validação recusa a política.
  const suja = { ...politica, features: {
    allowlist: [...politica.features.allowlist, 'candidato.idade'],
    denylist: politica.features.denylist } };
  assert.throws(() => validar(suja as never), /allow e deny/);
});

test('P7-bis · id na denylist lança na projeção, mesmo com política mal montada', () => {
  // Segunda linha: se alguém contornar a validação, a projeção ainda barra
  // no momento de emitir a feature.
  const suja = { ...politica, features: {
    allowlist: politica.features.allowlist,
    denylist: [...politica.features.denylist, 'eixo.ritmo'] } };
  assert.throws(
    () => projetar({ candidato: CANDIDATO }, suja as never),
    ErroFeatureProibida,
  );
});

test('P7b · feature fora da allowlist não entra, mesmo sem estar na denylist', () => {
  const restrita = { ...politica, features: { allowlist: ['eixo.ritmo'], denylist: politica.features.denylist } };
  assert.throws(
    () => projetar({ candidato: CANDIDATO }, restrita as never),
    ErroFeatureProibida,
  );
});

test('P7c · o vetor projetado só contém ids da allowlist', () => {
  const v = projetar({ candidato: CANDIDATO, empresa: EMPRESA, vaga: VAGA_RH }, politica);
  const permitidas = new Set(politica.features.allowlist);
  for (const f of v.porId.values()) {
    assert.ok(permitidas.has(f.id), `feature "${f.id}" escapou da allowlist`);
  }
});
