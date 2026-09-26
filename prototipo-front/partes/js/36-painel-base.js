/* ══════════════════ PAINEL · BASE ══════════════════
   Compartilhado entre o protótipo e o Conectaria Vagas (montar.py).

   Uma função só calcula tudo (derivarDash), e nenhum widget faz conta
   dentro de template string. P é sempre um array de candidaturas no
   formato {etapa, status, motivoId, favorito, origem, criadaEm,
   historico[], rec} — a mesma função serve o painel geral e o cabeçalho
   de KPIs de uma vaga só. */
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
