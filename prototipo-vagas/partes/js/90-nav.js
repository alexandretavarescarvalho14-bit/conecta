/* ══════════════════ NAVEGAÇÃO ══════════════════ */

const ROTAS = {
  vagas:     {r:vVagas},
  vaga:      {r:vVaga},
  cadastro:  {r:vCadastro, lado:'cand'},
  minhas:    {r:vMinhas, lado:'cand', conta:true},
  perfil:    {r:vPerfil, lado:'cand', conta:true},
  painel:    {r:vPainel, lado:'admin'},
  empresas:  {r:vEmpresas, lado:'admin'},
  avagas:    {r:vAvagas, lado:'admin'},
  vagaform:  {r:vVagaform, lado:'admin'},
  pipeline:  {r:vPipeline, lado:'admin'},
  talentos:  {r:vTalentos, lado:'admin'},
};
const MENU = {
  cand:  [['vagas','Vagas','nvHome'], ['minhas','Minhas candidaturas','nvMala'], ['perfil','Meu perfil','nvTag']],
  admin: [['painel','Painel','nvGraf'], ['avagas','Vagas','nvLista'], ['pipeline','Processos','nvPessoas'],
          ['talentos','Talentos','nvTag'], ['empresas','Empresas','nvPredio']],
};
/* tela filha acende o item do menu de que ela faz parte */
const PAI = {vaga:'vagas', vagaform:'avagas'};

function ir(v, arg){
  const rota = ROTAS[v] || ROTAS.vagas;
  if(rota.lado === 'admin' && S.papel !== 'admin') v = 'vagas';
  else if(rota.lado === 'cand' && S.papel !== 'cand') v = 'painel';
  else if(rota.conta && !eu()){ iniciarCadastro(); return; }
  fecharGaveta();
  S.view = v; S.arg = arg ?? null;
  $$('.view').forEach(x => x.classList.remove('on'));
  const el = $('#v-' + v); el.classList.add('on');
  if(ROTAS[v].lado === 'admin') garantirRecs();
  try{ ROTAS[v].r(arg); }
  catch(err){
    console.error('[conectaria vagas] falha ao montar "' + v + '"', err);
    el.innerHTML = '<div class="estado"><div class="ic">' + I.al + '</div><h3>Não consegui montar esta tela.</h3>' +
      '<p>O que já foi preenchido continua salvo. Tente de novo ou volte para as vagas.</p>' +
      '<button class="btn" data-ir="vagas">Ver vagas</button>' +
      '<details class="errodet"><summary>Detalhe técnico</summary><pre>' + esc(String((err && err.stack) || err)) + '</pre></details></div>';
  }
  montarNav(); marcarRolaveis();
  window.scrollTo({top:0, behavior:'instant'});
  if(['vaga','cadastro','vagaform'].includes(v)) el.focus({preventScroll:true});
}

function montarNav(){
  const c = eu();
  const itens = S.papel === 'admin' ? MENU.admin : c ? MENU.cand : [MENU.cand[0]];
  const atual = PAI[S.view] || S.view;
  $('#tnav').innerHTML = itens.map(([k, r]) =>
    '<button data-ir="' + k + '"' + (atual === k ? ' aria-current="page"' : '') + '>' + esc(r) + '</button>').join('');

  const tb = $('#tabbar');
  if(itens.length > 1){
    tb.hidden = false;
    tb.innerHTML = itens.map(([k, r, ic]) => '<button data-ir="' + k + '"' + (atual === k ? ' aria-current="page"' : '') + '>' +
      I[ic] + '<span>' + esc(r.split(' ')[0] === 'Minhas' ? 'Candidaturas' : r.replace('Meu ', '').replace(/^./, x => x.toUpperCase())) + '</span></button>').join('');
  } else { tb.hidden = true; tb.innerHTML = ''; }
  document.body.classList.toggle('comAbas', itens.length > 1);

  $('#tdir').innerHTML = S.papel === 'admin'
    ? '<span class="pill ac"><i></i>Equipe Conectaria</span>'
    : c
    ? '<button class="btn g sm" id="btSair">Sair</button><button class="av" data-ir="perfil" aria-label="Meu perfil">' +
      esc(c.nome.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase()) + '</button>'
    : (S.cad && S.view !== 'cadastro' ? '<button class="btn sm" id="btContinuar">Continuar cadastro</button>'
      : '<button class="btn g sm" id="btEntrar">Entrar</button><button class="btn sm" id="btCriar">Cadastrar</button>');
  const s = $('#btSair'); if(s) s.onclick = sairCandidato;
  const en = $('#btEntrar'); if(en) en.onclick = abrirEntrar;
  const cr = $('#btCriar'); if(cr) cr.onclick = () => { S.vagaAlvo = null; iniciarCadastro(); };
  const co = $('#btContinuar'); if(co) co.onclick = () => ir('cadastro');

  $$('[data-papel]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.papel === S.papel)));
}

/* Tabela que rola de lado precisa ser alcançável pelo teclado. */
function marcarRolaveis(){
  $$('.tabw').forEach(el => {
    if(el.scrollWidth > el.clientWidth + 1){
      el.tabIndex = 0; el.setAttribute('role', 'region');
      if(!el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'Tabela, role para os lados');
    } else { el.removeAttribute('tabindex'); el.removeAttribute('role'); el.removeAttribute('aria-label'); }
  });
}

function trocarPapel(p){
  if(p === S.papel) return;
  S.papel = p; salvar();
  ir(p === 'admin' ? 'painel' : 'vagas');
  toast(p === 'admin' ? 'Vendo como a equipe da Conectaria.' : 'Vendo como candidato.');
}
function recomecar(){
  confirmar('Recomeçar o teste?', 'Volta tudo ao estado inicial: empresas e vagas do site, candidatos de exemplo. ' +
    'O que foi cadastrado neste navegador é apagado.', 'Recomeçar', () => {
      semear(); S.papel = 'cand'; S.q = ''; S.area = null; rasc = null; salvar();
      ir('vagas'); toast('Teste recomeçado.');
    }, true);
}
