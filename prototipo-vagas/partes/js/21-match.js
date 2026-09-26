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
/* ── recomendações para o candidato ──
   O mesmo motor ordena as vagas para a pessoa, mas o que ela vê é a
   lista e o motivo em palavras, nunca o número: a nota continua sendo
   ferramenta da Conectaria. No app real isto vem pronto do servidor;
   aqui roda no navegador porque o teste não tem servidor.

   Quatro cortes: vaga a que ela já se candidatou sai; vaga em que falta
   requisito obrigatório sai, mesmo com nota alta (é a indicação que gera
   entrevista que não devia existir); vaga presencial ou híbrida em outro
   estado sai, porque na nota ela só perde pontos mas na vida real
   significa mudar de cidade; e o resto precisa passar de
   CORTE_RECOMENDACAO. */
const CORTE_RECOMENDACAO = 60;

function recomendacoesPara(c, limite){
  if(!c || !(c.competencias || []).length) return [];
  return vagasPublicadas()
    .filter(v => !jaCandidatou(c.id, v.id))
    .map(v => ({v, m:avaliar(c, v)}))
    .filter(({v, m}) => m.total >= CORTE_RECOMENDACAO && m.desfecho !== 'block' &&
      !m.tecnico.evidencias.some(e => e.reasonCode === 'REQ_OBRIGATORIO_AUSENTE') &&
      !(v.modelo !== 'remoto' && m.contexto.evidencias.some(e => e.reasonCode === 'LOCAL_DIVERGENTE')))
    .sort((a, b) => b.m.total - a.m.total)
    .slice(0, limite || 3)
    .map(({v, m}) => ({v, porque:porqueRecomendada(c, v, m)}));
}

function porqueRecomendada(c, v, m){
  const tem = new Set(c.competencias.map(k => k.skillId));
  // só a inicial em minúscula, e só em palavra comum: "B2B" e "SAP" ficam como estão
  const cobre = v.requisitos.filter(r => tem.has(r.skillId)).map(r => {
    const n = skillNome(r.skillId);
    return /^\p{Lu}\p{Ll}/u.test(n) ? n.charAt(0).toLowerCase() + n.slice(1) : n;
  });
  const partes = [];
  if(cobre.length) partes.push('Pede ' + (cobre.length === 1 ? cobre[0]
    : cobre.slice(0, 2).join(' e ') + (cobre.length > 2 ? ' e mais ' + (cobre.length - 2) : '')) + ', que você já fez');
  const ctx = m.contexto.evidencias;
  if(v.uf === 'BR') partes.push(v.modelo === 'remoto' ? 'é remota' : 'tem vaga em vários estados');
  else if(ctx.some(e => e.reasonCode === 'LOCAL_OK')) partes.push('fica no seu estado');
  if(ctx.some(e => e.reasonCode === 'MODELO_OK') && v.uf !== 'BR') partes.push('no modelo ' + MODELO_ROT[v.modelo].toLowerCase() + ' que você aceita');
  const txt = partes.join(', ');
  return txt ? txt.charAt(0).toUpperCase() + txt.slice(1) + '.' : 'Combina com as atividades do seu perfil.';
}

/* Principal motivo em uma linha, para a tabela. */
function motivoPrincipal(rec){
  const ev = [...rec.tecnico_ev, ...rec.contexto_ev];
  const gap = ev.find(e => e.kind === 'gap' && e.reasonCode === 'REQ_OBRIGATORIO_AUSENTE')
    || ev.find(e => e.kind !== 'strength');
  return gap ? gap.humano : 'Cobre os requisitos e o contexto da vaga.';
}
