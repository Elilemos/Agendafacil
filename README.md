# AgendaFácil

Sistema de agendamento para salões, barbearias e profissionais de estética. Este repositório é um protótipo acadêmico em desenvolvimento.

## Situação dos requisitos

A matriz de implementação e verificação está em `docs/requirements-status.md`.

## Funcionalidades implementadas

- Cadastro e listagem de clientes e serviços, com opção de desativar e reativar serviços sem apagar o histórico.
- Edição do nome e telefone de clientes.
- Criação e listagem de agendamentos.
- Filtro por status e atualização para confirmado, cancelado ou concluído.
- Rejeição de datas passadas e de horários sobrepostos.
- Consulta de horários disponíveis conforme duração do serviço e configuração `BUSINESS_HOURS`.
- Preparação de notificações ao proprietário pelo WhatsApp Cloud API, ativadas apenas com credenciais configuradas.
- Área do proprietário protegida por sessão autenticada.
- API Express, PostgreSQL, Prisma e adaptador PostgreSQL.
- Padrão Repository para separar rotas e persistência.
- Frontend React/Vite integrado à API.
- Testes unitários e testes HTTP de validação.

## Tecnologias

JavaScript, Node.js, Express, React, Vite, PostgreSQL, Prisma, Docker Compose, Vitest, Supertest, ESLint, Pino, prom-client e k6.

## Requisitos locais

- Node.js 22 ou superior.
- npm.
- Docker Desktop com backend Linux e Docker Compose.
- Docker Desktop para executar o teste rápido do k6 pelo contêiner oficial, ou k6 instalado localmente.

## Configuração local

Se `.env` ainda não existir, copie `.env.example` para criá-lo. Como neste projeto o `.env` já existe, não copie por cima: preserve as configurações atuais do PostgreSQL e acrescente nele `APP_ORIGIN`, `OWNER_EMAIL` e uma senha forte em `OWNER_PASSWORD`. Ajuste `BUSINESS_HOURS` para os dias e horários desejados. O padrão abre de segunda a sexta, das 9h às 18h, e sábado, das 9h às 13h; domingo fica fechado. `TZ` define o fuso usado pelo backend e `APP_ORIGIN` deve corresponder ao endereço do frontend. Nunca envie `.env` ao GitHub.

No terminal da raiz:

    npm ci
    docker compose up -d db
    npx prisma generate
    npx prisma migrate dev
    npm start

A API fica em http://localhost:3000.

Em outro terminal:

    Set-Location .\frontend
    npm ci
    npm run dev

O frontend fica em http://localhost:5173.

## Testes

Na raiz do repositório:

    npm test
    npm run coverage

A cobertura é parcial. Os testes HTTP de validação não acessam o banco. Os testes com PostgreSQL são executados quando `DATABASE_URL_TEST` aponta para um banco de teste isolado; a integração contínua cria um banco temporário para isso. Não configure `DATABASE_URL_TEST` para usar seu banco local de desenvolvimento. O relatório fica na pasta `coverage/` e não deve ser enviado ao GitHub.

## Integração contínua

O fluxo de integração contínua em `.github/workflows/ci.yml` é executado quando há envio de alterações ou solicitação de revisão para a branch `master`. Ele prepara um PostgreSQL temporário, gera o Prisma Client, aplica as migrações, executa os testes e calcula a cobertura. Também roda o teste rápido do k6, o ESLint e a compilação do frontend.

## Documentação

- Contrato da API: `docs/openapi.yaml`.
- Arquitetura e responsabilidades: `docs/architecture.md`.
- Autenticação do proprietário: `docs/autenticacao.md`.
- Decisão arquitetural: `docs/adr/0001-adapter-postgresql.md`.
- Padrão Repository: `docs/adr/0002-repository-pattern.md`.
- Objetivos de nível de serviço: `docs/slo.md`.
- Teste rápido de desempenho: `docs/performance.md` e `k6/smoke.js`.
- Configuração da integração com WhatsApp: `docs/whatsapp.md`.
- Colaboradores: `CONTRIBUTORS.md`.

## Limitações conhecidas

Esta versão ainda não deve ser exposta publicamente com dados reais sem revisão de segurança e implantação adequada. A autenticação local do proprietário usa uma sessão em memória, que expira após oito horas e é perdida quando a API reinicia; ainda não há configuração de horários pelo painel nem publicação em hospedagem. O adaptador WhatsApp está no código, mas o envio real depende de conta Meta, credenciais e um modelo aprovado; nada disso está configurado neste repositório. Os horários podem ser definidos por `BUSINESS_HOURS` no `.env`. Os objetivos de nível de serviço são propostas, não medições mensais.
