import client from "prom-client";

export const register = new client.Registry();

register.setDefaultLabels({ app: "agendafacil" });
client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total de requisições HTTP finalizadas.",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duração das requisições HTTP em segundos.",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

export const agendamentosCriadosTotal = new client.Counter({
  name: "agendafacil_agendamentos_criados_total",
  help: "Total de agendamentos criados com sucesso.",
  registers: [register],
});