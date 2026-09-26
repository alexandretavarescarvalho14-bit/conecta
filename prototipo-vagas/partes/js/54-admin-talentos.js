/* ══════════════════ CONECTARIA · BANCO DE TALENTOS ══════════════════
   Todo mundo que se cadastrou, com ou sem candidatura. É aqui que a
   Conectaria procura gente quando abre uma vaga nova: escolhe a vaga,
   a lista ordena por aderência e dá para trazer a pessoa para o
   processo, que entra com origem "banco de talentos". */

function vTalentos(){
  const f = S.adm.tal;
  const vaga = f.vaga ? vagaPor(f.vaga) : null;
  const q = normalizar(f.q.trim());
  let lista = DB.candidatos.filter(c =>
    (!f.area || c.areaId === f.area) && (!f.uf || c.uf === f.uf) &&
    (!q || normalizar([c.nome, c.cidade, ...(c.cargos || []).map(id => CARGO[id] ? CARGO[id].n : ''),
      ...(c.competencias || []).map(k => skillNome(k.skillId))].join(' ')).includes(q)));
  const fits = new Map(vaga ? lista.map(c => [c.id, avaliar(c, vaga)]) : []);
  lista = vaga ? lista.sort((a, b) => fits.get(b.id).total - fits.get(a.id).total)
    : lista.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  const ufs = [...new Set(DB.candidatos.map(c => c.uf).filter(Boolean))].sort();
  const vagasOp = vagasPublicadas().sort((a, b) => empresaPor(a.empresaId).n.localeCompare(empresaPor(b.empresaId).n));

  $('#v-talentos').innerHTML =
  '<div class="barra" style="margin-top:var(--s5)"><h2>Banco de talentos</h2>' +
    '<p class="cont">' + plural(lista.length, 'pessoa', 'pessoas') + (lista.length !== DB.candidatos.length ? ' de ' + DB.candidatos.length : '') + '</p></div>' +
  '<div class="filtrost">' +
    '<div class="fg"><label for="tVaga">Comparar com a vaga</label><select id="tVaga"><option value="">nenhuma, ver todos</option>' +
      vagasOp.map(v => '<option value="' + v.id + '"' + (f.vaga === v.id ? ' selected' : '') + '>' + esc(empresaPor(v.empresaId).n + ' · ' + v.titulo) + '</option>').join('') + '</select></div>' +
    '<div class="fg"><label for="tArea">Área</label><select id="tArea"><option value="">todas</option>' +
      areasOrdenadas().map(a => '<option value="' + a.id + '"' + (f.area === a.id ? ' selected' : '') + '>' + esc(a.n) + '</option>').join('') + '</select></div>' +
    '<div class="fg"><label for="tUf">Estado</label><select id="tUf"><option value="">todos</option>' +
      ufs.map(u => '<option' + (f.uf === u ? ' selected' : '') + '>' + u + '</option>').join('') + '</select></div>' +
    '<div class="fg"><label for="tQ">Buscar</label><input id="tQ" type="search" value="' + esc(f.q) + '" placeholder="nome, cargo, atividade"></div>' +
  '</div>' +
  (vaga ? '<p class="hint" style="margin:0 0 var(--s2)">Ordenado por aderência a <b>' + esc(vaga.titulo) + '</b>, com os requisitos e o local da vaga.</p>' : '') +
  '<div class="bloco" style="margin-top:0"><div class="tabw"><table class="tab"><thead><tr>' +
    '<th>Pessoa</th><th>Área e cargo</th><th>Onde</th>' + (vaga ? '<th>Aderência</th><th></th>' : '<th>Candidaturas</th>') + '</tr></thead><tbody>' +
    (lista.length ? lista.map(c => {
      const cargo = (c.cargos || [])[0] && CARGO[c.cargos[0]] ? CARGO[c.cargos[0]].n : '—';
      const noProc = vaga && jaCandidatou(c.id, vaga.id);
      return '<tr><td><button class="nomebt" data-vertal="' + c.id + '">' + esc(c.nome) + '</button>' +
        '<div class="sub2">cadastro ' + tempoRel(c.criadoEm) + (c.exemplo ? ' · exemplo' : '') + '</div></td>' +
        '<td>' + esc(AREA[c.areaId] ? AREA[c.areaId].n : '—') + '<div class="sub2">' + esc(cargo) + '</div></td>' +
        '<td>' + esc([c.cidade, c.uf].filter(Boolean).join(', ')) + '</td>' +
        (vaga ? '<td>' + barraFit(fits.get(c.id).total) + '</td><td class="pipAcoes">' +
          (noProc ? '<span class="pill ok"><i></i>no processo</span>' : '<button class="btn g sm" data-trazer="' + c.id + '">Trazer para a vaga</button>') + '</td>'
          : '<td>' + candidaturasDoCandidato(c.id).length + '</td>') + '</tr>';
    }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--i62);padding:var(--s4) 0">Ninguém com esse filtro.</td></tr>') +
  '</tbody></table></div></div>';

  $('#tVaga').onchange = e => { f.vaga = e.target.value; vTalentos(); };
  $('#tArea').onchange = e => { f.area = e.target.value; vTalentos(); };
  $('#tUf').onchange = e => { f.uf = e.target.value; vTalentos(); };
  $('#tQ').oninput = debounce(e => { f.q = e.target.value; vTalentos(); const i = $('#tQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 220);
  $$('[data-vertal]').forEach(b => b.onclick = () => gavetaTalento(b.dataset.vertal));
  $$('[data-trazer]').forEach(b => b.onclick = () => trazerParaVaga(b.dataset.trazer, vaga.id));
}

function trazerParaVaga(cid, vid){
  const ap = criarCandidatura(cid, vid, 'banco', 'conectaria');
  if(!ap) return;
  garantirRec(ap); salvar();
  toast(candidatoPor(cid).nome.split(' ')[0] + ' entrou no processo de ' + vagaPor(vid).titulo + '.');
  if(S.view === 'talentos') vTalentos();
  if(gavetaAberta === 't:' + cid) gavetaTalento(cid);
}

function gavetaTalento(cid){
  const c = candidatoPor(cid), vaga = S.adm.tal.vaga ? vagaPor(S.adm.tal.vaga) : null;
  const aps = candidaturasDoCandidato(cid);
  abrirGaveta(c.nome, c.exemplo ? 'exemplo' : '',
    blocoContato(c, vaga) +
    (vaga ? blocoFit(montarRec(c, vaga)) + (jaCandidatou(cid, vaga.id) ? '' :
      '<button class="btn w" id="gvTrazer">Trazer para ' + esc(vaga.titulo) + '</button>') : '') +
    blocoPerfil(c) +
    '<div class="gv"><h4>Candidaturas</h4>' + (aps.length ? '<ul class="apsl">' + aps.map(a => {
      const v = vagaPor(a.vagaId);
      return '<li><button class="link" data-irpipc="' + v.id + '">' + esc(v.titulo) + '</button> ' + pillStatus(a) + '</li>';
    }).join('') + '</ul>' : '<p class="hint">Nenhuma ainda.</p>') + '</div>',
    't:' + cid);
  const t = $('#gvTrazer'); if(t) t.onclick = () => trazerParaVaga(cid, vaga.id);
  $$('#drwBody [data-irpipc]').forEach(b => b.onclick = () => { fecharGaveta(); ir('pipeline', b.dataset.irpipc); });
  animaEixos();
}
