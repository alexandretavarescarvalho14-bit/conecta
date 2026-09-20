/* ══════════════════ 8 · ESTADO ══════════════════
   O candidato nasce com fonte "conversation": o perfil veio da triagem,
   é inferência até a pessoa confirmar. É essa distinção que faz o portão
   devolver "revisão" em vez de "publicável" logo depois do cadastro.   */
const EIXOS_CAND_BASE = {ritmo:58,autonomia:82,formal:30,erro:66,decisao:72,colab:54,
  previsib:52,presenca:20,interrup:58,escopo:70,senior:78,espec:40,dados:58,relacional:64};

function candidatoNovo(fonte){
  const f = fonte || 'conversation';
  const cf = f==='user' ? 1 : f==='conversation' ? .85 : .78;
  return {
    id:'cand-001', versao:'prof-v1', __v:0, fonte:f,
    uf: sv('PE', f, f==='user'?1:.9),
    modelos: sv(['presencial','hibrido'], f, cf),
    pretensao: sv(9500, f, f==='user'?1:.8),
    competencias: [['s01',3],['s02',3],['s06',2]].map(([skillId,n])=>
      ({skillId, nivel: sv(n, f, f==='user'?1:.8)})),
    eixos: Object.fromEntries(EIXO_IDS.map(id=>[id, sv(EIXOS_CAND_BASE[id], f, cf)])),
  };
}

const S = {
  view:'home', modo:'cand', q:'', local:'', vaga:null,
  filtros:{area:[], modelo:[], uf:[], emp:[]}, ordem:'match',
  logado:false, contaEmp:false, conta:null, passo:0, perfil:{}, candidaturas:[],
  ddAberto:false, aba:'criar',
  cand: candidatoNovo('conversation'),
  empPasso:0, empSalvo:false,
  comparar: [],
  onb: null,            // onboarding em andamento; null quando não há
  sugestoes: [],        // competências fora do catálogo, para a curadoria
};

/* Reprojeta a fonte de todo o perfil. É o que a tela de confirmação faz:
   o dado não muda de valor, muda de estatuto.                          */
function reprojetarFonte(f){
  const cf = f==='user' ? 1 : f==='conversation' ? .85 : .78;
  const c = S.cand;
  c.fonte = f;
  c.uf = sv(c.uf.value, f, f==='user'?1:.9);
  c.modelos = sv(c.modelos.value, f, cf);
  if(c.pretensao) c.pretensao = sv(c.pretensao.value, f, f==='user'?1:.8);
  c.competencias = c.competencias.map(x=>({skillId:x.skillId, nivel: sv(x.nivel.value, f, f==='user'?1:.8)}));
  c.eixos = Object.fromEntries(EIXO_IDS.map(id=>[id, sv(c.eixos[id].value, f, cf)]));
  // versiona a pessoa: a chave do memo cuida da invalidação sozinha
  tocar(c);
}


/* ══════════════════ 8b · ONBOARDING ══════════════════

   O cadastro não é controlado só pela tela atual. É uma máquina de
   estados persistida, e o motivo é prático: dá para retomar de onde
   parou, repetir uma extração que falhou, medir conversão por etapa, e
   nunca confundir "subiu o arquivo" com "tem perfil válido".

   Nada do que sai da extração vira fato. Entra na revisão com origem
   'document'; a pessoa confirma, e só a versão confirmada participa das
   recomendações.                                                     */

const ONB_ESTADOS = [
  'ACCOUNT_CREATED', 'ONBOARDING_STARTED', 'SOURCE_SELECTED', 'DOCUMENT_UPLOADED',
  'EXTRACTION_PENDING', 'EXTRACTION_READY', 'PROFILE_IN_REVIEW', 'PROFILE_CONFIRMED',
  'MATCHING_READY',
  // exceção
  'EXTRACTION_FAILED', 'DOCUMENT_REJECTED', 'REVIEW_REQUIRED', 'PROFILE_INCOMPLETE',
];

/* Ordem de exibição do progresso. Estados de exceção não aparecem aqui:
   eles são desvios de um passo, não passos. */
const ONB_PASSOS = [
  {id:'inicio',   rot:'Início',       estados:['ACCOUNT_CREATED','ONBOARDING_STARTED']},
  {id:'fonte',    rot:'Currículo',    estados:['SOURCE_SELECTED','DOCUMENT_UPLOADED','EXTRACTION_PENDING','EXTRACTION_READY','EXTRACTION_FAILED','DOCUMENT_REJECTED']},
  {id:'revisao',  rot:'Revisão',      estados:['PROFILE_IN_REVIEW','REVIEW_REQUIRED','PROFILE_INCOMPLETE']},
  {id:'prefs',    rot:'Preferências', estados:[]},
  {id:'confirma', rot:'Confirmação',  estados:['PROFILE_CONFIRMED']},
  {id:'pronto',   rot:'Vagas',        estados:['MATCHING_READY']},
];

function onbNovo(via){
  const agora = new Date().toISOString();
  return {
    estado:'ACCOUNT_CREATED', via: via || 'email',
    fonte:null,                     // 'import' | 'manual'
    arquivo:null,                   // {nome, tamanho, formato}
    texto:'',                       // texto extraído ou colado
    falha:null,                     // {msg, motivo} quando EXTRACTION_FAILED
    sug:null,                       // resultado de interpretar()
    rev:null,                       // o que a pessoa está revisando
    subpasso:'blocos',              // dentro de PROFILE_IN_REVIEW: 'blocos' | 'prefs'
    visivel:{area:true, resumo:true, competencias:true, contexto:true, ambiente:true},
    consent:{termos:false, compartilhar:false, retencao:false, avisos:true, em:null},
    iniciadoEm:agora, atualizadoEm:agora,
    historico:[{estado:'ACCOUNT_CREATED', em:agora}],
  };
}

function onbIr(estado){
  if(!ONB_ESTADOS.includes(estado)) throw new Error('estado de onboarding desconhecido: '+estado);
  const o = S.onb; if(!o) return;
  o.estado = estado;
  o.atualizadoEm = new Date().toISOString();
  o.historico.push({estado, em:o.atualizadoEm});
  salvar();
}

/* Revisão em branco, para quem preenche à mão. */
function revisaoVazia(){
  return {
    areaId:null, cargos:[],
    competencias:[],                // {skillId, nivel, de:'document'|'user', evidencia?, ok:bool}
    resumo:'', anos:null,
    uf:'', modelos:[], pretensao:null,
    eixos:Object.fromEntries(EIXO_IDS.map(id=>[id, 50])),
    eixosTocados:false,
  };
}

/* Revisão pré-preenchida a partir das sugestões da extração. Tudo que
   veio do documento chega marcado como tal e ainda não confirmado. */
function revisaoDeSugestoes(sug){
  const r = revisaoVazia();
  r.areaId = sug.areaId;
  r.cargos = sug.cargos.slice(0, 3);
  r.competencias = sug.competencias.map(c => ({skillId:c.skillId, nivel:c.nivel, de:'document', evidencia:c.evidencia, ok:true}));
  r.resumo = sug.resumo || '';
  r.anos = sug.anos;
  r.uf = sug.uf || '';
  r.modelos = sug.modelos.length ? sug.modelos : [];
  return r;
}

/* O que falta para o perfil valer. Devolve lista vazia quando está ok. */
function pendenciasDaRevisao(r){
  const p = [];
  if(!r.areaId) p.push('área de atuação');
  if(!r.competencias.some(c=>c.ok)) p.push('ao menos uma competência confirmada');
  if(!r.uf) p.push('onde você está');
  if(!r.modelos.length) p.push('modelo de trabalho');
  return p;
}

/* Confirmação: monta o candidato real a partir da revisão, com origem
   'user' e confiança 1. É o único caminho pelo qual dado de currículo
   vira fato. */
function candidatoDeRevisao(r){
  const f = 'user';
  return {
    id:'cand-001', versao:'prof-v2', __v:0, fonte:f,
    areaId:r.areaId, cargos:[...r.cargos], resumo:r.resumo, anos:r.anos,
    uf: sv(r.uf, f, 1),
    modelos: sv([...r.modelos], f, 1),
    pretensao: r.pretensao ? sv(Number(r.pretensao), f, 1) : undefined,
    competencias: r.competencias.filter(c=>c.ok).map(c=>({skillId:c.skillId, nivel: sv(c.nivel, f, 1)})),
    eixos: Object.fromEntries(EIXO_IDS.map(id=>[id, sv(Number(r.eixos[id]), f, 1)])),
  };
}
