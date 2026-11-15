import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  cliente: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  servico: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  agendamento: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../database.js", () => ({ prisma: prismaMock }));

import {
  atualizarCliente,
  buscarClientePorId,
  criarCliente,
  listarClientes,
} from "../repositories/clienteRepository.js";
import {
  buscarServicoPorId,
  criarServico,
  listarServicos,
} from "../repositories/servicoRepository.js";
import {
  atualizarStatusAgendamento,
  buscarAgendamentoPorId,
  buscarAgendamentosQuePodemConflitar,
  criarAgendamento,
  listarAgendamentosDoDia,
  listarAgendamentos,
} from "../repositories/agendamentoRepository.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("repositório de clientes", () => {
  it("lista clientes", () => {
    listarClientes();

    expect(prismaMock.cliente.findMany).toHaveBeenCalledWith();
  });

  it("busca cliente pelo ID", () => {
    buscarClientePorId(7);

    expect(prismaMock.cliente.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
    });
  });

  it("cria cliente com os dados recebidos", () => {
    const dados = { nome: "Ana", telefone: "85999990000" };

    criarCliente(dados);

    expect(prismaMock.cliente.create).toHaveBeenCalledWith({ data: dados });
  });

  it("atualiza cliente pelo ID", () => {
    const dados = { nome: "Ana Lima", telefone: "85999990001" };

    atualizarCliente(7, dados);

    expect(prismaMock.cliente.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: dados,
    });
  });
});

describe("repositório de serviços", () => {
  it("lista serviços", () => {
    listarServicos();

    expect(prismaMock.servico.findMany).toHaveBeenCalledWith();
  });

  it("busca serviço pelo ID", () => {
    buscarServicoPorId(3);

    expect(prismaMock.servico.findUnique).toHaveBeenCalledWith({
      where: { id: 3 },
    });
  });

  it("cria serviço com os dados recebidos", () => {
    const dados = { nome: "Corte", duracaoMinutos: 30, preco: 45 };

    criarServico(dados);

    expect(prismaMock.servico.create).toHaveBeenCalledWith({ data: dados });
  });
});

describe("repositório de agendamentos", () => {
  it("busca agendamento pelo ID", () => {
    buscarAgendamentoPorId(9);

    expect(prismaMock.agendamento.findUnique).toHaveBeenCalledWith({
      where: { id: 9 },
    });
  });

  it("lista agendamentos com filtro opcional e relações", () => {
    listarAgendamentos("CONFIRMADO");

    expect(prismaMock.agendamento.findMany).toHaveBeenCalledWith({
      where: { status: "CONFIRMADO" },
      orderBy: { inicio: "asc" },
      include: { cliente: true, servico: true },
    });
  });

  it("lista todos os agendamentos sem filtro", () => {
    listarAgendamentos(undefined);

    expect(prismaMock.agendamento.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { inicio: "asc" },
      include: { cliente: true, servico: true },
    });
  });

  it("busca agendamentos que podem conflitar", () => {
    const novoFim = new Date("2026-12-01T10:30:00.000Z");

    buscarAgendamentosQuePodemConflitar(novoFim);

    expect(prismaMock.agendamento.findMany).toHaveBeenCalledWith({
      where: {
        status: { notIn: ["CANCELADO", "CONCLUIDO"] },
        inicio: { lt: novoFim },
      },
      include: { servico: true },
    });
  });

  it("lista agendamentos ativos dentro do dia", () => {
    const inicioDoDia = new Date("2026-11-16T00:00:00");
    const fimDoDia = new Date("2026-11-17T00:00:00");

    listarAgendamentosDoDia(inicioDoDia, fimDoDia);

    expect(prismaMock.agendamento.findMany).toHaveBeenCalledWith({
      where: {
        status: { notIn: ["CANCELADO", "CONCLUIDO"] },
        inicio: { gte: inicioDoDia, lt: fimDoDia },
      },
      include: { servico: true },
    });
  });

  it("cria agendamento e inclui cliente e serviço", () => {
    const dados = { inicio: new Date(), clienteId: 2, servicoId: 3 };

    criarAgendamento(dados);

    expect(prismaMock.agendamento.create).toHaveBeenCalledWith({
      data: dados,
      include: { cliente: true, servico: true },
    });
  });

  it("atualiza status e inclui cliente e serviço", () => {
    atualizarStatusAgendamento(9, "CANCELADO");

    expect(prismaMock.agendamento.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { status: "CANCELADO" },
      include: { cliente: true, servico: true },
    });
  });
});
