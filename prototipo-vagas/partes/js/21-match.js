/* ══════════════════ MATCH (SÓ A CONECTARIA VÊ) ══════════════════

   Mesmo motor do core (evaluate, em prototipo-front/partes/js/01-motor.js),
   com a política da versão operada. Três ajustes, todos na entrada, nunca
   na fórmula:

   1. Eixos culturais neutros dos dois lados. Com peso cultural zero eles
      não mexem no total; existem só porque o motor os exige na projeção.
   2. Confiança do conjunto = menor entre técnico e contexto. A cultural
      fica de fora, porque ninguém preencheu eixo nenhum e ela não pode
      derrubar (nem sustentar) a recomendação.
   3. Pretensão só entra quando a vaga tem faixa com número. "A combinar"
      não pode reprovar ninguém por pretensão.

   O resultado é congelado na candidatura (montarRec) na primeira vez que
   a Conectaria abre o pipeline. Nunca é calculado na tela do candidato:
   no app real isso roda do lado da Conectaria, onde não dá para adulterar. */

const NEUTROS = Object.freeze(Object.fromEntries(EIXO_IDS.map(id => [id, sv(50, 'curator', 1)])));

function entidadeCandidato(c, comPretensao){
  return {
    id: c.id, versao: 'cand-v' + (c.__v || 0),
    uf: sv(c.uf || '', 'user', 1),
    modelos: sv(c.modelos || [], 'user', 1),
    pretensao: comPretensao && c.pretensao ? sv(Number(c.pretensao), 'user', 1) : undefined,
    competencias: (c.competencias || []).map(x => ({skillId:x.skillId, nivel:sv(x.nivel, 'user', 1)})),
    eixos: NEUTROS,
  };
}
function entidadeVaga(v){
  return {id:v.id, versao:'vaga-v' + (v.__v || 0), empresaId:v.empresaId, familia:familiaDaVaga(v),
    uf:v.uf, modelo:v.modelo, faixaMax:v.faixaMax || undefined, requisitos:v.requisitos};
}

function avaliar(c, v){
  const r = evaluate({candidato:entidadeCandidato(c, !!v.faixaMax), vaga:entidadeVaga(v),
    empresa:{eixos:NEUTROS}, politica:POLITICA_VAGAS, rotuloSkill:skillNome});
  r.confidence = Math.min(r.tecnico.confidence, r.contexto.confidence);
  r.decisoes = avaliarPoliticas(r, POLITICA_VAGAS);
  r.desfecho = desfechoFinal(r.decisoes);
  return r;
}

const chaveRec = (c, v) => c.id + '@' + (c.__v || 0) + '|' + v.id + '@' + (v.__v || 0) + '|' + POLITICA_VAGAS.policy_version;

/* Snapshot no formato que 36-painel-base e 37-pipeline-base esperam.
   cultural_ev vai vazio: não há evidência cultural nesta versão, e uma
   lista de "eixo alinhado, 0 pontos de distância" só confundiria. */
function montarRec(c, v, quando){
  const m = avaliar(c, v);
  return Object.freeze({
    total:m.total, tecnico:m.tecnico.nota, contexto:m.contexto.nota, cultural:null,
    confidence:m.confidence, desfecho:m.desfecho, decisoes:m.decisoes, pesos:m.pesos,
    tecnico_ev:m.tecnico.evidencias, cultural_ev:[], contexto_ev:m.contexto.evidencias,
    chave:chaveRec(c, v), geradoEm: quando || iso(Date.now()),
  });
}

function garantirRec(ap){
  if(ap.rec) return false;
  const c = candidatoPor(ap.candidatoId), v = vagaPor(ap.vagaId);
  if(!c || !v) return false;
  ap.rec = montarRec(c, v);
  return true;
}
function garantirRecs(){
  let mudou = false;
  DB.candidaturas.forEach(ap => { if(garantirRec(ap)) mudou = true; });
  if(mudou) salvar();
}
/* O perfil ou a vaga mudou depois do cálculo? */
function recDesatualizado(ap){
  const c = candidatoPor(ap.candidatoId), v = vagaPor(ap.vagaId);
  return !!(ap.rec && c && v && ap.rec.chave !== chaveRec(c, v));
}
/* Recalcula e arquiva o anterior. Nunca sobrescreve. */
function recalcularRec(ap){
  const c = candidatoPor(ap.candidatoId), v = vagaPor(ap.vagaId);
  const novo = montarRec(c, v);
  if(ap.rec) ap.recAnteriores.push(ap.rec);
  ap.rec = novo; ap.atualizadaEm = iso(Date.now());
  salvar();
  return novo;
}
/* Principal motivo em uma linha, para a tabela. */
function motivoPrincipal(rec){
  const ev = [...rec.tecnico_ev, ...rec.contexto_ev];
  const gap = ev.find(e => e.kind === 'gap' && e.reasonCode === 'REQ_OBRIGATORIO_AUSENTE')
    || ev.find(e => e.kind !== 'strength');
  return gap ? gap.humano : 'Cobre os requisitos e o contexto da vaga.';
}
