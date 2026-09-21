const eixosEmp = v => Object.fromEntries(EIXO_IDS.map(id=>[id, sv(v[id] ?? 50, 'company', 1)]));

/* `estado` é o mesmo vocabulário fechado do cadastro: pendente, aprovada
   ou recusada. Novo cadastro nasceria 'pendente' e dependeria da
   curadoria (Etapa 4, admin) para virar 'aprovada'. O Grupo Aurora é a
   empresa que o protótipo já usa como demo desde antes desse campo
   existir — pré-aprovada, para não gatear atrás de um admin que ainda
   não existe nesta versão o que já era o caminho principal da demo. */
const EMPRESAS = {
  aurora:{id:'emp-aurora', versao:'emp-v1', n:'Grupo Aurora', c:'#0C5F92', s:'Varejo · 620 pessoas',
    cnpj:'11.222.333/0001-81', razaoSocial:'Grupo Aurora Comércio de Materiais Ltda.',
    site:'aurora.exemplo.com.br', estado:'aprovada',
    eixos: eixosEmp({ritmo:64,autonomia:78,formal:34,erro:62,decisao:70,colab:58,
      previsib:56,presenca:14,interrup:66,escopo:74,senior:76,espec:38,dados:52,relacional:68})},
  vertigo:{id:'emp-vertigo', versao:'emp-v1', n:'Vertigo Saúde', c:'#1E8E6A', s:'Healthtech · 90 pessoas',
    eixos: eixosEmp({ritmo:88,autonomia:82,formal:22,erro:80,decisao:76,colab:70,
      previsib:80,presenca:52,interrup:74,escopo:82,senior:66,espec:44,dados:84,relacional:56})},
  malbec:{id:'emp-malbec', versao:'emp-v1', n:'Malbec Tech', c:'#8A4FBE', s:'Logística · 210 pessoas',
    eixos: eixosEmp({ritmo:72,autonomia:86,formal:30,erro:74,decisao:80,colab:52,
      previsib:62,presenca:92,interrup:32,escopo:48,senior:80,espec:82,dados:88,relacional:26})},
  valeverde:{id:'emp-valeverde', versao:'emp-v1', n:'Cooperativa Vale Verde', c:'#B0741A', s:'Agro · 1.400 associados',
    eixos: eixosEmp({ritmo:26,autonomia:34,formal:74,erro:24,decisao:28,colab:60,
      previsib:22,presenca:30,interrup:44,escopo:36,senior:32,espec:56,dados:38,relacional:44})},
};
