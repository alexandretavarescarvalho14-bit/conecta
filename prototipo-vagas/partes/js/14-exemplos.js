/* ══════════════════ CANDIDATOS DE EXEMPLO ══════════════════

   Para o pipeline não abrir vazio no teste. Gerados de forma
   determinística a partir do id de cada vaga (mesmo PRNG do core), todos
   marcados com `exemplo: true`, e o painel tem um botão que remove todos
   de uma vez sem tocar no que foi cadastrado no teste.

   Nomes, e-mails e telefones são fictícios: e-mail em example.com e
   WhatsApp com o prefixo 90000, que não existe.

   Arquétipo controla a forma do perfil em relação à vaga, para o
   pipeline ter gente forte, mediana, fraca e o caso "furou o
   obrigatório" (o teto de nota existe para ele). */

const ARQ_EX = [
  {id:'forte',   p:.20, cob:1.00, nivel:3},
  {id:'bom',     p:.30, cob:0.80, nivel:3},
  {id:'mediano', p:.25, cob:0.60, nivel:2},
  {id:'furou',   p:.12, cob:0.75, nivel:3, pulaObrig:true},
  {id:'fraco',   p:.13, cob:0.35, nivel:1},
];
const NOMES_EX = ['Ana','Bruno','Camila','Diego','Eduarda','Felipe','Gabriela','Heitor','Isabela','João Pedro',
  'Karina','Lucas','Mariana','Natália','Otávio','Paula','Rafael','Sabrina','Thiago','Vanessa','Wesley','Yasmin',
  'Letícia','Marcos','Renata','Caio','Débora','Igor','Juliana','Leandro'];
const SOBRENOMES_EX = ['Albuquerque','Barros','Cavalcanti','Dantas','Esteves','Farias','Gusmão','Holanda','Lins',
  'Macedo','Nogueira','Pimentel','Queiroz','Rocha','Siqueira','Teixeira','Uchôa','Vasconcelos','Xavier','Moura'];
const CIDADE_UF = {PE:'Recife', SP:'São Paulo', MG:'Belo Horizonte', RJ:'Rio de Janeiro', SC:'Joinville',
  RS:'Porto Alegre', BA:'Salvador', PR:'Curitiba', AM:'Manaus', CE:'Fortaleza'};
const DDD_UF = {PE:'81', SP:'11', MG:'31', RJ:'21', SC:'47', RS:'51', BA:'71', PR:'41', AM:'92', CE:'85'};
const UFS_EX = Object.keys(CIDADE_UF);

const semAcento = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

function candidatoExemplo(r, n, areaId, cargoId, vaga, base){
  const arq = vaga ? sortearPonderado(r, ARQ_EX) : ARQ_EX[1];
  const nome = escolher(r, NOMES_EX) + ' ' + escolher(r, SOBRENOMES_EX);
  const slug = semAcento(nome.toLowerCase()).replace(/[^a-z]+/g, '.');
  const uf = vaga && UFS_EX.includes(vaga.uf) && r() < .75 ? vaga.uf : escolher(r, UFS_EX);
  const cargo = CARGO[cargoId];

  let cobre = [], fora = [];
  if(vaga){
    const obrig = vaga.requisitos.filter(x => x.obrigatorio).map(x => x.skillId);
    cobre = vaga.requisitos.map(x => x.skillId).filter(() => r() < arq.cob);
    // 'furou' tem de continuar sem o obrigatório: nem os extras do cargo podem devolvê-lo
    if(arq.pulaObrig){ cobre = cobre.filter(x => !obrig.includes(x)); fora = obrig; }
  }
  const extras = (cargo ? cargo.sk : []).filter(x => !cobre.includes(x) && !fora.includes(x)).slice(0, entre(r, 1, 2));
  const competencias = [...new Set([...cobre, ...extras])].map(skillId => ({
    skillId, nivel: Math.max(1, Math.min(3, arq.nivel - (r() < .3 ? 1 : 0))), de:'user'}));

  const modeloVaga = vaga ? vaga.modelo : 'presencial';
  const modelos = r() < .8 ? [...new Set([modeloVaga, r() < .5 ? 'hibrido' : 'presencial'])]
    : ['remoto', 'hibrido'].filter(m => m !== modeloVaga);
  const anos = entre(r, 1, 14);
  const [bmin, bmax] = cargo ? cargo.base : [2500, 5000];
  const cadastradoHa = entre(r, 3, 45);

  return {
    id: 'ex-' + String(n).padStart(3, '0'), exemplo:true,
    nome, email: slug + '@example.com',
    whatsapp: '(' + DDD_UF[uf] + ') 90000-' + String(entre(r, 1000, 9999)),
    linkedin: '', areaId, cargos: cargoId ? [cargoId] : [], competencias,
    uf, cidade: CIDADE_UF[uf], modelos,
    pretensao: Math.round((bmin + (bmax - bmin) * r() * 1.1) / 100) * 100,
    resumo: anos + (anos === 1 ? ' ano' : ' anos') + ' de experiência' + (cargo ? ' como ' + cargo.n.toLowerCase() : '') +
      '. Procuro uma oportunidade em que eu possa crescer e aplicar o que já sei.',
    anos, cvNome: r() < .6 ? slug.replace(/\./g, '-') + '-curriculo.docx' : null,
    fonte:'user', consentEm: iso(base - cadastradoHa * DIA), criadoEm: iso(base - cadastradoHa * DIA), __v:0,
    _cadastradoHa: cadastradoHa,
  };
}

function gerarExemplos(base){
  let n = 1;
  const ORIGENS_EX = ['site', 'site', 'site', 'whatsapp', 'indicacao', 'banco'];

  for(const v of DB.vagas){
    const r = prng(sementeDe('ex|' + v.id));
    const qtd = entre(r, 1, 4);
    for(let i = 0; i < qtd; i++){
      const c = candidatoExemplo(r, n++, v.areaId, v.cargoId, v, base);
      DB.candidatos.push(c);

      const rec = montarRec(c, v, iso(base));
      const etapa = etapaSorteada(r);
      const chanceReprovar = [.42, .34, .24, .14, .05][etapa];
      let status = 'ativa', motivoId = null;
      if(r() < chanceReprovar){ status = 'reprovada'; motivoId = motivoPara(r, rec, etapa); }
      else if(etapa === ETAPAS.length - 1 && r() < .5) status = 'contratada';

      // a candidatura nunca é anterior ao cadastro nem à publicação da vaga
      const vagaHa = Math.round((base - new Date(v.publicadaEm).getTime()) / DIA);
      const iniciouHa = Math.max(0, Math.min(c._cadastradoHa, vagaHa) - entre(r, 0, 2));
      const historico = [{de:null, para:0, em:iso(base - iniciouHa * DIA), quem:'candidato', status:'ativa'}];
      let cursor = iniciouHa;
      for(let e = 1; e <= etapa; e++){
        cursor = Math.max(0, cursor - entre(r, 1, 4));
        historico.push({de:e - 1, para:e, em:iso(Math.min(base, base - cursor * DIA + e * 3600000)), quem:'conectaria', status:'ativa'});
      }
      if(status !== 'ativa'){
        cursor = Math.max(0, cursor - entre(r, 0, 2));
        historico.push({de:etapa, para:etapa, em:iso(Math.min(base, base - cursor * DIA + 9 * 3600000)), quem:'conectaria',
          status, ...(motivoId ? {motivoId} : {})});
      }
      DB.candidaturas.push({
        id:'ap-' + c.id, vagaId:v.id, candidatoId:c.id, etapa, status, motivoId, nota:'',
        favorito: r() < .1, origem: escolher(r, ORIGENS_EX),
        criadaEm: historico[0].em, atualizadaEm: historico[historico.length - 1].em,
        historico, rec, recAnteriores:[],
      });
      delete c._cadastradoHa;
    }
  }

  // Banco de talentos: gente cadastrada que ainda não se candidatou a nada.
  // É quem a Conectaria procura quando abre uma vaga nova.
  for(const a of areasOrdenadas()){
    const r = prng(sementeDe('talento|' + a.id));
    const cargos = cargosDaArea(a.id);
    if(!cargos.length) continue;
    const c = candidatoExemplo(r, n++, a.id, escolher(r, cargos).id, null, base);
    delete c._cadastradoHa;
    DB.candidatos.push(c);
  }
}
