# Integração com WhatsApp Cloud API

O módulo `integrations/whatsappNotifier.js` prepara uma notificação ao proprietário depois que a API salva um agendamento. Ele usa `fetch` do Node.js e o endpoint `/messages` da WhatsApp Cloud API. A versão da Graph API é configurável.

## Comportamento atual

- Se qualquer variável de configuração estiver vazia, o módulo não faz chamada externa e o agendamento continua normalmente.
- Se o serviço responder com erro, a API registra a falha no log; o agendamento já criado não é desfeito.
- Os testes simulam a resposta HTTP. Nenhuma mensagem real foi enviada ou verificada.

## Configuração necessária

1. Configure uma conta e um número na Meta for Developers.
2. Crie e obtenha aprovação para um modelo de mensagem em português com quatro campos no corpo: nome do cliente, telefone do cliente, serviço e data/hora.
3. Copie os valores para o arquivo `.env` local, sem compartilhá-lo nem enviá-lo ao GitHub:
   - `WHATSAPP_API_VERSION`: versão Graph habilitada para a aplicação Meta.
   - `WHATSAPP_PHONE_NUMBER_ID`: identificador do número comercial.
   - `WHATSAPP_ACCESS_TOKEN`: token de acesso protegido.
   - `WHATSAPP_OWNER_NUMBER`: telefone do proprietário em formato internacional, apenas com dígitos.
   - `WHATSAPP_TEMPLATE_NAME`: nome exato do modelo aprovado.
   - `WHATSAPP_TEMPLATE_LANGUAGE`: idioma aprovado do modelo, por padrão `pt_BR`.
4. Reinicie a API e faça um agendamento de teste usando apenas números autorizados pela conta de testes Meta.

Enquanto essas credenciais e a aprovação do modelo não existirem, a integração permanece desligada. A estrutura da chamada segue a documentação da plataforma Meta; as regras de aprovação e as versões da Graph API podem mudar.
