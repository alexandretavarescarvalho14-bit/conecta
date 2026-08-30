/* ══════════════════ 24 · ACESSO ══════════════════ */
function renderDD(){
  $('#ddAcesso').innerHTML =
    itemDD('cand','pes','Acesso para Candidatos','Ver vagas e acompanhar candidaturas')+
    '<hr>'+
    itemDD('emp','pre','Acesso para Empresas','Anunciar vagas e buscar na base');
  $$('#ddAcesso [data-ac]').forEach(b=>b.onclick=()=>{fecharDD();abrirAcesso(b.dataset.ac);});
}
function itemDD(k,ico,t,sub){
  return '<button role="menuitem" data-ac="'+k+'"><span class="ic">'+I[ico]+'</span>'+
    '<span>'+t+'<small>'+sub+'</small></span><span class="ch">'+I.ch+'</span></button>';
}
function abrirDD(){S.ddAberto=true;$('#ddAcesso').classList.add('on');
  $('#btAcesso').setAttribute('aria-expanded','true');}
function fecharDD(){S.ddAberto=false;$('#ddAcesso').classList.remove('on');
  $('#btAcesso').setAttribute('aria-expanded','false');}

const FOCAVEIS='a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
let focoAntes=null;
function abrirAcesso(perfil, aba){
  focoAntes=document.activeElement; S.aba = aba || (perfil==='emp'?'entrar':'criar');
  renderModal(perfil);
  $('#scrim').classList.add('on'); $('#mbox').classList.add('on');
  $('#modal').setAttribute('aria-hidden','false');
  setTimeout(()=>{const f=$('#mbox button'); if(f) f.focus();},60);
}
function fecharAcesso(){
  $('#scrim').classList.remove('on'); $('#mbox').classList.remove('on');
  $('#modal').setAttribute('aria-hidden','true');
  if(focoAntes && focoAntes.isConnected) focoAntes.focus();
}
/* Foco preso dentro do modal: sem isso o Tab passeava pela página atrás,
   que é bug clássico de acessibilidade em diálogo. */
function prenderFoco(e){
  if(e.key!=='Tab' || !$('#mbox').classList.contains('on')) return;
  const f=$$(FOCAVEIS,$('#mbox')).filter(x=>x.offsetParent!==null);
  if(!f.length) return;
  const pri=f[0], ult=f[f.length-1];
  if(e.shiftKey && document.activeElement===pri){ e.preventDefault(); ult.focus(); }
  else if(!e.shiftKey && document.activeElement===ult){ e.preventDefault(); pri.focus(); }
}

function renderModal(perfil){
  const emp = perfil==='emp';
  $('#mbox').innerHTML =
  '<h2 id="mTit">'+(emp?'Acesso para empresas':'Acesso para candidatos')+'</h2>'+
  '<p class="sub">'+(emp
    ? 'Entre para anunciar vagas e buscar dentro da comunidade de 9.014 pessoas.'
    : 'Sua conta guarda o perfil que faz as vagas certas chegarem até você.')+'</p>'+
  '<div class="tabs" role="tablist">'+
    '<button role="tab" data-aba="criar" aria-selected="'+(S.aba==='criar')+'">Criar conta</button>'+
    '<button role="tab" data-aba="entrar" aria-selected="'+(S.aba==='entrar')+'">Já tenho conta</button>'+
  '</div>'+
  '<div class="oauth">'+
    '<button class="ob" data-oa="google">'+I.gg+'Continuar com Google</button>'+
    '<button class="ob li" data-oa="linkedin">'+I.li+'Continuar com LinkedIn</button>'+
  '</div>'+
  '<div class="ou">ou com e-mail</div>'+
  '<div class="form" style="gap:var(--s2)">'+
    (S.aba==='criar' && !emp ? '<div class="fg"><label for="mn">Nome completo</label>'+
      '<input id="mn" placeholder="Como você quer ser chamado"></div>' : '')+
    (emp ? '<div class="fg"><label for="me">E-mail corporativo</label>'+
      '<input id="me" type="email" placeholder="voce@empresa.com.br"></div>'
         : '<div class="fg"><label for="me">E-mail</label>'+
      '<input id="me" type="email" placeholder="voce@email.com"></div>')+
    '<div class="fg"><label for="ms">Senha</label><input id="ms" type="password" '+
      'placeholder="Mínimo de 8 caracteres"></div>'+
    '<button class="btn w" data-oa="email">'+(S.aba==='criar'?'Criar conta':'Entrar')+'</button>'+
  '</div>'+
  '<p class="mini">Protótipo: o acesso não autentica de verdade e nenhum dado sai do seu '+
  'navegador. '+(S.aba==='criar' && !emp
    ? 'Ao criar a conta você monta seu perfil em poucos passos. É esse perfil, e não o PDF do '+
      'currículo, que a plataforma usa para comparar você com cada vaga.'
    : emp ? 'Na versão real, o acesso da empresa é liberado pela curadoria em até 1 dia útil.'
    : '')+'</p>'+
  '<button class="btn g w" id="fechaM" style="margin-top:var(--s3)">Cancelar</button>';

  $$('[data-aba]').forEach(b=>b.onclick=()=>{S.aba=b.dataset.aba;renderModal(perfil);});
  $('#fechaM').onclick=fecharAcesso;
  $$('[data-oa]').forEach(b=>b.onclick=()=>autenticar(b.dataset.oa, perfil, b));
}
async function autenticar(via, perfil, btn){
  const rot={google:'Conectando ao Google',linkedin:'Conectando ao LinkedIn',email:'Verificando'};
  const orig=btn.innerHTML; btn.disabled=true;
  btn.innerHTML='<span class="spin"></span>'+rot[via];
  await espera(760);
  btn.innerHTML=orig; btn.disabled=false;
  fecharAcesso();

  if(perfil==='emp'){
    S.modo='emp'; S.contaEmp=true; salvar(); ir(S.empSalvo?'evagas':'perfil');
    toast(via==='email'?'Bem-vindo de volta ao Grupo Aurora.'
      :'Conta da empresa conectada via '+(via==='google'?'Google':'LinkedIn')+'.');
    if(!S.empSalvo) setTimeout(()=>toast('Comece pelo perfil: é ele que alimenta o match.'),3900);
    return;
  }
  S.modo='cand'; S.conta={via};
  if(S.aba==='entrar'){
    // quem já tinha conta tem perfil confirmado: dado de origem 'user'
    S.logado=true; reprojetarFonte('user'); salvar();
    ir('minhas'); toast('Bem-vinda de volta. Seu perfil já está confirmado.');
  } else {
    toast(via==='email'?'Conta criada. Agora vamos montar seu perfil.'
      :'Conta criada via '+(via==='google'?'Google':'LinkedIn')+'. Puxamos o que deu para puxar.');
    ir('triagem');
  }
}
