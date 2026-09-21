/* ══════════════════ 20 · EMPRESA · PERFIL ══════════════════

   O cadastro tinha quatro passos: Dados, Cultura, Rotina e perfil,
   Contexto. Os dois do meio pediam os 14 eixos culturais — a mesma
   régua que o candidato responderia do outro lado. Para a primeira
   versão, isso saiu da interface: pede tempo demais para o valor que
   entrega agora, sem gente suficiente usando os dois lados para a
   distância entre eixos significar algo.

   O motor continua calculando o fit cultural por baixo — os eixos da
   empresa ficam no valor com que ela nasce nos dados de exemplo, e os
   do candidato ficam no padrão neutro (ver revisaoVazia() em
   20-estado.js). Reativar é só devolver os dois passos aqui e o bloco
   'ambiente' na revisão do candidato: o dado já tem lugar certo.

   `estado` segue o vocabulário pendente | aprovada | recusada. Um
   cadastro novo nasceria 'pendente' e dependeria da curadoria (admin,
   ainda não construído nesta versão) para virar 'aprovada'. O Grupo
   Aurora já é pré-aprovado, porque é a empresa que toda a demo usa
   desde antes desse campo existir — ver a nota em 12-empresas.js. */

/* Dígito verificador de CNPJ, mod 11. Confirma só que o número está bem
   formado, não que a empresa existe de verdade — por isso o texto na
   tela diz "formato válido", nunca "verificado". Consulta cadastral real
   é integração que este protótipo não tem. */
function validarCNPJ(cnpj){
  const d = String(cnpj || '').replace(/\D/g, '');
  if(d.length !== 14) return false;
  if(/^(\d)\1{13}$/.test(d)) return false; // todos os dígitos iguais: formalmente inválido
  const calc = base => {
    const pesos = base.length === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const soma = base.split('').reduce((a, n, i) => a + (+n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const dv1 = calc(d.slice(0, 12));
  const dv2 = calc(d.slice(0, 12) + dv1);
  return d === d.slice(0, 12) + String(dv1) + String(dv2);
}
function mascararCNPJ(v){
  const d = String(v || '').replace(/\D/g, '').slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

const ESTADO_EMP_ROT = {
  aprovada: ['ok', 'Aprovada'], pendente: ['al', 'Aguardando aprovação'], recusada: ['bl', 'Recusada'],
};

function vPerfil(){
  const e = EMPRESAS.aurora;
  const [classeEstado, rotEstado] = ESTADO_EMP_ROT[e.estado] || ESTADO_EMP_ROT.pendente;
  $('#v-perfil').innerHTML=
  '<div class="barra" style="margin-top:var(--s5)"><h2>Perfil da empresa</h2>'+
    '<p class="cont">'+esc(e.n)+'</p>'+
    '<span class="pill '+classeEstado+'" style="margin-left:auto"><i></i>'+rotEstado+'</span></div>'+
  '<p style="color:var(--i72);max-width:62ch;font-size:var(--md)">Quanto mais preciso esse perfil, '+
  'melhor o match. Cada campo aqui vira dimensão comparável com o perfil de cada pessoa da base.</p>'+
  '<div class="wiz">'+['Dados','Sinais'].map((n,i)=>
    '<span class="wz '+(i===S.empPasso?'on':i<S.empPasso?'ok':'')+'"><b>'+
    (i<S.empPasso?'✓':i+1)+'</b>'+n+'</span>').join('')+'</div>'+
  '<div id="empForm"></div>';
  renderEmpForm();
}
function renderEmpForm(){
  const el=$('#empForm'), e=EMPRESAS.aurora;
  if(S.empPasso===0){
    el.innerHTML='<div class="form">'+
      '<div class="dupla"><div class="fg"><label for="en">Nome fantasia</label>'+
        '<input id="en" value="'+esc(e.n)+'"></div>'+
        '<div class="fg"><label for="rs">Razão social</label>'+
        '<input id="rs" value="'+esc(e.razaoSocial||'')+'"></div></div>'+
      '<div class="dupla"><div class="fg"><label for="cnpj">CNPJ</label>'+
        '<input id="cnpj" value="'+esc(e.cnpj||'')+'" placeholder="00.000.000/0000-00" inputmode="numeric" maxlength="18">'+
        '<p class="hint" id="cnpjHint">Conferimos o formato do dígito verificador. Isso garante que '+
        'o número está bem formado, não que a empresa existe de verdade — não há consulta cadastral '+
        'nesta versão.</p></div>'+
        '<div class="fg"><label for="site">Site</label>'+
        '<input id="site" value="'+esc(e.site||'')+'" placeholder="suaempresa.com.br"></div></div>'+
      '<div class="dupla"><div class="fg"><label for="es">Setor</label>'+
        '<select id="es"><option>Varejo</option><option>Tecnologia</option><option>Saúde</option>'+
        '<option>Indústria</option><option>Serviços</option></select></div>'+
        '<div class="fg"><label for="ep">Porte</label>'+
        '<select id="ep"><option>201 a 1.000 pessoas</option><option>Até 50</option>'+
        '<option>51 a 200</option><option>Acima de 1.000</option></select></div></div>'+
      '<div class="fg"><label for="ed">Em uma frase, o que a empresa faz</label>'+
        '<p class="hint">Essa frase entra na busca por semelhança. Seja concreto: o que vocês '+
        'vendem e para quem.</p>'+
        '<textarea id="ed" rows="3">Rede de nove lojas de material de construção em Pernambuco, com 620 funcionários e foco em pequena reforma residencial.</textarea></div>'+
      '<button class="btn" id="p1" style="justify-self:start">Continuar</button></div>';

    const cnpjIn = $('#cnpj');
    cnpjIn.oninput = () => { cnpjIn.value = mascararCNPJ(cnpjIn.value); };
    $('#p1').onclick=()=>{
      if(!validarCNPJ(cnpjIn.value)){
        toast('CNPJ em formato inválido. Confira os 14 dígitos.', I.al);
        $('#cnpjHint').style.color='var(--bl)';
        cnpjIn.focus();
        return;
      }
      Object.assign(e, {n:$('#en').value.trim()||e.n, razaoSocial:$('#rs').value.trim(),
        cnpj:cnpjIn.value, site:$('#site').value.trim()});
      S.empPasso=1; salvar(); vPerfil();
    };
    return;
  }

  el.innerHTML='<div class="form">'+
    '<div class="fg"><label for="sp">Sinais de que deu certo antes</label>'+
      '<p class="hint">Texto livre, que entra na busca por semelhança. Descreva o perfil de '+
      'quem já rendeu bem por aqui.</p>'+
      '<textarea id="sp" rows="3">Quem se dá bem aqui já trabalhou com operação espalhada em várias unidades e não trava quando o processo ainda não existe.</textarea></div>'+
    '<div class="fg"><label for="dn">Desalinhamentos conhecidos</label>'+
      '<p class="hint">O que costuma dar errado. Filtrar cedo economiza entrevista dos dois lados.</p>'+
      '<textarea id="dn" rows="2">Perfil só corporativo, sem chão de loja, costuma se frustrar nos primeiros meses.</textarea></div>'+
    '<div class="box" style="background:var(--veu2);border-color:var(--ac5)">'+
      '<b style="font-family:var(--d);font-size:var(--md)">O que NÃO fica aqui</b>'+
      '<p style="font-size:var(--sm);color:var(--i72);margin-top:7px">Competência de cargo '+
      'descreve a vaga, e não a empresa. Ela é declarada no anúncio, com peso e '+
      'marcação de obrigatório, e toda vaga sua herda estes eixos sem repetir nada.</p>'+
      '<p style="font-size:var(--sm);color:var(--i72);margin-top:9px">Característica '+
      'protegida também não fica: nome, foto, idade, gênero, raça, estado civil, CEP exato e '+
      'instituição estão na denylist da política e a projeção de features recusa na emissão.</p></div>'+
    '<div style="display:flex;gap:9px"><button class="btn g" id="pv3">Voltar</button>'+
    '<button class="btn" id="salvarE">Salvar perfil da empresa</button></div></div>';
  $('#pv3').onclick=()=>{S.empPasso=0;vPerfil();};
  $('#salvarE').onclick=async()=>{
    const b=$('#salvarE'); b.disabled=true; b.innerHTML='<span class="spin"></span>Salvando';
    await espera(560); S.empSalvo=true; tocar(EMPRESAS.aurora); salvar(); ir('evagas');
    toast('Perfil salvo.');
  };
}
