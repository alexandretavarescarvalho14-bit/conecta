/* ══════════════════ 14 · BUSCA DE VAGAS ══════════════════

   Com 4 vagas uma lista simples bastava. Com 31 em 8 áreas, não: o
   candidato de RH via 31 cartões dos quais 4 eram dele, e só achava os
   certos porque a ordenação por match resolvia por acidente. Ele não
   tinha controle nenhum.

   Daí a barra de filtros. Duas decisões que valem registro:

   1. A contagem de cada opção respeita os OUTROS filtros ativos. Se você
      já filtrou por Recife, "Tecnologia (2)" quer dizer duas vagas de
      tecnologia EM RECIFE. Contagem que ignora o resto leva a beco: a
      pessoa clica num número e recebe lista vazia.

   2. O vazio diz qual filtro esvaziou e oferece tirar aquele, não limpar
      tudo. "Nenhum resultado" sem culpado obriga a desfazer no escuro.  */

const ORDENS = [
  {id:'match',    rot:'Melhor match',     soLogado:true,  cmp:(a,b)=>M(b).total-M(a).total},
  {id:'recentes', rot:'Mais recentes',    soLogado:false, cmp:(a,b)=>a.dias-b.dias},
  {id:'faixa',    rot:'Maior faixa',      soLogado:false, cmp:(a,b)=>b.faixaMax-a.faixaMax},
  {id:'concorr',  rot:'Menos concorrida', soLogado:false, cmp:(a,b)=>a.cand-b.cand},
];

const FILTROS = [
  {id:'area',   rot:'Área',    campo:v=>v.area,   ops:()=>AREAS.map(a=>({v:a.id, r:a.n}))},
  {id:'modelo', rot:'Modelo',  campo:v=>v.modelo, ops:()=>[
    {v:'presencial',r:'Presencial'},{v:'hibrido',r:'Híbrido'},{v:'remoto',r:'Remoto'}]},
  {id:'uf',     rot:'Local',   campo:v=>v.uf,     ops:()=>
    [...new Set(VAGAS.map(v=>v.uf))].sort().map(u=>({v:u, r:u==='BR'?'Remoto, Brasil':u}))},
  {id:'emp',    rot:'Empresa', campo:v=>v.emp,    ops:()=>Object.entries(EMPRESAS)
    .map(([k,e])=>({v:k, r:e.n}))},
];
const FILTRO = Object.fromEntries(FILTROS.map(f=>[f.id,f]));

const passaBusca = v => {
  const q=S.q.trim().toLowerCase(), l=S.local.trim().toLowerCase();
  const okQ = !q || (v.cargo+' '+EMPRESAS[v.emp].n+' '+v.tags.join(' ')+' '+
    (AREA[v.area]?AREA[v.area].n:'')).toLowerCase().includes(q);
  const okL = !l || v.local.toLowerCase().includes(l);
  return okQ && okL;
};
const passaFiltro = (v,fid) => {
  const sel = S.filtros[fid];
  return !sel.length || sel.includes(FILTRO[fid].campo(v));
};

function filtrar(){
  const r = VAGAS.filter(v => passaBusca(v) && FILTROS.every(f=>passaFiltro(v,f.id)));
  const ordem = ORDENS.find(o=>o.id===S.ordem) || ORDENS[1];
  return [...r].sort(ordem.cmp);
}

/* Contagem de cada opção considerando os demais filtros já aplicados. */
function contarOpcoes(fid){
  const base = VAGAS.filter(v => passaBusca(v) &&
    FILTROS.filter(f=>f.id!==fid).every(f=>passaFiltro(v,f.id)));
  const c={};
  base.forEach(v=>{ const k=FILTRO[fid].campo(v); c[k]=(c[k]||0)+1; });
  return c;
}

const filtrosAtivos = () => FILTROS.flatMap(f =>
  S.filtros[f.id].map(v => ({fid:f.id, v, rot:(f.ops().find(o=>o.v===v)||{r:v}).r})));

/* Cobertura de requisitos. O que importa não é só quantos, é se algum
   obrigatório ficou de fora — por isso o nível não é uma fração simples. */
function coberturaDe(v){
  const tem = new Set(S.cand.competencias.map(c=>c.skillId));
  const total = v.requisitos.length;
  const cobertos = v.requisitos.filter(r=>tem.has(r.skillId)).length;
  const obrigFalta = v.requisitos.filter(r=>r.obrigatorio && !tem.has(r.skillId)).length;
  const nivel = obrigFalta ? 'falta'
    : cobertos===total ? 'tudo'
    : cobertos >= Math.ceil(total/2) ? 'parte' : 'pouco';
  return {total, cobertos, obrigFalta, nivel};
}
/* glifo além da cor: cor sozinha não pode carregar a informação */
const IC_COB = {tudo:'✓', parte:'◕', pouco:'○', falta:'!'};

/* ── barra de filtros ── */
function popover(f){
  const sel = S.filtros[f.id], cont = contarOpcoes(f.id);
  return '<div class="filtro" data-pop="'+f.id+'">'+
    '<button class="fbt'+(sel.length?' on':'')+'" aria-expanded="false" aria-haspopup="true">'+
      esc(f.rot)+(sel.length?'<i>'+sel.length+'</i>':'')+
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
      'stroke-width="2.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'+
    '<div class="fpop" role="group" aria-label="'+esc(f.rot)+'">'+
      f.ops().map(o=>{
        const n = cont[o.v]||0;
        return '<label class="fop'+(n?'':' vazia')+'">'+
          '<input type="checkbox" data-fop="'+f.id+'" value="'+esc(o.v)+'"'+
          (sel.includes(o.v)?' checked':'')+(n?'':' disabled')+'>'+
          '<span>'+esc(o.r)+'</span><b>'+n+'</b></label>';
      }).join('')+
      (sel.length?'<button class="flimpa" data-flimpa="'+f.id+'">Limpar '+
        esc(f.rot).toLowerCase()+'</button>':'')+
    '</div></div>';
}

function barraFiltros(){
  const ordens = ORDENS.filter(o=>!o.soLogado || S.logado);
  const atual = ordens.find(o=>o.id===S.ordem) || ordens[0];
  return '<div class="fbarra">'+
    FILTROS.map(popover).join('')+
    '<div class="filtro fordem" data-pop="ordem">'+
      '<button class="fbt" aria-expanded="false" aria-haspopup="true">'+
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
        'stroke-width="2" stroke-linecap="round" aria-hidden="true">'+
        '<path d="M4 7h16M6 12h12M9 17h6"/></svg>'+esc(atual.rot)+
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
        'stroke-width="2.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'+
      '<div class="fpop" role="group" aria-label="Ordenar">'+
        ordens.map(o=>'<label class="fop"><input type="radio" name="ordem" data-ford="'+o.id+'"'+
          (o.id===atual.id?' checked':'')+'><span>'+esc(o.rot)+'</span></label>').join('')+
      '</div></div>'+
  '</div>';
}

function chipsAtivos(){
  const at = filtrosAtivos();
  if(!at.length && !S.q && !S.local) return '';
  return '<div class="fchips">'+
    (S.q ? '<button class="fchip" data-limpaq="1">busca: '+esc(S.q)+
      ' <span aria-hidden="true">×</span></button>' : '')+
    (S.local ? '<button class="fchip" data-limpal="1">onde: '+esc(S.local)+
      ' <span aria-hidden="true">×</span></button>' : '')+
    at.map(a=>'<button class="fchip" data-tira="'+a.fid+'|'+esc(a.v)+'">'+esc(a.rot)+
      ' <span aria-hidden="true">×</span></button>').join('')+
    '<button class="fchip zerar" data-zerar="1">limpar tudo</button></div>';
}

/* ── tela ── */
function vHome(){
  // Quem já entrou não precisa da promessa inteira de novo a cada visita:
  // o discurso é para quem chega, e vira pedágio para quem volta.
  const hero = S.logado
    ? '<section class="heroc">'+
        '<h1>Vagas abertas</h1>'+
        '<p>'+VAGAS.length+' publicadas, ordenadas pelo seu perfil. Use os filtros para recortar.</p>'+
      '</section>'
    : '<section class="hero">'+malha()+
        '<span class="selo"><i></i>9.014 pessoas na comunidade</span>'+
        '<h1>A vaga certa encontra <em>quem você já é</em>.</h1>'+
        '<p>Seu perfil aqui é um mapa do que você sabe fazer, de como você trabalha e de '+
        'onde quer chegar. As vagas chegam a partir dele.</p>'+
      '</section>';

  const retomar = S.conta && S.onb && !['MATCHING_READY','PROFILE_CONFIRMED'].includes(S.onb.estado);
  const passoOnb = retomar ? (ONB_PASSOS.find(p=>p.estados.includes(S.onb.estado))||ONB_PASSOS[0]).rot : '';
  const faixa = retomar
    ? '<div class="retoma rv">'+I.doc+'<div><b>Seu cadastro parou em '+esc(passoOnb.toLowerCase())+'.</b>'+
      '<p>O que você já preencheu está guardado. Faltam poucos passos para ver sua aderência em cada vaga.</p></div>'+
      '<button class="btn sm" data-n="triagem">Continuar</button></div>'
    : '';
  $('#v-home').innerHTML = faixa + hero +
  '<div class="buscador">'+
    '<div class="bfield">'+I.lupa+'<div style="flex:1;min-width:0">'+
      '<label for="q">Cargo, área ou empresa</label>'+
      '<input id="q" type="search" placeholder="Coordenador de RH" value="'+esc(S.q)+'"></div></div>'+
    '<div class="bfield">'+I.pin+'<div style="flex:1;min-width:0">'+
      '<label for="loc">Onde</label>'+
      '<input id="loc" type="search" placeholder="Recife, remoto..." value="'+esc(S.local)+'"></div></div>'+
    '<button class="btn" id="buscar" style="flex:0 0 auto">Buscar</button>'+
  '</div>'+
  (S.logado?'':'<div class="sugere"><span>Buscas frequentes:</span>'+
    ['Coordenador de RH','Marketing','Remoto','Financeiro'].map(s=>
      '<button class="sug" data-sug="'+esc(s)+'">'+esc(s)+'</button>').join('')+'</div>')+
  '<div id="filtrosBox"></div>'+
  '<div id="listaVagas"></div>'+
  '<div id="barraCmp"></div>'+
  '<p class="nota">Protótipo de avaliação da Conectaria. As vagas e as empresas são fictícias, '+
  'e coerentes entre si. O percentual de aderência é calculado de verdade, a partir dos '+
  'requisitos da vaga, dos catorze eixos de ambiente e do seu contexto, e cada vaga mostra '+
  'a conta por dentro. Pagamento, login e integração com sistemas de RH não estão '+
  'implementados.</p>';

  const buscarDeb = debounce(()=>renderVagas(), 200);
  $('#q').oninput = e => { S.q=e.target.value; buscarDeb(); };
  $('#loc').oninput = e => { S.local=e.target.value; buscarDeb(); };
  $('#buscar').onclick = () => { renderVagas(); $('#listaVagas').scrollIntoView({block:'start'}); };
  renderVagas(true);
}

async function renderVagas(primeira){
  const el=$('#listaVagas');
  $('#filtrosBox').innerHTML = barraFiltros() + chipsAtivos() +
    '<p class="cont" id="cont" aria-live="polite"></p>';
  const ct=$('#cont');

  if(primeira){
    ct.textContent='buscando vagas';
    el.innerHTML='<div class="vagas">'+Array.from({length:4},()=>
      '<div class="sk"><i style="width:38%"></i><i style="width:62%;height:9px"></i>'+
      '<i style="width:26%;height:9px"></i></div>').join('')+'</div>';
    await espera(520);
  }

  const r = filtrar();
  const ordem = ORDENS.find(o=>o.id===S.ordem) || ORDENS[1];
  ct.innerHTML = '<b class="tnum" data-n="'+r.length+'">0</b>' +
    (r.length===1?' vaga':' vagas') +
    (filtrosAtivos().length||S.q||S.local ? ' com esse recorte' : '') +
    ' · ' + esc(ordem.rot.toLowerCase());
  contar($('b',ct), r.length);

  if(!r.length){ el.innerHTML = vazioBusca(); renderBarraCmp(); return; }

  // Uma passada de cálculo por render. Antes, filtrar() e o card pediam
  // M(v) cada um, o que com 31 vagas e debounce de tecla vira trabalho à toa.
  const fits = new Map(r.map(v=>[v.id, S.logado ? M(v) : null]));

  el.innerHTML='<div class="vagas">'+r.map(v=>{
    const e=EMPRESAS[v.emp], m=fits.get(v.id), naCmp=S.comparar.includes(v.id);
    const c = S.logado ? coberturaDe(v) : null;
    return '<article class="vaga rv'+(naCmp?' sel':'')+'">'+
      '<button class="stretch" data-v="'+v.id+'" aria-label="Abrir vaga '+esc(v.cargo)+
        ' em '+esc(e.n)+'"></button>'+
      '<div class="conteudo">'+
        '<div class="vtopo">'+logo(v.emp)+
          '<b>'+esc(e.n)+'</b><span class="vsetor">'+esc(e.s.split('·')[0].trim())+'</span>'+
          (c ? '<span class="tag cob cob-'+c.nivel+'"><i aria-hidden="true">'+IC_COB[c.nivel]+
               '</i>'+c.cobertos+' de '+c.total+(c.obrigFalta?' · falta obrigatório':'')+'</span>' : '')+
        '</div>'+
        '<h3>'+esc(v.cargo)+'</h3>'+
        '<div class="vmeta">'+
          '<span>'+I.pin+esc(v.local)+'</span>'+
          '<span class="vfaixa">'+esc(v.faixa)+'</span>'+
          '<span>'+(v.dias===1?'ontem':'há '+v.dias+' dias')+'</span>'+
          '<span>'+v.cand+' candidaturas</span>'+
        '</div>'+
      '</div>'+
      '<div class="vdir">'+ medidor(m?m.total:0, m?m.confidence:0) +
        (S.logado ? '<button class="cmpbt'+(naCmp?' on':'')+'" data-cmp="'+v.id+'" '+
          'aria-pressed="'+naCmp+'">'+(naCmp?'comparando':'comparar')+'</button>' : '')+
      '</div></article>';
  }).join('')+'</div>';

  animaMed(); revelar($('#listaVagas')); renderBarraCmp();
}

/* Vazio por filtro aponta o culpado: testa tirar um filtro por vez e diz
   qual deles, sozinho, devolveria resultado. */
function vazioBusca(){
  const at = filtrosAtivos();
  const culpados = [];
  for(const f of FILTROS){
    if(!S.filtros[f.id].length) continue;
    const semEste = VAGAS.filter(v => passaBusca(v) &&
      FILTROS.filter(x=>x.id!==f.id).every(x=>passaFiltro(v,x.id)));
    if(semEste.length) culpados.push({fid:f.id, rot:f.rot, n:semEste.length});
  }
  culpados.sort((a,b)=>b.n-a.n);

  const dica = culpados.length
    ? '<p>Sem o filtro de <b>'+esc(culpados[0].rot.toLowerCase())+'</b>, '+
      culpados[0].n+(culpados[0].n===1?' vaga aparece':' vagas aparecem')+'.</p>'+
      '<button class="btn" data-tirafiltro="'+culpados[0].fid+'">Tirar o filtro de '+
      esc(culpados[0].rot.toLowerCase())+'</button>'
    : (S.q||S.local
        ? '<p>Nenhuma vaga combina com esse texto. Termo mais curto costuma achar mais.</p>'+
          '<button class="btn" data-zerar="1">Limpar a busca</button>'
        : '<p>Não há vagas abertas no momento.</p>');

  return '<div class="estado"><div class="ic">'+I.vazio+'</div>'+
    '<h3>Nenhuma vaga com esse recorte.</h3>'+
    '<p>São '+VAGAS.length+' vagas abertas no total'+
    (at.length? ', e '+at.length+(at.length===1?' filtro ativo':' filtros ativos'):'')+'.</p>'+
    dica+'</div>';
}

function renderBarraCmp(){
  const el=$('#barraCmp'); if(!el) return;
  if(!S.comparar.length){ el.innerHTML=''; return; }
  el.innerHTML='<div class="cmpbar">'+I.bal+
    '<b style="font-family:var(--d);font-size:var(--md)">'+S.comparar.length+
    (S.comparar.length===1?' vaga selecionada':' vagas selecionadas')+'</b>'+
    '<span style="font-size:var(--sm);color:var(--i62);flex:1;min-width:150px">'+
    (S.comparar.length<2?'Escolha mais uma para comparar lado a lado.'
      :'As duas passam pelo mesmo cálculo, com os pesos da família de cada cargo.')+'</span>'+
    '<button class="btn g sm" id="cmpLimpa">Limpar</button>'+
    '<button class="btn sm" id="cmpVer"'+(S.comparar.length<2?' disabled':'')+'>Comparar</button></div>';
  $('#cmpLimpa').onclick=()=>{S.comparar=[];salvar();renderVagas();};
  $('#cmpVer').onclick=()=>ir('comparar');
}
