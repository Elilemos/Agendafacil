import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../server.js";

describe("POST /agendamentos", () => {
  it("rejeita uma data passada", async () => {
    const resposta = await request(app)
      .post("/agendamentos")
      .send({
        inicio: "2020-01-01T12:00:00.000Z",
        clienteId: 1,
        servicoId: 1,
      });

    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toBe(
      "O agendamento deve começar em uma data e horário futuros."
    );
  });

  it("rejeita um clienteId inválido", async () => {
        const resposta = await request(app)
        .post("/agendamentos")
        .send({
        inicio: "2099-01-01T12:00:00.000Z",
        clienteId: 0,
        servicoId: 1,
        });

  expect(resposta.status).toBe(400);
});

describe("GET /agendamentos", () => {
  it("rejeita um filtro de status inválido", async () => {
    const resposta = await request(app).get(
      "/agendamentos?status=DESCONHECIDO"
    );

    expect(resposta.status).toBe(400);
  });
});
});