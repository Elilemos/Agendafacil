import express from "express";
import pinoHttp from "pino-http";
import { inicioEstaNoFuturo } from "./appointmentRules.js";
import {
  gerarHorariosDisponiveis,
  lerHorariosFuncionamento,
} from "./appointmentAvailability.js";
import { logger } from "./logger.js";
import {
  autenticarProprietario,
  cookieDeSessao,
  cookieParaEncerrarSessao,
  credenciaisDoProprietarioSaoValidas,
  criarSessao,
  encerrarSessao,
  lerCookie,
  limparFalhasLogin,
  loginBloqueado,
  NOME_COOKIE_SESSAO,
  proprietarioConfigurado,
  registrarFalhaLogin,
} from "./auth.js";
import { notificarAgendamento } from "./integrations/whatsappNotifier.js";
import {
  atualizarCliente,
  buscarClientePorId,
  criarCliente,
  listarClientes,
} from "./repositories/clienteRepository.js";
import {
  atualizarServicoAtivo,
  buscarServicoPorId,
  criarServico,
  listarServicosPublicos,
  listarServicosParaGerenciamento,
} from "./repositories/servicoRepository.js";
import {
  atualizarStatusAgendamento,
  buscarAgendamentoPorId,
  buscarAgendamentosQuePodemConflitar,
  criarAgendamento,
  listarAgendamentosDoDia,
  listarAgendamentos,
} from "./repositories/agendamentoRepository.js";
import {
  agendamentosCriadosTotal,
  httpRequestDurationSeconds,
  httpRequestsTotal,
  register,
} from "./metrics.js";

const app = express();
export { app };

const PORT = Number(process.env.PORT) || 3000;
const statusPermitidos = [
  "AGENDADO",
  "CONFIRMADO",
  "CANCELADO",
  "CONCLUIDO",
];

app.use(pinoHttp({ logger }));

app.use((req, res, next) => {
  if (req.path === "/metrics") {
    return next();
  }

  const encerrarCronometro = httpRequestDurationSeconds.startTimer();

  res.on("finish", () => {
    const rota = req.route ? req.baseUrl + req.route.path : "unmatched";
    const labels = {
      method: req.method,
      route: rota,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    encerrarCronometro(labels);
  });

  next();
});

app.use(express.json());
app.use((req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    req.body = {};
  }

  next();
});

app.get("/auth/sessao", autenticarProprietario, (req, res) => {
  res.json({ autenticado: true });
});

app.post("/auth/login", (req, res) => {
  const { email, senha } = req.body;
  const ip = req.ip;

  if (!proprietarioConfigurado()) {
    return res.status(503).json({
      error: "Configure OWNER_EMAIL e OWNER_PASSWORD no arquivo .env.",
    });
  }

  if (loginBloqueado(ip)) {
    return res.status(429).json({
      error: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.",
    });
  }

  if (
    typeof email !== "string" ||
    typeof senha !== "string" ||
    !credenciaisDoProprietarioSaoValidas(email, senha)
  ) {
    registrarFalhaLogin(ip);
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }

  limparFalhasLogin(ip);
  res.setHeader("Set-Cookie", cookieDeSessao(criarSessao()));
  res.json({ autenticado: true });
});

app.post("/auth/logout", (req, res) => {
  encerrarSessao(lerCookie(req, NOME_COOKIE_SESSAO));
  res.setHeader("Set-Cookie", cookieParaEncerrarSessao());
  res.status(204).end();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/clientes", autenticarProprietario, async (req, res) => {
  const clientes = await listarClientes();
  res.json(clientes);
});

app.get("/servicos", async (req, res) => {
  const servicos = await listarServicosPublicos();
  res.json(servicos);
});

app.get("/servicos/gerenciamento", autenticarProprietario, async (req, res) => {
  const servicos = await listarServicosParaGerenciamento();
  res.json(servicos);
});

app.get("/disponibilidade", async (req, res) => {
  const data = req.query.data;
  const servicoId = Number(req.query.servicoId);

  if (
    typeof data !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
    !Number.isInteger(servicoId) ||
    servicoId < 1
  ) {
    return res.status(400).json({
      error: "Informe uma data no formato AAAA-MM-DD e um servicoId válido.",
    });
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const inicioDoDia = new Date(ano, mes - 1, dia);

  if (
    inicioDoDia.getFullYear() !== ano ||
    inicioDoDia.getMonth() !== mes - 1 ||
    inicioDoDia.getDate() !== dia
  ) {
    return res.status(400).json({ error: "A data informada não existe." });
  }

  const servico = await buscarServicoPorId(servicoId);

  if (!servico) {
    return res.status(404).json({ error: "Serviço não encontrado." });
  }

  if (!servico.ativo) {
    return res.status(409).json({ error: "Este serviço está inativo." });
  }

  const fimDoDia = new Date(ano, mes - 1, dia + 1);
  const [horarios, agendamentos] = await Promise.all([
    Promise.resolve(lerHorariosFuncionamento(process.env.BUSINESS_HOURS)),
    listarAgendamentosDoDia(inicioDoDia, fimDoDia),
  ]);

  res.json({
    data,
    horarios: gerarHorariosDisponiveis({
      data,
      duracaoMinutos: servico.duracaoMinutos,
      horarios,
      agendamentos,
    }),
  });
});

app.post("/servicos", autenticarProprietario, async (req, res) => {
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

  const servico = await criarServico({
    nome,
    descricao,
    duracaoMinutos,
    preco,
  });

  res.status(201).json(servico);
});

app.patch("/servicos/:id/ativo", autenticarProprietario, async (req, res) => {
  const id = Number(req.params.id);
  const { ativo } = req.body;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID de serviço inválido." });
  }

  if (typeof ativo !== "boolean") {
    return res.status(400).json({ error: "Informe ativo como verdadeiro ou falso." });
  }

  const servicoExistente = await buscarServicoPorId(id);

  if (!servicoExistente) {
    return res.status(404).json({ error: "Serviço não encontrado." });
  }

  const servicoAtualizado = await atualizarServicoAtivo(id, ativo);
  res.json(servicoAtualizado);
});

app.get("/clientes/:id", autenticarProprietario, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const cliente = await buscarClientePorId(id);

  if (!cliente) {
    return res.status(404).json({ error: "Cliente não encontrado." });
  }

  res.json(cliente);
});

app.put("/clientes/:id", autenticarProprietario, async (req, res) => {
  const id = Number(req.params.id);
  const { nome, telefone } = req.body;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID inválido." });
  }

  if (
    typeof nome !== "string" ||
    nome.trim() === "" ||
    typeof telefone !== "string" ||
    telefone.trim() === ""
  ) {
    return res.status(400).json({ error: "Informe nome e telefone." });
  }

  const clienteExistente = await buscarClientePorId(id);

  if (!clienteExistente) {
    return res.status(404).json({ error: "Cliente não encontrado." });
  }

  const clienteAtualizado = await atualizarCliente(id, {
    nome: nome.trim(),
    telefone: telefone.trim(),
  });

  res.json(clienteAtualizado);
});

app.post("/clientes", autenticarProprietario, async (req, res) => {
  const { nome, telefone } = req.body;

  if (
    typeof nome !== "string" ||
    nome.trim() === "" ||
    typeof telefone !== "string" ||
    telefone.trim() === ""
  ) {
    return res.status(400).json({
      error: "Nome e telefone são obrigatórios.",
    });
  }

  const cliente = await criarCliente({
    nome: nome.trim(),
    telefone: telefone.trim(),
  });

  res.status(201).json(cliente);
});

app.patch("/agendamentos/:id/status", autenticarProprietario, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID inválido." });
  }

  if (!statusPermitidos.includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }

  const existente = await buscarAgendamentoPorId(id);

  if (!existente) {
    return res.status(404).json({ error: "Agendamento não encontrado." });
  }

  const atualizado = await atualizarStatusAgendamento(id, status);

  res.json(atualizado);
});

async function processarCriacaoAgendamento(
  { dataInicio, clienteId, clienteDados, servicoId },
  req,
  res
) {
  let cliente;

  if (clienteId) {
    cliente = await buscarClientePorId(clienteId);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }
  }

  const servico = await buscarServicoPorId(servicoId);

  if (!servico) {
    return res.status(404).json({ error: "Serviço não encontrado." });
  }

  if (!servico.ativo) {
    return res.status(409).json({ error: "Este serviço está inativo." });
  }

  const novoFim = new Date(
    dataInicio.getTime() + servico.duracaoMinutos * 60_000
  );

  const candidatos = await buscarAgendamentosQuePodemConflitar(novoFim);

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

  const agendamento = await criarAgendamento({
    inicio: dataInicio,
    cliente: clienteId
      ? { connect: { id: clienteId } }
      : {
          create: {
            nome: clienteDados.nome.trim(),
            telefone: clienteDados.telefone.trim(),
          },
        },
    servico: { connect: { id: servicoId } },
  });

  agendamentosCriadosTotal.inc();
  void notificarAgendamento(agendamento).catch((err) => {
    req.log.error(
      { err, agendamentoId: agendamento.id },
      "Falha ao enviar notificação pelo WhatsApp."
    );
  });

  return res.status(201).json(agendamento);
}

app.post("/agendamentos/publico", async (req, res) => {
  const { inicio, nome, telefone, servicoId } = req.body;
  const dataInicio = new Date(inicio);

  if (
    typeof inicio !== "string" ||
    Number.isNaN(dataInicio.getTime()) ||
    typeof nome !== "string" ||
    nome.trim() === "" ||
    typeof telefone !== "string" ||
    telefone.trim() === "" ||
    !Number.isInteger(servicoId) ||
    servicoId < 1
  ) {
    return res.status(400).json({
      error: "Informe data, nome, telefone e servicoId válidos.",
    });
  }

  if (!inicioEstaNoFuturo(dataInicio)) {
    return res.status(400).json({
      error: "O agendamento deve começar em uma data e horário futuros.",
    });
  }

  return processarCriacaoAgendamento(
    {
      dataInicio,
      clienteDados: { nome, telefone },
      servicoId,
    },
    req,
    res
  );
});

app.post("/agendamentos", autenticarProprietario, async (req, res) => {
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

  if (!inicioEstaNoFuturo(dataInicio)) {
    return res.status(400).json({
      error: "O agendamento deve começar em uma data e horário futuros.",
    });
  }

  return processarCriacaoAgendamento(
    { dataInicio, clienteId, servicoId },
    req,
    res
  );
});

app.get("/agendamentos", autenticarProprietario, async (req, res) => {
  const { status } = req.query;

  if (status && !statusPermitidos.includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }

  const agendamentos = await listarAgendamentos(status);

  res.json(agendamentos);
});

app.use((err, req, res, next) => {
  req.log.error({ err }, "Erro não tratado na API");

  if (res.headersSent) {
    return next(err);
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  const mensagem =
    status >= 500 ? "Erro interno do servidor." : "Requisição inválida.";

  res.status(status).json({ error: mensagem });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "API disponível");
  });
}
