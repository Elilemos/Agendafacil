import { prisma } from "../database.js";

export function buscarAgendamentoPorId(id) {
  return prisma.agendamento.findUnique({ where: { id } });
}

export function listarAgendamentos(filtroStatus) {
  return prisma.agendamento.findMany({
    where: filtroStatus ? { status: filtroStatus } : {},
    orderBy: { inicio: "asc" },
    include: { cliente: true, servico: true },
  });
}

export function buscarAgendamentosQuePodemConflitar(novoFim) {
  return prisma.agendamento.findMany({
    where: {
      status: { notIn: ["CANCELADO", "CONCLUIDO"] },
      inicio: { lt: novoFim },
    },
    include: { servico: true },
  });
}

export function listarAgendamentosDoDia(inicioDoDia, fimDoDia) {
  return prisma.agendamento.findMany({
    where: {
      status: { notIn: ["CANCELADO", "CONCLUIDO"] },
      inicio: { gte: inicioDoDia, lt: fimDoDia },
    },
    include: { servico: true },
  });
}

export function criarAgendamento(dados) {
  return prisma.agendamento.create({
    data: dados,
    include: { cliente: true, servico: true },
  });
}

export function atualizarStatusAgendamento(id, status) {
  return prisma.agendamento.update({
    where: { id },
    data: { status },
    include: { cliente: true, servico: true },
  });
}
