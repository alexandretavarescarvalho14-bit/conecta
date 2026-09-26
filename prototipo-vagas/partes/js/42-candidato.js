/* ══════════════════ LADO DO CANDIDATO ══════════════════
   Minhas candidaturas mostra a etapa com o mesmo nome que a Conectaria
   usa. Motivo de reprovação não aparece: é anotação interna, feita para
   calibrar o processo, e não foi escrita para ser lida pelo candidato. */

function vMinhas(){
  const c = eu(), el = $('#v-minhas');
  const lista = candidaturasDoCandidato(c.id).sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm));
  if(!lista.length){
    el.innerHTML = '<div class="estado"><div class="ic">' + I.vazio + '</div>' +
      '<h3>Você ainda não se candidatou.</h3>' +
      '<p>Quando se candidatar, o andamento aparece aqui, etapa por etapa.</p>' +
      '<button class="btn" data-ir="vagas">Ver vagas abertas</button></div>';
    return;
  }
  const ativas = lista.filter(a => a.status === 'ativa').length;
  el.innerHTML = '<div class="barra" style="margin-top:var(--s5)"><h2>Minhas candidaturas</h2>' +
    '<p class="cont">' + plural(lista.length, 'candidatura', 'candidaturas') + ' · ' + plural(ativas, 'em andamento', 'em andamento') + '</p></div>' +
    '<div class="cds">' + lista.map(a => {
      const v = vagaPor(a.vagaId), e = empresaPor(v.empresaId);
      const ult = a.historico[a.historico.length - 1];
      const fim = a.status === 'reprovada'
        ? '<p class="expect enc">' + I.al + 'Este processo foi encerrado ' + tempoRel(ult.em) + '. Seu cadastro continua ativo e a equipe pode indicar você para outras vagas.</p>'
        : a.status === 'contratada'
        ? '<p class="expect">' + I.ok + 'Parabéns! A contratação foi confirmada ' + tempoRel(ult.em) + '.</p>'
        : '<p class="expect">' + I.ok + 'Última atualização ' + tempoRel(a.atualizadaEm) + '. A equipe da Conectaria fala com você pelo WhatsApp a cada avanço.</p>';
      return '<div class="cd"><div class="cdtop"><div style="flex:1;min-width:210px">' +
        '<div class="emp">' + logoEmp(e) + '<b>' + esc(e.n) + '</b></div>' +
        '<h3 style="font-size:var(--lg);font-family:var(--d)">' + esc(v.titulo) + '</h3>' +
        '<div class="meta"><span>' + esc(v.local) + '</span><span>' + esc(v.regime) + '</span><span>enviada ' + tempoRel(a.criadaEm) + '</span></div></div>' +
        pillStatus(a) + '</div>' +
        (a.status === 'reprovada' ? '' : '<div class="trilhaw"><div class="trilha">' + ETAPAS.map((n, i) =>
          '<div class="et ' + (i < a.etapa || a.status === 'contratada' ? 'done' : i === a.etapa ? 'now' : '') + '"><i></i>' + esc(n) + '</div>').join('') + '</div></div>') +
        fim +
        '<div style="margin-top:var(--s2);display:flex;gap:9px;flex-wrap:wrap">' +
          '<button class="btn g sm" data-ir="vaga" data-irarg="' + v.id + '">Ver a vaga</button>' +
          '<a class="btn g sm" href="' + WHATS_EQUIPE + '" target="_blank" rel="noopener">Falar com a equipe</a></div>' +
      '</div>';
    }).join('') + '</div>';
}

function vPerfil(){
  const c = eu();
  $('#v-perfil').innerHTML = '<div class="barra" style="margin-top:var(--s5)"><h2>Meu perfil</h2>' +
    '<p class="cont">cadastrado ' + tempoRel(c.criadoEm) + '</p></div>' +
    '<div class="split"><div class="corpo">' +
      '<div class="gv"><h4>Contato</h4>' +
        '<div class="linha"><span>Nome</span><b>' + esc(c.nome) + '</b></div>' +
        '<div class="linha"><span>E-mail</span><b>' + esc(c.email) + '</b></div>' +
        '<div class="linha"><span>WhatsApp</span><b>' + esc(c.whatsapp) + '</b></div></div>' +
      blocoPerfil(c) +
    '</div><aside class="lateral">' +
      '<div class="box"><h4>Manter atualizado</h4><p class="hint">A equipe usa este perfil para indicar você a vagas novas. Quanto mais certo, melhores as indicações.</p>' +
        '<button class="btn w" id="btEditar">Editar perfil</button>' +
        '<button class="btn g w" id="btNovoCv" style="margin-top:8px">Enviar outro currículo</button></div>' +
      '<div class="box"><h4>Seus dados</h4><p class="hint">Você pode apagar seu cadastro e todas as suas candidaturas a qualquer momento.</p>' +
        '<button class="btn g w perigo" id="btApagar">Apagar meu cadastro</button>' +
        '<button class="btn g w" id="btSair" style="margin-top:8px">Sair</button></div>' +
    '</aside></div>';
  $('#btEditar').onclick = editarPerfil;
  $('#btNovoCv').onclick = () => { editarPerfil(); S.cad.passo = 2; salvar(); vCadastro(); };
  $('#btSair').onclick = sairCandidato;
  $('#btApagar').onclick = () => confirmar('Apagar seu cadastro?',
    'Seu perfil e ' + plural(candidaturasDoCandidato(c.id).length, 'candidatura', 'candidaturas') + ' serão apagados. Isso não pode ser desfeito.',
    'Apagar tudo', () => {
      DB.candidaturas = DB.candidaturas.filter(a => a.candidatoId !== c.id);
      DB.candidatos = DB.candidatos.filter(x => x.id !== c.id);
      S.userId = null; salvar(); ir('vagas'); toast('Cadastro e candidaturas apagados.');
    }, true);
}

function sairCandidato(){
  S.userId = null; S.cad = null; S.vagaAlvo = null; salvar();
  ir('vagas'); toast('Você saiu.');
}
