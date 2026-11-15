import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../database.js";
import request from "supertest";
import { app } from "../server.js";
import { obterCookieDeProprietario } from "./testHelpers.js";
import { lerHorariosFuncionamento } from "../appointmentAvailability.js";

const databaseDescribe = process.env.DATABASE_URL_TEST ? describe : describe.skip;

databaseDescribe("Integração com PostgreSQL", () => {
  let clienteId;
  let clienteReservaId;
  let servicoId;
  let agendamentoId;
  let cookieProprietario;

  beforeAll(async () => {
    cookieProprietario = await obterCookieDeProprietario(app);
  });

  afterAll(async () => {
    try {
      if (agendamentoId) {
        await prisma.agendamento.deleteMany({ where: { id: agendamentoId } });
      }
      if (clienteId) {
        await prisma.cliente.deleteMany({ where: { id: clienteId } });
      }
      if (clienteReservaId) {
        await prisma.cliente.deleteMany({ where: { id: clienteReservaId } });
      }
      if (servicoId) {
        await prisma.servico.deleteMany({ where: { id: servicoId } });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("cria e busca um cliente pela API", async () => {
    const nome = `Cliente de integração ${Date.now()}`;
    const criado = await request(app)
      .post("/clientes")
      .set("Cookie", cookieProprietario)
      .send({
        nome,
        telefone: "11999999999",
      });

    expect(criado.status).toBe(201);
    expect(criado.body.id).toEqual(expect.any(Number));
    clienteId = criado.body.id;

    const encontrado = await request(app).get(
      "/clientes/" + criado.body.id
    ).set("Cookie", cookieProprietario);

    expect(encontrado.status).toBe(200);
    expect(encontrado.body.nome).toBe(nome);
  });

  it("consulta disponibilidade e cria uma reserva pública sem sobreposição", async () => {
    const servico = await request(app)
      .post("/servicos")
      .set("Cookie", cookieProprietario)
      .send({ nome: `Serviço de teste ${Date.now()}`, duracaoMinutos: 30, preco: 25 });

    expect(servico.status).toBe(201);
    servicoId = servico.body.id;

    const horariosFuncionamento = lerHorariosFuncionamento(
      process.env.BUSINESS_HOURS
    );
    const hoje = new Date();
    let diaAberto;

    for (let diasAdiante = 1; diasAdiante <= 14; diasAdiante += 1) {
      const candidato = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate() + diasAdiante
      );

      if (horariosFuncionamento.has(candidato.getDay())) {
        diaAberto = candidato;
        break;
      }
    }

    if (!diaAberto) {
      throw new Error("Não há dia de funcionamento configurado nos próximos 14 dias.");
    }

    const data = [
      diaAberto.getFullYear(),
      String(diaAberto.getMonth() + 1).padStart(2, "0"),
      String(diaAberto.getDate()).padStart(2, "0"),
    ].join("-");
    const consulta = await request(app).get(
      `/disponibilidade?data=${data}&servicoId=${servicoId}`
    );

    expect(consulta.status).toBe(200);
    expect(consulta.body.horarios.length).toBeGreaterThan(0);

    const [hora, minuto] = consulta.body.horarios[0].split(":").map(Number);
    const inicio = new Date(
      diaAberto.getFullYear(),
      diaAberto.getMonth(),
      diaAberto.getDate(),
      hora,
      minuto
    );
    const dadosReserva = {
      inicio: inicio.toISOString(),
      nome: "Cliente de reserva pública",
      telefone: "11988887777",
      servicoId,
    };
    const reserva = await request(app)
      .post("/agendamentos/publico")
      .send(dadosReserva);

    expect(reserva.status).toBe(201);
    expect(reserva.body.cliente.nome).toBe(dadosReserva.nome);
    agendamentoId = reserva.body.id;
    clienteReservaId = reserva.body.cliente.id;

    const duplicada = await request(app)
      .post("/agendamentos/publico")
      .send({ ...dadosReserva, nome: "Outro cliente" });

    expect(duplicada.status).toBe(409);
  });
});
