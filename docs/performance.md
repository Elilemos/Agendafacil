# Teste de desempenho

## Escopo

`k6/smoke.js` executa um teste rápido (smoke test) nos endpoints `/health` e `/metrics`. Verifica disponibilidade básica, falhas e latência com poucas requisições simultâneas. Não mede a criação de agendamentos no banco nem representa a carga de produção.

## Executar localmente

1. Inicie a API com npm start.
2. Execute o script por uma instalação local do k6 ou pela imagem oficial do Docker.

No PowerShell, usando k6 instalado:

    $env:BASE_URL="http://localhost:3000"
    k6 run .\k6\smoke.js

No PowerShell, usando Docker Desktop e a imagem k6 1.8.2:

    docker run --rm --memory=128m -v "$($PWD.Path)\k6:/scripts:ro" -e BASE_URL=http://host.docker.internal:3000 grafana/k6:1.8.2 run /scripts/smoke.js

## Critérios do teste rápido

- Taxa de falhas HTTP menor que 1%.
- Latência p95 abaixo de 1 segundo.
- Respostas HTTP 200 em /health e /metrics.

O fluxo do GitHub executa este teste rápido após preparar a API e o banco. Esses limites não são resultados medidos até observarmos uma execução remota e também não representam uma promessa de desempenho.

## Registro da execução

Preencher após executar k6 em uma máquina identificada:

- Data e horário:
- Commit:
- Sistema operacional e hardware:
- Versões do Node.js e k6:
- Comando:
- Iterações:
- Falhas:
- Duração p95:
- Resultado:
- Limitações observadas:
