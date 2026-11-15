# SLO do protótipo AgendaFácil

Estes objetivos acadêmicos orientam a observabilidade. Não são uma garantia de serviço nem resultados medidos.

## Janela

- Janela proposta: 30 dias, quando houver ambiente implantado com coleta contínua.
- Situação atual: desenvolvimento local; ainda não há dados para afirmar disponibilidade mensal.

## Indicadores e objetivos

| Indicador (SLI) | Objetivo (SLO) |
| --- | --- |
| Proporção de respostas 2xx em GET /health | pelo menos 99% na janela |
| Percentil 95 da duração de requisições HTTP, excluindo /metrics | abaixo de 500 ms |
| Proporção de respostas 5xx | abaixo de 1% |

## Orçamento de erro

Com disponibilidade de 99%, o orçamento teórico é 1% da janela de 30 dias. Só será calculável com dados de um ambiente implantado.

## Medição

- pino-http registra requisições e respostas em JSON.
- prom-client expõe duração, contagem de requisições e métricas do processo em /metrics.
- k6/smoke.js verifica /health e /metrics sob carga curta.
- Um teste rápido não comprova o cumprimento de um SLO mensal.
