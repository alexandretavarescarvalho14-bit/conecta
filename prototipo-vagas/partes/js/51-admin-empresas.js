/* ══════════════════ CONECTARIA · EMPRESAS ══════════════════
   A empresa não tem login nesta versão: quem cadastra é a Conectaria.
   CNPJ é opcional; se vier, precisa ter dígito verificador válido, e a
   tela diz "formato válido", nunca "verificado". */

const CORES_EMP = ['#189CCC','#D9822B','#3D7A4A','#6B2A7A','#8A6A4A','#1F5E9E','#2E7D8F','#C0568A','#4A6FD8','#B3382F'];

function vEmpresas(){
  const linhas = [...DB.empresas].sort((a, b) => a.n.localeCompare(b.n)).map(e => {
    const vs = DB.vagas.filter(v => v.empresaId === e.id);
    const pub = vs.filter(v => v.status === 'publicada').length;
    return '<tr data-editemp="' + e.id + '"><td><div class="celemp">' + logoEmp(e) + '<div><b>' + esc(e.n) + '</b>' +
      '<div class="sub2">' + esc(e.setor || 'sem setor') + '</div></div></div></td>' +
      '<td>' + esc(e.cidade || '') + '</td>' +
      '<td>' + pub + (vs.length !== pub ? ' <small class="sub2">de ' + vs.length + '</small>' : '') + '</td>' +
      '<td>' + (e.cnpj ? '<span class="pill ok"><i></i>CNPJ</span>' : '<span class="pill n">sem CNPJ</span>') + '</td></tr>';
  }).join('');
  $('#v-empresas').innerHTML =
  '<div class="barra" style="margin-top:var(--s5)"><h2>Empresas</h2>' +
    '<p class="cont">' + plural(DB.empresas.length, 'empresa parceira', 'empresas parceiras') + '</p>' +
    '<div class="chips"><button class="btn sm" id="btNovaEmp">Nova empresa</button></div></div>' +
  '<div class="bloco" style="margin-top:0"><div class="tabw"><table class="tab"><thead><tr>' +
    '<th>Empresa</th><th>Onde</th><th>Vagas publicadas</th><th>Cadastro</th></tr></thead><tbody>' + linhas + '</tbody></table></div></div>';
  $('#btNovaEmp').onclick = () => formEmpresa(null);
  $$('[data-editemp]').forEach(tr => tr.onclick = () => formEmpresa(tr.dataset.editemp));
}

/* Formulário em modal. `aoSalvar` permite criar a empresa de dentro do
   cadastro de vaga sem perder o que já foi digitado lá. */
function formEmpresa(id, aoSalvar){
  const e = id ? empresaPor(id) : {n:'', setor:'', cidade:'', site:'', cnpj:'', contato:'', obs:''};
  const nVagas = id ? DB.vagas.filter(v => v.empresaId === id).length : 0;
  abrirModal('<h2 id="mTit">' + (id ? 'Editar empresa' : 'Nova empresa') + '</h2>' +
    '<form class="form" id="fEmp" style="gap:var(--s2)" novalidate>' +
      '<div class="logocampo"><span id="eLogoPrev"></span><div>' +
        '<div class="acoesform"><label class="btn g sm" for="eLogoIn" id="eLogoBt">' + (e.logo ? 'Trocar logo' : 'Enviar logo') + '</label>' +
        '<button type="button" class="link" id="eLogoTira"' + (e.logo ? '' : ' hidden') + '>Tirar logo</button></div>' +
        '<input type="file" id="eLogoIn" class="sr" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml">' +
        '<p class="hint" id="eLogoHint">PNG, JPG, WEBP ou SVG, de preferência quadrado. Sem logo, aparecem as iniciais.</p></div></div>' +
      '<div class="fg"><label for="eN">Nome da empresa</label><input id="eN" value="' + esc(e.n) + '"></div>' +
      '<div class="dupla"><div class="fg"><label for="eSetor">Setor</label><input id="eSetor" value="' + esc(e.setor) + '" placeholder="Varejo, Logística..."></div>' +
      '<div class="fg"><label for="eCid">Cidade</label><input id="eCid" value="' + esc(e.cidade) + '" placeholder="Recife, PE"></div></div>' +
      '<div class="dupla"><div class="fg"><label for="eSite">Site</label><input id="eSite" value="' + esc(e.site) + '" placeholder="empresa.com.br"></div>' +
      '<div class="fg"><label for="eCnpj">CNPJ <span class="opc">opcional</span></label><input id="eCnpj" inputmode="numeric" maxlength="18" value="' + esc(e.cnpj) + '" placeholder="00.000.000/0000-00">' +
        '<p class="hint" id="eCnpjHint">Conferimos só o formato do número.</p></div></div>' +
      '<div class="fg"><label for="eCont">Contato na empresa <span class="opc">interno</span></label><input id="eCont" value="' + esc(e.contato) + '" placeholder="Nome, cargo e telefone de quem fala com a Conectaria"></div>' +
      '<div class="fg"><label for="eObs">Observações <span class="opc">interno</span></label><textarea id="eObs" rows="2">' + esc(e.obs) + '</textarea></div>' +
      '<p class="erroform" id="eErroEmp" role="alert"></p>' +
      '<button class="btn w" type="submit">' + (id ? 'Salvar' : 'Cadastrar empresa') + '</button>' +
      (id ? '<button class="btn g w perigo" type="button" id="eApagar"' + (nVagas ? ' disabled title="Tem vagas ligadas"' : '') + '>Apagar empresa</button>' +
        (nVagas ? '<p class="hint" style="text-align:center">Para apagar, encerre e apague as ' + plural(nVagas, 'vaga', 'vagas') + ' dela antes.</p>' : '') : '') +
      '<button class="btn g w" type="button" id="eCancEmp">Cancelar</button></form>');

  let logo = e.logo || null;
  const cor = e.c || CORES_EMP[DB.empresas.length % CORES_EMP.length];
  const pintaLogo = () => {
    $('#eLogoPrev').innerHTML = logoEmp({n:$('#eN').value.trim() || '?', c:cor, logo}, true);
    $('#eLogoBt').textContent = logo ? 'Trocar logo' : 'Enviar logo';
    $('#eLogoTira').hidden = !logo;
  };
  pintaLogo();
  $('#eN').addEventListener('input', () => { if(!logo) pintaLogo(); });
  $('#eLogoIn').onchange = async ev => {
    const f = ev.target.files[0]; ev.target.value = '';
    if(!f) return;
    const h = $('#eLogoHint');
    try{ logo = await reduzirImagem(f); h.textContent = f.name + ' pronto. Salve para aplicar.'; h.style.color = ''; }
    catch(err){ h.textContent = err.message; h.style.color = 'var(--bl)'; }
    pintaLogo();
  };
  $('#eLogoTira').onclick = () => { logo = null; $('#eLogoHint').textContent = 'Logo removido. Salve para aplicar.'; pintaLogo(); };

  const cn = $('#eCnpj');
  cn.oninput = () => {
    cn.value = mascararCNPJ(cn.value);
    const d = soDigitos(cn.value), h = $('#eCnpjHint');
    h.textContent = !d.length ? 'Conferimos só o formato do número.' : d.length < 14 ? 'Faltam ' + (14 - d.length) + ' dígitos.'
      : validarCNPJ(cn.value) ? 'Formato válido.' : 'Os dígitos verificadores não batem. Confira o número.';
    h.style.color = d.length === 14 && !validarCNPJ(cn.value) ? 'var(--bl)' : '';
  };
  $('#eCancEmp').onclick = fecharModal;
  const ap = $('#eApagar');
  if(ap) ap.onclick = () => {
    DB.empresas = DB.empresas.filter(x => x.id !== id); salvar(); fecharModal(); vEmpresas(); toast('Empresa apagada.');
  };
  $('#fEmp').onsubmit = ev => {
    ev.preventDefault();
    const dados = {n:$('#eN').value.trim(), setor:$('#eSetor').value.trim(), cidade:$('#eCid').value.trim(),
      site:$('#eSite').value.trim(), cnpj:cn.value.trim(), contato:$('#eCont').value.trim(), obs:$('#eObs').value.trim(), logo};
    const erro = !dados.n ? 'Escreva o nome da empresa.'
      : DB.empresas.some(x => x.id !== id && normalizar(x.n) === normalizar(dados.n)) ? 'Já existe uma empresa com este nome.'
      : dados.cnpj && !validarCNPJ(dados.cnpj) ? 'CNPJ com formato inválido. Corrija ou deixe em branco.' : '';
    if(erro){ $('#eErroEmp').textContent = erro; return; }
    let emp;
    if(id){ emp = empresaPor(id); Object.assign(emp, dados); }
    else {
      emp = {id:novoId('e'), c:cor, criadaEm:iso(Date.now()), ...dados};
      DB.empresas.push(emp);
    }
    salvar(); fecharModal();
    toast(id ? 'Empresa atualizada.' : 'Empresa cadastrada.');
    if(aoSalvar) aoSalvar(emp); else vEmpresas();
  };
}
