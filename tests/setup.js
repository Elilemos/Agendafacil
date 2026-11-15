import "dotenv/config";

if (process.env.DATABASE_URL_TEST) {
  const url = new URL(process.env.DATABASE_URL_TEST);
  const nomeBanco = decodeURIComponent(url.pathname.slice(1));

  if (!nomeBanco.endsWith("_test")) {
    throw new Error(
      "DATABASE_URL_TEST deve apontar para um banco cujo nome termine em _test."
    );
  }

  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

// Garante que a suíte nunca envie mensagens reais, mesmo se o .env local tiver credenciais Meta.
process.env.WHATSAPP_PHONE_NUMBER_ID = "";
process.env.WHATSAPP_ACCESS_TOKEN = "";
process.env.WHATSAPP_OWNER_NUMBER = "";
process.env.WHATSAPP_TEMPLATE_NAME = "";
