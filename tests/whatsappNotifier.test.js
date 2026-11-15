import { describe, expect, it, vi } from "vitest";
import { notificarAgendamento } from "../integrations/whatsappNotifier.js";

const agendamento = {
  inicio: "2026-11-20T12:00:00.000Z",
  cliente: { nome: "Ana", telefone: "85999990000" },
  servico: { nome: "Corte" },
};

const configuracao = {
  apiVersion: "v27.0",
  phoneNumberId: "123456",
  accessToken: "token-de-teste",
  destinatario: "5585999990000",
  modelo: "agenda_agendamento_criado",
  idioma: "pt_BR",
};

describe("notificarAgendamento", () => {
  it("não faz chamadas quando faltam credenciais", async () => {
    const fetchSimulado = vi.fn();

    const enviado = await notificarAgendamento(agendamento, {}, fetchSimulado);

    expect(enviado).toBe(false);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("envia um modelo com os dados do agendamento", async () => {
    const fetchSimulado = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const enviado = await notificarAgendamento(
      agendamento,
      configuracao,
      fetchSimulado
    );

    expect(enviado).toBe(true);
    expect(fetchSimulado).toHaveBeenCalledWith(
      "https://graph.facebook.com/v27.0/123456/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token-de-teste",
        }),
      })
    );

    const corpo = JSON.parse(fetchSimulado.mock.calls[0][1].body);
    expect(corpo.messaging_product).toBe("whatsapp");
    expect(corpo.to).toBe("5585999990000");
    expect(corpo.template.name).toBe("agenda_agendamento_criado");
    expect(corpo.template.components[0].parameters).toHaveLength(4);
  });

  it("relata falha HTTP sem expor o token", async () => {
    const fetchSimulado = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401 });

    await expect(
      notificarAgendamento(agendamento, configuracao, fetchSimulado)
    ).rejects.toThrow("A API do WhatsApp respondeu com o status HTTP 401.");
  });
});
