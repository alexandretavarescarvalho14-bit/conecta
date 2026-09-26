/* ══════════════════ CONECTARIA · PROCESSO POR VAGA ══════════════════
   Porte da tela de pipeline do protótipo, agora operada pela Conectaria.
   Toda mudança passa por aplicar() (37-pipeline-base) e fica no
   histórico, com quem = 'conectaria'. Seleção de linhas é estado de tela:
   um Set aqui, não em S. */

let pipSel = new Set();

function vPipeline(vid){
  const vagas = DB.vagas.filter(v => v.status !== 'rascunho');
  if(!vagas.length){
    $('#v-pipeline').innerHTML = '<div class="estado"><div class="ic">' + I.vazio + '</div><h3>Nenhuma vaga publicada ainda.</h3>' +
      '<p>Publique uma vaga para começar a receber candidaturas.</p><button class="btn" data-ir="avagas">Ver vagas</button></div>';
    return;
  }
  const alvo = vid && vagaPor(vid) ? vid : S.adm.vagaSel && vagaPor(S.adm.vagaSel) ? S.adm.vagaSel : vagas[0].id;
  if(alvo !== S.adm.vagaSel){ S.adm.etapa = null; S.adm.busca = ''; }
  S.adm.vagaSel = alvo; pipSel = new Set();
  garantirRecs();
  renderPipeline();
}

function renderPipeline(){
  const v = vagaPor(S.adm.vagaSel), e = empresaPor(v.empresaId);
  const todas = candidaturasDaVaga(v.id);
  const d = derivarDash(todas);
  let P = [...todas].sort((a, b) => (b.status === 'ativa') - (a.status === 'ativa') || b.rec.total - a.rec.total);
  if(S.adm.etapa !== null) P = P.filter(a => a.etapa === S.adm.etapa && a.status === 'ativa');
  if(S.adm.busca.trim()){
    const q = normalizar(S.adm.busca.trim());
    P = P.filter(a => { const c = candidatoPor(a.candidatoId); return normalizar(c.nome + ' ' + (c.cidade || '')).includes(q); });
  }
  const desat = todas.filter(recDesatualizado).length;
  const opcoes = [...DB.vagas].filter(x => x.status !== 'rascunho')
    .sort((a, b) => empresaPor(a.empresaId).n.localeCompare(empresaPor(b.empresaId).n) || a.titulo.localeCompare(b.titulo));

  $('#v-pipeline').innerHTML =
  '<div class="barra" style="margin-top:var(--s5);flex-wrap:wrap"><h2>Processo</h2>' +
    '<select id="selVaga" class="selVaga" aria-label="Escolher vaga">' + opcoes.map(x =>
      '<option value="' + x.id + '"' + (x.id === v.id ? ' selected' : '') + '>' + esc(empresaPor(x.empresaId).n + ' · ' + x.titulo) +
      (x.status !== 'publicada' ? ' (' + ST_VAGA[x.status][1].toLowerCase() + ')' : '') + '</option>').join('') + '</select>' +
    '<div class="chips"><button class="btn g sm" data-editvaga2="' + v.id + '">Editar vaga</button>' +
    '<button class="btn g sm" id="btTrazer">Trazer do banco</button></div></div>' +
  '<p class="cont" style="margin-top:-6px">' + logoEmp(e) + ' ' + esc(e.n) + ' · ' + esc(v.local) + ' · ' + pillVaga(v.status) + '</p>' +

  '<div class="kpis" style="margin-bottom:var(--s3)">' +
    kpi('Em processo', d.emProcesso, plural(todas.length, 'candidatura', 'candidaturas') + ' no total') +
    kpi('Aderência média', todas.length ? Math.round(d.fitMedio) + '' : '—', todas.length ? 'de quem chegou à entrevista: ' + (d.fitMedioAvancou ? Math.round(d.fitMedioAvancou) : '—') : 'sem candidaturas') +
    kpi('Pedem atenção', d.retidasBlock + d.retidasReview, 'nota alta com requisito faltando, ou perfil pouco confiável') +
    kpi('Encerradas', d.reprovadasTotal, d.contratados ? plural(d.contratados, 'contratação', 'contratações') : 'nenhuma contratação ainda') +
  '</div>' +

  (desat ? '<div class="pend">' + I.al + '<div><b>' + plural(desat, 'aderência calculada antes de uma mudança', 'aderências calculadas antes de uma mudança') +
    '.</b> A vaga ou o perfil mudou depois do cálculo. <button class="link" id="btRecalcTodos">Recalcular</button></div></div>' : '') +

  '<div class="pipToolbar">' +
    '<div class="chips" style="margin:0">' +
      '<button class="chip" data-etf="todas" aria-pressed="' + (S.adm.etapa === null) + '">Todas <small>' + todas.length + '</small></button>' +
      ETAPAS.map((n, i) => '<button class="chip" data-etf="' + i + '" aria-pressed="' + (S.adm.etapa === i) + '">' + esc(n) +
        ' <small>' + todas.filter(a => a.etapa === i && a.status === 'ativa').length + '</small></button>').join('') +
    '</div>' +
    '<input id="pipBuscaIn" type="search" placeholder="Buscar por nome ou cidade" value="' + esc(S.adm.busca) + '" aria-label="Buscar candidato">' +
  '</div>' +

  '<div class="bloco" style="margin-top:var(--s2)"><div class="tabw"><table class="tab"><thead><tr>' +
    '<th style="width:30px"><input type="checkbox" id="selTodos" aria-label="Selecionar todas"></th>' +
    '<th>Pessoa</th><th>Aderência</th><th>Principal ponto</th><th>Etapa</th><th></th></tr></thead><tbody>' +
    (P.length ? P.map(linhaPip).join('') :
      '<tr><td colspan="6" style="text-align:center;color:var(--i62);padding:var(--s4) 0">' +
      (todas.length ? 'Ninguém com esse recorte.' : 'Nenhuma candidatura ainda. Use "Trazer do banco" para indicar alguém.') + '</td></tr>') +
  '</tbody></table></div></div>' +
  '<p class="nota">A aderência é calculada quando a Conectaria abre o processo e fica guardada na candidatura. Ela compara as ' +
  'atividades declaradas com os requisitos da vaga e o local, modelo e pretensão com o que a vaga oferece. O candidato não vê este número.</p>' +
  '<div id="pipBarraSel"></div>';

  ligarPipeline(v, P);
}

function linhaPip(ap){
  const c = candidatoPor(ap.candidatoId), off = ap.status !== 'ativa';
  return '<tr data-ap="' + ap.id + '"' + (off ? ' class="off"' : '') + '>' +
    '<td><input type="checkbox" data-sel="' + ap.id + '" aria-label="Selecionar ' + esc(c.nome) + '"' + (pipSel.has(ap.id) ? ' checked' : '') + (off ? ' disabled' : '') + '></td>' +
    '<td><button class="nomebt" data-vercand="' + ap.id + '">' + esc(c.nome) + (ap.favorito ? ' <span class="fav" aria-label="favorito">' + I.spark + '</span>' : '') + '</button>' +
      '<div class="sub2">' + esc([c.cidade, c.uf].filter(Boolean).join(', ')) + ' · ' + esc(ORIGEM_ROT[ap.origem] || ap.origem) + (c.exemplo ? ' · exemplo' : '') + '</div></td>' +
    '<td>' + barraFit(ap.rec.total) + (ap.rec.desfecho !== 'allow' ? '<div style="margin-top:4px">' + selo(ap.rec.desfecho) + '</div>' : '') + '</td>' +
    '<td class="porq">' + esc(motivoPrincipal(ap.rec)) + '</td>' +
    '<td>' + pillStatus(ap) + (ap.status === 'reprovada' && ap.motivoId ? '<div class="sub2" style="margin-top:3px">' + esc(MOTIVO[ap.motivoId] ? MOTIVO[ap.motivoId].r : '') + '</div>' : '') + '</td>' +
    '<td class="pipAcoes">' + acoesPip(ap) + '</td></tr>';
}
function acoesPip(ap){
  if(ap.status === 'reprovada' || ap.status === 'contratada') return '<button class="btn g sm" data-pip="reabrir" data-id="' + ap.id + '">Reabrir</button>';
  const ultima = ap.etapa === ETAPAS.length - 1;
  return (ap.etapa > 0 ? '<button class="btn g sm" data-pip="voltar" data-id="' + ap.id + '" title="Voltar etapa" aria-label="Voltar etapa">' + I.volta + '</button>' : '') +
    (ultima ? '<button class="btn sm" data-pip="contratar" data-id="' + ap.id + '">Contratar</button>'
      : '<button class="btn g sm" data-pip="avancar" data-id="' + ap.id + '" title="Avançar para ' + esc(ETAPAS[ap.etapa + 1]) + '" aria-label="Avançar etapa">' + I.ch + '</button>') +
    '<button class="btn g sm" data-pip="favoritar" data-id="' + ap.id + '" title="Favoritar" aria-pressed="' + ap.favorito + '" aria-label="Favoritar">' + I.spark + '</button>' +
    '<button class="btn g sm" data-pip="reprovar" data-id="' + ap.id + '" title="Encerrar" aria-label="Encerrar candidatura">' + I.x + '</button>';
}

const TOAST_PIP = {
  avancar: ap => 'Movida para ' + ETAPAS[ap.etapa] + '.',
  voltar: ap => 'Voltou para ' + ETAPAS[ap.etapa] + '.',
  contratar: () => 'Contratação registrada.',
  reabrir: () => 'Candidatura reaberta.',
};
function acaoPip(tipo, id){
  const ap = candidaturaPor(id);
  if(tipo === 'reprovar') return abrirEncerrar([id]);
  aplicar(ap, {tipo, quem:'conectaria'});
  if(TOAST_PIP[tipo]) toast(TOAST_PIP[tipo](ap));
  renderPipeline();
  if(gavetaAberta === id) gavetaCandidatura(id);
}

function ligarPipeline(v, P){
  const raiz = $('#v-pipeline');
  $('#selVaga', raiz).onchange = e => ir('pipeline', e.target.value);
  $('#pipBuscaIn', raiz).oninput = debounce(e => { S.adm.busca = e.target.value; renderPipeline(); const i = $('#pipBuscaIn'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
  $$('[data-etf]', raiz).forEach(b => b.onclick = () => { S.adm.etapa = b.dataset.etf === 'todas' ? null : +b.dataset.etf; renderPipeline(); });
  $$('[data-pip]', raiz).forEach(b => b.onclick = () => acaoPip(b.dataset.pip, b.dataset.id));
  $$('[data-vercand]', raiz).forEach(b => b.onclick = () => gavetaCandidatura(b.dataset.vercand));
  $$('[data-editvaga2]', raiz).forEach(b => b.onclick = () => { rasc = null; ir('vagaform', v.id); });
  $('#btTrazer', raiz).onclick = () => { S.adm.tal.vaga = v.id; ir('talentos'); };
  const rt = $('#btRecalcTodos', raiz);
  if(rt) rt.onclick = () => {
    const n = candidaturasDaVaga(v.id).filter(recDesatualizado).map(recalcularRec).length;
    toast(plural(n, 'aderência recalculada', 'aderências recalculadas') + '. As anteriores ficam no histórico.'); renderPipeline();
  };
  $$('[data-sel]', raiz).forEach(cb => cb.onchange = () => { cb.checked ? pipSel.add(cb.dataset.sel) : pipSel.delete(cb.dataset.sel); renderBarraSel(); });
  $('#selTodos', raiz).onchange = e => { P.filter(a => a.status === 'ativa').forEach(a => e.target.checked ? pipSel.add(a.id) : pipSel.delete(a.id)); renderPipeline(); };
  renderBarraSel();
}

function renderBarraSel(){
  const box = $('#pipBarraSel'); if(!box) return;
  if(!pipSel.size){ box.innerHTML = ''; return; }
  box.innerHTML = '<div class="cmpbar">' + I.pes + '<b style="font-family:var(--d);font-size:var(--md)">' +
    plural(pipSel.size, 'selecionada', 'selecionadas') + '</b>' +
    '<select id="moverPara" style="margin-left:auto" aria-label="Mover para">' + ETAPAS.map((n, i) => '<option value="' + i + '">Mover para ' + esc(n) + '</option>').join('') + '</select>' +
    '<button class="btn g sm" id="moverBt">Aplicar</button>' +
    '<button class="btn g sm" id="encSelBt">Encerrar</button>' +
    '<button class="btn g sm" id="limparSelBt">Limpar</button></div>';
  $('#moverBt').onclick = () => {
    const alvo = +$('#moverPara').value, n = pipSel.size;
    pipSel.forEach(id => { const ap = candidaturaPor(id); if(ap && ap.status === 'ativa') aplicar(ap, {tipo:'mover', etapa:alvo, quem:'conectaria'}); });
    toast(plural(n, 'movida', 'movidas') + ' para ' + ETAPAS[alvo] + '.');
    pipSel = new Set(); renderPipeline();
  };
  $('#encSelBt').onclick = () => abrirEncerrar([...pipSel]);
  $('#limparSelBt').onclick = () => { pipSel = new Set(); renderPipeline(); };
}

/* Encerrar sempre pede motivo do vocabulário fechado. É o que alimenta
   o quadro de motivos do painel e a medida "o match já apontava". */
function abrirEncerrar(ids){
  abrirModal('<h2 id="mTit">Encerrar ' + (ids.length > 1 ? ids.length + ' candidaturas' : 'candidatura') + '</h2>' +
    '<p class="sub">Escolha o motivo mais próximo. O candidato vê só que o processo foi encerrado, nunca o motivo.</p>' +
    '<div class="form" style="gap:var(--s2)"><div class="fg"><label for="motivoSel">Motivo</label>' +
    '<select id="motivoSel">' + MOTIVOS_REJEICAO.map(m => '<option value="' + m.id + '">' + esc(m.r) + '</option>').join('') + '</select></div>' +
    '<div class="fg"><label for="notaRep">Nota interna <span class="opc">opcional</span></label><textarea id="notaRep" rows="2"></textarea></div>' +
    '<button class="btn w" id="okEnc">Encerrar</button><button class="btn g w" id="cancEnc">Cancelar</button></div>');
  $('#cancEnc').onclick = fecharModal;
  $('#okEnc').onclick = () => {
    const motivoId = $('#motivoSel').value, nota = $('#notaRep').value.trim();
    ids.forEach(id => { const ap = candidaturaPor(id); if(ap) aplicar(ap, {tipo:'reprovar', motivoId, nota, quem:'conectaria'}); });
    fecharModal();
    toast(ids.length > 1 ? ids.length + ' candidaturas encerradas.' : 'Candidatura encerrada.');
    pipSel = new Set();
    if(S.view === 'pipeline') renderPipeline();
    if(ids.length === 1 && gavetaAberta === ids[0]) gavetaCandidatura(ids[0]);
  };
}

/* Gaveta: tudo o que a Conectaria precisa para decidir e para ligar. */
function gavetaCandidatura(id){
  const ap = candidaturaPor(id), c = candidatoPor(ap.candidatoId), v = vagaPor(ap.vagaId);
  abrirGaveta(c.nome, ETAPAS[ap.etapa], '<div class="gvtopo">' + pillStatus(ap) +
      '<span class="sub2">candidatou-se ' + tempoRel(ap.criadaEm) + ' · ' + esc(ORIGEM_ROT[ap.origem] || ap.origem) + '</span></div>' +
    '<div class="gvacoes">' + acoesPip(ap) + '</div>' +
    blocoContato(c, v) +
    (recDesatualizado(ap) ? '<div class="pend">' + I.al + '<div>A vaga ou o perfil mudou depois deste cálculo. <button class="link" id="gvRecalc">Recalcular</button></div></div>' : '') +
    blocoFit(ap.rec) +
    blocoPerfil(c) +
    '<div class="gv"><h4>Nota interna</h4><textarea id="gvNota" rows="3" placeholder="Só a equipe vê">' + esc(ap.nota || '') + '</textarea></div>' +
    '<div class="gv"><h4>Histórico</h4><ol class="hist">' + [...ap.historico].reverse().map(h =>
      '<li><b>' + (h.de === null ? 'Candidatura recebida' : h.status === 'reprovada' ? 'Encerrada' + (h.motivoId && MOTIVO[h.motivoId] ? ': ' + esc(MOTIVO[h.motivoId].r) : '')
        : h.status === 'contratada' ? 'Contratação' : h.de === h.para ? 'Reaberta em ' + esc(ETAPAS[h.para]) : (h.para < h.de ? 'Voltou para ' : 'Avançou para ') + esc(ETAPAS[h.para])) + '</b>' +
      '<span>' + dataCurta(h.em) + ' · ' + (h.quem === 'candidato' ? 'candidato' : 'Conectaria') + '</span></li>').join('') + '</ol>' +
      (ap.recAnteriores.length ? '<p class="hint">Aderências anteriores: ' + ap.recAnteriores.map(r => r.total).join(', ') + ' → ' + ap.rec.total + '.</p>' : '') + '</div>',
    id);
  $$('#drwBody [data-pip]').forEach(b => b.onclick = () => acaoPip(b.dataset.pip, b.dataset.id));
  const rc = $('#gvRecalc'); if(rc) rc.onclick = () => { recalcularRec(ap); gavetaCandidatura(id); if(S.view === 'pipeline') renderPipeline(); toast('Aderência recalculada.'); };
  $('#gvNota').oninput = debounce(e => { ap.nota = e.target.value.slice(0, 1000); salvar(); }, 300);
  animaEixos();
}
