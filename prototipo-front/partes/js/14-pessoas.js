/* ══════════════════ 7f · PESSOAS SINTÉTICAS ══════════════════

   ~40 perfis fictícios, gerados de forma determinística
   (prng(sementeDe(id))) e ancorados numa vaga de referência: é o que
   garante candidaturas com allow, review e block de verdade no board da
   empresa, em vez de um número escrito à mão.

   Sem nome, foto ou idade — a denylist da política proíbe, e
   projetar() lança se algum caminho tentar emitir isso como feature.
   `ini` é só iniciais sorteadas, para a tabela ter algo para mostrar.

   Arquétipo controla a FORMA do perfil relativa à vaga-âncora. É o que
   garante que o board tenha allow, review e block de verdade, e não só
   gente parecida com nota parecida:
     forte     cobre quase tudo, eixos alinhados, dado confirmado
     bom       cobre a maior parte, algum ruído de eixo
     mediano   cobertura mediana, dado ainda de conversa (confiança .85)
     furou     cobre bem, mas falha exatamente o requisito obrigatório —
               é o caso que o teto de 45 pontos existe para pegar
     culturaX  técnico forte, mas cultura bem fora da tolerância
     fraco     cobertura baixa, dado fraco (fonte document, confiança .72) */

const ARQUETIPOS = [
  {id:'forte',    p:.18, cob:1.00, nivelBase:3, ruidoEixo: 8, fonte:'user',         conf:1.00},
  {id:'bom',      p:.24, cob:0.85, nivelBase:3, ruidoEixo:16, fonte:'user',         conf:1.00},
  {id:'mediano',  p:.22, cob:0.70, nivelBase:2, ruidoEixo:26, fonte:'conversation', conf:0.85},
  {id:'furou',    p:.14, cob:0.60, nivelBase:3, ruidoEixo:14, fonte:'user',         conf:1.00, pulaObrig:true},
  {id:'culturaX', p:.12, cob:0.85, nivelBase:3, ruidoEixo:52, fonte:'user',         conf:1.00},
  {id:'fraco',    p:.10, cob:0.45, nivelBase:1, ruidoEixo:34, fonte:'document',     conf:0.72},
];

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVXZ'.split('');
const iniciais = r => escolher(r, LETRAS) + '.' + escolher(r, LETRAS) + '.';
const ORIGENS = ['busca', 'busca', 'busca', 'indicacao', 'convite', 'importado'];
const ORIGEM_ROT = {busca:'Busca própria', indicacao:'Indicação', convite:'Convite da empresa', importado:'Importado'};

function gerarPessoa(id, vagaAncora){
  const r = prng(sementeDe(id));
  const arq = sortearPonderado(r, ARQUETIPOS);
  const emp = EMPRESAS[vagaAncora.emp];
  const cargo = CARGO[vagaAncora.cargoId];
  const f = arq.fonte;

  const eixos = Object.fromEntries(EIXO_IDS.map(eid => {
    const base = emp.eixos[eid].value;
    const v = Math.max(0, Math.min(100, Math.round(base + (r() * 2 - 1) * arq.ruidoEixo)));
    return [eid, sv(v, f, arq.conf)];
  }));

  // cobertura dos requisitos da vaga-âncora, por probabilidade do arquétipo
  const obrig = vagaAncora.requisitos.filter(x => x.obrigatorio).map(x => x.skillId);
  const desej = vagaAncora.requisitos.filter(x => !x.obrigatorio).map(x => x.skillId);
  let cobre = [...obrig, ...desej].filter(() => r() < arq.cob);
  // 'furou' cobre bem no geral, mas falha o obrigatório de propósito: é o
  // caso que exercita o teto de 45 pontos, não a média.
  if(arq.pulaObrig && obrig.length && !cobre.includes(obrig[0])) { /* já não cobre */ }
  else if(arq.pulaObrig && obrig.length) cobre = cobre.filter(x => x !== obrig[0]);
  const extras = (cargo?.sk || []).filter(x => !cobre.includes(x)).slice(0, entre(r, 1, 3));
  const competencias = [...new Set([...cobre, ...extras])].map(skillId => ({
    skillId,
    nivel: sv(Math.max(1, Math.min(3, arq.nivelBase - (r() < .3 ? 1 : 0))), f, f === 'user' ? 1 : .8),
  }));

  const querRemoto = r() < .45;
  const ufAncora = vagaAncora.uf === 'BR' ? escolher(r, UFS_VAGA)[0] : vagaAncora.uf;
  return {
    id, versao:'prof-v1', __v:0, arq:arq.id,
    ini: iniciais(r), cargoAtual: cargo?.n || vagaAncora.cargo, areaId: cargo?.a || vagaAncora.area,
    sen: cargo?.sen || vagaAncora.sen,
    origem: escolher(r, ORIGENS),
    uf: sv(r() < .75 ? ufAncora : escolher(r, UFS_VAGA)[0], f, f === 'user' ? 1 : .9),
    modelos: sv(querRemoto ? ['remoto', 'hibrido'] : ['presencial', 'hibrido'], f, arq.conf),
    pretensao: sv(Math.round(vagaAncora.faixaMax * (0.75 + r() * 0.45) / 100) * 100, f, f === 'user' ? 1 : .8),
    competencias, eixos,
  };
}

/* Empresa cujo login o protótipo usa. Gera pessoas só para as vagas dela:
   é a única cujo pipeline alguém realmente abre nesta versão. */
function vagasDe(empKey){ return VAGAS.filter(v => v.emp === empKey); }

const PESSOAS = [];
const PESSOA = {};
(function gerarPessoas(){
  let n = 1;
  for(const v of vagasDe('aurora')){
    const r = prng(sementeDe('pessoas|' + v.vid));
    const qtd = entre(r, 3, 9);
    for(let i = 0; i < qtd; i++){
      const id = 'p-' + String(n++).padStart(3, '0');
      const pessoa = gerarPessoa(id, v);
      pessoa.vagaAncoraId = v.id;
      PESSOAS.push(pessoa);
      PESSOA[id] = pessoa;
    }
  }
})();
