/* ══════════════════ 20 · EMPRESA · PERFIL ══════════════════ */
function vPerfil(){
  $('#v-perfil').innerHTML=
  '<div class="barra" style="margin-top:var(--s5)"><h2>Perfil da empresa</h2>'+
    '<p class="cont">Grupo Aurora</p></div>'+
  '<p style="color:var(--i72);max-width:62ch;font-size:var(--md)">Quanto mais preciso esse perfil, '+
  'melhor o match. Cada campo aqui vira dimensão comparável com o perfil de cada pessoa da base.</p>'+
  '<div class="wiz">'+['Dados','Cultura','Rotina e perfil','Contexto'].map((n,i)=>
    '<span class="wz '+(i===S.empPasso?'on':i<S.empPasso?'ok':'')+'"><b>'+
    (i<S.empPasso?'✓':i+1)+'</b>'+n+'</span>').join('')+'</div>'+
  '<div id="empForm"></div>';
  renderEmpForm();
}
function renderEmpForm(){
  const el=$('#empForm');
  if(S.empPasso===0){
    el.innerHTML='<div class="form">'+
      '<div class="fg"><label for="en">Nome da empresa</label><input id="en" value="Grupo Aurora"></div>'+
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
    $('#p1').onclick=()=>{S.empPasso=1;vPerfil();};
    return;
  }
  if(S.empPasso===3){
    el.innerHTML='<div class="form">'+
      '<div class="fg"><label for="sp">Sinais de que deu certo antes</label>'+
        '<p class="hint">Texto livre, que entra na busca por semelhança. Ele complementa os '+
        'eixos: o texto ajuda a encontrar gente parecida, e o eixo é o que permite medir '+
        'a distância.</p>'+
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
    $('#pv3').onclick=()=>{S.empPasso=2;vPerfil();};
    $('#salvarE').onclick=async()=>{
      const b=$('#salvarE'); b.disabled=true; b.innerHTML='<span class="spin"></span>Salvando';
      await espera(560); S.empSalvo=true; tocar(EMPRESAS.aurora); salvar(); ir('evagas');
      toast('Perfil salvo. Toda vaga sua já herda estes eixos.');
    };
    return;
  }

  const grupo = S.empPasso===1 ? ['Cultura'] : ['Rotina','Perfil'];
  const lista = EIXOS.filter(e=>grupo.includes(e.grupo));
  el.innerHTML='<div class="form">'+
    '<p style="font-size:var(--sm);color:var(--i72)">Responda como a empresa <b>realmente é</b>, '+
    'não como gostaria de ser. O candidato responde exatamente estes eixos, na mesma escala, '+
    'com a pergunta virada para o lado dele, e é assim que dá para medir a distância entre '+
    'os dois.</p>'+
    lista.map(e=>
      '<div class="slider"><div class="top"><b>'+esc(e.nome)+'</b>'+
      '<span id="lb-'+e.id+'"></span></div>'+
      '<input type="range" min="0" max="100" value="'+EMPRESAS.aurora.eixos[e.id].value+'" '+
      'data-c="'+e.id+'" aria-label="'+esc(e.nome)+', de '+esc(e.poloA)+' a '+esc(e.poloB)+'">'+
      '<div class="polos"><span>'+esc(e.poloA)+'</span><span>'+esc(e.poloB)+'</span></div>'+
      '<p style="font-size:var(--xs);color:var(--i34);margin-top:2px">tolerância deste eixo: '+
      e.tolerancia+' pontos</p></div>').join('')+
    '<div class="box" style="background:var(--veu2);border-color:var(--ac5)">'+
      '<b style="font-family:var(--d);font-size:var(--md)">Como isso é lido</b>'+
      '<p style="font-size:var(--sm);color:var(--i72);margin-top:7px" id="leitura"></p></div>'+
    '<div style="display:flex;gap:9px">'+
      '<button class="btn g" id="pvv">Voltar</button>'+
      '<button class="btn" id="pnn">Continuar</button></div></div>';

  const atualizar=()=>{
    lista.forEach(e=>{const v=EMPRESAS.aurora.eixos[e.id].value;
      $('#lb-'+e.id).textContent = v<35?e.poloA:v>65?e.poloB:'equilibrado';});
    const dur = EIXOS.filter(e=>e.tolerancia<=20 && grupo.includes(e.grupo));
    $('#leitura').textContent = dur.length
      ? 'Eixos de baixa tolerância neste bloco: '+dur.map(e=>e.nome).join(', ')+
        '. Distância aqui derruba o fit cultural bem mais rápido que nos outros.'
      : 'Nenhum eixo crítico neste bloco. Distância aqui é mais negociável.';
  };
  $$('[data-c]').forEach(i=>{i.oninput=e=>{
    const id=e.target.dataset.c;
    EMPRESAS.aurora.eixos[id]=sv(Number(e.target.value),'company',1);
    tocar(EMPRESAS.aurora);
    atualizar();};});
  atualizar();
  $('#pvv').onclick=()=>{S.empPasso--;vPerfil();};
  $('#pnn').onclick=()=>{S.empPasso++;vPerfil();};
}
