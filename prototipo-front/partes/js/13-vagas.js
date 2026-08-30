/* ══════════════════ 7d · VAGAS ══════════════════

   As quatro primeiras são escritas à mão e ficam literais: a vaga 1 é o
   caso canônico do ADR 001, e é ela que mostra na tela o baseline de 84.
   As demais são geradas, para a busca ter volume de verdade.

   `familia` NUNCA é escrita à mão numa vaga gerada — sai de familiaDe(cargo).
   Nas quatro fixas ela está escrita, e 99-boot.js confere que bate com o
   cargo. Duas fontes para a mesma verdade divergem no primeiro que alguém
   editar.                                                                */

const req = l => l.map(([skillId,peso,obrigatorio])=>({skillId,peso,obrigatorio}));

const VAGAS_FIXAS = [
  {id:1, vid:'vaga-001', versao:'vaga-v1', cargo:'Coordenador de RH', cargoId:'c-rh-5',
   area:'rh', emp:'aurora',
   local:'Recife, presencial', modelo:'presencial', uf:'PE',
   faixa:'R$ 9.000 a R$ 11.000', faixaMin:9000, faixaMax:11000, dias:2, cand:9,
   familia:'Gente', sen:'senior', tags:['Recrutamento','Avaliação de desempenho','Varejo'],
   requisitos: req([['s01',3,true],['s02',3,true],['s06',2,false],['s07',2,false],['s03',1,false]]),
   res:'Grupo de varejo com 620 funcionários em nove lojas. A posição é nova e responde direto para a diretoria de gente.',
   faz:['Estruturar o processo seletivo, hoje feito por indicação',
        'Montar o ciclo de avaliação de desempenho do zero',
        'Cuidar do clima nas nove lojas, com visita quinzenal'],
   pede:['Experiência em varejo ou operação de alto volume',
         'Ter montado processo, não só executado',
         'Disponibilidade para viajar dentro de Pernambuco']},
  {id:2, vid:'vaga-002', versao:'vaga-v1', cargo:'Analista de Marketing Pleno', cargoId:'c-mkt-2',
   area:'marketing', emp:'vertigo',
   local:'Recife, híbrido', modelo:'hibrido', uf:'PE',
   faixa:'R$ 6.500 a R$ 8.200', faixaMin:6500, faixaMax:8200, dias:5, cand:23,
   familia:'Marketing', sen:'pleno', tags:['Mídia paga','RD Station','Growth'],
   requisitos: req([['s08',3,true],['s09',2,false],['s12',2,false],['s11',1,false]]),
   res:'Área de aquisição de uma healthtech com 40 mil pacientes ativos no Nordeste. O time de growth dobrou de dois para quatro pessoas neste semestre.',
   faz:['Rodar campanhas em Meta e Google, com verba mensal de R$ 90 mil',
        'Estruturar o funil no RD Station junto com vendas',
        'Acompanhar CAC e retenção por coorte de plano'],
   pede:['3 anos ou mais em marketing digital com verba própria',
         'Prática de mídia paga, não só planejamento',
         'Confortável com planilha e leitura de dado']},
  {id:3, vid:'vaga-003', versao:'vaga-v1', cargo:'Pessoa Desenvolvedora Backend Sênior', cargoId:'c-tec-2',
   area:'tecnologia', emp:'malbec',
   local:'Remoto, Brasil', modelo:'remoto', uf:'BR',
   faixa:'R$ 12.000 a R$ 15.000', faixaMin:12000, faixaMax:15000, dias:8, cand:41,
   familia:'Tecnologia', sen:'senior', tags:['Node','TypeScript','PostgreSQL'],
   requisitos: req([['s09',2,false],['s12',1,false]]),
   res:'Squad de integrações de uma empresa de logística que processa 1,2 milhão de rastreios por dia.',
   faz:['Manter as integrações com transportadoras em Node e TypeScript',
        'Reduzir o tempo de resposta da API pública, hoje em 840ms no p95',
        'Participar do plantão, uma semana a cada oito'],
   pede:['5 anos ou mais em backend sob carga','Node, TypeScript e PostgreSQL',
         'Ter passado por migração de monólito para serviços']},
  {id:4, vid:'vaga-004', versao:'vaga-v1', cargo:'Analista Financeiro Júnior', cargoId:'c-fin-2',
   area:'financas', emp:'valeverde',
   local:'Recife, híbrido', modelo:'hibrido', uf:'PE',
   faixa:'R$ 3.400 a R$ 4.100', faixaMin:3400, faixaMax:4100, dias:11, cand:56,
   familia:'Financeiro', sen:'junior', tags:['Conciliação','Excel','Fluxo de caixa'],
   requisitos: req([['s10',3,true],['s12',2,true]]),
   res:'Cooperativa agrícola com 1.400 associados. O financeiro tem quatro pessoas e fecha o mês em cinco dias úteis.',
   faz:['Conciliação bancária e contas a pagar','Apoiar o fechamento mensal',
        'Manter a planilha de fluxo de caixa de 90 dias'],
   pede:['Formação em contábeis, administração ou economia','Excel com procv e tabela dinâmica',
         'Primeira ou segunda experiência']},
];

/* ── gerador ──
   Peso alto em PE e no remoto nacional de propósito. `okLocal` dá 25 quando
   a UF diverge, o que tira uns 5 pontos do total; espalhar as vagas por
   sete estados deixaria o board inteiro entre 60 e 70 e o produto pareceria
   não separar ninguém de ninguém.                                         */
const UFS_VAGA = [
  ['PE','Recife'], ['PE','Recife'], ['PE','Recife'],
  ['BR','Remoto, Brasil'], ['BR','Remoto, Brasil'],
  ['SP','São Paulo'], ['MG','Belo Horizonte'], ['BA','Salvador'],
  ['CE','Fortaleza'], ['RS','Porto Alegre'],
];
const ROT_MODELO = {presencial:'presencial', hibrido:'híbrido', remoto:'remoto'};

const RES_AREA = {
  operacoes:   e => 'Operação de '+e.s.split('·')[0].trim().toLowerCase()+' com rotina distribuída entre unidades. A área responde por prazo, custo e ruptura.',
  financas:    e => 'Time financeiro enxuto, com fechamento mensal em cinco dias úteis e auditoria anual.',
  rh:          e => 'Área de gente em estruturação, com processo ainda sendo desenhado e espaço para deixar marca.',
  vendas:      e => 'Time comercial com meta trimestral e carteira ativa. A área responde por receita nova e recorrência.',
  marketing:   e => 'Área de aquisição com verba própria e meta de custo por lead acordada com vendas.',
  tecnologia:  e => 'Squad de produto com entrega contínua, plantão rotativo e código revisado por pares.',
  produto:     e => 'Time de produto trabalhando por descoberta, com acesso direto a quem usa e a quem vende.',
  atendimento: e => 'Central de atendimento com SLA acordado e volume concentrado no início do mês.',
};
const PEDE_SEN = {
  junior:    ['Primeira ou segunda experiência na área','Vontade de aprender o processo por dentro','Formação em andamento ou concluída'],
  pleno:     ['3 anos ou mais na função','Autonomia para tocar a rotina sem supervisão diária','Confortável com planilha e leitura de dado'],
  senior:    ['5 anos ou mais na função','Ter estruturado processo, não só executado','Capacidade de defender uma decisão com dado'],
  lideranca: ['Experiência prévia liderando time direto','Responsabilidade por orçamento e por meta','Prática em contratar e desenvolver pessoas'],
};

function gerarVaga(n, cargo){
  const vid = 'vaga-' + String(n).padStart(3, '0');
  const r = prng(sementeDe(vid));
  const empK = escolher(r, Object.keys(EMPRESAS));
  const [uf, cidade] = escolher(r, UFS_VAGA);
  const modelo = uf === 'BR' ? 'remoto' : escolher(r, ['presencial','hibrido','hibrido','remoto']);

  const fator = 0.9 + r() * 0.35;
  const faixaMin = Math.round(cargo.base[0] * fator / 100) * 100;
  const faixaMax = Math.round(cargo.base[1] * fator / 100) * 100;

  // 3 a 5 competências do cargo. Peso decrescente, ao menos um obrigatório:
  // sem obrigatório o teto de 45 nunca dispara e metade das telas de portão
  // fica sem dado para mostrar.
  const pool = embaralhar(r, cargo.sk);
  const qtd = Math.min(pool.length, entre(r, 3, 5));
  const requisitos = pool.slice(0, qtd).map((skillId, i) => ({
    skillId,
    peso: i === 0 ? 3 : i <= 2 ? 2 : 1,
    obrigatorio: i === 0 || (i === 1 && r() < 0.5),
  }));

  return {
    id: n, vid, versao:'vaga-v1',
    cargo: cargo.n, cargoId: cargo.id, area: cargo.a,
    emp: empK, familia: familiaDe(cargo), sen: cargo.sen,
    local: uf === 'BR' ? 'Remoto, Brasil' : cidade + ', ' + ROT_MODELO[modelo],
    modelo, uf, faixaMin, faixaMax,
    faixa: 'R$ ' + faixaMin.toLocaleString('pt-BR') + ' a R$ ' + faixaMax.toLocaleString('pt-BR'),
    dias: entre(r, 1, 28), cand: entre(r, 3, 60),
    requisitos,
    tags: requisitos.slice(0, 3).map(x => skillNome(x.skillId)),
    res: RES_AREA[cargo.a](EMPRESAS[empK]),
    faz: requisitos.slice(0, 3).map(x => 'Responder por ' + skillNome(x.skillId).toLowerCase()),
    pede: PEDE_SEN[cargo.sen],
  };
}

/* Cobertura forçada por área. Sorteio livre de cargo deixaria Atendimento
   com zero vagas e o filtro daquela área morto na tela. */
function gerarVagas(){
  const out = [];
  let n = VAGAS_FIXAS.length + 1;
  for(const area of AREAS){
    const r = prng(sementeDe('area|' + area.id));
    const disp = embaralhar(r, cargosDaArea(area.id));
    const quantas = Math.min(disp.length, entre(r, 3, 4));
    for(let i = 0; i < quantas; i++) out.push(gerarVaga(n++, disp[i]));
  }
  return out;
}

const VAGAS = [...VAGAS_FIXAS, ...gerarVagas()];
const VAGA = Object.fromEntries(VAGAS.map(v => [v.id, v]));

const ETAPAS = ['Enviada','Triagem','Entrevista Conectaria','Entrevista empresa','Proposta'];
