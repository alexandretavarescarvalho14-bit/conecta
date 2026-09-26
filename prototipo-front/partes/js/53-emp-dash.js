/* ══════════════════ 23 · EMPRESA · DASHBOARD ══════════════════

   derivarDash, kpi e linhaSaude moram em 36-painel-base.js, compartilhado
   com o Conectaria Vagas. Aqui fica só a tela da empresa. */

function vEdash(){
  const P = S.pipeline; // todas as vagas do Grupo Aurora
  const d = derivarDash(P);
  const vagas = vagasDe('aurora');

  // candidaturas por semana, últimas 6 — deriva de quando cada uma
  // chegou (o primeiro marco do histórico), não um número hardcoded
  const semanas = Array.from({length: 6}, (_, i) => {
    const fim = 7 * (5 - i), ini = fim + 7;
    const q = P.filter(a => {
      const dias = (AGORA_DEMO - new Date(a.criadaEm)) / 86400000;
      return dias >= fim && dias < ini;
    }).length;
    return [ini === 42 ? '6+ sem' : (5 - i === 0 ? 'esta sem' : 'há ' + (5 - i) + 'sem'), q];
  });
  const maxSemana = Math.max(1, ...semanas.map(s => s[1]));

  const emRev = d.retidasBlock + d.retidasReview;

  $('#v-edash').innerHTML=
  '<div class="barra" style="margin-top:var(--s5)"><h2>Andamento das contratações</h2>'+
    '<p class="cont">Grupo Aurora · '+vagas.length+' '+(vagas.length===1?'vaga':'vagas')+' · '+P.length+' candidaturas no total</p></div>'+
  '<div class="kpis">'+
    kpi('Vagas ativas', vagas.length, 'todas com responsável na Conectaria')+
    kpi('Em processo', d.emProcesso, d.aguardandoDecisao+' aguardando sua decisão · '+d.favoritos+' favoritada'+(d.favoritos===1?'':'s'))+
    kpi('Tempo médio até entrevista', Math.round((d.tempoMedio[0]||0)+(d.tempoMedio[1]||0))+' dias', 'da candidatura até a entrevista Conectaria')+
    kpi('Contratados', d.contratados, 'via base da Conectaria', semanas.map(s=>s[1]))+
  '</div>'+
  '<div class="bloco"><header><h3>Candidaturas por semana</h3>'+
    '<span class="pill ac" style="margin-left:auto">'+P.length+' no total</span></header>'+
    '<div class="graf">'+semanas.map(([m,v])=>
      '<div class="gb"><div class="col" data-h="'+(v/maxSemana*100)+'" data-v="'+v+' candidaturas"></div>'+
      '<small>'+m+'</small></div>').join('')+'</div></div>'+
  '<div class="bloco"><header><h3>Saúde do dado que alimenta o match</h3>'+
    '<span class="pill '+(emRev?'al':'ok')+'" style="margin-left:auto">'+emRev+
    ' de '+P.length+' fora de publicável</span></header>'+
    '<div class="tabw"><table class="tab"><tbody>'+
    linhaSaude('Confiança média do conjunto', pc(d.confMedia), d.confMedia<POLITICA.confianca.revisar_abaixo_de?'al':'ok')+
    linhaSaude('Recomendações bloqueadas por confiança', String(d.retidasBlock), d.retidasBlock?'al':'ok')+
    linhaSaude('Recomendações em revisão humana', String(d.retidasReview), d.retidasReview?'al':'ok')+
    linhaSaude('O motor já tinha avisado (das reprovações)', d.motorBaseN ? pc(d.motorAcertos)+' de '+d.motorBaseN : 'sem dado ainda', d.motorBaseN && d.motorAcertos<0.5?'al':'ok')+
    '</tbody></table></div></div>'+
  '<div class="bloco"><header><h3>Onde as candidaturas ativas estão</h3>'+
    '<span class="pill n" style="margin-left:auto">'+d.emProcesso+' em processo</span></header>'+
    '<div class="tabw"><table class="tab"><tbody>'+
    d.porEtapaAtiva.map(e=>linhaSaude(esc(e.n), String(e.q), 'n')).join('')+
    '</tbody></table></div></div>'+
  '<div class="bloco"><header><h3>Onde o funil está travando</h3></header>'+
    '<div class="tabw"><table class="tab"><tbody>'+
    d.funil.slice(1).map((f,i)=>{
      const de = ETAPAS[i], p = Math.round(f.taxa*100);
      return linhaSaude('De "'+de+'" para "'+f.n+'"', p+'%', p<50?'al':'ok');
    }).join('')+
    '</tbody></table></div></div>'+
  '<div class="bloco"><header><h3>De onde vêm as candidaturas</h3></header>'+
    '<div class="tabw"><table class="tab"><tbody>'+
    Object.entries(d.fontes).sort((a,b)=>b[1]-a[1]).map(([o,n])=>
      linhaSaude(esc(ORIGEM_ROT[o]||o), n+' ('+pc(n/P.length)+')', 'n')).join('')+
    '</tbody></table></div></div>'+
  (d.reprovadasTotal ? '<div class="bloco"><header><h3>Motivos de reprovação</h3>'+
    '<span class="pill n" style="margin-left:auto">'+d.reprovadasTotal+' no total</span></header>'+
    '<div class="tabw"><table class="tab"><tbody>'+
    Object.entries(d.porMotivo).sort((a,b)=>b[1]-a[1]).map(([mid,n])=>
      linhaSaude(esc(MOTIVO[mid]?.r||mid), n+' ('+pc(n/d.reprovadasTotal)+')',
        GRUPO_MOTIVO[MOTIVO[mid]?.g]==='Processo'?'n':'al')).join('')+
    '</tbody></table></div></div>' : '')+
  '<p class="nota">A linha <b>"o motor já tinha avisado"</b>, na tabela do meio, é a que detecta '+
  'piora de modelo antes de alguém reclamar: mede quantas reprovações já tinham evidência de gap '+
  'no trace, antes da empresa decidir. Sem reprovação suficiente ainda, ela some por construção.</p>';

  requestAnimationFrame(()=>$$('.col[data-h]').forEach((el,i)=>
    setTimeout(()=>{el.style.height=el.dataset.h+'%'},120+i*70)));
  animaEixos(); animaKpis();
}
