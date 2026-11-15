# ADR 0002: Repositórios para acesso a dados

- Situação: aceito
- Data: 14/11/2026

## Contexto

As rotas HTTP consultavam o Prisma Client diretamente. Isso misturava o tratamento das requisições com detalhes de persistência e dificultava isolar o acesso ao banco.

## Decisão

Usar o padrão Repository para concentrar as operações de persistência em módulos por domínio: clientes, serviços e agendamentos. As rotas usam esses módulos; eles usam o Prisma Client configurado em `database.js`.

## Justificativa

O repositório oferece uma interface de aplicação para buscar, criar e atualizar dados. Assim, os handlers HTTP não precisam montar consultas Prisma e uma mudança futura no mecanismo de persistência fica mais localizada.

## Consequências

- Acesso ao banco fica separado dos handlers HTTP.
- Regras de negócio ainda estão parcialmente em `server.js` e podem ser extraídas para serviços em outra etapa.
- Testes de integração exercitam o repositório real por meio da API.
