/* ══════════════════ CADASTRO DO CANDIDATO ══════════════════

   Três passos, na ordem em que a pessoa pensa: quem sou (conta), o que
   eu já fiz (currículo), confere e confirma (revisão). Tudo o que o
   protótipo completo tinha e não serve para a Conectaria operar saiu:
   eixos de ambiente, visibilidade por bloco, página de avisos, painel de
   confiança.

   O que veio do currículo continua sendo sugestão: entra marcado "do
   currículo" e só vira perfil quando a pessoa confirma. É a mesma regra
   do protótipo, com uma tela só no lugar de cinco. */

function cadNovo(){
  return {passo:1, editando:null, conta:{nome:'', email:'', whatsapp:''}, fonte:null, arquivo:null,
    lendo:false, falha:null, achado:null, erros:[], consent:{termos:false, compartilhar:false},
    rev:{areaId:null, cargos:[], competencias:[], resumo:'', anos:null, uf:'', cidade:'', modelos:[], pretensao:null, linkedin:''}};
}
function iniciarCadastro(){
  if(!S.cad || S.cad.editando) S.cad = cadNovo();
  salvar(); ir('cadastro');
}
function editarPerfil(){
  const c = eu(); if(!c) return;
  const cad = cadNovo();
  cad.passo = 3; cad.editando = c.id; cad.fonte = 'manual';
  cad.conta = {nome:c.nome, email:c.email, whatsapp:c.whatsapp};
  cad.consent = {termos:true, compartilhar:true};
  cad.rev = {areaId:c.areaId, cargos:[...(c.cargos || [])],
    competencias:(c.competencias || []).map(x => ({skillId:x.skillId, nivel:x.nivel, de:'user', ok:true})),
    resumo:c.resumo || '', anos:c.anos, uf:c.uf || '', cidade:c.cidade || '', modelos:[...(c.modelos || [])],
    pretensao:c.pretensao, linkedin:c.linkedin || ''};
  S.cad = cad; salvar(); ir('cadastro');
}

const PASSOS_CAD = ['Conta', 'Currículo', 'Revisão'];

function vCadastro(){
  if(!S.cad) S.cad = cadNovo();
  const k = S.cad;
  const corpo = k.passo === 1 ? passoConta(k) : k.passo === 2 ? passoCurriculo(k) : passoRevisao(k);
  $('#v-cadastro').innerHTML = '<div class="onb">' +
    (k.editando ? '' : '<ol class="stp stp3" aria-label="Etapas do cadastro">' + PASSOS_CAD.map((p, i) =>
      '<li class="' + (i + 1 < k.passo ? 'ok' : i + 1 === k.passo ? 'on' : '') + '"><i></i><span>' + p + '</span></li>').join('') + '</ol>') +
    '<div class="onbc"><div class="onbg"><div class="onbm">' + corpo + '</div>' + ladoCadastro(k) + '</div></div></div>';
  ligarCadastro(k);
}

function ladoCadastro(k){
  return '<aside class="onbl"><div class="box">' +
    '<h4>' + I.spark + ' Como funciona</h4>' +
    '<ol class="comofunc">' +
      '<li><b>Cadastro único.</b> Serve para todas as vagas, e você edita quando quiser.</li>' +
      '<li><b>Candidatura com um clique.</b> Seu perfil vai junto.</li>' +
      '<li><b>A equipe fala com você.</b> A Conectaria conduz o processo e chama pelo WhatsApp.</li>' +
    '</ol>' +
    (S.vagaAlvo && vagaPor(S.vagaAlvo) ? '<p class="porque">Ao terminar, sua candidatura para <b>' +
      esc(vagaPor(S.vagaAlvo).titulo) + '</b> é enviada.</p>' : '') +
  '</div></aside>';
}

function avisoErros(k){
  return k.erros.length ? '<div class="pend" role="alert">' + I.al + '<div><b>Falta pouco.</b> ' + esc(k.erros.join(' ')) + '</div></div>' : '';
}

/* ── 1 · conta ── */
function passoConta(k){
  const c = k.conta;
  return '<h1>Crie seu cadastro</h1>' +
    '<p class="lead">Só o essencial para a equipe da Conectaria falar com você.</p>' + avisoErros(k) +
    '<form class="form" id="fConta" novalidate>' +
      '<div class="fg"><label for="cNome">Nome completo</label><input id="cNome" autocomplete="name" value="' + esc(c.nome) + '"></div>' +
      '<div class="dupla"><div class="fg"><label for="cEmail">E-mail</label><input id="cEmail" type="email" autocomplete="email" value="' + esc(c.email) + '"></div>' +
      '<div class="fg"><label for="cWhats">WhatsApp</label><input id="cWhats" inputmode="tel" autocomplete="tel" placeholder="(81) 99999-9999" value="' + esc(c.whatsapp) + '"></div></div>' +
      '<div class="fg"><label for="cSenha">Senha</label><input id="cSenha" type="password" autocomplete="new-password" placeholder="Mínimo de 8 caracteres">' +
        '<p class="hint">Nesta versão de teste a senha não é guardada.</p></div>' +
      '<div class="acoesform"><button class="btn" type="submit">Continuar</button>' +
      '<button class="btn g" type="button" id="jaTenho">Já tenho cadastro</button></div>' +
    '</form>';
}

/* ── 2 · currículo ── */
function passoCurriculo(k){
  if(k.lendo) return '<h1>Lendo seu currículo</h1><p class="lead">' + esc(k.arquivo ? k.arquivo.nome : 'texto colado') + '</p>' +
    '<div class="sk"><i style="width:60%"></i><i style="width:85%"></i><i style="width:40%"></i></div>';
  return (k.editando ? '' : '<button class="volta" data-cadpasso="1">' + I.volta + 'Voltar</button>') +
    '<h1>Seu currículo</h1>' +
    '<p class="lead">Envie o arquivo e a gente preenche o que conseguir. Você confere tudo no próximo passo.</p>' +
    (k.falha ? '<div class="pend" role="alert">' + I.al + '<div><b>Não deu para ler este arquivo.</b> ' + esc(k.falha) + '</div></div>' : '') +
    '<label class="drop" id="drop">' +
      '<input type="file" id="arq" accept=".docx,.txt,.md,.pdf,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document">' +
      '<span class="ic">' + I.doc + '</span><b>Arraste o arquivo aqui ou clique para escolher</b>' +
      '<span>DOCX, TXT ou MD preenchem o perfil. PDF é guardado para a equipe ler, e você preenche à mão.</span>' +
    '</label>' +
    '<details class="alt"><summary>Prefere colar o texto do currículo?</summary>' +
      '<textarea id="colado" rows="7" placeholder="Cole aqui o conteúdo do seu currículo"></textarea>' +
      '<button class="btn sm" id="usarColado" type="button">Usar este texto</button></details>' +
    '<button class="btn g" id="semCv" type="button" style="margin-top:var(--s2)">Não tenho currículo agora, vou preencher</button>';
}

/* ── 3 · revisão ── */
function passoRevisao(k){
  const r = k.rev, doc = k.fonte === 'import';
  const ufs = Object.entries(UFS).sort((a, b) => a[1].localeCompare(b[1]));
  return (k.editando ? '<button class="volta" data-ir="perfil">' + I.volta + 'Meu perfil</button>'
      : '<button class="volta" data-cadpasso="2">' + I.volta + 'Voltar ao currículo</button>') +
    '<h1>' + (k.editando ? 'Editar meu perfil' : 'Confira seu perfil') + '</h1>' +
    (k.achado ? '<div class="achou">' + I.ok + '<div>' + k.achado + '</div></div>' :
      '<p class="lead">Escolha sua área e as atividades que você já fez. Leva uns três minutos.</p>') +
    avisoErros(k) +

    '<section class="blk"><header><h3>Área e cargos</h3>' + (doc ? '<span class="prov document"><i></i>do currículo</span>' : '') + '</header>' +
      '<div class="chips" style="margin:0 0 10px">' + areasOrdenadas().map(a =>
        '<button class="chip" type="button" data-carea="' + a.id + '" aria-pressed="' + (r.areaId === a.id) + '">' + esc(a.n) + '</button>').join('') + '</div>' +
      '<p class="hint">Cargos que você busca (até 3):</p>' +
      '<div class="chips" id="cargosBox" style="margin:0">' + chipsCargosCad(r) + '</div></section>' +

    '<section class="blk"><header><h3>O que você já fez</h3></header>' +
      '<p class="hint">Clique no nível para trocar. ' + (doc ? 'Embaixo de cada item está o trecho do currículo de onde ele saiu.' : 'Adicione pela busca.') + '</p>' +
      '<div class="cmps" id="cmpsBox">' + listaCompsCad(r) + '</div>' +
      '<div class="tagin" style="margin-top:10px"><input id="buscaCmp" placeholder="Buscar atividade: vendas, estoque, Excel..." aria-label="Buscar atividade" autocomplete="off"></div>' +
      '<div class="sugt" id="sugCmp"></div></section>' +

    '<section class="blk"><header><h3>Onde e como você trabalha</h3></header>' +
      '<div class="dupla"><div class="fg"><label for="rCidade">Cidade</label><input id="rCidade" value="' + esc(r.cidade) + '" placeholder="Recife"></div>' +
      '<div class="fg"><label for="rUf">Estado</label><select id="rUf"><option value="">escolher</option>' +
        ufs.map(([n, s]) => '<option value="' + s + '"' + (r.uf === s ? ' selected' : '') + '>' + s + ' · ' + n.replace(/\b\w/g, x => x.toUpperCase()) + '</option>').join('') +
      '</select></div></div>' +
      '<p class="hint" style="margin-top:10px">Modelos que você aceita:</p>' +
      '<div class="checks">' + ['presencial', 'hibrido', 'remoto'].map(m =>
        '<label class="check"><input type="checkbox" data-cmod="' + m + '"' + (r.modelos.includes(m) ? ' checked' : '') + '> ' + MODELO_ROT[m] + '</label>').join('') + '</div>' +
      '<div class="dupla" style="margin-top:10px"><div class="fg"><label for="rPret">Pretensão mensal (R$)</label>' +
        '<input id="rPret" type="number" min="0" step="100" placeholder="opcional" value="' + (r.pretensao ?? '') + '"></div>' +
      '<div class="fg"><label for="rAnos">Anos de experiência</label><input id="rAnos" type="number" min="0" max="45" placeholder="opcional" value="' + (r.anos ?? '') + '"></div></div></section>' +

    '<section class="blk"><header><h3>Sobre você</h3><span class="opc">opcional</span></header>' +
      '<textarea id="rResumo" rows="3" placeholder="Duas ou três frases: o que você faz e o que busca agora">' + esc(r.resumo) + '</textarea>' +
      '<div class="fg" style="margin-top:10px"><label for="rLinkedin">LinkedIn</label><input id="rLinkedin" placeholder="linkedin.com/in/seu-nome" value="' + esc(r.linkedin) + '"></div></section>' +

    (k.editando ? '' : '<section class="blk">' +
      '<label class="check cons"><input type="checkbox" data-ccons="termos"' + (k.consent.termos ? ' checked' : '') + '><span>Li e aceito os termos de uso e a política de privacidade da Conectaria. <em class="necessário">necessário</em></span></label>' +
      '<label class="check cons"><input type="checkbox" data-ccons="compartilhar"' + (k.consent.compartilhar ? ' checked' : '') + '><span>Autorizo a Conectaria a usar meu perfil para me indicar a vagas e a compartilhá-lo com as empresas das vagas em que eu me candidatar. Posso pedir para ver, corrigir ou apagar meus dados quando quiser. <em class="necessário">necessário</em></span></label>' +
    '</section>') +

    '<button class="btn w" id="btConfirmaCad" type="button">' + (k.editando ? 'Salvar alterações'
      : S.vagaAlvo && vagaPor(S.vagaAlvo) ? 'Confirmar e enviar candidatura' : 'Confirmar cadastro') + '</button>';
}

function chipsCargosCad(r){
  const lista = r.areaId ? cargosDaArea(r.areaId) : [];
  if(!lista.length) return '<span class="hint">Escolha uma área para ver os cargos.</span>';
  return lista.map(c => '<button class="chip" type="button" data-ccargo="' + c.id + '" aria-pressed="' + r.cargos.includes(c.id) + '">' +
    esc(c.n) + ' <small>' + SEN_ROT[c.sen] + '</small></button>').join('');
}
function listaCompsCad(r){
  if(!r.competencias.length) return '<p class="hint" style="margin:6px 0">Nenhuma ainda. ' +
    (r.cargos.length ? 'Sugestões pelos cargos escolhidos aparecem ao clicar na busca.' : 'Busque abaixo.') + '</p>';
  return r.competencias.map((c, i) =>
    '<div class="cmp' + (c.ok ? '' : ' off') + '">' +
      '<button class="okb" type="button" data-cok="' + i + '" aria-pressed="' + c.ok + '" aria-label="' + (c.ok ? 'Tirar' : 'Manter') + ' ' + esc(skillNome(c.skillId)) + '">' + (c.ok ? I.ok : I.x) + '</button>' +
      '<div class="cmpi"><b>' + esc(skillNome(c.skillId)) + '</b>' + (c.evidencia ? '<q>' + esc(c.evidencia) + '</q>' : '') + '</div>' +
      '<button class="nvbt" type="button" data-cniv="' + i + '">' + NIVEIS[c.nivel - 1] + '</button>' +
      '<span class="prov ' + (c.de === 'document' ? 'document' : 'user') + '"><i></i>' + (c.de === 'document' ? 'currículo' : 'você') + '</span>' +
    '</div>').join('');
}

function pendenciasCad(k){
  const r = k.rev, p = [];
  if(!r.areaId) p.push('Escolha sua área.');
  if(!r.competencias.some(c => c.ok)) p.push('Marque ao menos uma atividade que você já fez.');
  if(!r.uf) p.push('Diga em que estado você está.');
  if(!r.modelos.length) p.push('Marque ao menos um modelo de trabalho.');
  if(!k.editando && !(k.consent.termos && k.consent.compartilhar)) p.push('Aceite as duas autorizações.');
  return p;
}

function ligarCadastro(k){
  const raiz = $('#v-cadastro');
  $$('[data-cadpasso]', raiz).forEach(b => b.onclick = () => { k.passo = +b.dataset.cadpasso; k.erros = []; salvar(); vCadastro(); });

  const fc = $('#fConta', raiz);
  if(fc){
    const w = $('#cWhats'); w.oninput = () => { w.value = mascararWhats(w.value); };
    fc.onsubmit = e => {
      e.preventDefault();
      const nome = $('#cNome').value.trim(), email = $('#cEmail').value.trim(), whats = $('#cWhats').value.trim();
      const erros = [];
      if(nome.split(/\s+/).length < 2) erros.push('Escreva nome e sobrenome.');
      if(!emailValido(email)) erros.push('Confira o e-mail.');
      else if(DB.candidatos.some(c => c.email.toLowerCase() === email.toLowerCase())) erros.push('Este e-mail já tem cadastro. Use "Já tenho cadastro".');
      if(soDigitos(whats).length < 10) erros.push('Informe o WhatsApp com DDD.');
      if($('#cSenha').value.length < 8) erros.push('A senha precisa de 8 caracteres ou mais.');
      k.conta = {nome, email, whatsapp:whats};
      k.erros = erros;
      if(!erros.length) k.passo = 2;
      salvar(); vCadastro();
    };
    $('#jaTenho').onclick = abrirEntrar;
  }

  const arq = $('#arq', raiz);
  if(arq){
    arq.onchange = () => { if(arq.files[0]) lerCurriculo(k, arq.files[0]); };
    const drop = $('#drop', raiz);
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if(f) lerCurriculo(k, f); });
    $('#usarColado').onclick = () => {
      const tx = $('#colado').value;
      if(tx.trim().length < 60){ toast('Cole um pouco mais de texto para eu conseguir ler.', I.al); return; }
      interpretarCurriculo(k, tx, null);
    };
    $('#semCv').onclick = () => { k.fonte = 'manual'; k.achado = null; k.falha = null; k.passo = 3; salvar(); vCadastro(); };
  }

  if(k.passo === 3) ligarRevisao(k, raiz);
}

async function lerCurriculo(k, arquivo){
  const ext = (arquivo.name.split('.').pop() || '').toLowerCase();
  k.falha = null;
  if(ext === 'pdf'){
    k.arquivo = {nome:arquivo.name, tamanho:arquivo.size}; k.fonte = 'pdf';
    k.achado = 'Guardamos <b>' + esc(arquivo.name) + '</b> para a equipe ler. PDF não preenche o perfil sozinho, então preencha abaixo.';
    k.passo = 3; salvar(); vCadastro(); return;
  }
  k.lendo = true; k.arquivo = {nome:arquivo.name, tamanho:arquivo.size}; vCadastro();
  try{
    const {texto} = await lerArquivo(arquivo);
    await espera(500);
    interpretarCurriculo(k, texto, arquivo.name);
  }catch(e){
    k.lendo = false; k.falha = (e && e.message) || 'Confira se é DOCX, TXT ou MD.'; k.arquivo = null;
    salvar(); vCadastro();
  }
}
function interpretarCurriculo(k, texto, nome){
  const s = interpretar(texto);
  const r = k.rev;
  r.areaId = s.areaId || r.areaId;
  r.cargos = s.cargos.slice(0, 3).length ? s.cargos.slice(0, 3) : r.cargos;
  r.competencias = s.competencias.map(c => ({skillId:c.skillId, nivel:c.nivel, de:'document', evidencia:c.evidencia, ok:true}));
  r.resumo = s.resumo || r.resumo; r.anos = s.anos ?? r.anos; r.uf = s.uf || r.uf;
  if(s.modelos.length) r.modelos = s.modelos;
  k.fonte = 'import'; k.lendo = false; k.passo = 3; k.erros = [];
  k.arquivo = nome ? {nome, tamanho:0} : null;
  const n = s.competencias.length;
  k.achado = 'Lemos seu currículo e encontramos <b>' + plural(n, 'atividade', 'atividades') + '</b>' +
    (s.areaId ? ' e a área <b>' + esc(AREA[s.areaId].n) + '</b>' : '') + '. Confira, ajuste o que precisar e confirme.';
  salvar(); vCadastro();
}

function ligarRevisao(k, raiz){
  const r = k.rev;
  const repintarComps = () => { $('#cmpsBox', raiz).innerHTML = listaCompsCad(r); ligarComps(); salvar(); };
  $$('[data-carea]', raiz).forEach(b => b.onclick = () => {
    r.areaId = r.areaId === b.dataset.carea ? null : b.dataset.carea;
    r.cargos = r.cargos.filter(id => CARGO[id] && CARGO[id].a === r.areaId);
    $$('[data-carea]', raiz).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.carea === r.areaId)));
    $('#cargosBox', raiz).innerHTML = chipsCargosCad(r); ligarCargos(); salvar();
  });
  const ligarCargos = () => $$('[data-ccargo]', raiz).forEach(b => b.onclick = () => {
    const id = b.dataset.ccargo;
    r.cargos = r.cargos.includes(id) ? r.cargos.filter(x => x !== id) : [...r.cargos, id].slice(-3);
    $$('[data-ccargo]', raiz).forEach(x => x.setAttribute('aria-pressed', String(r.cargos.includes(x.dataset.ccargo))));
    salvar();
  });
  const ligarComps = () => {
    $$('[data-cok]', raiz).forEach(b => b.onclick = () => { const c = r.competencias[+b.dataset.cok]; c.ok = !c.ok; repintarComps(); });
    $$('[data-cniv]', raiz).forEach(b => b.onclick = () => { const c = r.competencias[+b.dataset.cniv]; c.nivel = c.nivel % 3 + 1; if(c.de === 'document') c.de = 'user'; repintarComps(); });
  };
  ligarCargos(); ligarComps();

  const busca = $('#buscaCmp', raiz), sug = $('#sugCmp', raiz);
  const pintaSug = () => {
    const q = normalizar(busca.value.trim());
    const tem = new Set(r.competencias.map(c => c.skillId));
    const base = q ? SKILLS : skillsDosCargos(r.cargos).concat(r.areaId ? SKILLS.filter(s => s.a.includes(r.areaId)) : []);
    const lista = [...new Set(base)].filter(s => s.st === 'ativa' && !tem.has(s.id) &&
      (!q || normalizar(s.r).includes(q) || (SINONIMOS[s.id] || []).some(t => t.includes(q)))).slice(0, 10);
    sug.innerHTML = lista.map(s => '<button type="button" data-addc="' + s.id + '">+ ' + esc(s.r) + '</button>').join('') ||
      (q ? '<span class="hint">Nada com esse termo. Tente uma palavra mais curta.</span>' : '');
    $$('[data-addc]', sug).forEach(b => b.onclick = () => {
      r.competencias.push({skillId:b.dataset.addc, nivel:2, de:'user', ok:true});
      busca.value = ''; pintaSug(); repintarComps();
    });
  };
  busca.oninput = pintaSug; busca.onfocus = pintaSug;

  const liga = (id, f) => { const el = $(id, raiz); if(el) el.oninput = el.onchange = () => { f(el); salvar(); }; };
  liga('#rCidade', el => r.cidade = el.value.slice(0, 60));
  liga('#rUf', el => r.uf = el.value);
  liga('#rPret', el => r.pretensao = el.value === '' ? null : Math.max(0, +el.value));
  liga('#rAnos', el => r.anos = el.value === '' ? null : Math.max(0, Math.min(45, +el.value)));
  liga('#rResumo', el => r.resumo = el.value.slice(0, 900));
  liga('#rLinkedin', el => r.linkedin = el.value.trim().slice(0, 120));
  $$('[data-cmod]', raiz).forEach(cb => cb.onchange = () => {
    r.modelos = ['presencial', 'hibrido', 'remoto'].filter(m => $('[data-cmod="' + m + '"]', raiz).checked); salvar();
  });
  $$('[data-ccons]', raiz).forEach(cb => cb.onchange = () => { k.consent[cb.dataset.ccons] = cb.checked; salvar(); });

  $('#btConfirmaCad', raiz).onclick = async () => {
    k.erros = pendenciasCad(k);
    if(k.erros.length){ vCadastro(); scrollTo({top:0, behavior:'smooth'}); return; }
    const b = $('#btConfirmaCad'); b.disabled = true; b.innerHTML = '<span class="spin"></span>Salvando';
    await espera(420);
    confirmarCadastro(k);
  };
}

function confirmarCadastro(k){
  const r = k.rev, agora = iso(Date.now());
  const dados = {areaId:r.areaId, cargos:[...r.cargos],
    competencias:r.competencias.filter(c => c.ok).map(c => ({skillId:c.skillId, nivel:c.nivel, de:'user'})),
    uf:r.uf, cidade:r.cidade, modelos:[...r.modelos], pretensao:r.pretensao || null,
    resumo:r.resumo, anos:r.anos, linkedin:r.linkedin};

  if(k.editando){
    const c = candidatoPor(k.editando);
    Object.assign(c, dados);
    if(k.arquivo) c.cvNome = k.arquivo.nome;
    tocar(c); S.cad = null; salvar();
    ir('perfil'); toast('Perfil atualizado.');
    return;
  }
  const c = {id:novoId('c'), exemplo:false, nome:k.conta.nome, email:k.conta.email, whatsapp:k.conta.whatsapp,
    ...dados, cvNome:k.arquivo ? k.arquivo.nome : null, fonte:'user', consentEm:agora, criadoEm:agora, __v:0};
  DB.candidatos.push(c);
  S.userId = c.id; S.cad = null;
  const alvo = S.vagaAlvo && vagaPor(S.vagaAlvo) && vagaPor(S.vagaAlvo).status === 'publicada' ? S.vagaAlvo : null;
  if(alvo){
    criarCandidatura(c.id, alvo, 'site', 'candidato');
    S.vagaAlvo = null; salvar();
    ir('minhas'); toast('Candidatura enviada. Logo abaixo, outras vagas que combinam com o seu perfil.');
  } else {
    S.vagaAlvo = null; salvar();
    ir('vagas'); toast('Cadastro pronto. Separamos as vagas que combinam com você.');
  }
}

/* Entrar de novo: no teste, basta o e-mail. Dá para entrar como um dos
   candidatos de exemplo e ver o lado dele. */
function abrirEntrar(){
  abrirModal('<h2 id="mTit">Entrar</h2><p class="sub">Use o e-mail do seu cadastro.</p>' +
    '<form class="form" id="fEntrar" style="gap:var(--s2)" novalidate>' +
      '<div class="fg"><label for="eEmail">E-mail</label><input id="eEmail" type="email" autocomplete="email"></div>' +
      '<div class="fg"><label for="eSenha">Senha</label><input id="eSenha" type="password" autocomplete="current-password">' +
        '<p class="hint">Nesta versão de teste a senha não é conferida. Para ver o lado de um candidato de exemplo, use por exemplo <b>' +
        esc((DB.candidatos.find(c => c.exemplo) || {email:''}).email) + '</b>.</p></div>' +
      '<p class="erroform" id="eErro" role="alert"></p>' +
      '<button class="btn w" type="submit">Entrar</button>' +
      '<button class="btn g w" type="button" id="eCancela">Cancelar</button></form>');
  $('#eCancela').onclick = fecharModal;
  $('#fEntrar').onsubmit = e => {
    e.preventDefault();
    const email = $('#eEmail').value.trim().toLowerCase();
    const c = DB.candidatos.find(x => x.email.toLowerCase() === email);
    if(!c){ $('#eErro').textContent = 'Não achamos cadastro com este e-mail. Confira ou crie um cadastro.'; return; }
    S.userId = c.id; S.cad = null; fecharModal();
    const alvo = S.vagaAlvo; S.vagaAlvo = null; salvar();
    if(alvo && !jaCandidatou(c.id, alvo)){ ir('vaga', alvo); toast('Olá, ' + c.nome.split(' ')[0] + '. Agora é só confirmar a candidatura.'); }
    else { ir('minhas'); toast('Olá, ' + c.nome.split(' ')[0] + '.'); }
  };
}
