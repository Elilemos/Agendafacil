import { prisma } from "../database.js";

export function listarClientes() {
  return prisma.cliente.findMany();
}

export function buscarClientePorId(id) {
  return prisma.cliente.findUnique({ where: { id } });
}

export function criarCliente(dados) {
  return prisma.cliente.create({ data: dados });
}

export function atualizarCliente(id, dados) {
  return prisma.cliente.update({ where: { id }, data: dados });
}
