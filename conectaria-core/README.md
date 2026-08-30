# conectaria-core

Fundação do sistema de recomendação. Cobre a lista **Agora** da seção 17 do
documento de evolução técnica: baseline puro, política versionada, contratos
de trace e testes de propriedade.

```bash
npm test          # 34 testes, sem dependência nem build
```

Node 22.6 ou superior. TypeScript roda por type stripping, então não há passo
de build para executar os testes.

## Pacotes

| Pacote | O que é |
|---|---|
| `contracts` | tipos compartilhados: `SourcedValue`, entidades, `RecommendationTrace` |
| `recommendation-policy` | pesos, tolerâncias e thresholds como artefato JSON versionado |
| `matching-core` | baseline determinístico, projeção de features, policy gate, trace |

## O que este pacote garante

**Baseline determinístico.** Mesma entrada e mesmas versões produzem o mesmo
resultado e o mesmo `inputHash`. Sem rede, sem banco, sem relógio implícito:
`generatedAt` é injetado.

**Política fora do código.** `policies/policy-2026.09.0.json` guarda os 14
eixos com tolerância, os pesos por família, o modo do portão de requisito
obrigatório, os thresholds de contexto e confiança, e as listas de features.
Front-end, API, job offline e avaliação histórica leem o mesmo arquivo.

**Feature entra por lista positiva.** `projetar()` é passagem obrigatória e
recusa tanto o que está na denylist quanto o que não está na allowlist. Duas
camadas: a validação da política impede liberar atributo protegido pela
allowlist, e a projeção barra na emissão.

**Score não é número solto.** Toda dimensão devolve nota, confiança e
evidências com `reasonCode` e texto legível. O tipo obriga.

**Nada é publicado sem passar pelo portão.** `avaliarPoliticas()` devolve
`allow`, `review` ou `block`. Confiança abaixo do mínimo bloqueia; score alto
com requisito obrigatório ausente vai para revisão humana.

## Baseline travado

O candidato canônico do ADR 001 na vaga de RH: técnico 67, cultural 93,
contexto 100, total **84**. É o mesmo número do protótipo. Se mudar, o ADR
muda junto, na mesma entrega.

## Próximo passo

`docs/proximos-passos.md`.
