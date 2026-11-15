# Status dos requisitos de entrega

Atualizado em 14/11/2026. “Implementado” significa que o código ou documento está no projeto. “Verificado” significa que observamos a execução neste ambiente. Isso não substitui uma execução pelo avaliador.

| Requisito | Situação | Evidência e limite |
| --- | --- | --- |
| Docker Compose | Verificado anteriormente | PostgreSQL iniciou localmente; o compose atual contém o serviço do banco. |
| SOLID | Parcial | Persistência, regra temporal, logs e métricas estão em módulos separados; rotas e regras de negócio ainda estão parcialmente concentradas em `server.js`. |
| Design Pattern | Implementado | Adapter do Prisma para PostgreSQL e Repository para persistência, documentados nos ADRs 0001 e 0002. |
| Testes unitários | Verificado | Testes da regra de horário, validações HTTP e delegação dos repositórios passaram. |
| Teste de integração | Implementado, execução remota pendente | Supertest cobre HTTP; há teste real com PostgreSQL isolado no CI. Localmente ele é ignorado sem DATABASE_URL_TEST. |
| Cobertura | Verificado | Última execução local: 76,94% de linhas/declarações; ramificações 69,69%; funções 89,65%. Foram 49 testes aprovados e 2 testes de integração PostgreSQL ignorados por não haver `DATABASE_URL_TEST` local. |
| Integração contínua | Configurada, falta verificar no GitHub | O fluxo executa a geração do Prisma Client, migrações, testes, cobertura, k6, análise estática e compilação. Ainda não observamos uma execução no GitHub. |
| .env.example | Implementado | Contém valores ilustrativos, não credenciais reais. |
| Logs estruturados | Implementado, falta conferir no terminal | Pino e pino-http configurados; headers Authorization e Cookie redigidos. |
| Métrica | Verificado por teste HTTP | prom-client expõe /metrics; há contador de agendamentos criados e métricas HTTP. |
| SLO | Proposto | Objetivos documentados; não há dados de 30 dias. |
| README | Atualizado | Instruções locais, testes e limitações descritos. |
| ADR | Implementado | Decisão do adaptador PostgreSQL documentada. |
| OpenAPI 3.1 | Rascunho implementado | Contrato em `docs/openapi.yaml`; ainda não validado por uma ferramenta OpenAPI. |
| Teste rápido do k6 | Script e execução na integração contínua configurados; falta executar no GitHub | O fluxo usa a imagem oficial do k6; ainda não houve execução no GitHub. |
| Desempenho | Documentação preparada | Existe roteiro e modelo de resultados; ainda não há resultados medidos. |
| `CONTRIBUTORS.md` | Implementado | Arquivo criado com o colaborador do repositório. |
| Autenticação do proprietário | Implementada para o protótipo | Cookie HttpOnly/SameSite, sessão de oito horas, validação de origem e bloqueio temporário após cinco tentativas; armazenamento em memória não serve para múltiplas instâncias. |
| Horários de funcionamento/disponibilidade | Parcial | Horários podem ser configurados em `BUSINESS_HOURS`; `GET /disponibilidade` calcula opções livres. Ainda não há tela administrativa para editar a grade. |
| WhatsApp Cloud API | Adaptador implementado; envio real pendente | Há envio por modelo e teste simulado. Requer conta Meta, credenciais e modelo aprovado; não foi feita chamada real. |
| Publicação em hospedagem | Não implementada | Projeto permanece para desenvolvimento local. |
