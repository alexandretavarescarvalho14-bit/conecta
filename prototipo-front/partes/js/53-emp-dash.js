/* ══════════════════ 23 · EMPRESA · DASHBOARD ══════════════════

   Uma função só calcula tudo (derivarDash), e nenhum widget faz conta
   dentro de template string. P é sempre um array de candidaturas — a
   mesma função serve o dashboard geral (todas as vagas da empresa) e o
   cabeçalho de KPIs da tela de pipeline (candidaturas de uma vaga só). */

const media = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function derivarDash(P){
  const ativas = P.filter(a => a.status === 'ativa');
  const reprovadas = P.filter(a => a.status === 'reprovada');

  // Funil por HISTÓRICO, não por etapa atual: quem foi reprovado na
  // etapa 4 tem que contar como tendo passado pelas 1, 2 e 3.
  const alcancou = i => P.filter(a => a.historico.some(h => h.para >= i)).length;
  const funil = ETAPAS.map((n, i) => {
    const chegou = alcancou(i);
    const base = i === 0 ? P.length : alcancou(i - 1);
    return {n, chegou, taxa: base ? chegou / base : 0};
  });

  // tempo médio entre marcos consecutivos do histórico, por etapa de origem
  const temposPorEtapa = ETAPAS.map(() => []);
  P.forEach(a => {
    for(let i = 1; i < a.historico.length; i++){
      const h0 = a.historico[i - 1], h1 = a.historico[i];
      if(h0.para == null) continue;
      const dias = (new Date(h1.em) - new Date(h0.em)) / 86400000;
      if(dias >= 0) temposPorEtapa[h0.para].push(dias);
    }
  });

  const fontes = {};
  P.forEach(a => { fontes[a.origem] = (fontes[a.origem] || 0) + 1; });

  const porMotivo = {}, porGrupo = {};
  reprovadas.forEach(a => {
    porMotivo[a.motivoId] = (porMotivo[a.motivoId] || 0) + 1;
    const g = MOTIVO[a.motivoId]?.g || 'processo';
    porGrupo[g] = (porGrupo[g] || 0) + 1;
  });

  // "o motor já tinha avisado?": das reprovações cujo motivo tem um
  // reasonCode correspondente, em quantas esse reasonCode já estava nas
  // evidências do trace? É o sinal de calibração mais direto que existe.
  const comEng = reprovadas.filter(a => MOTIVO[a.motivoId]?.eng);
  const acertos = comEng.filter(a => {
    const ev = [...a.rec.tecnico_ev, ...a.rec.cultural_ev, ...a.rec.contexto_ev];
    return ev.some(e => e.reasonCode === MOTIVO[a.motivoId].eng);
  });

  return {
    total: P.length, emProcesso: ativas.length, favoritos: P.filter(a => a.favorito).length,
    contratados: P.filter(a => a.status === 'contratada').length,
    fitMedio: media(P.map(a => a.rec.total)),
    fitMedioAvancou: media(P.filter(a => a.etapa >= 2).map(a => a.rec.total)),
    confMedia: media(P.map(a => a.rec.confidence)),
    aguardandoDecisao: ativas.filter(a => a.rec.desfecho !== 'allow').length,
    retidasBlock: P.filter(a => a.rec.desfecho === 'block').length,
    retidasReview: P.filter(a => a.rec.desfecho === 'review').length,
    porEtapaAtiva: ETAPAS.map((n, i) => ({n, q: ativas.filter(a => a.etapa === i).length})),
    funil, tempoMedio: temposPorEtapa.map(media),
    fontes, porMotivo, porGrupo, reprovadasTotal: reprovadas.length,
    motorAcertos: comEng.length ? acertos.length / comEng.length : null, motorBaseN: comEng.length,
  };
}

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
/* classe 'n' é neutra: contagem sem juízo de valor, então a célula de
   status fica vazia em vez de um chip sem texto nenhum dentro. */
const linhaSaude = (n, val, classe) =>
  '<tr style="cursor:default"><td>'+n+'</td><td style="width:110px"><b>'+val+'</b></td>'+
  '<td style="width:130px">'+(classe==='n' ? '' :
    '<span class="pill '+classe+'">'+(classe==='al'?'atenção':'saudável')+'</span>')+'</td></tr>';

/* Número inteiro puro conta na entrada; o resto ("21 dias", "80%") entra
   direto, porque animar só metade de um rótulo fica pior que não animar. */
function kpi(l,n,d,sp){
  const puro = /^\d+$/.test(String(n));
  const valor = puro ? '<span class="tnum" data-kpi="'+n+'">0</span>' : n;
  return '<div class="kpi rv"><div class="l">'+l+'</div><div class="n">'+valor+'</div>'+
    '<div class="d">'+d+'</div>'+(sp?spark(sp):'')+'</div>';
}
function animaKpis(){
  requestAnimationFrame(()=>$$('[data-kpi]').forEach((el,i)=>
    setTimeout(()=>contar(el, +el.dataset.kpi), 120+i*90)));
}
