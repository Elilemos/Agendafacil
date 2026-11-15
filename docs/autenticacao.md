# Autenticação do proprietário

O acesso ao painel administrativo usa as variáveis `OWNER_EMAIL` e `OWNER_PASSWORD` do `.env`. As rotas administrativas exigem uma sessão; a lista pública de serviços e a reserva pública permanecem abertas.

## Sessão

- Após validar as credenciais, a API cria um identificador aleatório de sessão e o guarda em memória por até oito horas.
- O navegador recebe o identificador em um cookie `HttpOnly` e `SameSite=Strict`; em produção, o cookie também recebe `Secure`.
- A API aceita requisições administrativas apenas da origem configurada em `APP_ORIGIN`, quando a requisição envia o cabeçalho `Origin`.
- Depois de cinco tentativas inválidas do mesmo IP, novas tentativas ficam bloqueadas por 15 minutos.
- Reiniciar a API encerra todas as sessões. O armazenamento em memória também não serve para múltiplas instâncias.

## Configuração local

Preencha `OWNER_EMAIL`, `OWNER_PASSWORD` e `APP_ORIGIN` no `.env`, sem incluir esse arquivo em commits. O painel não permite acesso enquanto as credenciais estiverem vazias. A senha fica fora do banco e deve ser forte e exclusiva para este projeto.

Esta autenticação atende ao protótipo local. Antes de publicar, é necessário revisar armazenamento de sessões, limitação de tentativas em ambiente com múltiplas instâncias, HTTPS, recuperação de conta e demais requisitos de produção.
