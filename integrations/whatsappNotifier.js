const configuracaoPadrao = {
  apiVersion: process.env.WHATSAPP_API_VERSION || "v27.0",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  destinatario: process.env.WHATSAPP_OWNER_NUMBER,
  modelo: process.env.WHATSAPP_TEMPLATE_NAME,
  idioma: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "pt_BR",
};

export async function notificarAgendamento(
  agendamento,
  configuracao = configuracaoPadrao,
  fetchImpl = globalThis.fetch
) {
  const { apiVersion, phoneNumberId, accessToken, destinatario, modelo, idioma } =
    configuracao;

  if (!phoneNumberId || !accessToken || !destinatario || !modelo) {
    return false;
  }

  if (!/^v\d+\.\d+$/.test(apiVersion)) {
    throw new Error("WHATSAPP_API_VERSION deve ter formato como v27.0.");
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("A API fetch não está disponível neste ambiente.");
  }

  const dataHora = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: process.env.TZ || "America/Fortaleza",
  }).format(new Date(agendamento.inicio));

  const resposta = await fetchImpl(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: destinatario,
        type: "template",
        template: {
          name: modelo,
          language: { code: idioma },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: agendamento.cliente.nome },
                { type: "text", text: agendamento.cliente.telefone },
                { type: "text", text: agendamento.servico.nome },
                { type: "text", text: dataHora },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!resposta.ok) {
    throw new Error(
      `A API do WhatsApp respondeu com o status HTTP ${resposta.status}.`
    );
  }

  return true;
}
