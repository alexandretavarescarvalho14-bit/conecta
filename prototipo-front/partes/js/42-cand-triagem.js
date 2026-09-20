/* ══════════════════ 18 · ONBOARDING POR CURRÍCULO ══════════════════

   A triagem deixou de ser questionário e virou importação, interpretação
   e confirmação. A IA sugere uma estrutura a partir do currículo; a
   pessoa revisa, corrige e confirma. Só a versão confirmada entra nas
   recomendações.

   Cada tela abaixo é um estado da máquina em 20-estado.js. A tela não
   guarda estado próprio: lê S.onb e desenha. Recarregar a página cai na
   mesma tela.                                                            */

const ROT_MODELO_ONB = {presencial:'Presencial', hibrido:'Híbrido', remoto:'Remoto'};

function vTriagem(){
  if(!S.onb) S.onb = onbNovo(S.conta?.via);
  const o = S.onb;
  const el = $('#v-triagem');
  const tela = {
    ACCOUNT_CREATED: telaBoasVindas, ONBOARDING_STARTED: telaEscolha,
    SOURCE_SELECTED: telaUpload, DOCUMENT_UPLOADED: telaAnalise, EXTRACTION_PENDING: telaAnalise,
    EXTRACTION_READY: telaEncontrado, EXTRACTION_FAILED: telaFalha, DOCUMENT_REJECTED: telaFalha,
    PROFILE_IN_REVIEW: telaRevisao, REVIEW_REQUIRED: telaRevisao, PROFILE_INCOMPLETE: telaRevisao,
    PROFILE_CONFIRMED: telaElegibilidade, MATCHING_READY: telaPronto,
  }[o.estado] || telaBoasVindas;

  el.innerHTML = '<div class="onb">' + stepper(o) + '<div class="onbc">' + tela(o) + '</div></div>';
  ligarTela(o);
  revelar(el);
}

/* ── progresso ── */
function stepper(o){
  const emPrefs = o.estado === 'PROFILE_IN_REVIEW' && (o.subpasso === 'avisos' || o.subpasso === 'consentimentos');
  const atual = ONB_PASSOS.findIndex(p => p.estados.includes(o.estado) || (p.id === 'prefs' && emPrefs));
  const idx = emPrefs ? 3 : Math.max(0, atual);
  return '<ol class="stp" aria-label="Etapas do cadastro">' + ONB_PASSOS.map((p, i) =>
    '<li class="' + (i < idx ? 'ok' : i === idx ? 'on' : '') + '"><i></i><span>' + p.rot + '</span></li>'
  ).join('') + '</ol>';
}

/* ── 1 · boas-vindas ── */
function telaBoasVindas(o){
  return '<div class="onbg">' +
    '<div class="onbm">' +
      '<span class="selo"><i></i>conta criada</span>' +
      '<h1>Seu perfil, do seu jeito.</h1>' +
      '<p class="lead">Crie seu perfil para encontrar oportunidades compatíveis com sua ' +
      'experiência e com o jeito como você quer trabalhar. Você decide quais informações ' +
      'ficam visíveis para as empresas.</p>' +
      '<div class="tres">' +
        card3(I.doc, 'Importe ou preencha', 'Suba seu currículo e a gente organiza. Ou preencha à mão, se preferir.') +
        card3(I.al, 'Nada vai sem você ver', 'O que a gente entender do seu currículo é sugestão. Só entra no seu perfil o que você confirmar.') +
        card3(I.spark, 'Vagas explicadas', 'Cada vaga mostra por que combina com você, em três dimensões, com o motivo por escrito.') +
      '</div>' +
      '<button class="btn" data-onb="comecar">Começar</button>' +
      '<p class="mini">Nome e foto do seu login servem só para a interface. Não entram no cálculo ' +
      'de compatibilidade: a política que rege o match proíbe.</p>' +
    '</div>' +
    lateral(o) +
  '</div>';
}
const card3 = (ic, t, d) => '<div class="c3"><span class="ic">' + ic + '</span><b>' + t + '</b><p>' + d + '</p></div>';

/* ── 2 · como você quer começar ── */
function telaEscolha(o){
  return '<div class="onbg"><div class="onbm">' +
    '<h1>Como você quer começar?</h1>' +
    '<p class="lead">Os dois caminhos chegam ao mesmo lugar: um perfil que você revisa antes de ' +
    'qualquer empresa ver.</p>' +
    '<div class="dois">' +
      '<button class="cx" data-onb="fonte" data-fonte="import">' +
        '<span class="ic">' + I.doc + '</span>' +
        '<b>Importar meu currículo</b>' +
        '<p>Envie seu currículo e nós organizaremos as informações para você revisar. Nada ' +
        'será publicado antes da sua confirmação.</p>' +
        '<span class="fmt">DOCX · TXT · MD</span>' +
      '</button>' +
      '<button class="cx" data-onb="fonte" data-fonte="manual">' +
        '<span class="ic">' + I.pes + '</span>' +
        '<b>Preencher manualmente</b>' +
        '<p>Você escolhe sua área, suas competências e como quer trabalhar. Leva uns cinco ' +
        'minutos e dá para importar o currículo depois.</p>' +
        '<span class="fmt">sem arquivo</span>' +
      '</button>' +
    '</div>' +
  '</div>' + lateral(o) + '</div>';
}

/* ── 3 · upload ── */
function telaUpload(o){
  return '<div class="onbg"><div class="onbm">' +
    '<button class="volta" data-onb="voltarEscolha">' + I.volta + 'Outro caminho</button>' +
    '<h1>Envie seu currículo</h1>' +
    '<p class="lead">Aceito DOCX, TXT e MD. O arquivo fica só no seu navegador: nesta ' +
    'versão, nada sai daqui.</p>' +
    '<label class="drop" id="drop">' +
      '<input type="file" id="arq" accept=".docx,.txt,.md,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document">' +
      '<span class="ic">' + I.doc + '</span>' +
      '<b>Arraste o arquivo aqui ou clique para escolher</b>' +
      '<span>até 8 MB</span>' +
    '</label>' +
    '<details class="alt"><summary>Prefere colar o texto?</summary>' +
      '<textarea id="colado" rows="8" placeholder="Cole aqui o conteúdo do seu currículo"></textarea>' +
      '<button class="btn sm" data-onb="colar">Usar este texto</button></details>' +
    '<details class="alt"><summary>Se quiser começar do zero: modelo em Markdown</summary>' +
      '<p class="mini">Markdown é o formato que a extração lê com mais precisão, porque os ' +
      'títulos dizem o que cada parte é. Não é exigência: qualquer formato serve.</p>' +
      '<pre class="modelo" id="modeloMd">' + esc(MODELO_MD) + '</pre>' +
      '<button class="btn g sm" data-onb="copiarModelo">Copiar modelo</button></details>' +
  '</div>' + lateral(o) + '</div>';
}

/* ── 4 · análise ── */
function telaAnalise(o){
  const a = o.arquivo;
  return '<div class="onbg"><div class="onbm">' +
    '<h1>Lendo seu currículo</h1>' +
    '<p class="lead">' + (a ? esc(a.nome) + ' · ' + kb(a.tamanho) : 'texto colado') + '</p>' +
    '<ol class="etapas" id="etapasAn">' +
      '<li data-et="ler"><i></i>Abrindo o arquivo</li>' +
      '<li data-et="texto"><i></i>Extraindo o texto</li>' +
      '<li data-et="catalogo"><i></i>Procurando competências no catálogo</li>' +
      '<li data-et="montar"><i></i>Montando o pré-cadastro</li>' +
    '</ol>' +
  '</div>' + lateral(o) + '</div>';
}

/* ── 4b · falha ── */
function telaFalha(o){
  const f = o.falha || {msg:'Não consegui ler o arquivo.', motivo:'formato'};
  const saidas = {
    ilegivel: 'Cole o texto do currículo, ou exporte em DOCX que a leitura é mais confiável.',
    formato:  'Confira se o arquivo é DOCX, TXT ou MD. PDF não é aceito nesta versão.',
    tamanho:  'Um currículo raramente passa de 1 MB. Vale conferir se o arquivo certo foi escolhido.',
    vazio:    'Se o currículo é uma imagem escaneada, o texto não está acessível. Cole o conteúdo, ou preencha à mão.',
  };
  return '<div class="onbg"><div class="onbm">' +
    '<div class="estado" style="padding:var(--s4) 0 var(--s3);text-align:left;max-width:none">' +
      '<div class="ic" style="margin:0 0 var(--s2);background:var(--al-bg);color:var(--al)">' + I.al + '</div>' +
      '<h3>Não deu para montar o perfil a partir deste arquivo.</h3>' +
      '<p>' + esc(f.msg) + '</p>' +
      '<p><b>O que fazer:</b> ' + esc(saidas[f.motivo] || saidas.formato) + '</p>' +
    '</div>' +
    '<div style="display:flex;gap:9px;flex-wrap:wrap">' +
      '<button class="btn" data-onb="tentarDeNovo">Enviar outro arquivo</button>' +
      '<button class="btn g" data-onb="fonte" data-fonte="manual">Preencher à mão</button>' +
    '</div>' +
    '<details class="alt" open><summary>Colar o texto do currículo</summary>' +
      '<textarea id="colado" rows="8" placeholder="Cole aqui o conteúdo"></textarea>' +
      '<button class="btn sm" data-onb="colar">Usar este texto</button></details>' +
  '</div>' + lateral(o) + '</div>';
}

/* ── 5 · encontrado ── */
function telaEncontrado(o){
  const s = o.sug;
  const n = s.competencias.length;
  return '<div class="onbg"><div class="onbm">' +
    '<span class="selo"><i></i>leitura concluída</span>' +
    '<h1>Encontrei ' + n + (n === 1 ? ' competência' : ' competências') + ' no seu currículo.</h1>' +
    '<p class="lead">Isto é o que eu entendi. Nada está confirmado ainda: na próxima tela você ' +
    'revisa cada item, corrige o que estiver errado e tira o que não fizer sentido.</p>' +
    '<div class="achados">' +
      achado('Área provável', s.areaId ? AREA[s.areaId].n : 'não identifiquei', !!s.areaId) +
      achado('Cargos citados', s.cargos.length ? s.cargos.map(id => CARGO[id].n).join(', ') : 'nenhum do catálogo', s.cargos.length > 0) +
      achado('Onde você está', s.uf || 'não identifiquei', !!s.uf) +
      achado('Experiência', s.anos ? s.anos + ' anos' : 'não identifiquei', !!s.anos) +
      achado('Resumo', s.resumo ? 'encontrei um parágrafo' : 'não encontrei', !!s.resumo) +
      achado('Texto lido', s.palavras + ' palavras', true) +
    '</div>' +
    '<button class="btn" data-onb="revisar">Revisar meu perfil</button>' +
  '</div>' + lateral(o) + '</div>';
}
const achado = (r, v, ok) => '<div class="ach' + (ok ? '' : ' nao') + '"><span>' + r + '</span><b>' + esc(v) + '</b></div>';

/* ── 6 · revisão por blocos ── */
function telaRevisao(o){
  if(o.subpasso === 'avisos') return telaAvisos(o);
  if(o.subpasso === 'consentimentos') return telaConsentimentos(o);
  const r = o.rev;
  const pend = o.estado === 'PROFILE_INCOMPLETE' ? pendenciasDaRevisao(r) : [];
  const deDoc = o.fonte === 'import';

  return '<div class="onbg"><div class="onbm">' +
    '<h1>Revise seu perfil</h1>' +
    '<p class="lead">' + (deDoc
      ? 'O que está marcado como <b>do currículo</b> é o que eu entendi do arquivo. Confirme, ajuste ou tire. O resto é com você.'
      : 'Escolha sua área, suas competências e como você quer trabalhar. Nada aqui é obrigatório ser perfeito: dá para ajustar depois.') + '</p>' +
    (pend.length ? '<div class="pend">' + I.al + '<div><b>Falta pouco.</b> Para confirmar, preencha: ' + esc(pend.join(', ')) + '.</div></div>' : '') +

    bloco('area', 'Área e cargos', o,
      '<div class="chips" style="margin:0 0 10px">' + AREAS.map(a =>
        '<button class="chip" data-area="' + a.id + '" aria-pressed="' + (r.areaId === a.id) + '">' + esc(a.n) + '</button>').join('') + '</div>' +
      '<p class="hint">Cargos que você busca' + (r.areaId ? ' em ' + esc(AREA[r.areaId].n) : '') + ':</p>' +
      '<div class="chips" id="cargosBox" style="margin:0">' + chipsCargos(r) + '</div>') +

    bloco('competencias', 'Competências', o,
      '<p class="hint">Clique no nível para alternar. ' + (deDoc ? 'O trecho embaixo de cada uma é de onde tirei.' : 'Adicione do catálogo, na busca abaixo.') + '</p>' +
      '<div class="cmps" id="cmpsBox">' + listaComps(r) + '</div>' +
      '<div class="tagin" style="margin-top:10px"><input id="buscaCmp" placeholder="Adicionar competência do catálogo" aria-label="Buscar competência" autocomplete="off"></div>' +
      '<div class="sugt" id="sugCmp"></div>') +

    bloco('resumo', 'Sobre você', o,
      '<textarea id="resumoTx" rows="4" placeholder="Duas ou três frases: o que você faz, há quanto tempo, o que busca agora">' + esc(r.resumo || '') + '</textarea>' +
      '<div class="dupla" style="margin-top:10px"><div class="fg"><label for="anosIn">Anos de experiência</label>' +
      '<input id="anosIn" type="number" min="0" max="45" value="' + (r.anos ?? '') + '"></div></div>') +

    bloco('contexto', 'Onde e como você trabalha', o,
      '<div class="dupla"><div class="fg"><label for="ufSel">Estado</label><select id="ufSel">' +
        '<option value="">escolher</option>' + Object.entries(UFS).sort((a, b) => a[1].localeCompare(b[1])).map(([n, s]) =>
        '<option value="' + s + '"' + (r.uf === s ? ' selected' : '') + '>' + s + ' · ' + n.replace(/\b\w/g, c => c.toUpperCase()) + '</option>').join('') + '</select></div>' +
      '<div class="fg"><label for="pretIn">Pretensão mensal (R$)</label><input id="pretIn" type="number" min="0" step="100" value="' + (r.pretensao ?? '') + '" placeholder="opcional"></div></div>' +
      '<p class="hint" style="margin-top:10px">Modelos que você aceita:</p>' +
      '<div class="checks">' + ['presencial', 'hibrido', 'remoto'].map(m =>
        '<label class="check"><input type="checkbox" data-modelo="' + m + '"' + (r.modelos.includes(m) ? ' checked' : '') + '> ' + ROT_MODELO_ONB[m] + '</label>').join('') + '</div>') +

    '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:var(--s3)">' +
      '<button class="btn" data-onb="paraPrefs">Continuar</button>' +
      (deDoc ? '<button class="btn g" data-onb="tentarDeNovo">Enviar outro currículo</button>' : '') +
    '</div>' +
  '</div>' + lateral(o) + '</div>';
}

function bloco(id, titulo, o, corpo){
  const vis = o.visivel[id] !== false;
  const deDoc = o.fonte === 'import' && ['area', 'competencias', 'resumo', 'contexto'].includes(id);
  return '<section class="blk" data-blk="' + id + '">' +
    '<header><h3>' + titulo + '</h3>' +
      (deDoc ? '<span class="prov document"><i></i>do currículo</span>' : '') +
      '<label class="vis" title="Empresas veem este bloco?"><input type="checkbox" data-vis="' + id + '"' + (vis ? ' checked' : '') + '>' +
      '<span>' + (vis ? 'visível para empresas' : 'só você vê') + '</span></label>' +
    '</header>' + corpo + '</section>';
}
function chipsCargos(r){
  const lista = r.areaId ? cargosDaArea(r.areaId) : [];
  if(!lista.length) return '<span class="hint">Escolha uma área para ver os cargos.</span>';
  return lista.map(c => '<button class="chip" data-cargo="' + c.id + '" aria-pressed="' + r.cargos.includes(c.id) + '">' +
    esc(c.n) + ' <small>' + SEN_ROT[c.sen] + '</small></button>').join('');
}
function listaComps(r){
  if(!r.competencias.length) return '<p class="hint" style="margin:6px 0">Nenhuma ainda. Busque no catálogo abaixo.</p>';
  return r.competencias.map((c, i) =>
    '<div class="cmp' + (c.ok ? '' : ' off') + '" data-i="' + i + '">' +
      '<button class="okb" data-cok="' + i + '" aria-pressed="' + c.ok + '" aria-label="' + (c.ok ? 'Confirmada' : 'Removida') + '">' + (c.ok ? I.ok : I.x) + '</button>' +
      '<div class="cmpi"><b>' + esc(skillNome(c.skillId)) + '</b>' +
        (c.evidencia ? '<q>' + esc(c.evidencia) + '</q>' : '') + '</div>' +
      '<button class="nvbt" data-cniv="' + i + '">' + NIVEIS[c.nivel - 1] + '</button>' +
      '<span class="prov ' + c.de + '"><i></i>' + (c.de === 'document' ? 'currículo' : 'você') + '</span>' +
    '</div>').join('');
}
function slidersEixos(r){
  const grupos = {};
  EIXOS.forEach(e => (grupos[e.grupo] = grupos[e.grupo] || []).push(e));
  return Object.entries(grupos).map(([g, lista]) =>
    '<div class="axis-group-title">' + g + '</div>' + lista.map(e =>
      '<div class="slider"><div class="top"><b>' + esc(e.nome) + '</b><span id="rl-' + e.id + '">' + rotuloEixo(e, r.eixos[e.id]) + '</span></div>' +
      '<input type="range" min="0" max="100" value="' + r.eixos[e.id] + '" data-eixo="' + e.id + '" aria-label="' + esc(e.nome) + '">' +
      '<div class="polos"><span>' + esc(e.poloA) + '</span><span>' + esc(e.poloB) + '</span></div></div>').join('')
  ).join('');
}
const rotuloEixo = (e, v) => v < 35 ? e.poloA : v > 65 ? e.poloB : 'equilibrado';

/* ── 7 · preferências e consentimentos ──
   Duas páginas curtas em vez de uma tela longa: avisos primeiro (rápido,
   sem risco), autorização de dado depois (a parte que exige leitura). A
   pessoa nunca decide as duas coisas na mesma rolagem. */
const PAG_PREFS = {avisos: 1, consentimentos: 2};
function paginaPrefs(subpasso, titulo){
  return '<div class="pgprefs"><span>Página ' + PAG_PREFS[subpasso] + ' de 2</span><b>' + titulo + '</b></div>';
}

function telaAvisos(o){
  const c = o.consent;
  return '<div class="onbg"><div class="onbm">' +
    '<button class="volta" data-onb="voltarBlocos">' + I.volta + 'Voltar à revisão</button>' +
    paginaPrefs('avisos', 'Como avisar você') +
    '<h1>Quer que a gente te avise?</h1>' +
    '<p class="lead">Isso é sobre notificação, não sobre dado. A próxima página é a que autoriza ' +
    'o uso do seu perfil.</p>' +
    '<section class="blk">' +
      '<label class="check"><input type="checkbox" data-cons="avisos"' + (c.avisos ? ' checked' : '') + '>' +
      '<span>Avisar no WhatsApp ou e-mail quando entrar uma vaga com aderência acima de 75% ' +
      'com o meu perfil</span></label>' +
      '<p class="hint" style="margin-top:10px">Dá para desligar quando quiser, na tela do seu perfil.</p>' +
    '</section>' +
    '<button class="btn" data-onb="paraConsentimentos">Continuar</button>' +
  '</div>' + lateral(o) + '</div>';
}

function telaConsentimentos(o){
  const c = o.consent, r = o.rev;
  const nConf = r.competencias.filter(x => x.ok).length;
  const vis = Object.entries(o.visivel).filter(([, v]) => v).map(([k]) => ({area:'área e cargos', competencias:'competências', resumo:'sobre você', contexto:'onde e como trabalha'}[k])).filter(Boolean);
  return '<div class="onbg"><div class="onbm">' +
    '<button class="volta" data-onb="voltarAvisos">' + I.volta + 'Voltar</button>' +
    paginaPrefs('consentimentos', 'Autorização de dado') +
    '<h1>O que você está autorizando</h1>' +
    '<p class="lead">Três autorizações, uma por vez. As duas primeiras são exigidas para o ' +
    'perfil funcionar; a terceira é opcional e você decide.</p>' +

    '<section class="blk">' +
      consentimento('termos', c.termos,
        'Li os termos de uso e a política de privacidade da Conectaria, e concordo com eles.',
        'necessário') +
      consentimento('compartilhar', c.compartilhar,
        'Autorizo enviar meu perfil confirmado para as empresas das vagas em que eu me ' +
        'candidatar. Só vão os blocos que eu marquei como visíveis na revisão, o resto fica ' +
        'só comigo.',
        'necessário') +
      consentimento('retencao', c.retencao,
        'Autorizo guardar meu perfil por 12 meses depois da minha última atividade, para eu ' +
        'não ter que montar tudo de novo se eu voltar. Posso revogar essa autorização a ' +
        'qualquer momento, na tela do meu perfil, sem precisar justificar.',
        'opcional') +
    '</section>' +

    '<div class="lgpdInfo">' + I.al +
      '<p>Você pode pedir para ver, corrigir ou apagar seu perfil quando quiser, e pode pedir ' +
      'revisão humana de qualquer recomendação automática feita sobre você. Cada recomendação ' +
      'da Conectaria já vem com o motivo por escrito: é o botão <b>ver o trace</b>, em toda ' +
      'vaga.</p>' +
    '</div>' +

    '<section class="blk resumoFinal"><header><h3>O que vai ser confirmado</h3></header>' +
      '<div class="linha"><span>Área</span><b>' + (r.areaId ? esc(AREA[r.areaId].n) : 'sem área') + '</b></div>' +
      '<div class="linha"><span>Cargos</span><b>' + (r.cargos.length ? r.cargos.map(id => esc(CARGO[id].n)).join(', ') : 'nenhum') + '</b></div>' +
      '<div class="linha"><span>Competências confirmadas</span><b>' + nConf + '</b></div>' +
      '<div class="linha"><span>Local e modelo</span><b>' + esc(r.uf || 'sem UF') + ' · ' + (r.modelos.map(m => ROT_MODELO_ONB[m]).join(', ') || 'sem modelo') + '</b></div>' +
      '<div class="linha"><span>Visível para empresas</span><b>' + (vis.join(', ') || 'nada') + '</b></div>' +
    '</section>' +

    '<button class="btn w" data-onb="confirmar" id="btConfirmar"' + (c.termos && c.compartilhar ? '' : ' disabled') + '>Confirmar meu perfil</button>' +
    '<p class="mini" style="text-align:center">Depois disso, o que estava marcado como "do currículo" passa a valer como confirmado por você.</p>' +
  '</div>' + lateral(o) + '</div>';
}
const consentimento = (id, on, txt, tipo) =>
  '<label class="check cons"><input type="checkbox" data-cons="' + id + '"' + (on ? ' checked' : '') + '>' +
  '<span>' + txt + ' <em class="' + tipo + '">' + tipo + '</em></span></label>';

/* ── 8 · elegibilidade e recomendações ── */
function telaElegibilidade(o){
  const fits = VAGAS.map(v => ({v, m: M(v)})).sort((a, b) => b.m.total - a.m.total);
  const acima = fits.filter(x => x.m.total >= 60).length;
  const top = fits.slice(0, 3);
  return '<div class="onbg"><div class="onbm">' +
    '<span class="selo"><i></i>perfil confirmado</span>' +
    '<h1>' + acima + ' das ' + VAGAS.length + ' vagas abertas têm aderência acima de 60% com você.</h1>' +
    '<p class="lead">Estas são as três mais próximas. Cada uma mostra o motivo por dentro, e dá ' +
    'para ajustar seu perfil a qualquer momento.</p>' +
    '<div class="vagas" style="margin:var(--s3) 0">' + top.map(({v, m}) => {
      const e = EMPRESAS[v.emp];
      const ev = [...m.tecnico.evidencias, ...m.cultural.evidencias].find(x => x.kind === 'strength');
      return '<article class="vaga rv"><button class="stretch" data-v="' + v.id + '" aria-label="Abrir ' + esc(v.cargo) + '"></button>' +
        '<div class="conteudo"><div class="vtopo">' + logo(v.emp) + '<b>' + esc(e.n) + '</b></div>' +
        '<h3>' + esc(v.cargo) + '</h3>' +
        '<div class="vmeta"><span>' + esc(v.local) + '</span><span class="vfaixa">' + esc(v.faixa) + '</span></div>' +
        (ev ? '<p class="hint" style="margin:8px 0 0">' + esc(ev.humano) + '</p>' : '') +
        '</div><div class="vdir">' + medidor(m.total, m.confidence) + '</div></article>';
    }).join('') + '</div>' +
    '<button class="btn" data-onb="verVagas">Ver todas as vagas</button>' +
  '</div>' + lateral(o) + '</div>';
}

/* ── 9 · pronto (quem volta aqui depois) ── */
function telaPronto(o){
  const c = S.cand;
  return '<div class="onbg"><div class="onbm">' +
    '<h1>Seu perfil está completo.</h1>' +
    '<p class="lead">' + (c.areaId ? esc(AREA[c.areaId].n) + ' · ' : '') + c.competencias.length + ' competências confirmadas · ' + esc(c.uf.value) + '</p>' +
    '<div style="display:flex;gap:9px;flex-wrap:wrap">' +
      '<button class="btn" data-onb="verVagas">Ver vagas</button>' +
      '<button class="btn g" data-n="tags">Editar meu perfil</button>' +
      '<button class="btn g" data-onb="reimportar">Importar outro currículo</button>' +
    '</div>' +
  '</div>' + lateral(o) + '</div>';
}

/* ── painel lateral: o perfil enquanto ele é montado ── */
function lateral(o){
  const r = o.rev;
  let conf = null, nConf = 0, nDoc = 0;
  if(r){
    nConf = r.competencias.filter(c => c.ok).length;
    nDoc = r.competencias.filter(c => c.ok && c.de === 'document').length;
    // estimativa honesta: o que veio do documento e ainda não foi confirmado pesa 0,7
    const pesos = r.competencias.filter(c => c.ok).map(c => c.de === 'document' ? .7 : 1);
    conf = pesos.length ? pesos.reduce((a, b) => a + b, 0) / pesos.length : null;
  }
  const vis = Object.values(o.visivel).filter(Boolean).length;
  return '<aside class="onbl"><div class="box">' +
    '<h4>' + I.spark + ' Seu perfil até agora</h4>' +
    '<div class="linha"><span>Origem</span><b>' + (o.fonte === 'import' ? 'currículo' : o.fonte === 'manual' ? 'preenchido' : 'a definir') + '</b></div>' +
    (r ? '<div class="linha"><span>Competências</span><b id="lnComp">' + nConf + (nDoc ? ' <small>(' + nDoc + ' do currículo)</small>' : '') + '</b></div>' : '') +
    (r ? '<div class="linha"><span>Blocos visíveis</span><b id="lnVis">' + vis + ' de ' + Object.keys(o.visivel).length + '</b></div>' : '') +
    (conf !== null ? '<div class="linha"><span>Confiança estimada</span><b id="lnConfOnb">' + pc(conf) + '</b></div>' : '') +
    '<p class="porque">' + (o.estado === 'PROFILE_CONFIRMED' || o.estado === 'MATCHING_READY'
      ? 'Tudo que você confirmou vale com peso total. O que a empresa vê é só o que você marcou como visível.'
      : 'Dado que veio do currículo pesa 0,7 até você confirmar; confirmado, pesa 1. É esse peso que decide se a empresa vê seu perfil completo.') + '</p>' +
  '</div></aside>';
}

/* ── comportamento ── */
function ligarTela(o){
  const raiz = $('#v-triagem');

  // ações por data-onb
  $$('[data-onb]', raiz).forEach(b => b.onclick = () => acaoOnb(b.dataset.onb, b));

  // upload
  const arq = $('#arq', raiz);
  if(arq){
    arq.onchange = () => { if(arq.files[0]) processarArquivo(arq.files[0]); };
    const drop = $('#drop', raiz);
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if(f) processarArquivo(f); });
  }

  // revisão: edições
  if(o.rev && o.estado !== 'PROFILE_CONFIRMED'){
    const r = o.rev;
    $$('[data-area]', raiz).forEach(b => b.onclick = () => {
      r.areaId = r.areaId === b.dataset.area ? null : b.dataset.area;
      r.cargos = r.cargos.filter(id => CARGO[id].a === r.areaId);
      $$('[data-area]', raiz).forEach(x => x.setAttribute('aria-pressed', x.dataset.area === r.areaId));
      const cb = $('#cargosBox', raiz); if(cb) cb.innerHTML = chipsCargos(r);
      ligarCargos(raiz, r); salvar();
    });
    ligarCargos(raiz, r);
    ligarComps(raiz, r);
    const tx = $('#resumoTx', raiz); if(tx) tx.oninput = () => { r.resumo = tx.value.slice(0, 900); salvar(); };
    const an = $('#anosIn', raiz); if(an) an.oninput = () => { r.anos = an.value === '' ? null : Math.max(0, Math.min(45, +an.value)); salvar(); };
    const uf = $('#ufSel', raiz); if(uf) uf.onchange = () => { r.uf = uf.value; salvar(); };
    const pr = $('#pretIn', raiz); if(pr) pr.oninput = () => { r.pretensao = pr.value === '' ? null : +pr.value; salvar(); };
    $$('[data-modelo]', raiz).forEach(cb => cb.onchange = () => {
      r.modelos = ['presencial', 'hibrido', 'remoto'].filter(m => $('[data-modelo="' + m + '"]', raiz).checked); salvar();
    });
    $$('[data-eixo]', raiz).forEach(sl => sl.oninput = () => {
      r.eixos[sl.dataset.eixo] = +sl.value; r.eixosTocados = true;
      $('#rl-' + sl.dataset.eixo, raiz).textContent = rotuloEixo(EIXO[sl.dataset.eixo], +sl.value);
    });
    $$('[data-eixo]', raiz).forEach(sl => sl.onchange = salvar);
    $$('[data-vis]', raiz).forEach(cb => cb.onchange = () => {
      o.visivel[cb.dataset.vis] = cb.checked;
      cb.nextElementSibling.textContent = cb.checked ? 'visível para empresas' : 'só você vê';
      const lv = $('#lnVis'); if(lv) lv.textContent = Object.values(o.visivel).filter(Boolean).length + ' de ' + Object.keys(o.visivel).length;
      salvar();
    });
    $$('[data-cons]', raiz).forEach(cb => cb.onchange = () => {
      o.consent[cb.dataset.cons] = cb.checked;
      const bt = $('#btConfirmar', raiz); if(bt) bt.disabled = !(o.consent.termos && o.consent.compartilhar);
      salvar();
    });
  }
}
function ligarCargos(raiz, r){
  $$('[data-cargo]', raiz).forEach(b => b.onclick = () => {
    const id = b.dataset.cargo;
    r.cargos = r.cargos.includes(id) ? r.cargos.filter(x => x !== id) : [...r.cargos, id].slice(-3);
    $$('[data-cargo]', raiz).forEach(x => x.setAttribute('aria-pressed', r.cargos.includes(x.dataset.cargo)));
    salvar();
  });
}
function ligarComps(raiz, r){
  const box = $('#cmpsBox', raiz), busca = $('#buscaCmp', raiz), sug = $('#sugCmp', raiz);
  if(!box) return;
  const repintar = () => {
    box.innerHTML = listaComps(r); ligarComps(raiz, r);
    const ln = $('#lnComp'); if(ln){ const ok = r.competencias.filter(c => c.ok); ln.innerHTML = ok.length + (ok.some(c => c.de === 'document') ? ' <small>(' + ok.filter(c => c.de === 'document').length + ' do currículo)</small>' : ''); }
    const lc = $('#lnConfOnb'); if(lc){ const p = r.competencias.filter(c => c.ok).map(c => c.de === 'document' ? .7 : 1); lc.textContent = p.length ? pc(p.reduce((a, b) => a + b, 0) / p.length) : '—'; }
    salvar();
  };
  $$('[data-cok]', box).forEach(b => b.onclick = () => { const c = r.competencias[+b.dataset.cok]; c.ok = !c.ok; if(c.ok && c.de === 'document') c.de = 'user'; repintar(); });
  $$('[data-cniv]', box).forEach(b => b.onclick = () => { const c = r.competencias[+b.dataset.cniv]; c.nivel = c.nivel % 3 + 1; if(c.de === 'document') c.de = 'user'; repintar(); });
  if(busca && !busca._ligado){
    busca._ligado = true;
    const pintaSug = () => {
      const q = normalizar(busca.value.trim());
      const tem = new Set(r.competencias.map(c => c.skillId));
      const lista = SKILLS.filter(k => k.st === 'ativa' && !tem.has(k.id) && (!q || normalizar(k.r).includes(q) || (SINONIMOS[k.id] || []).some(s => s.includes(q)))).slice(0, 8);
      sug.innerHTML = lista.map(k => '<button data-addc="' + k.id + '">+ ' + esc(k.r) + '</button>').join('') ||
        (q ? '<span class="hint">Nada no catálogo com esse termo. Escreva e a curadoria avalia incluir.</span>' : '');
      $$('[data-addc]', sug).forEach(b => b.onclick = () => {
        r.competencias.push({skillId: b.dataset.addc, nivel: 2, de: 'user', ok: true});
        busca.value = ''; pintaSug(); repintar();
      });
    };
    busca.oninput = pintaSug; busca.onfocus = pintaSug;
  }
}

async function acaoOnb(acao, btn){
  const o = S.onb;
  switch(acao){
    case 'comecar': onbIr('ONBOARDING_STARTED'); vTriagem(); break;
    case 'fonte':
      o.fonte = btn.dataset.fonte;
      if(o.fonte === 'manual'){ o.rev = revisaoVazia(); o.subpasso = 'blocos'; onbIr('PROFILE_IN_REVIEW'); }
      else onbIr('SOURCE_SELECTED');
      vTriagem(); break;
    case 'voltarEscolha': o.fonte = null; onbIr('ONBOARDING_STARTED'); vTriagem(); break;
    case 'tentarDeNovo': o.arquivo = null; o.falha = null; o.sug = null; o.fonte = 'import'; onbIr('SOURCE_SELECTED'); vTriagem(); break;
    case 'colar': {
      const tx = ($('#colado') || {}).value || '';
      if(tx.trim().length < 60){ toast('Cole um pouco mais de texto para eu conseguir ler.', I.al); return; }
      o.arquivo = null; await processarTexto(tx); break;
    }
    case 'copiarModelo':
      try{ await navigator.clipboard.writeText(MODELO_MD); toast('Modelo copiado.'); }catch(_){ toast('Não consegui copiar. Selecione o texto e copie manualmente.', I.al); }
      break;
    case 'revisar': o.rev = revisaoDeSugestoes(o.sug); o.subpasso = 'blocos'; onbIr('PROFILE_IN_REVIEW'); vTriagem(); break;
    case 'paraPrefs': {
      const pend = pendenciasDaRevisao(o.rev);
      if(pend.length){ onbIr('PROFILE_INCOMPLETE'); vTriagem(); scrollTo({top: 0, behavior: 'smooth'}); return; }
      o.subpasso = 'avisos'; onbIr('PROFILE_IN_REVIEW'); vTriagem(); break;
    }
    case 'paraConsentimentos': o.subpasso = 'consentimentos'; onbIr('PROFILE_IN_REVIEW'); vTriagem(); break;
    case 'voltarAvisos': o.subpasso = 'avisos'; onbIr('PROFILE_IN_REVIEW'); vTriagem(); break;
    case 'voltarBlocos': o.subpasso = 'blocos'; onbIr('PROFILE_IN_REVIEW'); vTriagem(); break;
    case 'confirmar': {
      if(!(o.consent.termos && o.consent.compartilhar)) return;
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Confirmando';
      await espera(520);
      o.consent.em = new Date().toISOString();
      S.cand = candidatoDeRevisao(o.rev);
      S.logado = true;
      onbIr('PROFILE_CONFIRMED'); salvar(); vTriagem();
      toast('Perfil confirmado. Agora ele vale com peso total.');
      break;
    }
    case 'verVagas': onbIr('MATCHING_READY'); ir('home'); break;
    case 'reimportar': o.fonte = 'import'; o.arquivo = null; o.sug = null; o.falha = null; onbIr('SOURCE_SELECTED'); vTriagem(); break;
  }
}

/* ── pipeline de extração, com etapas visíveis ── */
async function processarArquivo(arquivo){
  const o = S.onb;
  o.arquivo = {nome: arquivo.name, tamanho: arquivo.size, formato: formatoDe(arquivo)};
  o.fonte = 'import'; o.falha = null;
  onbIr('DOCUMENT_UPLOADED'); vTriagem();
  marcarEtapa('ler'); await espera(380);
  try{
    onbIr('EXTRACTION_PENDING');
    marcarEtapa('texto');
    const {texto} = await lerArquivo(arquivo);
    await espera(320);
    await terminarExtracao(texto);
  }catch(e){ falharExtracao(e); }
}
async function processarTexto(texto){
  const o = S.onb;
  o.fonte = 'import'; o.falha = null; o.arquivo = null;
  onbIr('EXTRACTION_PENDING'); vTriagem();
  marcarEtapa('ler'); await espera(260);
  marcarEtapa('texto'); await espera(260);
  try{ await terminarExtracao(texto); }catch(e){ falharExtracao(e); }
}
async function terminarExtracao(texto){
  const o = S.onb;
  o.texto = texto;
  marcarEtapa('catalogo'); await espera(420);
  o.sug = interpretar(texto);
  marcarEtapa('montar'); await espera(380);
  onbIr('EXTRACTION_READY'); vTriagem();
}
function falharExtracao(e){
  const o = S.onb;
  o.falha = {msg: e.message || 'Não consegui ler o arquivo.', motivo: e.motivo || 'formato'};
  onbIr(e.motivo === 'formato' || e.motivo === 'tamanho' ? 'DOCUMENT_REJECTED' : 'EXTRACTION_FAILED');
  vTriagem();
}
/* Síncrono de propósito: esperar um frame aqui travaria a extração em aba
   de segundo plano, onde requestAnimationFrame não roda. O navegador
   pinta quando puder; o trabalho não depende disso. */
function marcarEtapa(id){
  const li = $('[data-et="' + id + '"]'); if(!li) return;
  $$('#etapasAn li').forEach(x => { if(x.classList.contains('on')){ x.classList.remove('on'); x.classList.add('ok'); } });
  li.classList.add('on');
}
const kb = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
