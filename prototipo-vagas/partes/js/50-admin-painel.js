/* ══════════════════ CONECTARIA · PAINEL ══════════════════
   Visão da operação inteira. Tudo sai de derivarDash() (36-painel-base,
   o mesmo do protótipo), que lê o histórico das candidaturas, e não a
   etapa atual: quem foi reprovado na entrevista conta como tendo passado
   pela triagem. */

function vPainel(){
  const P = DB.candidaturas, d = derivarDash(P);
  const pub = vagasPublicadas(), agora = Date.now();
  const semanas = Array.from({length:6}, (_, i) => {
    const fim = 7 * (5 - i), ini = fim + 7;
    const q = P.filter(a => { const dias = (agora - new Date(a.criadaEm)) / DIA; return dias >= fim && dias < ini; }).length;
    return [i === 5 ? 'esta sem.' : 'há ' + (5 - i) + ' sem.', q];
  });
  const maxS = Math.max(1, ...semanas.map(s => s[1]));
  const naSemana = semanas[5][1];

  // vagas publicadas sem ninguém ativo: é onde a Conectaria precisa buscar gente
  const semGente = pub.map(v => ({v, ativas:candidaturasDaVaga(v.id).filter(a => a.status === 'ativa').length}))
    .filter(x => x.ativas === 0);
  // candidaturas paradas na primeira etapa há mais de 3 dias
  const paradas = P.filter(a => a.status === 'ativa' && a.etapa === 0 && (agora - new Date(a.atualizadaEm)) / DIA > 3);
  const exemplos = DB.candidatos.filter(c => c.exemplo).length;

  $('#v-painel').innerHTML =
  '<div class="barra" style="margin-top:var(--s5)"><h2>Painel</h2>' +
    '<p class="cont">' + plural(DB.empresas.length, 'empresa', 'empresas') + ' · ' + plural(pub.length, 'vaga publicada', 'vagas publicadas') + ' · ' +
    plural(DB.candidatos.length, 'pessoa cadastrada', 'pessoas cadastradas') + '</p></div>' +
  (exemplos ? '<div class="avisoex">' + I.al + '<div><b>' + plural(exemplos, 'candidato de exemplo', 'candidatos de exemplo') +
    '</b> para o pipeline não começar vazio. Quem você cadastrar no teste não é afetado.</div>' +
    '<button class="btn g sm" id="btTiraEx">Remover exemplos</button></div>' : '') +
  '<div class="kpis">' +
    kpi('Candidaturas na semana', naSemana, plural(P.length, 'no total', 'no total'), semanas.map(s => s[1])) +
    kpi('Em processo', d.emProcesso, plural(paradas.length, 'parada em "Recebida" há mais de 3 dias', 'paradas em "Recebida" há mais de 3 dias')) +
    kpi('Vagas sem candidato ativo', semGente.length, 'de ' + pub.length + ' publicadas') +
    kpi('Contratações', d.contratados, 'conduzidas pela Conectaria') +
  '</div>' +

  '<div class="painelg">' +
  '<div class="bloco"><header><h3>Candidaturas por semana</h3></header>' +
    '<div class="graf">' + semanas.map(([m, v]) =>
      '<div class="gb"><div class="col" style="height:' + (v / maxS * 100) + '%" data-v="' + plural(v, 'candidatura', 'candidaturas') + '"></div><small>' + m + '</small></div>').join('') + '</div></div>' +

  '<div class="bloco"><header><h3>Funil</h3><span class="hint" style="margin:0 0 0 auto">quem chegou a cada etapa</span></header>' +
    '<div class="tabw"><table class="tab"><tbody>' +
    d.funil.map((f, i) => linhaSaude(esc(f.n), String(f.chegou) + (i ? ' <small>(' + Math.round(f.taxa * 100) + '%)</small>' : ''),
      i && f.taxa < .5 ? 'al' : 'n')).join('') +
    '</tbody></table></div></div>' +
  '</div>' +

  '<div class="painelg">' +
  '<div class="bloco"><header><h3>Vagas sem candidato ativo</h3></header>' +
    (semGente.length ? '<div class="tabw"><table class="tab"><tbody>' + semGente.map(({v}) => {
      const e = empresaPor(v.empresaId);
      return '<tr data-irpip="' + v.id + '"><td><b>' + esc(v.titulo) + '</b><div class="sub2">' + esc(e.n) + ' · ' + esc(v.local) + '</div></td>' +
        '<td style="width:120px"><button class="btn g sm" data-buscagente="' + v.id + '">Buscar no banco</button></td></tr>';
    }).join('') + '</tbody></table></div>' : '<p class="hint">Todas as vagas publicadas têm alguém em processo.</p>') +
  '</div>' +
  '<div class="bloco"><header><h3>Motivos de encerramento</h3>' +
    '<span class="pill n" style="margin-left:auto">' + d.reprovadasTotal + '</span></header>' +
    (d.reprovadasTotal ? '<div class="tabw"><table class="tab"><tbody>' +
      Object.entries(d.porMotivo).sort((a, b) => b[1] - a[1]).map(([mid, n]) =>
        linhaSaude(esc(MOTIVO[mid] ? MOTIVO[mid].r : mid), n + ' <small>(' + pc(n / d.reprovadasTotal) + ')</small>', 'n')).join('') +
      '</tbody></table></div>' +
      (d.motorBaseN ? '<p class="hint" style="margin-top:10px">Em ' + pc(d.motorAcertos) + ' dos ' + d.motorBaseN +
        ' encerramentos com motivo técnico ou de contexto, o match já apontava a mesma lacuna antes da decisão.</p>' : '')
      : '<p class="hint">Nenhum processo encerrado ainda.</p>') +
  '</div></div>';

  $$('[data-irpip]').forEach(tr => tr.onclick = e => { if(!e.target.closest('button')) ir('pipeline', tr.dataset.irpip); });
  $$('[data-buscagente]').forEach(b => b.onclick = () => { S.adm.tal.vaga = b.dataset.buscagente; ir('talentos'); });
  const tx = $('#btTiraEx');
  if(tx) tx.onclick = () => confirmar('Remover candidatos de exemplo?',
    'Saem ' + plural(exemplos, 'candidato de exemplo', 'candidatos de exemplo') + ' e as candidaturas deles. Empresas, vagas e quem você cadastrou ficam.',
    'Remover exemplos', () => {
      const ids = new Set(DB.candidatos.filter(c => c.exemplo).map(c => c.id));
      DB.candidaturas = DB.candidaturas.filter(a => !ids.has(a.candidatoId));
      DB.candidatos = DB.candidatos.filter(c => !ids.has(c.id));
      if(S.userId && ids.has(S.userId)) S.userId = null;
      salvar(); vPainel(); toast('Exemplos removidos.');
    });
  animaKpis();
}
