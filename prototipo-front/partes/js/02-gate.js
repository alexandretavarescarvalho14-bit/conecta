/* ══════════════════ 5 · PORTÃO DE POLÍTICA ══════════════════
   Score nunca é publicado direto. Passa por um portão que pode liberar,
   mandar para revisão humana ou bloquear.                              */
function avaliarPoliticas(r, pol){
  const d=[], conf = pol.confianca;

  if(r.confidence < conf.minima_para_publicar){
    d.push({policyId:'confianca.minima', outcome:'block', reasonCode:'CONFIANCA_ABAIXO_DO_MINIMO'});
  } else if(r.confidence < conf.revisar_abaixo_de){
    d.push({policyId:'confianca.revisao', outcome:'review', reasonCode:'CONFIANCA_EM_FAIXA_DE_REVISAO'});
  } else {
    d.push({policyId:'confianca.minima', outcome:'allow', reasonCode:'CONFIANCA_OK'});
  }

  // Score alto apoiado em lacuna obrigatória é o falso positivo mais caro:
  // gera entrevista que não deveria existir, dos dois lados.
  const furou = r.tecnico.evidencias.some(e=>e.reasonCode==='REQ_OBRIGATORIO_AUSENTE');
  if(furou && r.total >= 60){
    d.push({policyId:'coerencia.obrigatorio', outcome:'review',
      reasonCode:'TOTAL_ALTO_COM_OBRIGATORIO_AUSENTE'});
  }
  return d;
}
const desfechoFinal = d => d.some(x=>x.outcome==='block') ? 'block'
  : d.some(x=>x.outcome==='review') ? 'review' : 'allow';

const RAZAO = {
  CONFIANCA_ABAIXO_DO_MINIMO:'A confiança do conjunto está abaixo do mínimo para publicar. O perfil precisa ser confirmado pela pessoa antes de a recomendação circular.',
  CONFIANCA_EM_FAIXA_DE_REVISAO:'A confiança está na faixa que pede revisão humana. O número aparece, mas com ressalva de que parte do perfil ainda é inferência.',
  CONFIANCA_OK:'Confiança suficiente. Dado confirmado na origem.',
  TOTAL_ALTO_COM_OBRIGATORIO_AUSENTE:'Nota total alta apesar de requisito obrigatório ausente. Vai para revisão para não gerar entrevista que não deveria existir.',
};
const GATE_ROT = {allow:'publicável', review:'revisão humana', block:'bloqueado'};
