/* ══════════════════ VITRINE E PÁGINA DA VAGA ══════════════════
   O que qualquer pessoa vê, com ou sem cadastro. Nenhum percentual de
   aderência aparece deste lado: o match é ferramenta da Conectaria. */

function filtrarVagas(){
  const q = normalizar(S.q.trim());
  return vagasPublicadas()
    .filter(v => !S.area || v.areaId === S.area)
    .filter(v => {
      if(!q) return true;
      const e = empresaPor(v.empresaId);
      return normalizar([v.titulo, e.n, v.local, AREA[v.areaId].n, v.regime].join(' ')).includes(q);
    })
    .sort((a, b) => new Date(b.publicadaEm) - new Date(a.publicadaEm));
}

function vVagas(){
  const pub = vagasPublicadas();
  const porArea = {};
  pub.forEach(v => { porArea[v.areaId] = (porArea[v.areaId] || 0) + 1; });
  const areas = areasOrdenadas().filter(a => porArea[a.id]);
  const c = eu();

  $('#v-vagas').innerHTML =
  '<section class="heroc hv">' +
    (c ? '<h1>Olá, ' + esc(c.nome.split(' ')[0]) + '</h1>' +
      '<p>Separamos as vagas que combinam com o seu perfil. Todas as outras estão logo abaixo.</p>'
    : '<h1>Vagas conectadas a você</h1>' +
      '<p>Oportunidades das empresas parceiras da Conectaria. Cadastre-se uma vez, candidate-se com um clique ' +
      'e acompanhe cada etapa por aqui. A nossa equipe fala com você pelo WhatsApp.</p>') +
  '</section>' +
  (c ? blocoRecomendacoes(c, 'Recomendadas para você', 'Pelas atividades, local e modelo de trabalho do seu perfil.') : '') +
  (c ? '<h2 class="todash">Todas as vagas</h2>' : '') +
  '<div class="buscador">' +
    '<div class="bfield">' + I.lupa + '<div style="flex:1;min-width:0">' +
      '<label for="q">Cargo, empresa ou cidade</label>' +
      '<input id="q" type="search" placeholder="Vendedor, Recife, estágio..." value="' + esc(S.q) + '"></div></div>' +
  '</div>' +
  '<div class="chips achips" role="group" aria-label="Filtrar por área">' +
    '<button class="chip" data-farea="" aria-pressed="' + !S.area + '">Todas <small>' + pub.length + '</small></button>' +
    areas.map(a => '<button class="chip" data-farea="' + a.id + '" aria-pressed="' + (S.area === a.id) + '">' +
      esc(a.n) + ' <small>' + porArea[a.id] + '</small></button>').join('') +
  '</div>' +
  '<p class="cont" id="contVagas" aria-live="polite"></p>' +
  '<div id="listaVagas"></div>' +
  '<section class="ctaeq">' +
    '<div><h3>Buscando uma vaga? A gente te apoia no processo.</h3>' +
    '<p>Fale com a nossa equipe para ter apoio na sua mentoria de carreira.</p></div>' +
    '<a class="btn" href="' + WHATS_EQUIPE + '" target="_blank" rel="noopener">Falar com a equipe</a>' +
  '</section>';

  $$('#v-vagas .recs [data-abrevaga]').forEach(b => b.onclick = () => ir('vaga', b.dataset.abrevaga));
  $('#q').oninput = debounce(e => { S.q = e.target.value; renderListaVagas(); }, 160);
  $$('[data-farea]').forEach(b => b.onclick = () => {
    S.area = b.dataset.farea || null;
    $$('[data-farea]').forEach(x => x.setAttribute('aria-pressed', String((x.dataset.farea || null) === S.area)));
    renderListaVagas();
  });
  renderListaVagas();
}

function renderListaVagas(){
  const lista = filtrarVagas(), c = eu();
  $('#contVagas').textContent = plural(lista.length, 'vaga', 'vagas') + (S.area || S.q ? ' com esse recorte' : ' abertas');
  if(!lista.length){
    $('#listaVagas').innerHTML = '<div class="estado"><div class="ic">' + I.vazio + '</div>' +
      '<h3>Nenhuma vaga com esse recorte.</h3><p>Tente outro termo ou veja todas as áreas.</p>' +
      '<button class="btn" id="limpaVitrine">Ver todas as vagas</button></div>';
    $('#limpaVitrine').onclick = () => { S.q = ''; S.area = null; vVagas(); };
    return;
  }
  $('#listaVagas').innerHTML = '<div class="vagas">' + lista.map(v => cardVaga(v, c)).join('') + '</div>';
  $$('#listaVagas [data-abrevaga]').forEach(b => b.onclick = () => ir('vaga', b.dataset.abrevaga));
}

/* Card de vaga. Com `porque`, é uma recomendação: o resumo dá lugar ao
   motivo em palavras, e o selo diz que combina, sem número nenhum. */
function cardVaga(v, c, porque){
  const e = empresaPor(v.empresaId), foi = c && jaCandidatou(c.id, v.id);
  return '<article class="vaga' + (porque ? ' rec' : '') + '">' +
    '<button class="stretch" data-abrevaga="' + v.id + '" aria-label="Abrir vaga ' + esc(v.titulo) + ' em ' + esc(e.n) + '"></button>' +
    '<div class="conteudo">' +
      '<div class="vtopo">' + logoEmp(e) + '<b>' + esc(e.n) + '</b>' +
        '<span class="vsetor">' + esc(AREA[v.areaId].n) + '</span>' +
        (porque ? '<span class="tag combina">' + I.spark + 'Combina com você</span>'
          : v.conectaria ? '<span class="tag trab">Vaga trabalhada pela Conectaria</span>' : '') + '</div>' +
      '<h3>' + esc(v.titulo) + '</h3>' +
      '<div class="vmeta"><span>' + I.pin + esc(v.local) + '</span><span>' + esc(v.regime) + '</span>' +
        '<span>' + tempoRel(v.publicadaEm) + '</span></div>' +
      '<p class="vres">' + esc(porque || v.resumo) + '</p>' +
    '</div>' +
    '<div class="vdir">' + (foi ? '<span class="pill ok"><i></i>candidatura enviada</span>'
      : '<span class="vver">Ver vaga ' + I.ch + '</span>') + '</div>' +
  '</article>';
}

/* Bloco de recomendações. Serve a vitrine e Minhas candidaturas. */
function blocoRecomendacoes(c, titulo, sub){
  const recs = recomendacoesPara(c, 3);
  if(!recs.length){
    return (c.competencias || []).length
      ? '<div class="avisoex">' + I.spark + '<div><b>Nenhuma vaga aberta combina com o seu perfil agora.</b> Quando entrar uma, ' +
        'ela aparece aqui, e a equipe da Conectaria também pode indicar você.</div></div>'
      : '<div class="avisoex">' + I.spark + '<div><b>Sem recomendações ainda.</b> Adicione ao seu perfil as atividades que você já fez e ' +
        'a gente indica as vagas que combinam.</div><button class="btn g sm" data-ir="perfil">Completar perfil</button></div>';
  }
  return '<section class="recs"><div class="recstop"><h2>' + esc(titulo) + '</h2><p>' + esc(sub) + '</p></div>' +
    '<div class="vagas">' + recs.map(({v, porque}) => cardVaga(v, c, porque)).join('') + '</div></section>';
}

function vVaga(id){
  const v = vagaPor(id);
  if(!v || (v.status !== 'publicada' && S.papel !== 'admin')){
    $('#v-vaga').innerHTML = '<div class="estado"><div class="ic">' + I.vazio + '</div><h3>Esta vaga não está mais aberta.</h3>' +
      '<p>Ela pode ter sido encerrada ou pausada. Veja as outras vagas publicadas.</p>' +
      '<button class="btn" data-ir="vagas">Ver vagas abertas</button></div>';
    return;
  }
  const e = empresaPor(v.empresaId), c = eu(), foi = c && jaCandidatou(c.id, v.id);
  const obrig = v.requisitos.filter(r => r.obrigatorio), desej = v.requisitos.filter(r => !r.obrigatorio);
  const paragrafos = String(v.descricao || v.resumo).split(/\n{2,}/).map(p => {
    const linhas = p.split('\n');
    const titulo = linhas.length > 1 && linhas[0].length < 40 && !/^[-•]/.test(linhas[0]) ? linhas.shift() : null;
    const itens = linhas.every(l => /^\s*[-•]/.test(l));
    return (titulo ? '<h4>' + esc(titulo) + '</h4>' : '') + (itens
      ? '<ul>' + linhas.map(l => '<li>' + esc(l.replace(/^\s*[-•]\s*/, '')) + '</li>').join('') + '</ul>'
      : '<p>' + linhas.map(esc).join('<br>') + '</p>');
  }).join('');

  $('#v-vaga').innerHTML =
  '<button class="volta" data-ir="' + (S.papel === 'admin' ? 'avagas' : 'vagas') + '">' + I.volta + (S.papel === 'admin' ? 'Vagas' : 'Todas as vagas') + '</button>' +
  (v.status !== 'publicada' ? '<div class="pend">' + I.al + '<div><b>Prévia.</b> Esta vaga está como ' + ST_VAGA[v.status][1].toLowerCase() + ' e não aparece para candidatos.</div></div>' : '') +
  '<div class="split"><div class="corpo">' +
    '<div class="emp">' + logoEmp(e) + '<b>' + esc(e.n) + '</b><span class="tag">' + esc(e.setor) + '</span></div>' +
    '<h1>' + esc(v.titulo) + '</h1>' +
    '<div class="meta" style="margin-bottom:var(--s3)"><span>' + I.pin + esc(v.local) + '</span>' +
      '<span>' + esc(MODELO_ROT[v.modelo]) + '</span><span>' + esc(v.regime) + '</span>' +
      '<span>' + esc(v.faixa) + '</span></div>' +
    (v.conectaria ? '<p class="tag trab" style="display:inline-flex;margin-bottom:var(--s2)">Vaga trabalhada pela Conectaria</p>' : '') +
    paragrafos +
    (v.requisitos.length ? '<h4>O que a vaga pede</h4><ul>' +
      obrig.map(r => '<li><b>' + esc(skillNome(r.skillId)) + '</b> <span class="pill al">obrigatório</span></li>').join('') +
      desej.map(r => '<li>' + esc(skillNome(r.skillId)) + ' <span class="pill n">diferencial</span></li>').join('') + '</ul>' : '') +
  '</div><aside class="lateral">' +
    '<div class="box">' +
      (S.papel === 'admin'
        ? '<p class="hint" style="margin:0">Você está vendo como a Conectaria. Troque para "Candidato" no topo para testar a candidatura.</p>'
        : foi
        ? '<button class="btn w" disabled>' + I.ok + 'Candidatura enviada</button>' +
          '<p class="mini" style="text-align:center">Acompanhe em Minhas candidaturas.</p>'
        : '<button class="btn w" id="btCandidatar">Candidatar-se</button>' +
          '<p class="mini">' + (c
            ? 'Seu perfil já está pronto. A candidatura vai com ele, e a equipe da Conectaria fala com você pelo WhatsApp.'
            : 'Primeira vez aqui? O cadastro leva poucos minutos e serve para todas as vagas.') + '</p>') +
    '</div>' +
    '<div class="box"><h4>Sobre a empresa</h4>' +
      '<div class="linha"><span>Setor</span><b>' + esc(e.setor) + '</b></div>' +
      '<div class="linha"><span>Onde</span><b>' + esc(e.cidade) + '</b></div>' +
      (e.site ? '<div class="linha"><span>Site</span><b>' + esc(e.site) + '</b></div>' : '') +
    '</div>' +
    '<div class="box"><h4>Dúvidas sobre a vaga?</h4>' +
      '<p class="hint">Fale com a equipe da Conectaria no WhatsApp ' + NUMERO_EQUIPE + '.</p>' +
      '<a class="btn g sm w" href="' + WHATS_EQUIPE + '" target="_blank" rel="noopener">Falar com a equipe</a></div>' +
  '</aside></div>';

  const bt = $('#btCandidatar');
  if(bt) bt.onclick = () => {
    if(eu()) candidatar(v.id);
    else { S.vagaAlvo = v.id; iniciarCadastro(); }
  };
}

/* Único caminho pelo qual o candidato fecha uma candidatura. */
async function candidatar(vid){
  const c = eu(); if(!c || jaCandidatou(c.id, vid)) return;
  const b = $('#btCandidatar');
  if(b){ b.disabled = true; b.innerHTML = '<span class="spin"></span>Enviando'; }
  await espera(480);
  criarCandidatura(c.id, vid, 'site', 'candidato');
  S.vagaAlvo = null; salvar();
  ir('minhas');
  toast('Candidatura enviada. A equipe da Conectaria vai falar com você pelo WhatsApp.');
}
