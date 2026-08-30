/* ══════════════════ 9 · FACHADA DO MOTOR ══════════════════

   A chave do memo é o ponto mais frágil desta camada, e vale explicar o
   que ela precisa cobrir. O resultado de evaluate() depende de quatro
   coisas: quem é a pessoa, qual é a vaga, como está a empresa e qual
   política está valendo. Se qualquer uma delas mudar e a chave não mudar
   junto, a tela mostra um número desatualizado — plausível, e por isso
   invisível. É a pior classe de bug que este arquivo pode ter.

   A versão anterior usava `vagaId|cand.v|empresa.__v`: sem a pessoa (o
   fit de duas pessoas na mesma vaga colidia), sem a vaga (editar requisito
   não invalidava) e sem a política. Funcionava por acidente, porque todo
   caminho de mutação chamava _memo.clear() — a chave versionada era
   decorativa, e o clear() global jogava fora o cache das 31 vagas a cada
   movimento de slider.                                                   */

const _memo = new Map();
const LIMITE_MEMO = 2000;

/** Versão de uma entidade mutável. */
const vv = e => e.__v || 0;

/** Único lugar que incrementa versão. Nunca faça `x.__v++` solto: a
 *  garantia de invalidação depende de todo caminho passar por aqui. */
function tocar(e){ if(e) e.__v = vv(e) + 1; }

function chaveMatch(pessoa, v){
  const emp = EMPRESAS[v.emp];
  return pessoa.id + '@' + vv(pessoa)
    + '|' + v.vid + '@' + vv(v)
    + '|' + emp.id + '@' + vv(emp)
    + '|' + POLITICA.policy_version;
}

function vagaEntidade(v){
  return {id:v.vid, versao:v.versao, empresaId:EMPRESAS[v.emp].id, familia:v.familia,
    uf:v.uf, modelo:v.modelo, faixaMin:v.faixaMin, faixaMax:v.faixaMax, requisitos:v.requisitos};
}

/** Fit de qualquer pessoa contra qualquer vaga. */
function Mp(pessoa, v){
  const chave = chaveMatch(pessoa, v);
  const emCache = _memo.get(chave);
  if(emCache) return emCache;

  const r = evaluate({candidato:pessoa, vaga:vagaEntidade(v), empresa:EMPRESAS[v.emp],
    politica:POLITICA, rotuloSkill:skillNome});
  r.decisoes = avaliarPoliticas(r, POLITICA);
  r.desfecho = desfechoFinal(r.decisoes);

  // Cada resultado carrega três listas de evidência com strings. Sem teto,
  // uma sessão longa de busca acumula alguns MB sem necessidade.
  if(_memo.size >= LIMITE_MEMO) _memo.clear();
  _memo.set(chave, r);
  return r;
}

/** Fit do candidato logado. Mantém as chamadas existentes intactas. */
const M = v => Mp(S.cand, v);

/** Escape para troca de política em runtime, que muda tudo de uma vez.
 *  Mutação de perfil, vaga ou empresa NÃO precisa disto: passa por tocar()
 *  e a chave já cuida. */
function invalidarMatch(){ _memo.clear(); }
