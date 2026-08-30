/* ══════════════════ 2 · SOURCED VALUE ══════════════════
   Todo dado que entra no match carrega de onde veio e quanta confiança
   tem. É o tipo que impõe a regra "IA sugere, pessoa confirma": extração
   de documento não vira fato só por estar preenchida.                  */
const OBSERVADO = '2026-09-01T12:00:00.000Z';
const sv = (value, source='user', confidence=1, extra) =>
  ({value, source, confidence, observedAt:OBSERVADO,
    ...(source==='user'||source==='company'||source==='curator' ? {confirmedAt:OBSERVADO} : {}),
    ...extra});
const confirmado = v => v.source==='user'||v.source==='company'||v.source==='curator'||!!v.confirmedAt;

const FONTE_ROT = {
  user:'confirmado por você', company:'declarado pela empresa', curator:'checado pela curadoria',
  conversation:'extraído da conversa', document:'extraído de documento',
};

/* ══════════════════ 3 · PROJEÇÃO DE FEATURES ══════════════════
   Passagem obrigatória. É aqui, e só aqui, que se garante que feature
   proibida nunca chega ao cálculo. Se a checagem morasse no motor, cada
   caminho novo de entrada precisaria lembrar de fazer a verificação.   */
class ErroFeatureProibida extends Error {}

function projetar(ent, pol){
  const porId = new Map();
  const deny = new Set(pol.features.denylist);
  const allow = new Set(pol.features.allowlist);
  const por = f => {
    if(deny.has(f.id)) throw new ErroFeatureProibida(
      'feature "'+f.id+'" está na denylist da política '+pol.policy_version+
      '. Proxy de característica protegida não entra no modelo.');
    if(!allow.has(f.id)) throw new ErroFeatureProibida(
      'feature "'+f.id+'" não está na allowlist da política '+pol.policy_version+
      '. Feature entra por lista positiva; adicione à política e versione.');
    porId.set(f.id, f);
  };
  const nova = (id,v) => ({id, valor:v.value, fonte:v.source, confidence:v.confidence});
  const {candidato, empresa, vaga} = ent;

  if(candidato){
    for(const id of EIXO_IDS) por(nova('eixo.'+id, candidato.eixos[id]));
    por(nova('contexto.uf', candidato.uf));
    por(nova('contexto.modelo', candidato.modelos));
    if(candidato.pretensao) por(nova('contexto.pretensao', candidato.pretensao));
    for(const c of candidato.competencias){
      // skill.nivel é família de features: o id do skill vai no valor, não
      // no id da feature, para a allowlist não crescer a cada skill nova.
      const f = nova('skill.nivel', c.nivel);
      if(deny.has('skill.nivel') || !allow.has('skill.nivel'))
        throw new ErroFeatureProibida('feature "skill.nivel" fora da allowlist');
      porId.set('skill.nivel:'+c.skillId, {...f, id:'skill.nivel'});
    }
  }
  if(empresa){ for(const id of EIXO_IDS) por(nova('eixo.'+id, empresa.eixos[id])); }
  if(vaga){
    por({id:'vaga.familia', valor:vaga.familia, fonte:'company', confidence:1});
    por({id:'vaga.faixa', valor:vaga.faixaMax, fonte:'company', confidence:1});
  }
  return {featureSchemaVersion: pol.feature_schema_version, porId};
}

/* Confiança agregada, ponderada pela fonte. Perfil montado por extração
   de currículo vale menos que o mesmo perfil confirmado pela pessoa.   */
function confiancaDe(valores, pol){
  if(!valores.length) return 0;
  const soma = valores.reduce((acc,v)=>{
    const peso = pol.confianca.peso_fonte[v.source] ?? .5;
    return acc + Math.max(0, Math.min(1, v.confidence)) * peso;
  },0);
  return soma / valores.length;
}

/* ══════════════════ 4 · MOTOR ══════════════════
   Função pura. Sem rede, sem banco, sem relógio implícito. Mesma entrada
   e mesmas versões produzem o mesmo resultado.                          */
const clamp = (n,min=0,max=100) => Math.max(min, Math.min(max, n));

function fitTecnico(i){
  const {candidato, vaga, politica} = i;
  const rot = i.rotuloSkill || (id=>id);
  const evidencias = [];

  if(!vaga.requisitos.length){
    return {nota:60, confidence:.3, evidencias:[{kind:'constraint', featureId:'vaga.requisitos',
      reasonCode:'REQ_AUSENTE',
      humano:'A vaga não declarou requisitos, então o técnico não pôde ser avaliado.'}]};
  }

  const tem = new Map(candidato.competencias.map(c=>[c.skillId,c]));
  let ganho=0, total=0, furouObrigatorio=false;

  for(const r of vaga.requisitos){
    total += r.peso;
    const c = tem.get(r.skillId);
    if(!c){
      if(r.obrigatorio) furouObrigatorio = true;
      evidencias.push({kind:'gap', featureId:'skill.nivel',
        reasonCode: r.obrigatorio ? 'REQ_OBRIGATORIO_AUSENTE' : 'REQ_AUSENTE',
        contribution: -r.peso/total,
        humano: r.obrigatorio
          ? 'Requisito obrigatório ausente: '+rot(r.skillId)+'.'
          : 'Requisito desejável ausente: '+rot(r.skillId)+'.'});
      continue;
    }
    const parcial = r.peso * Math.min(1, c.nivel.value/3);
    ganho += parcial;
    evidencias.push({kind:'strength', featureId:'skill.nivel', sourceRef:c.nivel.evidenceRef,
      reasonCode:'REQ_COBERTO', contribution:parcial,
      humano: rot(r.skillId)+' em nível '+c.nivel.value+' de 3.'});
  }

  let nota = Math.round(ganho/total*100);

  // Teto, não média. Se o obrigatório virasse mais um peso, um candidato
  // forte em quatro requisitos e zerado no único obrigatório sairia com ~70
  // e passaria despercebido. A lacuna crítica não pode se diluir.
  if(furouObrigatorio && politica.requisito_obrigatorio.modo==='cap'){
    nota = Math.min(nota, politica.requisito_obrigatorio.nota_maxima);
    evidencias.push({kind:'constraint', featureId:'politica.requisito_obrigatorio',
      reasonCode:'TETO_APLICADO',
      humano:'Nota limitada a '+politica.requisito_obrigatorio.nota_maxima+
        ' por requisito obrigatório não atendido.'});
  }

  const confidence = confiancaDe(candidato.competencias.map(c=>c.nivel), politica);
  return {nota:clamp(nota), confidence, evidencias};
}

function fitCultural(i){
  const {candidato, empresa, politica} = i;
  const fator = politica.cultural.fator_decaimento;

  const porEixo = politica.eixos.map(e=>{
    const cv = candidato.eixos[e.id] ? candidato.eixos[e.id].value : 50;
    const ev = empresa.eixos[e.id] ? empresa.eixos[e.id].value : 50;
    const d = Math.abs(cv-ev);
    const ponto = Math.max(0, 1 - d/(e.tolerancia*fator));
    return {e, d, ponto};
  });

  const nota = Math.round(porEixo.reduce((a,x)=>a+x.ponto,0)/porEixo.length*100);
  const ordenado = [...porEixo].sort((a,b)=>a.ponto-b.ponto);

  const evidencias = ordenado.slice(0,3).map(x=>({
    kind: x.d > x.e.tolerancia ? 'gap' : 'strength',
    featureId:'eixo.'+x.e.id,
    reasonCode: x.d > x.e.tolerancia ? 'EIXO_FORA_TOLERANCIA' : 'EIXO_ALINHADO',
    contribution: x.ponto/porEixo.length,
    humano: x.d > x.e.tolerancia
      ? x.e.nome+': '+x.d+' pontos de distância, acima da tolerância de '+x.e.tolerancia+'.'
      : x.e.nome+': '+x.d+' pontos de distância, dentro da tolerância de '+x.e.tolerancia+'.',
  }));

  const confidence = confiancaDe([
    ...EIXO_IDS.map(id=>candidato.eixos[id]),
    ...EIXO_IDS.map(id=>empresa.eixos[id]),
  ], politica);

  return {nota:clamp(nota), confidence, evidencias, porEixo:ordenado};
}

function fitContexto(i){
  const {candidato, vaga, politica} = i;
  const c = politica.contexto;
  const evidencias=[], notas=[];

  const okLocal = vaga.uf==='BR' || candidato.uf.value===vaga.uf;
  notas.push(okLocal ? c.localidade.compativel : c.localidade.incompativel);
  evidencias.push({kind: okLocal?'strength':'constraint', featureId:'contexto.uf',
    reasonCode: okLocal?'LOCAL_OK':'LOCAL_DIVERGENTE',
    humano: okLocal ? 'Localidade compatível.'
      : 'Vaga em '+vaga.uf+', candidato em '+candidato.uf.value+'.'});

  const okModelo = candidato.modelos.value.includes(vaga.modelo);
  notas.push(okModelo ? c.modelo.compativel : c.modelo.incompativel);
  evidencias.push({kind: okModelo?'strength':'constraint', featureId:'contexto.modelo',
    reasonCode: okModelo?'MODELO_OK':'MODELO_DIVERGENTE',
    humano: okModelo ? 'Modelo '+vaga.modelo+' está nas preferências.'
      : 'Modelo '+vaga.modelo+' fora das preferências declaradas.'});

  if(candidato.pretensao){
    const p = candidato.pretensao.value, teto = vaga.faixaMax;
    const margem = teto*(1+c.pretensao.tolerancia_relativa);
    const nota = p<=teto ? c.pretensao.dentro : p<=margem ? c.pretensao.margem : c.pretensao.fora;
    notas.push(nota);
    evidencias.push({kind: nota===c.pretensao.dentro?'strength':'constraint',
      featureId:'contexto.pretensao',
      reasonCode: nota===c.pretensao.dentro?'PRETENSAO_OK'
        : nota===c.pretensao.margem?'PRETENSAO_MARGEM':'PRETENSAO_FORA',
      humano: nota===c.pretensao.dentro ? 'Pretensão dentro da faixa.'
        : 'Pretensão acima do teto da faixa (R$ '+teto.toLocaleString('pt-BR')+').'});
  }

  const confidence = confiancaDe([candidato.uf, candidato.modelos,
    ...(candidato.pretensao?[candidato.pretensao]:[])], politica);

  return {nota:clamp(Math.round(notas.reduce((a,b)=>a+b,0)/notas.length)), confidence, evidencias};
}

function evaluate(i){
  // Passagem obrigatória pela projeção: garante que feature proibida não
  // chega ao cálculo, mesmo quando o motor for chamado por caminho novo.
  const vetor = projetar({candidato:i.candidato, empresa:i.empresa, vaga:i.vaga}, i.politica);

  const tecnico = fitTecnico(i), cultural = fitCultural(i), contexto = fitContexto(i);
  const w = pesosDe(i.politica, i.vaga.familia);
  const total = Math.round(tecnico.nota*w.tecnico + cultural.nota*w.cultural + contexto.nota*w.contexto);

  // Confiança do conjunto é a MENOR das dimensões, não a média: uma dimensão
  // apoiada em dado fraco contamina a recomendação inteira, e média esconderia.
  const confidence = Math.min(tecnico.confidence, cultural.confidence, contexto.confidence);

  return {tecnico, cultural, contexto, total:clamp(total), confidence, pesos:w,
    features:[...vetor.porId.keys()]};
}
