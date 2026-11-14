import express from "express";
import { prisma } from "./database.js";

const app = express();
app.use(express.json());
const PORT = 3000;

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.get("/clientes", async (req, res) => {
    const clientes = await prisma.cliente.findMany();
    res.json(clientes);
});

app.get("/servicos", async (req, res) => {
    const servicos = await prisma.servico.findMany();
    res.json(servicos);
});

app.post("/servicos", async (req, res) => {
  const { nome, descricao, duracaoMinutos, preco } = req.body;

  if (
    !nome ||
    !Number.isInteger(duracaoMinutos) ||
    duracaoMinutos <= 0 ||
    typeof preco !== "number" ||
    !Number.isFinite(preco) ||
    preco < 0
  ) {
    return res.status(400).json({
      error: "Informe nome, duração positiva em minutos e preço válido.",
    });
  }

  const servico = await prisma.servico.create({
    data: { nome, descricao, duracaoMinutos, preco },
  });

  res.status(201).json(servico);
});

app.get("/clientes/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id },
  });

  if (!cliente) {
    return res.status(404).json({ error: "Cliente não encontrado." });
  }

  res.json(cliente);
});

app.post("/clientes", async (req, res) => {
    const { nome, telefone } = req.body;

    if (!nome || !telefone) {
        return res.status(400).json({
            error: "Nome e telefone são obrigatórios.",
        });
    }

    const cliente = await prisma.cliente.create({
        data: {nome, telefone},
    });

    res.status(201).json(cliente);
});

app.patch("/agendamentos/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const statusPermitidos = [
    "AGENDADO",
    "CONFIRMADO",
    "CANCELADO",
    "CONCLUIDO",
  ];

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID inválido." });
  }

  if (!statusPermitidos.includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }

  const existente = await prisma.agendamento.findUnique({
    where: { id },
  });

  if (!existente) {
    return res.status(404).json({ error: "Agendamento não encontrado." });
  }

  const atualizado = await prisma.agendamento.update({
    where: { id },
    data: { status },
    include: {
      cliente: true,
      servico: true,
    },
  });

  res.json(atualizado);
});

app.listen(PORT, () => {
    console.log(`API disponível na porta ${PORT}.`);
});

app.post("/agendamentos", async (req, res) => {
  const { inicio, clienteId, servicoId } = req.body;
  const dataInicio = new Date(inicio);

  if (
    typeof inicio !== "string" ||
    Number.isNaN(dataInicio.getTime()) ||
    !Number.isInteger(clienteId) ||
    clienteId < 1 ||
    !Number.isInteger(servicoId) ||
    servicoId < 1
  ) {
    return res.status(400).json({
      error: "Informe uma data válida, clienteId e servicoId.",
    });
  }

  if (dataInicio <= new Date()) {
  return res.status(400).json({
    error: "O agendamento deve começar em uma data e horário futuros.",
  });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
  });

  if (!cliente) {
    return res.status(404).json({ error: "Cliente não encontrado." });
  }

  const servico = await prisma.servico.findUnique({
    where: { id: servicoId },
  });

  if (!servico) {
    return res.status(404).json({ error: "Serviço não encontrado." });
  }

  if (!servico.ativo) {
    return res.status(409).json({ error: "Este serviço está inativo." });
  }

  const novoFim = new Date(
    dataInicio.getTime() + servico.duracaoMinutos * 60_000
  );

  const candidatos = await prisma.agendamento.findMany({
    where: {
      status: { notIn: ["CANCELADO", "CONCLUIDO"] },
      inicio: { lt: novoFim },
    },
    include: { servico: true },
  });

  const temConflito = candidatos.some((existente) => {
    const fimExistente =
      new Date(existente.inicio).getTime() +
      existente.servico.duracaoMinutos * 60_000;

    return dataInicio.getTime() < fimExistente;
  });

  if (temConflito) {
    return res.status(409).json({
      error: "Esse horário se sobrepõe a outro agendamento ativo.",
    });
  }

  const agendamento = await prisma.agendamento.create({
    data: {
      inicio: dataInicio,
      cliente: { connect: { id: clienteId } },
      servico: { connect: { id: servicoId } },
    },
    include: {
      cliente: true,
      servico: true,
    },
  });

  res.status(201).json(agendamento);
});

app.get("/agendamentos", async (req, res) => {
  const { status } = req.query;
  const statusPermitidos = [
    "AGENDADO",
    "CONFIRMADO",
    "CANCELADO",
    "CONCLUIDO",
  ];

  if (status && !statusPermitidos.includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: status ? { status } : {},
    orderBy: { inicio: "asc" },
    include: {
      cliente: true,
      servico: true,
    },
  });

  res.json(agendamentos);
});