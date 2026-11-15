# Arquitetura atual

O AgendaFácil é um protótipo dividido em API Express, frontend React e PostgreSQL acessado pelo Prisma.

## Responsabilidades

- server.js compõe a aplicação Express, registra endpoints HTTP e inicia o servidor.
- appointmentRules.js concentra a regra pura que verifica se um horário está no futuro.
- appointmentAvailability.js interpreta a configuração semanal e calcula horários livres, sem acesso ao banco.
- database.js configura o Prisma Client e o adaptador PostgreSQL.
- logger.js configura logs JSON com Pino e protege cabeçalhos de autorização e cookies contra registro.
- metrics.js registra métricas HTTP e de processo com prom-client.
- auth.js cria e valida sessões do proprietário para as rotas administrativas.
- repositories/ separa as consultas e alterações do PostgreSQL das rotas HTTP, usando o Prisma por trás de uma interface de repositório.
- frontend/src/App.jsx apresenta as telas e envia requisições para a API.
- prisma/schema.prisma define os modelos persistidos.

## Princípio aplicado

O princípio da responsabilidade única (SRP) aparece de forma inicial: a comparação temporal fica isolada em appointmentRules.js, a configuração do banco em database.js e a configuração de logs em logger.js. As rotas ainda estão reunidas em server.js; separar controllers e serviços é uma evolução futura, não algo concluído.

## Padrão de projeto: Adapter

database.js utiliza PrismaPg, adaptador do Prisma para PostgreSQL. Ele faz a ponte entre a interface esperada pelo Prisma Client e o driver pg. Isso mantém os detalhes de conexão concentrados na fronteira do banco.

## Padrão de projeto: Repository

Os módulos em repositories/ concentram as operações de persistência de clientes, serviços e agendamentos. As rotas chamam esses módulos e não precisam conhecer diretamente a forma das consultas Prisma. Essa separação deixa as responsabilidades mais claras e facilita substituir ou simular o acesso a dados em testes futuros. As regras de negócio continuam nas rotas por enquanto.

## Observabilidade

- pino-http registra requisições e respostas em JSON.
- prom-client coleta métricas do processo e publica métricas HTTP em /metrics.
- GET /health indica que o processo da API está respondendo; não verifica a conexão com o banco.

## Fluxo de requisição

1. O navegador envia uma requisição ao backend por meio do proxy do Vite.
2. Pino registra a requisição sem cabeçalhos de autorização ou cookies.
3. Express valida os dados e executa a regra correspondente.
4. Prisma Client conversa com PostgreSQL pelo adaptador PrismaPg.
5. A métrica HTTP é atualizada e a API devolve JSON ao frontend.

## Disponibilidade

`GET /disponibilidade?data=AAAA-MM-DD&servicoId=ID` combina a grade semanal de `BUSINESS_HOURS`, a duração cadastrada do serviço e agendamentos ativos do dia. O cálculo exclui horários passados e sobrepostos. A rota de criação de agendamento verifica conflitos novamente para impedir colisões entre consultas simultâneas.

## Acesso público e administrativo

O catálogo de serviços, a consulta de disponibilidade e a criação pública de uma reserva ficam acessíveis sem sessão. A reserva recebe nome e telefone diretamente e cria o vínculo com o cliente sem retornar a lista de clientes. As rotas de administração usam `autenticarProprietario`; o navegador recebe um cookie de sessão `HttpOnly` e `SameSite=Strict`.
