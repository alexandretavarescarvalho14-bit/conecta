/* ══════════════════ 21 · EMPRESA · VAGAS ══════════════════ */
function vEvagas(){
  $('#v-evagas').innerHTML=
  '<div class="barra" style="margin-top:var(--s5)"><h2>Suas vagas</h2>'+
    '<p class="cont">1 anúncio ativo</p>'+
    '<div class="chips"><button class="btn sm" id="nova">Anunciar nova vaga</button></div></div>'+
  '<div class="bloco" style="margin-top:0"><div class="tabw"><table class="tab"><thead><tr>'+
    '<th>Vaga</th><th>Candidaturas</th><th>Match médio</th><th>Publicada</th><th>Situação</th>'+
    '</tr></thead><tbody><tr data-ir="ecand">'+
    '<td><b style="font-family:var(--d);font-size:var(--md)">Coordenador de RH</b>'+
      '<div style="color:var(--i52);font-size:var(--xs)">Recife, presencial · R$ 9.000 a R$ 11.000</div></td>'+
    '<td>'+CANDS_EMP.length+'</td><td>'+
      Math.round(CANDS_EMP.reduce((a,c)=>a+c.match,0)/CANDS_EMP.length)+'%</td>'+
    '<td>há 2 dias</td><td><span class="pill ok"><i></i>ativa</span></td></tr>'+
  '</tbody></table></div></div>'+
  '<div id="formVaga"></div>'+
  '<p class="nota">O anúncio herda os eixos de cultura do perfil da empresa, então você não '+
  'preenche a mesma informação duas vezes. Só o que é específico da vaga entra aqui: '+
  'competência com peso e marcação de obrigatório, faixa, local e modelo.</p>';
  $('[data-ir]').onclick=()=>ir('ecand');
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
      toast('Vaga publicada. A Conectaria buscou 9.014 perfis e achou 12 acima de 70%.');
    };
  };
}
