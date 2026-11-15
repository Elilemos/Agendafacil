import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { obterCookieDeProprietario } from "./testHelpers.js";

let cookieProprietario;

beforeAll(async () => {
  cookieProprietario = await obterCookieDeProprietario(app);
});

describe("Validação de clientes", () => {
  it("rejeita um ID inválido na busca", async () => {
    const resposta = await request(app)
      .get("/clientes/abc")
      .set("Cookie", cookieProprietario);

    expect(resposta.status).toBe(400);
  });

  it("rejeita dados vazios ao atualizar cliente", async () => {
    const resposta = await request(app)
      .put("/clientes/1")
      .set("Cookie", cookieProprietario)
      .send({ nome: " ", telefone: "85999990000" });

    expect(resposta.status).toBe(400);
  });

  it("rejeita um corpo JSON malformado", async () => {
    const resposta = await request(app)
      .post("/clientes")
      .set("Cookie", cookieProprietario)
      .set("Content-Type", "application/json")
      .send("{");

    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toBe("Requisição inválida.");
  });

  it("rejeita cadastro de cliente sem nome e telefone", async () => {
    const resposta = await request(app)
      .post("/clientes")
      .set("Cookie", cookieProprietario)
      .send({ nome: "", telefone: "" });

    expect(resposta.status).toBe(400);
  });
});

describe("Validação de serviços", () => {
  it("rejeita serviço com duração inválida", async () => {
    const resposta = await request(app)
      .post("/servicos")
      .set("Cookie", cookieProprietario)
      .send({
        nome: "Corte",
        duracaoMinutos: 0,
        preco: 50,
      });

    expect(resposta.status).toBe(400);
  });
});

describe("Validação de status do agendamento", () => {
  it("rejeita um ID inválido", async () => {
    const resposta = await request(app)
      .patch("/agendamentos/abc/status")
      .set("Cookie", cookieProprietario)
      .send({ status: "CANCELADO" });

    expect(resposta.status).toBe(400);
  });

  it("rejeita um status inválido", async () => {
    const resposta = await request(app)
      .patch("/agendamentos/1/status")
      .set("Cookie", cookieProprietario)
      .send({ status: "DESCONHECIDO" });

    expect(resposta.status).toBe(400);
  });
});

describe("Validação de entrada do agendamento", () => {
  it("rejeita uma data que não pode ser interpretada", async () => {
    const resposta = await request(app)
      .post("/agendamentos/publico")
      .send({
        inicio: "data-inválida",
        nome: "Ana",
        telefone: "85999990000",
        servicoId: 1,
      });

    expect(resposta.status).toBe(400);
  });
});

describe("Validação da disponibilidade", () => {
  it("rejeita data em formato inválido", async () => {
    const resposta = await request(app).get(
      "/disponibilidade?data=16-11-2026&servicoId=1"
    );

    expect(resposta.status).toBe(400);
  });

  it("rejeita uma data que não existe", async () => {
    const resposta = await request(app).get(
      "/disponibilidade?data=2026-02-30&servicoId=1"
    );

    expect(resposta.status).toBe(400);
  });

  it("rejeita um serviçoId inválido", async () => {
    const resposta = await request(app).get(
      "/disponibilidade?data=2026-11-16&servicoId=abc"
    );

    expect(resposta.status).toBe(400);
  });
});
