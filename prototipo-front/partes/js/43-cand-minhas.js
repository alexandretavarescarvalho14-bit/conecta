/* ══════════════════ 19 · MINHAS CANDIDATURAS ══════════════════ */
function vMinhas(){
  const el=$('#v-minhas');
  if(!S.candidaturas.length){
    el.innerHTML='<div class="estado" style="padding-top:var(--s6)"><div class="ic">'+I.vazio+'</div>'+
      '<h3>Você ainda não se candidatou.</h3>'+
      '<p>Quando você se candidatar, o andamento aparece aqui: em que etapa está, quem já viu '+
      'seu perfil e quanto tempo aquela empresa costuma levar para responder.</p>'+
      '<button class="btn" id="verVagas">Ver vagas abertas</button></div>';
    $('#verVagas').onclick=()=>ir('home'); return;
  }
  el.innerHTML='<div class="barra" style="margin-top:var(--s5)"><h2>Minhas candidaturas</h2>'+
    '<p class="cont">'+S.candidaturas.length+(S.candidaturas.length===1?' processo em andamento':' processos em andamento')+'</p></div>'+
    '<div class="cds">'+S.candidaturas.map(c=>{
      const v=VAGAS.find(x=>x.id===c.v), e=EMPRESAS[v.emp], m=M(v);
      return '<div class="cd rv"><div class="cdtop"><div style="flex:1;min-width:210px">'+
        '<div class="emp">'+logo(v.emp)+'<b>'+esc(e.n)+'</b></div>'+
        '<h3 style="font-size:var(--lg);font-family:var(--d)">'+esc(v.cargo)+'</h3>'+
        '<div class="meta"><span>'+esc(v.local)+'</span><span>'+esc(v.faixa)+'</span></div></div>'+
        medidor(m.total,m.confidence)+'</div>'+
        '<div class="trilhaw"><div class="trilha">'+ETAPAS.map((n,i)=>
          '<div class="et '+(i<c.et?'done':i===c.et?'now':'')+'"><i></i>'+esc(n)+'</div>').join('')+
        '</div></div>'+
        '<p class="expect">'+I.ok+'Esta empresa responde em 4 dias, em média. '+
        'Sua candidatura entrou '+esc(c.quando)+'.</p>'+
        '<div style="margin-top:var(--s3);display:flex;gap:9px;flex-wrap:wrap">'+
        '<button class="btn g sm" data-ver="'+v.id+'">Ver a vaga</button>'+
        '<button class="btn g sm" data-trace="'+v.id+'">'+I.doc+'Trace</button>'+
        '<button class="btn g sm" data-msg="'+v.id+'">Falar com a Conectaria</button></div>'+
      '</div>';
    }).join('')+'</div>'+
    '<div class="box" style="margin-top:var(--s3);display:flex;gap:var(--s3);align-items:center;flex-wrap:wrap">'+
      '<span class="ic" style="width:42px;height:42px;border-radius:12px;background:var(--veu);'+
      'color:var(--ac2);display:grid;place-items:center">'+I.spark+'</span>'+
      '<div style="flex:1;min-width:220px"><b style="font-family:var(--d)">Vagas sob demanda estão ativas</b>'+
      '<p style="font-size:var(--sm);color:var(--i72)">Com seu perfil montado, avisamos por '+
      'WhatsApp quando entrar vaga com match acima de 75% e portão em publicável.</p></div>'+
      '<button class="btn g sm" id="ajustar">Ajustar preferências</button></div>';
  $$('[data-msg]').forEach(b=>b.onclick=()=>toast('A Conectaria responde no WhatsApp em até 1 dia útil.'));
  $('#ajustar').onclick=()=>toast('Preferências de match e canal de aviso, em construção nesta versão.');
  animaMed(); revelar(el);
}
