/* ══════════════════ 21 · EMPRESA · VAGAS ══════════════════
   Lista TODAS as vagas do Grupo Aurora, cada uma com candidaturas e fit
   médio derivados de verdade do pipeline — nunca escrito à mão. */
function vEvagas(){
  const vagas = vagasDe('aurora');
  const linhas = vagas.map(v => {
    const P = S.pipeline.filter(a => a.vagaId === v.id);
    const fitMedio = P.length ? Math.round(P.reduce((a, x) => a + x.rec.total, 0) / P.length) : 0;
    const ativas = P.filter(a => a.status === 'ativa').length;
    return '<tr data-irvaga="' + v.id + '"><td><b style="font-family:var(--d);font-size:var(--md)">' +
      esc(v.cargo) + '</b><div style="color:var(--i62);font-size:var(--xs)">' + esc(v.local) + ' · ' +
      esc(v.faixa) + '</div></td>' +
      '<td>' + P.length + (ativas !== P.length ? ' <span style="color:var(--i62)">(' + ativas + ' ativas)</span>' : '') + '</td>' +
      '<td>' + (P.length ? fitMedio + '%' : '—') + '</td>' +
      '<td>' + (v.dias === 1 ? 'ontem' : 'há ' + v.dias + ' dias') + '</td>' +
      '<td><span class="pill ok"><i></i>ativa</span></td></tr>';
  }).join('');

  $('#v-evagas').innerHTML=
  '<div class="barra" style="margin-top:var(--s5)"><h2>Suas vagas</h2>'+
    '<p class="cont">'+vagas.length+(vagas.length===1?' anúncio ativo':' anúncios ativos')+'</p>'+
    '<div class="chips"><button class="btn sm" id="nova">Anunciar nova vaga</button></div></div>'+
  '<div class="bloco" style="margin-top:0"><div class="tabw"><table class="tab"><thead><tr>'+
    '<th>Vaga</th><th>Candidaturas</th><th>Fit médio</th><th>Publicada</th><th>Situação</th>'+
    '</tr></thead><tbody>'+linhas+'</tbody></table></div></div>'+
  '<div id="formVaga"></div>'+
  '<p class="nota">O anúncio herda os eixos de cultura do perfil da empresa, então você não '+
  'preenche a mesma informação duas vezes. Só o que é específico da vaga entra aqui: '+
  'competência com peso e marcação de obrigatório, faixa, local e modelo.</p>';

  $$('[data-irvaga]').forEach(tr => tr.onclick = () => ir('ecand', tr.dataset.irvaga));
  $('#nova').onclick=()=>{
    $('#formVaga').innerHTML='<div class="bloco" style="padding:var(--s3)"><div class="form">'+
      '<h3 style="font-size:var(--lg)">Nova vaga</h3>'+
      '<div class="dupla"><div class="fg"><label for="nc">Cargo</label><input id="nc" placeholder="Analista de Compras"></div>'+
      '<div class="fg"><label for="nl">Local e modelo</label><input id="nl" placeholder="Recife, híbrido"></div></div>'+
      '<div class="dupla"><div class="fg"><label for="nf">Faixa salarial</label><input id="nf" placeholder="R$ 5.000 a R$ 6.500"></div>'+
      '<div class="fg"><label for="ns">Família de cargo</label><select id="ns">'+
        Object.keys(POLITICA.pesos_por_familia).filter(f=>f!=='_padrao')
          .map(f=>'<option>'+esc(f)+'</option>').join('')+'</select>'+
      '<p class="hint" id="hintFam"></p></div></div>'+
      '<div class="fg"><label for="nd">O que a pessoa vai fazer</label>'+
      '<p class="hint">Descreva a rotina real. Isso é indexado junto com os eixos de cultura já salvos.</p>'+
      '<textarea id="nd" rows="3" placeholder="Negociar com fornecedores, acompanhar prazo de entrega..."></textarea></div>'+
      '<div style="display:flex;gap:9px"><button class="btn" id="pub">Publicar vaga</button>'+
      '<button class="btn g" id="canc">Cancelar</button></div></div></div>';
    $('#formVaga').scrollIntoView({block:'center'}); $('#nc').focus();
    const hf=()=>{ const w=pesosDe(POLITICA,$('#ns').value);
      $('#hintFam').textContent='Pesos desta família: técnico '+pc(w.tecnico)+', cultural '+
        pc(w.cultural)+', contexto '+pc(w.contexto)+'.'; };
    $('#ns').onchange=hf; hf();
    $('#canc').onclick=()=>{$('#formVaga').innerHTML='';};
    $('#pub').onclick=async()=>{
      if(!$('#nc').value.trim()){ $('#nc').focus(); toast('Falta o cargo para publicar.', I.al); return; }
      const b=$('#pub'); b.disabled=true; b.innerHTML='<span class="spin"></span>Publicando';
      await espera(600); $('#formVaga').innerHTML='';
      toast('Vaga publicada. Ainda sem candidaturas: a busca leva um tempo para achar gente compatível.');
    };
  };
}
