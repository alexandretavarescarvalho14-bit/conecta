/* ══════════════════ 6 · HASH E TRACE ══════════════════ */
function canonico(v){
  if(v===null || typeof v!=='object') return JSON.stringify(v);
  if(Array.isArray(v)) return '['+v.map(canonico).join(',')+']';
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonico(v[k])).join(',')+'}';
}
/* FNV-1a em quatro correntes. Só entra quando crypto.subtle não existe
   (file:// em alguns navegadores). Determinístico do mesmo jeito, que é
   a propriedade que o trace precisa: mesma entrada, mesmo hash.        */
function fnv128(s){
  const off=[0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
  return off.map(seed=>{
    let h = seed>>>0;
    for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193)>>>0; }
    return h.toString(16).padStart(8,'0');
  }).join('');
}
async function hashEntrada(candidato, vaga, empresa, versoes){
  const txt = canonico({candidato, vaga, empresa, versoes});
  if(globalThis.crypto && crypto.subtle){
    try{
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
      return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,32);
    }catch(_){ /* contexto não seguro: cai no determinístico local */ }
  }
  return fnv128(txt);
}

async function montarTrace(e){
  const versions = {
    candidateProfile:e.candidato.versao, vacancy:e.vaga.versao,
    taxonomy:e.politica.taxonomy_version, featureSchema:e.politica.feature_schema_version,
    embedding:e.versoes.embedding, reranker:e.versoes.reranker,
    policy:e.politica.policy_version, explanation:e.politica.explanation_version,
  };
  const evidence = [...e.resultado.tecnico.evidencias, ...e.resultado.cultural.evidencias,
    ...e.resultado.contexto.evidencias];
  const geradoEm = new Date(e.generatedAt);
  const expira = new Date(geradoEm.getTime() + (e.validadeHoras ?? 72)*3600000);

  return Object.freeze({
    recommendationId:e.recommendationId,
    candidateId:e.candidato.id, vacancyId:e.vaga.id,
    scores:{technical:e.resultado.tecnico.nota, culture:e.resultado.cultural.nota,
      context:e.resultado.contexto.nota, total:e.resultado.total,
      confidence:Number(e.resultado.confidence.toFixed(4))},
    evidence,
    policyDecisions: avaliarPoliticas(e.resultado, e.politica),
    versions,
    generatedAt:e.generatedAt,
    expiresAt:expira.toISOString(),
    inputHash: await hashEntrada(e.candidato, e.vaga, e.empresa, versions),
  });
}
