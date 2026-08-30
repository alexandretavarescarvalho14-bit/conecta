# Próximos passos

Estado: a lista **Agora** da seção 17 está entregue. O que segue é a lista
**Em seguida**, com o que cada item destrava e o que trava se for pulado.

---

## Feito

| Item da seção 17 | Onde |
|---|---|
| Extrair `fitTecnico`, `fitCultural`, `fitContexto`, `match` para lib pura | `packages/matching-core/src/engine.ts` |
| `EIXOS`, `PESO_FAMILIA` e thresholds como política versionada | `packages/recommendation-policy/policies/` |
| Schemas de Profile, Vacancy e Recommendation Trace | `packages/contracts/src/index.ts` |
| Testes de propriedade e casos do ADR | `packages/matching-core/test/` (34 testes) |

Além do pedido, entraram três coisas que o documento cobra em outras seções e
que ficariam caras de retrofitar depois: `SourcedValue` com proveniência e
confiança (8.1), o policy gate com `allow`, `review` e `block` (9), e a
projeção de features com allowlist obrigatória (13.1).

---

## Em seguida, na ordem

### 1 · Persistência e migrations

Postgres com `pgvector`. O schema está em `docs/02-modelo-de-dados.md` da
entrega anterior. Comece pela tabela `desfecho`, não pelo resto.

**Por que primeiro o log:** sem ele não existe fase de modelo aprendido, e o
histórico não pode ser reconstruído retroativamente. Toda semana sem
instrumentação é uma semana de dado que não volta.

Cuidado ao portar: `motivo` de desfecho precisa de vocabulário fechado desde
a primeira migration. Texto livre não treina, e ninguém volta para
categorizar depois.

### 2 · Recommendation API e autoridade no servidor

`POST /v1/recommendations:generate` retornando o trace completo. O cálculo no
cliente vira preview opcional e deixa de ser autoridade.

Enquanto o motor roda só no navegador, dois clientes podem divergir e o
resultado é manipulável. É o limite mais grave da lista da seção 3.

### 3 · Outbox e eventos

Escrita no domínio grava evento na mesma transação. Projetores consomem para
feature store, analytics e pré-cálculo.

Sem outbox, evento perdido em falha parcial vira buraco silencioso no dataset,
e o buraco só aparece meses depois, na avaliação offline.

### 4 · Pré-cálculo e invalidação dirigida

O `_memo` local vira cache compartilhado com invalidação por evento. Quando
uma empresa mexe num eixo, invalide as recomendações daquela empresa, não a
base inteira.

### 5 · Observabilidade

`request_id`, `trace_id`, `recommendation_id`, versões do pipeline, duração
por etapa, resultado do gate, fallback usado. SLOs da seção 14.

O alerta mais importante e o menos óbvio: **divergência entre score ativo e
baseline**. É o que detecta regressão de modelo antes do usuário reclamar.

---

## Depois

Extração estruturada, canonicalização de skills, embeddings, recuperação
híbrida, confidence model, reranker aprendido, registry, shadow e canary.

Regra que vale para toda essa fase: o baseline determinístico continua
rodando em paralelo e é o piso de comparação. Modelo que não bate a regra
não é promovido.

---

## Dívidas conhecidas nesta entrega

**`fator_decaimento: 2.6` é chute calibrado.** Está na política justamente
para ser o primeiro parâmetro a virar aprendido quando houver desfecho
suficiente. Não é verdade, é ponto de partida.

**A confiança agregada usa média por dimensão e mínimo entre dimensões.**
Funciona e é explicável, mas não é calibrada: uma confiança de 0.7 não quer
dizer que 70% das recomendações naquele nível dão certo. Calibração real só
depois do log.

**Não há teste de fairness ainda.** A seção 13.4 pede paridade de exposição,
taxa de avanço e falso negativo por coorte. Isso precisa de dado real e
coorte definida; a estrutura de allowlist já impede o pior caso, que é a
característica protegida virar feature.

**A projeção de features ainda não é consumida como vetor pelo cálculo.** Ela
roda como portão de validação dentro de `evaluate()`. Quando o reranker
entrar, o cálculo passa a ler do vetor, e aí a projeção deixa de ser só
guarda e vira caminho de dado.
