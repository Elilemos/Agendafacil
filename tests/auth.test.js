import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import {
  cookieDeSessao,
  cookieParaEncerrarSessao,
  limparFalhasLogin,
} from "../auth.js";

const variaveisOriginais = {
  OWNER_EMAIL: process.env.OWNER_EMAIL,
  OWNER_PASSWORD: process.env.OWNER_PASSWORD,
  APP_ORIGIN: process.env.APP_ORIGIN,
};

afterEach(() => {
  for (const [nome, valor] of Object.entries(variaveisOriginais)) {
    if (valor === undefined) {
      delete process.env[nome];
    } else {
      process.env[nome] = valor;
    }
  }

  limparFalhasLogin("::ffff:127.0.0.1");
  limparFalhasLogin("127.0.0.1");
});

describe("autenticação do proprietário", () => {
  it("informa quando faltam credenciais configuradas", async () => {
    delete process.env.OWNER_EMAIL;
    delete process.env.OWNER_PASSWORD;

    const resposta = await request(app)
      .post("/auth/login")
      .send({ email: "dona@example.com", senha: "qualquer" });

    expect(resposta.status).toBe(503);
  });

  it("rejeita credenciais incorretas sem criar sessão", async () => {
    process.env.OWNER_EMAIL = "dona@example.com";
    process.env.OWNER_PASSWORD = "uma-senha-de-teste";

    const resposta = await request(app)
      .post("/auth/login")
      .send({ email: "dona@example.com", senha: "senha-errada" });

    expect(resposta.status).toBe(401);
  });

  it("limita tentativas inválidas por endereço IP", async () => {
    process.env.OWNER_EMAIL = "dona@example.com";
    process.env.OWNER_PASSWORD = "uma-senha-de-teste";

    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
      const resposta = await request(app)
        .post("/auth/login")
        .send({ email: "dona@example.com", senha: "senha-errada" });

      expect(resposta.status).toBe(401);
    }

    const bloqueada = await request(app)
      .post("/auth/login")
      .send({ email: "dona@example.com", senha: "uma-senha-de-teste" });

    expect(bloqueada.status).toBe(429);
  });

  it("cria e encerra uma sessão em cookie HttpOnly", async () => {
    process.env.OWNER_EMAIL = "dona@example.com";
    process.env.OWNER_PASSWORD = "uma-senha-de-teste";

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "DONA@example.com", senha: "uma-senha-de-teste" });

    expect(login.status).toBe(200);
    expect(login.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(login.headers["set-cookie"][0]).toContain("SameSite=Strict");

    const cookie = login.headers["set-cookie"][0].split(";")[0];
    const sessao = await request(app)
      .get("/auth/sessao")
      .set("Cookie", cookie);

    expect(sessao.status).toBe(200);
    expect(sessao.body.autenticado).toBe(true);

    const logout = await request(app)
      .post("/auth/logout")
      .set("Cookie", cookie);

    expect(logout.status).toBe(204);

    const sessaoEncerrada = await request(app)
      .get("/auth/sessao")
      .set("Cookie", cookie);

    expect(sessaoEncerrada.status).toBe(401);
  });

  it("protege a lista de clientes contra acesso anônimo", async () => {
    const resposta = await request(app).get("/clientes");

    expect(resposta.status).toBe(401);
  });

  it("marca cookies como Secure em produção", () => {
    expect(cookieDeSessao("sessao-teste", "production")).toContain("Secure");
    expect(cookieParaEncerrarSessao("production")).toContain("Secure");
  });

  it("trata um cookie malformado como sessão inválida", async () => {
    const resposta = await request(app)
      .get("/auth/sessao")
      .set("Cookie", "agendafacil_sessao=%ZZ");

    expect(resposta.status).toBe(401);
  });

  it("bloqueia origem diferente da configurada", async () => {
    process.env.APP_ORIGIN = "http://localhost:5173";

    const resposta = await request(app)
      .get("/clientes")
      .set("Origin", "https://site-desconhecido.example");

    expect(resposta.status).toBe(403);
  });
});
