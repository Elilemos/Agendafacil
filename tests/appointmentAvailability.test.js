import { describe, expect, it } from "vitest";
import {
  gerarHorariosDisponiveis,
  lerHorariosFuncionamento,
} from "../appointmentAvailability.js";

describe("lerHorariosFuncionamento", () => {
  it("converte horários semanais para minutos", () => {
    const horarios = lerHorariosFuncionamento("1=09:00-18:00;6=09:00-13:00");

    expect(horarios.get(1)).toEqual({ abreMinutos: 540, fechaMinutos: 1080 });
    expect(horarios.get(6)).toEqual({ abreMinutos: 540, fechaMinutos: 780 });
    expect(horarios.has(0)).toBe(false);
  });

  it("rejeita uma faixa de horário inválida", () => {
    expect(() => lerHorariosFuncionamento("1=18:00-09:00")).toThrow(
      "BUSINESS_HOURS contém um horário inválido."
    );
  });
});

describe("gerarHorariosDisponiveis", () => {
  const horarios = lerHorariosFuncionamento("1=09:00-11:00");

  it("gera horários dentro da faixa de funcionamento", () => {
    const disponiveis = gerarHorariosDisponiveis({
      data: "2026-11-16",
      duracaoMinutos: 60,
      horarios,
      agendamentos: [],
      agora: new Date("2026-11-15T12:00:00"),
    });

    expect(disponiveis).toEqual(["09:00", "09:30", "10:00"]);
  });

  it("remove horários que se sobrepõem a agendamentos existentes", () => {
    const disponiveis = gerarHorariosDisponiveis({
      data: "2026-11-16",
      duracaoMinutos: 30,
      horarios,
      agendamentos: [
        {
          inicio: new Date("2026-11-16T09:30:00"),
          servico: { duracaoMinutos: 30 },
        },
      ],
      agora: new Date("2026-11-15T12:00:00"),
    });

    expect(disponiveis).toEqual(["09:00", "10:00", "10:30"]);
  });

  it("não oferece horários passados nem datas inválidas", () => {
    const disponiveis = gerarHorariosDisponiveis({
      data: "2026-11-16",
      duracaoMinutos: 30,
      horarios,
      agendamentos: [],
      agora: new Date("2026-11-16T09:30:00"),
    });
    const dataInvalida = gerarHorariosDisponiveis({
      data: "2026-02-30",
      duracaoMinutos: 30,
      horarios,
      agendamentos: [],
    });

    expect(disponiveis[0]).toBe("10:00");
    expect(dataInvalida).toEqual([]);
  });
});
