/* ══════════════════ 14 · HOME ══════════════════ */
function filtrar(){
  const q=S.q.trim().toLowerCase(), l=S.local;
  return VAGAS.filter(v=>{
    const okF = S.filtro==='todas' || v.modelo===S.filtro
      || (S.filtro==='match' && S.logado && M(v).total>=70)
      || (S.filtro==='pub' && S.logado && M(v).desfecho==='allow');
    const okL = !l || v.local.toLowerCase().includes(l.toLowerCase());
    const okQ = !q || (v.cargo+' '+EMPRESAS[v.emp].n+' '+v.tags.join(' ')).toLowerCase().includes(q);
    return okF&&okL&&okQ;
  }).sort((a,b)=> S.logado ? M(b).total-M(a).total : a.dias-b.dias);
}

function vHome(){
  const chips = [['todas','Todas'],['match','Melhor match'],['pub','Só publicável'],
                 ['remoto','Remoto'],['hibrido','Híbrido'],['presencial','Presencial']]
    .filter(([k])=> S.logado || (k!=='match' && k!=='pub'));

  $('#v-home').innerHTML =
  '<section class="hero">'+malha()+
    '<span class="selo"><i></i>9.014 pessoas na comunidade</span>'+
    '<h1>A vaga certa encontra <em>quem você já é</em>.</h1>'+
    '<p>Aqui seu perfil não é um currículo em PDF. É um mapa do que você sabe, de como você '+
    'trabalha e de onde você quer chegar. As vagas chegam a partir disso.</p>'+
    '<div class="buscador">'+
      '<div class="bfield">'+I.lupa+'<div style="flex:1;min-width:0">'+
        '<label for="q">Cargo, área ou tecnologia</label>'+
        '<input id="q" type="search" placeholder="Coordenador de RH" value="'+esc(S.q)+'"></div></div>'+
      '<div class="bfield">'+I.pin+'<div style="flex:1;min-width:0">'+
        '<label for="loc">Onde</label>'+
        '<input id="loc" type="search" placeholder="Recife, remoto..." value="'+esc(S.local)+'"></div></div>'+
      '<button class="btn" id="buscar" style="flex:0 0 auto">Buscar</button>'+
    '</div>'+
    '<div class="sugere"><span>Buscas frequentes:</span>'+
      ['Coordenador de RH','Marketing','Remoto','Financeiro'].map(s=>
        '<button class="sug" data-sug="'+esc(s)+'">'+esc(s)+'</button>').join('')+'</div>'+
  '</section>'+
  '<div class="barra"><h2>Vagas abertas</h2><p class="cont" id="cont"></p>'+
    '<div class="chips">'+chips.map(([k,r])=>
      '<button class="chip" data-f="'+k+'" aria-pressed="'+(S.filtro===k)+'">'+r+'</button>').join('')+
    '</div></div>'+
  '<div id="listaVagas"></div>'+
  '<div id="barraCmp"></div>'+
  '<p class="nota">Protótipo de avaliação da Conectaria. Dados fictícios e coerentes entre si. '+
  'O match roda o mesmo motor determinístico de <b>packages/matching-core</b>: política '+
  '<b>'+POLITICA.policy_version+'</b>, 14 eixos com tolerância, portão de confiança e trace '+
  'auditável em cada recomendação. Pagamento, login real e integração com ATS externo não '+
  'estão implementados.</p>';

  const buscarDeb = debounce(()=>renderVagas(), 180);
  $('#q').oninput = e => { S.q=e.target.value; buscarDeb(); };
  $('#loc').oninput = e => { S.local=e.target.value; buscarDeb(); };
  $('#buscar').onclick = () => { renderVagas(); $('#listaVagas').scrollIntoView({block:'start'}); };
  renderVagas(true);
}

async function renderVagas(primeira){
  const el=$('#listaVagas'), ct=$('#cont');
  if(primeira){
    ct.textContent='buscando vagas';
    el.innerHTML='<div class="vagas">'+Array.from({length:3},()=>
      '<div class="sk"><i style="width:38%"></i><i style="width:62%;height:9px"></i>'+
      '<i style="width:26%;height:9px"></i></div>').join('')+'</div>';
    await espera(560);
  }
  const r=filtrar();
  ct.textContent = r.length + (r.length===1?' vaga':' vagas') +
    (S.filtro!=='todas'||S.q||S.local ? ' com esse filtro'
      : S.logado ? ', ordenadas pelo seu match' : ', mais recentes primeiro');

  if(!r.length){
    el.innerHTML='<div class="estado"><div class="ic">'+I.vazio+'</div>'+
      '<h3>Nenhuma vaga com esse recorte.</h3>'+
      '<p>São 4 vagas abertas no total. Você pode limpar os filtros, ou cadastrar seu perfil '+
      'para receber por WhatsApp assim que entrar uma que combine com seu objetivo.</p>'+
      '<div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">'+
      '<button class="btn g" id="limpa">Limpar filtros</button>'+
      '<button class="btn" id="avisa">Quero receber vagas sob demanda</button></div></div>';
    $('#limpa').onclick=()=>{S.filtro='todas';S.q='';S.local='';vHome();};
    $('#avisa').onclick=()=>abrirAcesso('cand','criar');
    renderBarraCmp();
    return;
  }

  el.innerHTML='<div class="vagas">'+r.map(v=>{
    const e=EMPRESAS[v.emp];
    const m = S.logado ? M(v) : null;
    const naCmp = S.comparar.includes(v.id);
    const cobertos = S.logado
      ? v.requisitos.filter(rq=>S.cand.competencias.some(c=>c.skillId===rq.skillId)).length : 0;
    return '<article class="vaga rv'+(naCmp?' sel':'')+'">'+
      '<button class="stretch" data-v="'+v.id+'" aria-label="Abrir vaga '+esc(v.cargo)+
        ' em '+esc(e.n)+'"></button>'+
      '<div class="conteudo">'+
        '<div class="emp">'+logo(v.emp)+'<b>'+esc(e.n)+'</b>'+
          '<span class="tag">'+esc(e.s.split('·')[0].trim())+'</span>'+
          (m ? selo(m.desfecho) : '')+'</div>'+
        '<h3>'+esc(v.cargo)+'</h3>'+
        '<div class="meta"><span>'+I.pin+esc(v.local)+'</span><span>'+esc(v.faixa)+'</span>'+
          '<span>'+(v.dias===1?'publicada ontem':'há '+v.dias+' dias')+'</span>'+
          '<span>'+v.cand+' candidaturas</span></div>'+
        '<div class="tags">'+
          (m ? '<span class="tag cob">'+cobertos+' de '+v.requisitos.length+' requisitos</span>' : '')+
          v.tags.map((t,i)=>'<span class="tag'+(i===0?' hi':'')+'">'+esc(t)+'</span>').join('')+
        '</div>'+
      '</div>'+
      '<div class="vdir">'+ medidor(m?m.total:0, m?m.confidence:0) +
        (S.logado ? '<button class="cmpbt'+(naCmp?' on':'')+'" data-cmp="'+v.id+'" '+
          'aria-pressed="'+naCmp+'">'+(naCmp?'comparando':'comparar')+'</button>' : '')+
      '</div></article>';
  }).join('')+'</div>';

  animaMed(); revelar($('#listaVagas')); renderBarraCmp();
}

function renderBarraCmp(){
  const el=$('#barraCmp'); if(!el) return;
  if(!S.comparar.length){ el.innerHTML=''; return; }
  el.innerHTML='<div class="cmpbar">'+I.bal+
    '<b style="font-family:var(--d);font-size:var(--md)">'+S.comparar.length+
    (S.comparar.length===1?' vaga selecionada':' vagas selecionadas')+'</b>'+
    '<span style="font-size:var(--sm);color:var(--i52);flex:1;min-width:150px">'+
    (S.comparar.length<2?'Escolha mais uma para comparar lado a lado.'
      :'Mesmo motor, mesma política, três dimensões lado a lado.')+'</span>'+
    '<button class="btn g sm" id="cmpLimpa">Limpar</button>'+
    '<button class="btn sm" id="cmpVer"'+(S.comparar.length<2?' disabled':'')+'>Comparar</button></div>';
  $('#cmpLimpa').onclick=()=>{S.comparar=[];salvar();renderVagas();};
  $('#cmpVer').onclick=()=>ir('comparar');
}
