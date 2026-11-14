import { describe, expect, it } from "vitest";
import { inicioEstaNoFuturo } from "../appointmentRules.js";

describe("inicioEstaNoFuturo", () => {
  const agora = new Date("2026-11-14T12:00:00.000Z");

  it("aceita uma data futura", () => {
    const dataInicio = new Date("2026-11-14T13:00:00.000Z");

    expect(inicioEstaNoFuturo(dataInicio, agora)).toBe(true);
  });

  it("rejeita uma data passada", () => {
    const dataInicio = new Date("2026-11-14T11:00:00.000Z");

    expect(inicioEstaNoFuturo(dataInicio, agora)).toBe(false);
  });

  it("rejeita o horário atual", () => {
    expect(inicioEstaNoFuturo(agora, agora)).toBe(false);
  });
});