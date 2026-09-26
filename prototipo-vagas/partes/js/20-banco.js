/* ══════════════════ BANCO LOCAL ══════════════════

   No app real isto é o Supabase. Aqui é um objeto só, guardado no
   navegador, com as mesmas tabelas do plano: empresas, vagas, candidatos,
   candidaturas (com o histórico dentro). A forma dos registros é a mesma
   que as migrations vão ter, para o João testar exatamente o que vai
   existir depois.

   Tudo que muda dado passa por salvar(). O storage pode não existir (aba
   anônima, prévia, bloqueio de dados do site): a página funciona igual,
   só não lembra de nada ao recarregar. */

const CHAVE_BANCO = 'conectaria.vagas.teste.v1';
const DIA = 86400000;

let DB = null;

const S = {
  papel: 'cand',          // 'cand' | 'admin' — a troca do topo
  userId: null,           // candidato logado, no lado do candidato
  view: 'vagas', arg: null,
  q: '', area: null,      // vitrine
  vagaAlvo: null,         // vaga para voltar depois do cadastro
  cad: null,              // cadastro em andamento
  adm: {vagaSel:null, etapa:null, busca:'', stVagas:'publicada', tal:{area:'', uf:'', q:'', vaga:''}},
};

function salvar(){
  try{
    localStorage.setItem(CHAVE_BANCO, JSON.stringify({
      db: DB,
      sessao: {papel:S.papel, userId:S.userId, vagaAlvo:S.vagaAlvo, cad:S.cad, vagaSel:S.adm.vagaSel},
    }));
  }catch(_){}
}
function carregar(){
  try{
    const bruto = localStorage.getItem(CHAVE_BANCO);
    if(!bruto) return false;
    const d = JSON.parse(bruto);
    if(!d || !d.db || !Array.isArray(d.db.vagas)) return false;
    DB = d.db;
    const s = d.sessao || {};
    S.papel = s.papel === 'admin' ? 'admin' : 'cand';
    S.userId = s.userId && DB.candidatos.some(c => c.id === s.userId) ? s.userId : null;
    S.vagaAlvo = s.vagaAlvo || null;
    S.cad = s.cad || null;
    S.adm.vagaSel = s.vagaSel || null;
    return true;
  }catch(_){ return false; }
}

const iso = t => new Date(t).toISOString();
function novoId(prefixo){
  DB.seq = (DB.seq || 0) + 1;
  return prefixo + '-' + Date.now().toString(36) + DB.seq.toString(36);
}

/* Estado de partida: empresas e vagas do site atual, mais os exemplos. */
function semear(){
  const base = Date.now();
  DB = {versao:1, base, seq:0, empresas:[], vagas:[], candidatos:[], candidaturas:[]};
  DB.empresas = EMPRESAS_SEED.map(e => ({...e, site:'', cnpj:'', contato:'', obs:'', criadaEm:iso(base - 60 * DIA)}));
  DB.vagas = VAGAS_SEED.map(([id, empresaId, cargoId, titulo, local, uf, modelo, regime, faixa, resumo, conectaria, dias]) => ({
    id, empresaId, cargoId, areaId:CARGO[cargoId].a, titulo, local, uf, modelo, regime, faixa,
    faixaMax: tetoDaFaixa(faixa), resumo,
    descricao: resumo + '\n\nA Conectaria faz a primeira conversa com você e acompanha todas as etapas até a resposta final da empresa.',
    conectaria, status:'publicada', requisitos: requisitosDoCargo(cargoId),
    criadaEm: iso(base - dias * DIA), publicadaEm: iso(base - dias * DIA), __v:0,
  }));
  gerarExemplos(base);
  S.userId = null; S.cad = null; S.vagaAlvo = null; S.adm.vagaSel = null;
  salvar();
}

/* ── consultas ── */
const empresaPor = id => DB.empresas.find(e => e.id === id);
const vagaPor = id => DB.vagas.find(v => v.id === id);
const candidatoPor = id => DB.candidatos.find(c => c.id === id);
const candidaturaPor = id => DB.candidaturas.find(a => a.id === id);
const candidaturasDaVaga = vid => DB.candidaturas.filter(a => a.vagaId === vid);
const candidaturasDoCandidato = cid => DB.candidaturas.filter(a => a.candidatoId === cid);
const vagasPublicadas = () => DB.vagas.filter(v => v.status === 'publicada');
const eu = () => S.userId ? candidatoPor(S.userId) : null;
const jaCandidatou = (cid, vid) => DB.candidaturas.some(a => a.candidatoId === cid && a.vagaId === vid);

/* Único lugar que incrementa versão de vaga ou candidato. É o que avisa
   o pipeline de que o fit congelado ficou para trás. */
function tocar(e){ if(e) e.__v = (e.__v || 0) + 1; }

/* Cria candidatura. Serve o candidato (origem site) e a Conectaria
   (origem banco, quando ela traz alguém do banco de talentos). */
function criarCandidatura(cid, vid, origem, quem){
  if(jaCandidatou(cid, vid)) return null;
  const agora = iso(Date.now());
  const ap = {id:novoId('ap'), vagaId:vid, candidatoId:cid, etapa:0, status:'ativa', motivoId:null,
    nota:'', favorito:false, origem, criadaEm:agora, atualizadaEm:agora,
    historico:[{de:null, para:0, em:agora, quem, status:'ativa'}], rec:null, recAnteriores:[]};
  DB.candidaturas.push(ap);
  salvar();
  return ap;
}
