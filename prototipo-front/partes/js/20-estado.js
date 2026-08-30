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
  view:'home', modo:'cand', q:'', local:'', filtro:'todas', vaga:null,
  logado:false, contaEmp:false, conta:null, passo:0, perfil:{}, candidaturas:[],
  ddAberto:false, aba:'criar',
  cand: candidatoNovo('conversation'),
  empPasso:0, empSalvo:false,
  comparar: [],
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
