# ADR 0001: Adaptador PostgreSQL do Prisma

- Status: aceito
- Data: 2026-11-14

## Contexto

A API persiste clientes, serviços e agendamentos em PostgreSQL. O Prisma Client consulta o banco por meio do driver pg.

## Decisão

Usar PrismaPg, de @prisma/adapter-pg, como adaptador entre Prisma Client e o driver PostgreSQL. A instância fica concentrada em database.js e é exportada para a API.

## Justificativa

O Adapter Pattern permite que interfaces diferentes cooperem por meio de um componente intermediário. Neste projeto, PrismaPg conecta a interface do Prisma ao driver pg. Concentrar a configuração em database.js reduz a dispersão dos detalhes de conexão.

## Consequências

- A configuração do banco fica em um único módulo.
- A aplicação usa Prisma Client para consultar o banco.
- Trocar de banco exige outro adaptador e revisar o schema e as consultas.