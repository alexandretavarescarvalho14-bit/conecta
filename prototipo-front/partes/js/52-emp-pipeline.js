/* ══════════════════ 22 · EMPRESA · CANDIDATURAS ══════════════════

   Substitui a lista chapada de 4 pessoas por um pipeline de verdade:
   seletor de vaga, tabela ordenada por fit com etapa e portão, filtro
   por etapa, busca por texto, seleção múltipla com "mover para", e
   ações linha a linha. Toda mudança passa por aplicar() (15-pipeline-
   seed.js) e fica no histórico — é dali que o dashboard deriva o funil.

   Seleção de linhas é estado transitório de tela, não do app: um Set
   aqui, não em S. Trocar de vaga ou sair da tela limpa sozinho. */
let pipSel = new Set();
let pipFiltroEtapa = null;
let pipBusca = '';

function vEcand(vagaIdArg){
  const vagas = vagasDe('aurora');
  if(!vagas.length){
    $('#v-ecand').innerHTML = '<div class="estado" style="padding-top:var(--s6)"><div class="ic">' +
      I.vazio + '</div><h3>Nenhuma vaga publicada ainda.</h3>' +
      '<p>Publique uma vaga para começar a receber candidaturas.</p>' +
      '<button class="btn" data-n="evagas">Ver suas vagas</button></div>';
    $$('[data-n]', $('#v-ecand')).forEach(b => b.onclick = () => ir(b.dataset.n));
    return;
  }
  const vid = vagaIdArg || S.vagaEmpSelecionada || vagas[0].id;
  S.vagaEmpSelecionada = vid; pipSel = new Set(); pipFiltroEtapa = null; pipBusca = '';
  renderEcand();
}

function candidaturasDaVaga(vid){ return S.pipeline.filter(a => a.vagaId === vid); }

function renderEcand(){
  const vagas = vagasDe('aurora');
  const v = VAGA[S.vagaEmpSelecionada] || vagas[0];
  const todas = candidaturasDaVaga(v.id);
  const d = derivarDash(todas);

  let P = [...todas].sort((a, b) => b.rec.total - a.rec.total);
  if(pipFiltroEtapa !== null) P = P.filter(a => a.etapa === pipFiltroEtapa && a.status === 'ativa');
  if(pipBusca.trim()){
    const q = normalizar(pipBusca.trim());
    P = P.filter(a => normalizar(PESSOA[a.pessoaId].ini + ' ' + PESSOA[a.pessoaId].cargoAtual).includes(q));
  }

  $('#v-ecand').innerHTML=
  '<div class="barra" style="margin-top:var(--s5);flex-wrap:wrap"><h2>Candidaturas</h2>'+
    '<select id="selVaga" class="selVaga" aria-label="Escolher vaga">' +
      vagas.map(vx => '<option value="' + vx.id + '"' + (vx.id === v.id ? ' selected' : '') + '>' +
        esc(vx.cargo) + '</option>').join('') + '</select>'+
    '<p class="cont">' + todas.length + (todas.length === 1 ? ' pessoa' : ' pessoas') + '</p></div>'+

  '<div class="kpis" style="margin-bottom:var(--s3)">' +
    kpi('Em processo', d.emProcesso, d.aguardandoDecisao + ' aguardando sua decisão') +
    kpi('Fit médio', Math.round(d.fitMedio) + '%', 'de quem avançou: ' + Math.round(d.fitMedioAvancou) + '%') +
    kpi('Fora de publicável', d.retidasBlock + d.retidasReview, d.retidasBlock + ' bloqueadas · ' + d.retidasReview + ' em revisão') +
    kpi('Reprovadas', d.reprovadasTotal, d.reprovadasTotal ? (d.porGrupo.tecnico||0) + ' por técnico' : 'nenhuma ainda') +
  '</div>' +

  '<div class="pipToolbar">' +
    '<div class="chips" id="chipsEtapa" style="margin:0">' +
      '<button class="chip" data-etf="todas" aria-pressed="' + (pipFiltroEtapa === null) + '">Todas</button>' +
      ETAPAS.map((n, i) => '<button class="chip" data-etf="' + i + '" aria-pressed="' + (pipFiltroEtapa === i) + '">' +
        esc(n) + ' <small>' + todas.filter(a => a.etapa === i && a.status === 'ativa').length + '</small></button>').join('') +
    '</div>' +
    '<input id="pipBuscaIn" type="search" placeholder="Buscar por iniciais ou cargo" value="' + esc(pipBusca) + '">' +
  '</div>' +

  '<div class="bloco" style="margin-top:var(--s2)"><div class="tabw"><table class="tab"><thead><tr>' +
    '<th style="width:30px"><input type="checkbox" id="selTodos" aria-label="Selecionar todas"></th>' +
    '<th>Pessoa</th><th>Fit</th><th>Confiança</th><th>Portão</th><th>Por quê</th><th>Etapa</th><th></th>' +
    '</tr></thead><tbody>' + (P.length ? P.map(linhaPipeline).join('') :
      '<tr><td colspan="8" style="text-align:center;color:var(--i62);padding:var(--s4) 0">Nenhuma candidatura com esse recorte.</td></tr>'
    ) + '</tbody></table></div></div>' +

  '<p class="nota">A coluna "por quê" vem dos mesmos eixos que a pessoa vê do outro lado. A coluna ' +
  'portão traz a decisão da política de publicação: quem aparece em <b>revisão humana</b> tem ' +
  'perfil que a própria pessoa ainda não confirmou, então o número existe mas a plataforma não o ' +
  'trata como fato verificado.</p>' +

  '<div id="pipBarraSel"></div>';

  ligarEcand(v, P);
  animaEixos();
}

function linhaPipeline(ap){
  const p = PESSOA[ap.pessoaId];
  const gap = [...ap.rec.tecnico_ev, ...ap.rec.cultural_ev, ...ap.rec.contexto_ev].find(e => e.kind !== 'strength');
  const porque = gap ? gap.humano : 'Cobre bem os requisitos e o ambiente da vaga.';
  const desativada = ap.status !== 'ativa';
  return '<tr data-ap="' + ap.id + '"' + (desativada ? ' style="opacity:.55"' : '') + '>' +
    '<td><input type="checkbox" class="selLinha" data-sel="' + ap.id + '" aria-label="Selecionar"' +
      (pipSel.has(ap.id) ? ' checked' : '') + (desativada ? ' disabled' : '') + '></td>' +
    '<td><b style="font-family:var(--d);font-size:var(--md)">' + esc(p.ini) +
      (ap.favorito ? ' ' + I.spark : '') + '</b>' +
      '<div style="color:var(--i62);font-size:var(--xs)">' + esc(p.cargoAtual) + ' · ' + esc(ORIGEM_ROT[ap.origem]) + '</div></td>' +
    '<td><span class="eixo" style="grid-template-columns:1fr 34px;width:104px">' +
      '<span class="t"><i data-w="' + ap.rec.total + '"></i></span><span class="v">' + ap.rec.total + '</span></span></td>' +
    '<td><span class="cbar' + (ap.rec.confidence < POLITICA.confianca.revisar_abaixo_de ? ' bx' : '') +
      '" style="width:58px;display:block"><i data-w="' + Math.round(ap.rec.confidence * 100) + '"></i></span>' +
      '<span style="font-size:var(--xs);color:var(--i62)">' + pc(ap.rec.confidence) + '</span></td>' +
    '<td>' + selo(ap.rec.desfecho) + '</td>' +
    '<td style="max-width:230px;color:var(--i72)">' + esc(porque) + '</td>' +
    '<td>' + (ap.status === 'reprovada'
        ? '<span class="pill bl"><i></i>Reprovada</span>'
        : ap.status === 'contratada' ? '<span class="pill ok"><i></i>Contratada</span>'
        : '<span class="pill ' + (ap.etapa >= 3 ? 'ac' : 'n') + '">' + esc(ETAPAS[ap.etapa]) + '</span>') +
    (ap.status === 'reprovada' && ap.motivoId ? '<div style="font-size:var(--xs);color:var(--i62);margin-top:3px">' + esc(MOTIVO[ap.motivoId]?.r || '') + '</div>' : '') +
    '</td>' +
    '<td class="pipAcoes">' +
      (ap.status === 'ativa' ? (
        (ap.etapa < ETAPAS.length - 1 ? '<button class="btn g sm" data-avancar="' + ap.id + '" title="Avançar etapa">' + I.ch + '</button>' : '') +
        '<button class="btn g sm" data-favoritar="' + ap.id + '" title="Favoritar" aria-pressed="' + ap.favorito + '">' + I.spark + '</button>' +
        '<button class="btn g sm" data-reprovarbt="' + ap.id + '" title="Reprovar">' + I.x + '</button>'
      ) : ap.status === 'reprovada'
        ? '<button class="btn g sm" data-reabrir="' + ap.id + '">Reabrir</button>'
        : '') +
    '</td></tr>';
}

function ligarEcand(v, P){
  $('#selVaga').onchange = e => ir('ecand', e.target.value);
  $('#pipBuscaIn').oninput = debounce(e => { pipBusca = e.target.value; renderEcand(); }, 180);
  $$('[data-etf]').forEach(b => b.onclick = () => {
    pipFiltroEtapa = b.dataset.etf === 'todas' ? null : +b.dataset.etf; renderEcand();
  });

  $$('[data-avancar]').forEach(b => b.onclick = () => {
    const ap = S.pipeline.find(x => x.id === b.dataset.avancar);
    aplicar(ap, {tipo:'avancar'});
    toast('Movida para ' + ETAPAS[ap.etapa] + '.');
    renderEcand();
  });
  $$('[data-favoritar]').forEach(b => b.onclick = () => {
    aplicar(S.pipeline.find(x => x.id === b.dataset.favoritar), {tipo:'favoritar'});
    renderEcand();
  });
  $$('[data-reabrir]').forEach(b => b.onclick = () => {
    aplicar(S.pipeline.find(x => x.id === b.dataset.reabrir), {tipo:'reabrir'});
    toast('Candidatura reaberta.');
    renderEcand();
  });
  $$('[data-reprovarbt]').forEach(b => b.onclick = () => abrirReprovar([b.dataset.reprovarbt]));

  $$('[data-sel]').forEach(cb => cb.onchange = () => {
    cb.checked ? pipSel.add(cb.dataset.sel) : pipSel.delete(cb.dataset.sel);
    renderBarraSel();
  });
  $('#selTodos').onchange = e => {
    P.filter(a => a.status === 'ativa').forEach(a => e.target.checked ? pipSel.add(a.id) : pipSel.delete(a.id));
    renderEcand();
  };
  renderBarraSel();
}

function renderBarraSel(){
  const box = $('#pipBarraSel'); if(!box) return;
  if(!pipSel.size){ box.innerHTML = ''; return; }
  box.innerHTML = '<div class="cmpbar">' + I.pes +
    '<b style="font-family:var(--d);font-size:var(--md)">' + pipSel.size +
    (pipSel.size === 1 ? ' selecionada' : ' selecionadas') + '</b>' +
    '<select id="moverPara" style="margin-left:auto">' +
      ETAPAS.map((n, i) => '<option value="' + i + '">Mover para ' + esc(n) + '</option>').join('') +
    '</select>' +
    '<button class="btn g sm" id="moverBt">Aplicar</button>' +
    '<button class="btn g sm" id="reprovarSelBt">Reprovar selecionadas</button>' +
    '<button class="btn g sm" id="limparSelBt">Limpar</button></div>';
  $('#moverBt').onclick = () => {
    const alvo = +$('#moverPara').value;
    pipSel.forEach(id => {
      const ap = S.pipeline.find(x => x.id === id); if(!ap || ap.status !== 'ativa') return;
      const antes = ap.etapa; ap.etapa = alvo; ap.status = 'ativa';
      ap.historico.push({de:antes, para:alvo, em:new Date().toISOString(), quem:'empresa'});
      ap.atualizadaEm = new Date().toISOString();
    });
    salvar(); toast(pipSel.size + ' movida(s) para ' + ETAPAS[alvo] + '.');
    pipSel = new Set(); renderEcand();
  };
  $('#reprovarSelBt').onclick = () => abrirReprovar([...pipSel]);
  $('#limparSelBt').onclick = () => { pipSel = new Set(); renderEcand(); };
}

/* Reprovar sempre pede motivo do vocabulário fechado — nunca texto livre
   puro, senão nada disso alimenta o widget de calibração do dashboard. */
function abrirReprovar(ids){
  const corpo = '<h2 id="mTit">Reprovar ' + (ids.length > 1 ? ids.length + ' candidaturas' : 'candidatura') + '</h2>' +
    '<p class="sub">Escolha o motivo mais próximo. Isso alimenta o painel de saúde do dado no dashboard.</p>' +
    '<div class="form" style="gap:var(--s2)"><div class="fg"><label for="motivoSel">Motivo</label>' +
    '<select id="motivoSel">' + MOTIVOS_REJEICAO.map(m => '<option value="' + m.id + '">' + esc(m.r) + '</option>').join('') +
    '</select></div>' +
    '<div class="fg"><label for="notaRep">Nota (opcional, não entra em estatística)</label>' +
    '<textarea id="notaRep" rows="2"></textarea></div>' +
    '<button class="btn w" id="confirmarReprovar">Reprovar</button>' +
    '<button class="btn g w" id="cancelarReprovar" style="margin-top:8px">Cancelar</button></div>';
  // reaproveita o modal genérico do app (70-acesso.js), sem passar por
  // abrirAcesso(): aquele monta o formulário de login, este monta o de
  // reprovação. Setar focoAntes aqui é o que faz fecharAcesso() devolver
  // o foco para o botão certo, e não para o resto de uma sessão anterior.
  focoAntes = document.activeElement;
  $('#mbox').innerHTML = corpo;
  $('#scrim').classList.add('on'); $('#mbox').classList.add('on');
  $('#modal').setAttribute('aria-hidden', 'false');
  setTimeout(() => { const f = $('#mbox button'); if(f) f.focus(); }, 60);
  $('#cancelarReprovar').onclick = fecharAcesso;
  $('#confirmarReprovar').onclick = () => {
    const motivoId = $('#motivoSel').value, nota = $('#notaRep').value.trim();
    ids.forEach(id => {
      const ap = S.pipeline.find(x => x.id === id); if(!ap) return;
      aplicar(ap, {tipo:'reprovar', motivoId, nota});
    });
    fecharAcesso();
    toast(ids.length > 1 ? ids.length + ' candidaturas reprovadas.' : 'Candidatura reprovada.');
    pipSel = new Set(); renderEcand();
  };
}
