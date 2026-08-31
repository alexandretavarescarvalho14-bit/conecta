/* ══════════════════ 15 · DETALHE DA VAGA ══════════════════ */
function vVaga(id){
  const v=VAGAS.find(x=>x.id===id); S.vaga=id; const e=EMPRESAS[v.emp];
  const jaFoi=S.candidaturas.some(c=>c.v===id);

  $('#v-vaga').innerHTML=
  '<button class="volta" id="volta">'+I.volta+'Todas as vagas</button>'+
  '<div class="split"><div class="corpo">'+
    '<div class="emp">'+logo(v.emp)+'<b>'+esc(e.n)+'</b><span class="tag">'+esc(e.s)+'</span></div>'+
    '<h1>'+esc(v.cargo)+'</h1>'+
    '<div class="meta" style="margin-bottom:var(--s3)"><span>'+I.pin+esc(v.local)+'</span>'+
      '<span>'+esc(v.faixa)+'</span><span>'+v.cand+' candidaturas</span></div>'+
    '<p>'+esc(v.res)+'</p>'+
    '<h4>O que você faz aqui</h4><ul>'+v.faz.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
    '<h4>O que a vaga pede</h4><ul>'+v.pede.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
    '<h4>Requisitos declarados</h4>'+
    '<div class="tabw"><table class="tab" style="min-width:420px"><thead><tr>'+
      '<th>Competência</th><th>Peso</th><th>Obrigatório</th>'+(S.logado?'<th>Você</th>':'')+
      '</tr></thead><tbody>'+v.requisitos.map(rq=>{
        const c = S.cand.competencias.find(x=>x.skillId===rq.skillId);
        return '<tr style="cursor:default"><td>'+esc(skillNome(rq.skillId))+'</td>'+
          '<td>'+rq.peso+'</td>'+
          '<td>'+(rq.obrigatorio?'<span class="pill al">obrigatório</span>'
                                :'<span class="pill n">desejável</span>')+'</td>'+
          (S.logado ? '<td>'+(c ? '<span class="pill ok"><i></i>nível '+c.nivel.value+'</span>'
                                : '<span class="pill '+(rq.obrigatorio?'bl':'n')+'">não declarado</span>')+'</td>' : '')+
          '</tr>';
      }).join('')+'</tbody></table></div>'+
    (S.logado ? '<h4>Distância nos 14 eixos</h4>'+radar(S.cand.eixos, e.eixos)+
      '<p class="porque" style="border:0;padding:0;max-width:60ch">A linha cheia é você, a '+
      'tracejada é a empresa. Ponto laranja marca eixo fora da tolerância. Cada eixo tem '+
      'tolerância própria: autonomia aceita 15 pontos de distância, presença aceita 30. '+
      'Por isso a mesma distância não pesa igual em todo lugar.</p>' : '')+
  '</div><aside class="lateral">'+
    (!S.logado
      ? '<div class="gate"><h4>Sua aderência aparece depois do cadastro</h4>'+
        '<p>Crie sua conta e monte seu perfil. Com ele pronto você vê, nas três dimensões e '+
        'nos catorze eixos, o quanto esta vaga combina com você e por quê.</p>'+
        '<button class="btn w" id="gateBtn">Criar conta</button>'+
        '<button class="btn g w" id="gateEntrar" style="margin-top:8px">Já tenho conta</button></div>'
      : painelMatch(v))+
    '<div class="box">'+
      (jaFoi
        ? '<button class="btn w" disabled>'+I.ok+'Candidatura enviada</button>'+
          '<p style="font-size:var(--xs);color:var(--i52);margin-top:10px;text-align:center">'+
          'Acompanhe em Minhas candidaturas.</p>'
        : '<button class="btn w" id="cand">Candidatar-se</button>'+
          '<p style="font-size:var(--xs);color:var(--i52);margin-top:11px;line-height:1.65">'+
          (S.logado
            ? 'Seu perfil já está montado. A candidatura vai com tudo que você preencheu na triagem.'
            : 'Ao se candidatar você cria a conta e monta seu perfil. Depois disso, vagas '+
              'compatíveis passam a chegar até você sem que precise procurar.')+'</p>')+
    '</div>'+
    '<div class="box"><h4>Sobre a empresa</h4>'+
      '<div class="linha"><span>Setor</span><b>'+esc(e.s.split('·')[0].trim())+'</b></div>'+
      '<div class="linha"><span>Porte</span><b>'+esc(e.s.split('·')[1].trim())+'</b></div>'+
      '<div class="linha"><span>Contratações via Conectaria</span><b>3 em 2026</b></div>'+
      '<div class="linha"><span>Retorno médio</span><b>4 dias</b></div>'+
    '</div>'+
  '</aside></div>';

  $('#volta').onclick=()=>ir('home');
  const c=$('#cand'); if(c) c.onclick=()=>{ S.logado ? candidatar(id) : abrirAcesso('cand','criar'); };
  const g=$('#gateBtn'); if(g) g.onclick=()=>abrirAcesso('cand','criar');
  const ge=$('#gateEntrar'); if(ge) ge.onclick=()=>abrirAcesso('cand','entrar');
  const tr=$('#verTrace'); if(tr) tr.onclick=()=>abrirTrace(id);
  animaMed(); animaEixos();
}

function painelMatch(v){
  const m=M(v);
  const dim=(rot,o,peso)=>
    '<div class="eixo"><span class="n">'+rot+'</span>'+
    '<span class="t"><i data-w="'+o.nota+'"></i></span><span class="v">'+o.nota+'</span></div>'+
    '<div class="cfw">'+
      '<div class="cbar'+(o.confidence<POLITICA.confianca.revisar_abaixo_de?' bx':'')+'">'+
        '<i data-w="'+Math.round(o.confidence*100)+'"></i></div>'+
      '<p style="font-size:var(--xs);color:var(--i34);margin-top:4px">peso '+pc(peso)+
      ' · confiança '+pc(o.confidence)+'</p></div>';

  return '<div class="box" style="text-align:center">'+
    medidor(m.total, m.confidence, true)+
    '<p style="font-size:var(--sm);color:var(--i72);margin:var(--s2) 0 var(--s3)">'+
    (m.total>=70?'Forte aderência.':'Aderência parcial. Veja onde está a distância.')+'</p>'+
    '<div class="eixos" style="text-align:left">'+
      dim('Técnico', m.tecnico, m.pesos.tecnico)+
      dim('Cultural', m.cultural, m.pesos.cultural)+
      dim('Contexto', m.contexto, m.pesos.contexto)+
    '</div>'+
    // O portão é decisão de governança: vale para a empresa e para a
    // curadoria, não para quem está procurando vaga. Do lado do candidato
    // a mesma informação vira o que ele pode fazer a respeito.
    (S.cand.fonte!=='user'
      ? '<div class="acaoperfil"><span class="ic">'+I.al+'</span>'+
        '<div><b>Confirme seu perfil</b>'+
        '<p>Ele veio da conversa e ainda não passou pela sua revisão. Confirmado, ele chega '+
        'completo para a empresa.</p>'+
        '<button class="btn sm" data-irtags="1">Revisar meu perfil</button></div></div>'
      : '')+
    '<details style="margin-top:var(--s2);text-align:left" open>'+
      '<summary style="font-size:var(--xs);color:var(--ac1);cursor:pointer;font-weight:600">'+
      'Evidências que sustentam esta nota</summary>'+
      evidencias([...m.tecnico.evidencias, ...m.cultural.evidencias, ...m.contexto.evidencias])+
    '</details>'+
    '<div style="display:flex;gap:8px;margin-top:var(--s2)">'+
      '<button class="btn g sm w" id="verTrace">'+I.doc+'Ver a conta por dentro</button></div>'+
    '<p class="porque" style="text-align:left">Os pesos mudam por família de cargo. Esta vaga é de '+
    '<b>'+esc(v.familia)+'</b>, então o técnico pesa '+pc(m.pesos.tecnico)+'. '+
    'Seus dados estão como '+esc(FONTE_ROT[S.cand.fonte])+'.</p></div>';
}

/* ══════════════════ 16 · INSPETOR DE TRACE ══════════════════ */
function realce(json){
  return esc(json)
    .replace(/&quot;([A-Za-z0-9_]+?)&quot;(\s*:)/g,'<span class="k">&quot;$1&quot;</span>$2')
    .replace(/:\s(&quot;[^&]*?&quot;)/g,': <span class="v">$1</span>')
    .replace(/:\s(-?\d+\.?\d*)/g,': <span class="b">$1</span>')
    .replace(/:\s(true|false|null)/g,': <span class="b">$1</span>');
}
const V_ROT = {candidateProfile:'perfil do candidato', vacancy:'vaga', taxonomy:'taxonomia',
  featureSchema:'schema de features', embedding:'embedding', reranker:'reranker',
  policy:'política', explanation:'explicação'};

let traceAberto=null;
async function abrirTrace(vagaId){
  const v=VAGAS.find(x=>x.id===vagaId), m=M(v);
  traceAberto=vagaId;
  const drw=$('#drw');
  $('#drwBody').innerHTML='<div class="sk"><i style="width:60%"></i><i style="width:90%"></i>'+
    '<i style="width:40%"></i></div>';
  drw.classList.add('on'); drw.setAttribute('aria-hidden','false');
  $('#drwId').textContent=v.vid;

  const t = await montarTrace({
    recommendationId:'rec-'+v.vid+'-p'+vv(S.cand),
    candidato:S.cand, vaga:vagaEntidade(v), empresa:EMPRESAS[v.emp],
    resultado:m, politica:POLITICA,
    versoes:{embedding:'sem-embedding-baseline', reranker:'sem-reranker-baseline'},
    generatedAt:new Date().toISOString(),
  });
  if(traceAberto!==vagaId) return;

  $('#drwBody').innerHTML=
    '<div>'+selo(desfechoFinal(t.policyDecisions))+
      '<p style="font-size:var(--sm);color:var(--i72);margin-top:var(--s2);line-height:1.6">'+
      'Este artefato é imutável. Recalcular gera uma recomendação nova e expira a anterior, '+
      'nunca sobrescreve, senão some a capacidade de reconstruir por que algo foi exibido '+
      'três meses atrás.</p></div>'+
    '<div><h4 style="font-family:var(--d);font-size:var(--md);margin-bottom:9px">Hash da entrada</h4>'+
      '<div class="hashbox">'+I.doc+'<span>'+esc(t.inputHash)+'</span></div>'+
      '<p style="font-size:var(--xs);color:var(--i52);margin-top:8px;line-height:1.6">'+
      'Deriva do JSON canônico da entrada mais as oito versões. Mesma entrada e mesmas versões '+
      'produzem sempre o mesmo hash, então ele não muda se você fechar e abrir de novo, e '+
      'muda assim que você mexe num eixo.'+
      '</p></div>'+
    '<div><h4 style="font-family:var(--d);font-size:var(--md);margin-bottom:9px">'+
      'As oito versões do pipeline</h4><dl class="vers">'+
      Object.entries(t.versions).map(([k,val])=>
        '<dt>'+esc(V_ROT[k]||k)+'</dt><dd>'+esc(val)+'</dd>').join('')+'</dl></div>'+
    '<div><h4 style="font-family:var(--d);font-size:var(--md);margin-bottom:9px">'+
      'Features projetadas <span class="pill n">'+m.features.length+'</span></h4>'+
      '<p style="font-size:var(--xs);color:var(--i52);line-height:1.6;margin-bottom:9px">'+
      'Só entra o que está na allowlist da política. Nome, foto, idade, gênero, raça, estado '+
      'civil, CEP exato e instituição estão na denylist e a projeção recusa na emissão, mesmo '+
      'que alguém tente liberar por engano.</p>'+
      '<div class="tags">'+m.features.map(f=>'<span class="tag">'+esc(f)+'</span>').join('')+'</div></div>'+
    '<div><h4 style="font-family:var(--d);font-size:var(--md);margin-bottom:9px">'+
      'Evidências <span class="pill n">'+t.evidence.length+'</span></h4>'+
      evidencias(t.evidence)+'</div>'+
    '<div><h4 style="font-family:var(--d);font-size:var(--md);margin-bottom:9px">JSON completo</h4>'+
      '<pre>'+realce(JSON.stringify(t,null,2))+'</pre></div>';
}
function fecharTrace(){
  traceAberto=null;
  $('#drw').classList.remove('on');
  $('#drw').setAttribute('aria-hidden','true');
}

/* ══════════════════ 17 · COMPARADOR ══════════════════ */
function vComparar(){
  const vs = S.comparar.map(id=>VAGAS.find(v=>v.id===id)).filter(Boolean);
  if(vs.length<2){
    $('#v-comparar').innerHTML='<div class="estado" style="padding-top:var(--s6)">'+
      '<div class="ic">'+I.bal+'</div><h3>Escolha ao menos duas vagas.</h3>'+
      '<p>Na lista de vagas, use o botão comparar em cada card. O comparador roda o mesmo '+
      'motor nas duas e mostra onde a diferença está.</p>'+
      '<button class="btn" id="cmpVolta">Ver vagas abertas</button></div>';
    $('#cmpVolta').onclick=()=>ir('home');
    return;
  }
  const ms = vs.map(v=>({v, m:M(v)}));
  const melhor = ms.reduce((a,b)=>b.m.total>a.m.total?b:a);

  $('#v-comparar').innerHTML=
  '<button class="volta" id="cmpV">'+I.volta+'Todas as vagas</button>'+
  '<h1 style="font-size:var(--xxl);max-width:22ch">Onde exatamente elas diferem para você.</h1>'+
  '<p style="color:var(--i72);max-width:62ch;margin-top:10px">Mesma política, mesmas fórmulas, '+
  'mesmos pesos por família de cargo, então o que difere aqui é a sua aderência a cada '+
  'uma delas.</p>'+
  '<div class="cmp">'+ms.map(({v,m})=>{
    const e=EMPRESAS[v.emp];
    const ganha = v.id===melhor.v.id;
    return '<div class="cmpc'+(ganha?' win':'')+'">'+
      (ganha?'<span class="cw">maior aderência</span>':'')+
      '<div class="emp">'+logo(v.emp)+'<b>'+esc(e.n)+'</b></div>'+
      '<h3 style="font-size:var(--lg);font-family:var(--d)">'+esc(v.cargo)+'</h3>'+
      '<div style="display:grid;place-items:center">'+medidor(m.total,m.confidence,true)+'</div>'+
      '<div class="eixos">'+
        [['Técnico',m.tecnico,m.pesos.tecnico],['Cultural',m.cultural,m.pesos.cultural],
         ['Contexto',m.contexto,m.pesos.contexto]].map(([r,o,p])=>
          '<div class="eixo"><span class="n">'+r+' <span style="color:var(--i34)">'+pc(p)+
          '</span></span><span class="t"><i data-w="'+o.nota+'"></i></span>'+
          '<span class="v">'+o.nota+'</span></div>').join('')+
      '</div>'+
      '<div class="linha"><span>Família</span><b>'+esc(v.familia)+'</b></div>'+
      '<div class="linha"><span>Faixa</span><b>'+esc(v.faixa)+'</b></div>'+
      '<div class="linha"><span>Requisitos cobertos</span><b>'+
        v.requisitos.filter(rq=>S.cand.competencias.some(c=>c.skillId===rq.skillId)).length+
        ' de '+v.requisitos.length+'</b></div>'+
      evidencias([...m.tecnico.evidencias.filter(x=>x.kind!=='strength'),
                  ...m.cultural.evidencias.filter(x=>x.kind==='gap'),
                  ...m.contexto.evidencias.filter(x=>x.kind==='constraint')], 3)+
      '<button class="btn g sm" data-ver="'+v.id+'">Abrir a vaga</button></div>';
  }).join('')+'</div>'+
  '<p class="nota">O comparador chama o mesmo cálculo que a página da vaga usa. Se um '+
  'número divergisse entre as duas telas seria falha de cache, e é por isso que o resultado '+
  'é recalculado a cada mudança no seu perfil.</p>';

  $('#cmpV').onclick=()=>ir('home');
  animaMed(); animaEixos();
}
