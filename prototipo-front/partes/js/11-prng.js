/* ══════════════════ 7b · ALEATÓRIO DETERMINÍSTICO ══════════════════

   Os dados de demonstração são gerados, não escritos à mão, mas precisam
   ser os MESMOS a cada carregamento: sem isso não dá para reproduzir um
   bug de funil, e o dashboard muda de forma a cada F5.

   O mesmo PRNG do core (fixtures.ts), com uma diferença importante: a
   semente vem de uma string, não de um contador. Semente por id significa
   que inserir a vaga 17 não desloca as vagas 18 a 32 — cada item é
   reconstruível isoladamente, e a persistência guarda só o id.          */

function prng(semente){
  let s = semente >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/* FNV-1a: string → semente. Determinística entre execuções e navegadores. */
function sementeDe(str){
  let h = 0x811c9dc5 >>> 0;
  for(let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const escolher = (r, arr) => arr[Math.floor(r() * arr.length)];
const entre = (r, a, b) => a + Math.floor(r() * (b - a + 1));

/* Sorteio ponderado por `p`. Os pesos não precisam somar 1. */
function sortearPonderado(r, itens){
  const total = itens.reduce((a, x) => a + x.p, 0);
  let k = r() * total;
  for(const x of itens){ k -= x.p; if(k <= 0) return x; }
  return itens[itens.length - 1];
}

/* Embaralha sem mutar a origem, usando o PRNG injetado (nunca Math.random). */
function embaralhar(r, arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Âncora de tempo fixa. Datas semeadas contam a partir daqui, nunca de
   Date.now(): senão o dashboard muda de forma entre um reload e outro e
   nenhum bug de funil se reproduz. */
const AGORA_DEMO = new Date('2026-08-30T12:00:00.000Z');
const diasAtras = n => new Date(AGORA_DEMO.getTime() - n * 86400000).toISOString();
