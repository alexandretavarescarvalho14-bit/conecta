/* ══════════════════ 23 · EMPRESA · DASHBOARD ══════════════════ */
function vEdash(){
  const dados=[['mar',2],['abr',3],['mai',1],['jun',4],['jul',3],['ago',5]];
  const max=Math.max(...dados.map(d=>d[1]));
  const emRev = CANDS_EMP.filter(c=>gateDe(c.conf)!=='allow').length;
  $('#v-edash').innerHTML=
  '<div class="barra" style="margin-top:var(--s5)"><h2>Andamento das contratações</h2>'+
    '<p class="cont">Grupo Aurora · últimos 6 meses</p></div>'+
  '<div class="kpis">'+
    kpi('Vagas ativas','1','todas com responsável na Conectaria')+
    kpi('Em processo',CANDS_EMP.length,'<b>1</b> aguardando sua decisão')+
    kpi('Tempo médio','21 dias','<b>abaixo</b> da média do setor, 38 dias', [38,34,30,27,24,21])+
    kpi('Contratados em 2026','18','via base da Conectaria', [2,3,1,4,3,5])+
  '</div>'+
  '<div class="bloco"><header><h3>Contratações por mês</h3>'+
    '<span class="pill ac" style="margin-left:auto">18 no ano</span></header>'+
    '<div class="graf">'+dados.map(([m,v])=>
      '<div class="gb"><div class="col" data-h="'+(v/max*100)+'" data-v="'+v+' contratações"></div>'+
      '<small>'+m+'</small></div>').join('')+'</div></div>'+
  '<div class="bloco"><header><h3>Saúde do dado que alimenta o match</h3>'+
    '<span class="pill '+(emRev?'al':'ok')+'" style="margin-left:auto">'+emRev+
    ' de '+CANDS_EMP.length+' fora de publicável</span></header>'+
    '<div class="tabw"><table class="tab"><tbody>'+
    [['Perfis com dado confirmado pela pessoa','2 de 4','al'],
     ['Perfis ainda apoiados em extração','2 de 4','al'],
     ['Recomendações bloqueadas por confiança','1','al'],
     ['Divergência entre score ativo e baseline','0','ok']].map(([n,p,c])=>
     '<tr style="cursor:default"><td>'+n+'</td><td style="width:90px"><b>'+p+'</b></td>'+
     '<td style="width:130px"><span class="pill '+c+'">'+(c==='al'?'atenção':'saudável')+
     '</span></td></tr>').join('')+
    '</tbody></table></div></div>'+
  '<div class="bloco"><header><h3>Onde o funil está travando</h3></header>'+
    '<div class="tabw"><table class="tab"><tbody>'+
    [['Da candidatura para triagem','86%','ok'],
     ['Da triagem para entrevista Conectaria','64%','ok'],
     ['Da entrevista Conectaria para você','41%','al'],
     ['Da sua entrevista para proposta','78%','ok']].map(([n,p,c])=>
     '<tr style="cursor:default"><td>'+n+'</td><td style="width:90px"><b>'+p+'</b></td>'+
     '<td style="width:130px"><span class="pill '+c+'">'+(c==='al'?'atenção':'saudável')+
     '</span></td></tr>').join('')+
    '</tbody></table></div></div>'+
  '<p class="nota">O alerta menos óbvio e mais importante é o último da tabela do meio: '+
  '<b>divergência entre score ativo e baseline</b>. É o que detecta regressão de modelo antes '+
  'do usuário reclamar. Enquanto só o baseline determinístico roda, ele é zero por construção.</p>';
  requestAnimationFrame(()=>$$('.col[data-h]').forEach((el,i)=>
    setTimeout(()=>{el.style.height=el.dataset.h+'%'},120+i*70)));
  animaEixos();
}
function kpi(l,n,d,sp){
  return '<div class="kpi rv"><div class="l">'+l+'</div><div class="n">'+n+'</div>'+
    '<div class="d">'+d+'</div>'+(sp?spark(sp):'')+'</div>';
}
