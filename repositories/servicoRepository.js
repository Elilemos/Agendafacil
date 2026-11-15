import { prisma } from "../database.js";

export function listarServicos() {
  return prisma.servico.findMany();
}

export function listarServicosPublicos() {
  return prisma.servico.findMany({ where: { ativo: true } });
}

export function listarServicosParaGerenciamento() {
  return listarServicos();
}

export function buscarServicoPorId(id) {
  return prisma.servico.findUnique({ where: { id } });
}

export function criarServico(dados) {
  return prisma.servico.create({ data: dados });
}

export function atualizarServicoAtivo(id, ativo) {
  return prisma.servico.update({ where: { id }, data: { ativo } });
}
