import request from "supertest";

export async function obterCookieDeProprietario(app) {
  const emailOriginal = process.env.OWNER_EMAIL;
  const senhaOriginal = process.env.OWNER_PASSWORD;
  process.env.OWNER_EMAIL = "proprietario@teste.invalid";
  process.env.OWNER_PASSWORD = "senha-apenas-para-testes";

  try {
    const resposta = await request(app)
      .post("/auth/login")
      .send({
        email: process.env.OWNER_EMAIL,
        senha: process.env.OWNER_PASSWORD,
      });

    if (resposta.status !== 200) {
      throw new Error("Não foi possível iniciar a sessão de teste.");
    }

    return resposta.headers["set-cookie"][0].split(";")[0];
  } finally {
    if (emailOriginal === undefined) {
      delete process.env.OWNER_EMAIL;
    } else {
      process.env.OWNER_EMAIL = emailOriginal;
    }

    if (senhaOriginal === undefined) {
      delete process.env.OWNER_PASSWORD;
    } else {
      process.env.OWNER_PASSWORD = senhaOriginal;
    }
  }
}
