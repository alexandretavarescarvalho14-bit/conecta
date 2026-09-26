/* ══════════════════ CONECTARIA · VAGAS ══════════════════
   Criar a vaga, ligar a uma empresa e acompanhar. Só vaga "publicada"
   aparece para o candidato; rascunho e pausada ficam só aqui. */

const REGIMES = ['CLT','PJ','CLT ou PJ','Estágio','Temporário','Comissionada','Efetivo (CLT)'];

function vAvagas(){
  const st = S.adm.stVagas;
  const cont = {todas:DB.vagas.length};
  DB.vagas.forEach(v => { cont[v.status] = (cont[v.status] || 0) + 1; });
  const lista = DB.vagas.filter(v => st === 'todas' || v.status === st)
    .sort((a, b) => new Date(b.publicadaEm || b.criadaEm) - new Date(a.publicadaEm || a.criadaEm));

  $('#v-avagas').innerHTML =
  '<div class="barra" style="margin-top:var(--s5)"><h2>Vagas</h2>' +
    '<p class="cont">' + plural(cont.publicada || 0, 'publicada', 'publicadas') + ' no site</p>' +
    '<div class="chips"><button class="btn sm" id="btNovaVaga">Nova vaga</button></div></div>' +
  '<div class="chips" style="margin:0 0 var(--s2)">' + [['publicada','Publicadas'],['rascunho','Rascunhos'],['pausada','Pausadas'],['encerrada','Encerradas'],['todas','Todas']]
    .map(([k, r]) => '<button class="chip" data-stv="' + k + '" aria-pressed="' + (st === k) + '">' + r + ' <small>' + (cont[k] || 0) + '</small></button>').join('') + '</div>' +
  (lista.length ? '<div class="bloco" style="margin-top:0"><div class="tabw"><table class="tab"><thead><tr>' +
    '<th>Vaga</th><th>Situação</th><th>Em processo</th><th>No ar</th><th></th></tr></thead><tbody>' +
    lista.map(v => {
      const e = empresaPor(v.empresaId), P = candidaturasDaVaga(v.id);
      const ativas = P.filter(a => a.status === 'ativa').length;
      return '<tr data-irpip="' + v.id + '"><td><div class="celemp">' + logoEmp(e) + '<div><b>' + esc(v.titulo) + '</b>' +
        '<div class="sub2">' + esc(e.n) + ' · ' + esc(v.local) + '</div></div></div></td>' +
        '<td>' + pillVaga(v.status) + '</td>' +
        '<td>' + ativas + (P.length !== ativas ? ' <small class="sub2">de ' + P.length + '</small>' : '') + '</td>' +
        '<td>' + (v.publicadaEm && v.status !== 'rascunho' ? tempoRel(v.publicadaEm).replace('há ', '') : '—') + '</td>' +
        '<td class="pipAcoes"><button class="btn g sm" data-editvaga="' + v.id + '">Editar</button></td></tr>';
    }).join('') + '</tbody></table></div></div>'
    : '<div class="estado"><div class="ic">' + I.vazio + '</div><h3>Nenhuma vaga aqui.</h3><p>Crie uma vaga nova ou veja outra situação.</p></div>');

  $('#btNovaVaga').onclick = () => { rasc = null; ir('vagaform', null); };
  $$('[data-stv]').forEach(b => b.onclick = () => { S.adm.stVagas = b.dataset.stv; vAvagas(); });
  $$('[data-editvaga]').forEach(b => b.onclick = e => { e.stopPropagation(); rasc = null; ir('vagaform', b.dataset.editvaga); });
  $$('[data-irpip]').forEach(tr => tr.onclick = () => ir('pipeline', tr.dataset.irpip));
}

/* ── formulário ── */
let rasc = null; // rascunho em edição; sobrevive ao modal de "nova empresa"

function vVagaform(id){
  const v = id ? vagaPor(id) : null;
  if(!rasc || rasc._de !== (id || 'nova')){
    rasc = v ? JSON.parse(JSON.stringify(v)) : {id:null, empresaId:'', cargoId:'', areaId:'', titulo:'', local:'', uf:'', modelo:'presencial',
      regime:'CLT', faixa:'A combinar', resumo:'', descricao:'', conectaria:true, status:'rascunho', requisitos:[]};
    rasc._de = id || 'nova'; rasc._erros = [];
  }
  const r = rasc;
  const ufs = Object.entries(UFS).sort((a, b) => a[1].localeCompare(b[1]));
  const fam = familiaDaVaga(r), w = pesosDe(POLITICA_VAGAS, fam);

  $('#v-vagaform').innerHTML =
  '<button class="volta" data-ir="avagas">' + I.volta + 'Vagas</button>' +
  '<div class="barra" style="margin-top:0"><h2>' + (v ? 'Editar vaga' : 'Nova vaga') + '</h2>' +
    (v ? pillVaga(v.status) : '') + '</div>' +
  (r._erros.length ? '<div class="pend" role="alert">' + I.al + '<div><b>Para publicar falta:</b> ' + esc(r._erros.join(', ')) + '.</div></div>' : '') +
  '<div class="split"><div class="corpo form">' +

    '<section class="blk"><header><h3>Empresa e cargo</h3></header>' +
      '<div class="dupla"><div class="fg"><label for="vEmp">Empresa</label><select id="vEmp"><option value="">escolher</option>' +
        [...DB.empresas].sort((a, b) => a.n.localeCompare(b.n)).map(e => '<option value="' + e.id + '"' + (r.empresaId === e.id ? ' selected' : '') + '>' + esc(e.n) + '</option>').join('') +
        '</select><button type="button" class="link" id="vNovaEmp">+ cadastrar empresa nova</button></div>' +
      '<div class="fg"><label for="vArea">Área</label><select id="vArea"><option value="">escolher</option>' +
        areasOrdenadas().map(a => '<option value="' + a.id + '"' + (r.areaId === a.id ? ' selected' : '') + '>' + esc(a.n) + '</option>').join('') + '</select></div></div>' +
      '<div class="dupla"><div class="fg"><label for="vCargo">Cargo</label><select id="vCargo"' + (r.areaId ? '' : ' disabled') + '><option value="">' + (r.areaId ? 'outro, não está na lista' : 'escolha a área antes') + '</option>' +
        (r.areaId ? cargosDaArea(r.areaId).map(c => '<option value="' + c.id + '"' + (r.cargoId === c.id ? ' selected' : '') + '>' + esc(c.n) + ' · ' + SEN_ROT[c.sen] + '</option>').join('') : '') + '</select>' +
        '<p class="hint">O cargo sugere os requisitos e define os pesos do match: técnico ' + pc(w.tecnico) + ', contexto ' + pc(w.contexto) + (fam === '_padrao' ? ' (peso padrão)' : '') + '.</p></div>' +
      '<div class="fg"><label for="vTit">Título do anúncio</label><input id="vTit" value="' + esc(r.titulo) + '" placeholder="Como vai aparecer no site"></div></div>' +
    '</section>' +

    '<section class="blk"><header><h3>Onde e como</h3></header>' +
      '<div class="dupla"><div class="fg"><label for="vLocal">Local</label><input id="vLocal" value="' + esc(r.local) + '" placeholder="Recife, PE"></div>' +
      '<div class="fg"><label for="vUf">Estado</label><select id="vUf"><option value="">escolher</option>' +
        '<option value="BR"' + (r.uf === 'BR' ? ' selected' : '') + '>Remoto, Brasil todo</option>' +
        '<option value="EX"' + (r.uf === 'EX' ? ' selected' : '') + '>Exterior</option>' +
        ufs.map(([n, s]) => '<option value="' + s + '"' + (r.uf === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select></div></div>' +
      '<div class="dupla"><div class="fg"><label for="vMod">Modelo</label><select id="vMod">' +
        Object.entries(MODELO_ROT).map(([k, n]) => '<option value="' + k + '"' + (r.modelo === k ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div>' +
      '<div class="fg"><label for="vReg">Contratação</label><input id="vReg" list="regimes" value="' + esc(r.regime) + '">' +
        '<datalist id="regimes">' + REGIMES.map(x => '<option value="' + esc(x) + '">').join('') + '</datalist></div></div>' +
      '<div class="fg"><label for="vFaixa">Remuneração</label><input id="vFaixa" value="' + esc(r.faixa) + '" placeholder="R$ 3.000 a R$ 4.000, ou A combinar">' +
        '<p class="hint" id="vFaixaHint">' + hintFaixa(r.faixa) + '</p></div>' +
    '</section>' +

    '<section class="blk"><header><h3>Anúncio</h3></header>' +
      '<div class="fg"><label for="vRes">Resumo</label><input id="vRes" maxlength="200" value="' + esc(r.resumo) + '" placeholder="Uma frase: aparece no card da vaga">' +
        '<p class="hint"><span id="vResN">' + r.resumo.length + '</span> de 200 caracteres.</p></div>' +
      '<div class="fg"><label for="vDesc">Descrição completa</label>' +
        '<button type="button" class="btn g sm" id="vIa" style="justify-self:start;margin-bottom:8px">' + I.spark + (r.descricao ? 'Gerar de novo com IA' : 'Gerar descrição com IA') + '</button>' +
        '<textarea id="vDesc" rows="9" placeholder="Escreva, ou gere um rascunho com IA a partir do que já está preenchido e depois ajuste.">' + esc(r.descricao) + '</textarea>' +
        '<p class="hint">A IA usa empresa, cargo, local, contratação e requisitos. O texto é sempre seu para editar antes de publicar.</p></div>' +
      '<label class="check"><input type="checkbox" id="vConect"' + (r.conectaria ? ' checked' : '') + '> Mostrar o selo "Vaga trabalhada pela Conectaria"</label>' +
    '</section>' +

    '<section class="blk"><header><h3>Requisitos</h3>' +
      (r.cargoId ? '<button type="button" class="btn g sm" id="vSugReq" style="margin-left:auto">Sugerir pelo cargo</button>' : '') + '</header>' +
      '<p class="hint">É com isto que o match compara cada candidato. Obrigatório pesa mais: quem não tem fica com nota limitada.</p>' +
      '<div id="reqBox">' + listaReq(r) + '</div>' +
      '<div class="tagin" style="margin-top:10px"><input id="vBuscaReq" placeholder="Adicionar requisito: negociação, Excel, SAP..." aria-label="Adicionar requisito" autocomplete="off"></div>' +
      '<div class="sugt" id="vSugBox"></div>' +
    '</section>' +

  '</div><aside class="lateral">' +
    '<div class="box vfacoes">' +
      '<button class="btn w" id="vPublicar">' + (v && v.status === 'publicada' ? 'Salvar e manter publicada' : 'Publicar') + '</button>' +
      (!v || v.status === 'rascunho' ? '<button class="btn g w" id="vRascunho">Salvar rascunho</button>' : '') +
      (v ? '<button class="btn g w" id="vPrevia">Ver como o candidato vê</button>' : '') +
      (v && v.status === 'publicada' ? '<button class="btn g w" id="vPausar">Pausar</button>' : '') +
      (v && v.status !== 'encerrada' && v.status !== 'rascunho' ? '<button class="btn g w" id="vEncerrar">Encerrar</button>' : '') +
      (v ? '<button class="btn g w" id="vDuplicar">Duplicar</button>' : '') +
      (v && !candidaturasDaVaga(v.id).length ? '<button class="btn g w perigo" id="vApagar">Apagar</button>' : '') +
      '<button class="btn g w" data-ir="avagas">Cancelar</button>' +
    '</div>' +
    (v ? '<div class="box"><h4>Candidaturas</h4><p class="hint">' + plural(candidaturasDaVaga(v.id).length, 'pessoa', 'pessoas') + ' nesta vaga.</p>' +
      '<button class="btn g sm w" data-irpipv="' + v.id + '">Abrir o processo</button></div>' : '') +
  '</aside></div>';

  ligarVagaform(v);
}

function hintFaixa(txt){
  const t = tetoDaFaixa(txt);
  return t ? 'O match compara a pretensão com ' + brl(t) + ', o maior valor da faixa.' : 'Sem valor: a pretensão do candidato não entra no match.';
}
function listaReq(r){
  if(!r.requisitos.length) return '<p class="hint">Nenhum requisito ainda.</p>';
  return '<div class="reqs">' + r.requisitos.map((q, i) =>
    '<div class="req"><b>' + esc(skillNome(q.skillId)) + '</b>' +
      '<label class="check"><input type="checkbox" data-robrig="' + i + '"' + (q.obrigatorio ? ' checked' : '') + '> obrigatório</label>' +
      '<select data-rpeso="' + i + '" aria-label="Peso de ' + esc(skillNome(q.skillId)) + '">' +
        [1, 2, 3].map(p => '<option value="' + p + '"' + (q.peso === p ? ' selected' : '') + '>peso ' + p + '</option>').join('') + '</select>' +
      '<button type="button" class="btn g sm" data-rtira="' + i + '" aria-label="Tirar ' + esc(skillNome(q.skillId)) + '">' + I.x + '</button></div>').join('') + '</div>';
}

function ligarVagaform(v){
  const r = rasc, raiz = $('#v-vagaform');
  const val = id => $(id, raiz).value;
  const repintarReq = () => { $('#reqBox', raiz).innerHTML = listaReq(r); ligarReq(); };
  const ligarReq = () => {
    $$('[data-robrig]', raiz).forEach(cb => cb.onchange = () => { r.requisitos[+cb.dataset.robrig].obrigatorio = cb.checked; });
    $$('[data-rpeso]', raiz).forEach(s => s.onchange = () => { r.requisitos[+s.dataset.rpeso].peso = +s.value; });
    $$('[data-rtira]', raiz).forEach(b => b.onclick = () => { r.requisitos.splice(+b.dataset.rtira, 1); repintarReq(); });
  };
  ligarReq();

  $('#vEmp', raiz).onchange = e => { r.empresaId = e.target.value; };
  $('#vNovaEmp', raiz).onclick = () => formEmpresa(null, emp => { r.empresaId = emp.id; vVagaform(v ? v.id : null); });
  $('#vArea', raiz).onchange = e => { r.areaId = e.target.value; if(r.cargoId && CARGO[r.cargoId].a !== r.areaId) r.cargoId = ''; vVagaform(v ? v.id : null); };
  $('#vCargo', raiz).onchange = e => {
    r.cargoId = e.target.value;
    if(r.cargoId && !r.titulo.trim()) r.titulo = CARGO[r.cargoId].n;
    if(r.cargoId && !r.requisitos.length) r.requisitos = requisitosDoCargo(r.cargoId);
    vVagaform(v ? v.id : null);
  };
  $('#vTit', raiz).oninput = e => { r.titulo = e.target.value; };
  $('#vLocal', raiz).oninput = e => { r.local = e.target.value; };
  $('#vUf', raiz).onchange = e => { r.uf = e.target.value; if(r.uf === 'BR') r.modelo = 'remoto'; };
  $('#vMod', raiz).onchange = e => { r.modelo = e.target.value; };
  $('#vReg', raiz).oninput = e => { r.regime = e.target.value; };
  $('#vFaixa', raiz).oninput = e => { r.faixa = e.target.value; $('#vFaixaHint', raiz).textContent = hintFaixa(r.faixa); };
  $('#vRes', raiz).oninput = e => { r.resumo = e.target.value; $('#vResN', raiz).textContent = r.resumo.length; };
  $('#vDesc', raiz).oninput = e => { r.descricao = e.target.value; };
  $('#vConect', raiz).onchange = e => { r.conectaria = e.target.checked; };
  const sr = $('#vSugReq', raiz);
  if(sr) sr.onclick = () => {
    const novos = requisitosDoCargo(r.cargoId).filter(q => !r.requisitos.some(x => x.skillId === q.skillId));
    r.requisitos.push(...novos.map(q => ({...q, obrigatorio: q.obrigatorio && !r.requisitos.some(x => x.obrigatorio)})));
    repintarReq(); toast(novos.length ? plural(novos.length, 'requisito sugerido', 'requisitos sugeridos') + ' pelo cargo.' : 'Os requisitos do cargo já estão na lista.');
  };

  const busca = $('#vBuscaReq', raiz), sug = $('#vSugBox', raiz);
  const pinta = () => {
    const q = normalizar(busca.value.trim());
    const tem = new Set(r.requisitos.map(x => x.skillId));
    const base = q ? SKILLS : SKILLS.filter(s => r.areaId && (s.a.includes(r.areaId) || s.tr));
    sug.innerHTML = base.filter(s => s.st === 'ativa' && !tem.has(s.id) &&
      (!q || normalizar(s.r).includes(q) || (SINONIMOS[s.id] || []).some(t => t.includes(q)))).slice(0, 10)
      .map(s => '<button type="button" data-radd="' + s.id + '">+ ' + esc(s.r) + '</button>').join('') ||
      (q ? '<span class="hint">Nada no catálogo com esse termo.</span>' : '');
    $$('[data-radd]', sug).forEach(b => b.onclick = () => {
      r.requisitos.push({skillId:b.dataset.radd, peso:2, obrigatorio:!r.requisitos.length});
      busca.value = ''; pinta(); repintarReq();
    });
  };
  busca.oninput = pinta; busca.onfocus = pinta;

  $('#vIa', raiz).onclick = async () => {
    if(!r.titulo.trim() && !r.cargoId){ toast('Escolha o cargo ou escreva o título antes de gerar.', I.al); $('#vTit', raiz).focus(); return; }
    const b = $('#vIa', raiz); b.disabled = true; b.innerHTML = '<span class="spin"></span>Gerando';
    await espera(650);
    const e = empresaPor(r.empresaId);
    r.descricao = gerarDescricaoVaga(r.titulo || CARGO[r.cargoId].n, r.local, familiaDaVaga(r), {
      empresa: e ? e.n : '', regime: r.regime,
      requisitos: r.requisitos.map(q => skillNome(q.skillId)),
      obrigatorios: r.requisitos.filter(q => q.obrigatorio).map(q => skillNome(q.skillId)),
    });
    if(!r.resumo.trim()){
      const rot = FAMILIA_ROTINA[familiaDaVaga(r)] || FAMILIA_ROTINA['Operações'];
      r.resumo = ((e ? e.n + ' busca ' : 'Vaga de ') + (r.titulo || CARGO[r.cargoId].n) + (r.local ? ' em ' + r.local.split(',')[0].trim() : '') +
        ' para ' + rot[0] + '.').slice(0, 200);
    }
    vVagaform(v ? v.id : null);
    toast('Rascunho gerado. Revise e ajuste antes de publicar.');
  };

  const guardar = status => {
    const faltam = [];
    if(!r.empresaId) faltam.push('empresa');
    if(!r.areaId) faltam.push('área');
    if(!r.titulo.trim()) faltam.push('título');
    if(status === 'publicada'){
      if(!r.local.trim()) faltam.push('local');
      if(!r.uf) faltam.push('estado');
      if(!r.resumo.trim()) faltam.push('resumo');
      if(!r.requisitos.length) faltam.push('ao menos um requisito');
    }
    if(faltam.length){ r._erros = faltam; vVagaform(v ? v.id : null); scrollTo({top:0, behavior:'smooth'}); return; }
    const agora = iso(Date.now());
    const dados = {empresaId:r.empresaId, cargoId:r.cargoId || null, areaId:r.areaId, titulo:r.titulo.trim(), local:r.local.trim(),
      uf:r.uf, modelo:r.modelo, regime:r.regime.trim(), faixa:r.faixa.trim() || 'A combinar', faixaMax:tetoDaFaixa(r.faixa),
      resumo:r.resumo.trim(), descricao:r.descricao.trim() || r.resumo.trim(), conectaria:r.conectaria,
      requisitos:r.requisitos.map(q => ({skillId:q.skillId, peso:q.peso, obrigatorio:q.obrigatorio})), status};
    let alvo;
    if(v){
      alvo = v;
      const mudouMatch = JSON.stringify([v.requisitos, v.uf, v.modelo, v.faixaMax, v.cargoId]) !==
        JSON.stringify([dados.requisitos, dados.uf, dados.modelo, dados.faixaMax, dados.cargoId]);
      Object.assign(v, dados);
      if(status === 'publicada' && !v.publicadaEm) v.publicadaEm = agora;
      if(mudouMatch) tocar(v);
    } else {
      alvo = {id:novoId('v'), criadaEm:agora, publicadaEm:status === 'publicada' ? agora : null, __v:0, ...dados};
      DB.vagas.push(alvo);
    }
    rasc = null; salvar();
    toast(status === 'publicada' ? 'Vaga publicada. Já aparece no site.' : 'Rascunho salvo.');
    ir('avagas');
  };
  $('#vPublicar', raiz).onclick = () => guardar('publicada');
  const rs = $('#vRascunho', raiz); if(rs) rs.onclick = () => guardar('rascunho');
  const pv = $('#vPrevia', raiz); if(pv) pv.onclick = () => ir('vaga', v.id);
  const pa = $('#vPausar', raiz); if(pa) pa.onclick = () => { v.status = 'pausada'; rasc = null; salvar(); toast('Vaga pausada. Saiu do site.'); ir('avagas'); };
  const en = $('#vEncerrar', raiz); if(en) en.onclick = () => confirmar('Encerrar esta vaga?',
    'Ela sai do site. As ' + candidaturasDaVaga(v.id).filter(a => a.status === 'ativa').length + ' candidaturas em andamento continuam no processo para você encerrar uma a uma.',
    'Encerrar vaga', () => { v.status = 'encerrada'; rasc = null; salvar(); toast('Vaga encerrada.'); ir('avagas'); });
  const du = $('#vDuplicar', raiz); if(du) du.onclick = () => {
    rasc = {...JSON.parse(JSON.stringify(v)), id:null, titulo:v.titulo + ' (cópia)', status:'rascunho', _de:'nova', _erros:[]};
    ir('vagaform', null); toast('Cópia criada como rascunho. Ajuste e publique.');
  };
  const apg = $('#vApagar', raiz); if(apg) apg.onclick = () => confirmar('Apagar esta vaga?', 'Ela não tem candidaturas. Isso não pode ser desfeito.', 'Apagar',
    () => { DB.vagas = DB.vagas.filter(x => x.id !== v.id); rasc = null; salvar(); toast('Vaga apagada.'); ir('avagas'); }, true);
  const ap = $('[data-irpipv]', raiz); if(ap) ap.onclick = () => ir('pipeline', v.id);
}
