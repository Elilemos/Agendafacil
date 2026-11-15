const HORARIOS_PADRAO =
  "1=09:00-18:00;2=09:00-18:00;3=09:00-18:00;4=09:00-18:00;5=09:00-18:00;6=09:00-13:00";

function converterHoraParaMinutos(hora) {
  const correspondencia = /^(\d{2}):(\d{2})$/.exec(hora);

  if (!correspondencia) {
    return null;
  }

  const horas = Number(correspondencia[1]);
  const minutos = Number(correspondencia[2]);

  if (horas > 23 || minutos > 59) {
    return null;
  }

  return horas * 60 + minutos;
}

export function lerHorariosFuncionamento(valor = HORARIOS_PADRAO) {
  const horarios = new Map();

  for (const item of valor.split(";")) {
    const correspondencia = /^(\d)=([0-2]\d:[0-5]\d)-([0-2]\d:[0-5]\d)$/.exec(
      item.trim()
    );

    if (!correspondencia) {
      throw new Error(
        "BUSINESS_HOURS deve usar o formato dia=HH:mm-HH:mm, separado por ponto e vírgula."
      );
    }

    const dia = Number(correspondencia[1]);
    const abreMinutos = converterHoraParaMinutos(correspondencia[2]);
    const fechaMinutos = converterHoraParaMinutos(correspondencia[3]);

    if (abreMinutos === null || fechaMinutos === null || abreMinutos >= fechaMinutos) {
      throw new Error("BUSINESS_HOURS contém um horário inválido.");
    }

    if (horarios.has(dia)) {
      throw new Error("BUSINESS_HOURS não pode repetir um dia da semana.");
    }

    horarios.set(dia, { abreMinutos, fechaMinutos });
  }

  return horarios;
}

export function gerarHorariosDisponiveis({
  data,
  duracaoMinutos,
  horarios,
  agendamentos,
  agora = new Date(),
  intervaloMinutos = 30,
}) {
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);

  if (!correspondencia || !Number.isInteger(duracaoMinutos) || duracaoMinutos < 1) {
    return [];
  }

  const ano = Number(correspondencia[1]);
  const mes = Number(correspondencia[2]);
  const dia = Number(correspondencia[3]);
  const inicioDoDia = new Date(ano, mes - 1, dia);

  if (
    inicioDoDia.getFullYear() !== ano ||
    inicioDoDia.getMonth() !== mes - 1 ||
    inicioDoDia.getDate() !== dia
  ) {
    return [];
  }

  const horario = horarios.get(inicioDoDia.getDay());

  if (!horario) {
    return [];
  }

  const disponiveis = [];

  for (
    let inicioMinutos = horario.abreMinutos;
    inicioMinutos + duracaoMinutos <= horario.fechaMinutos;
    inicioMinutos += intervaloMinutos
  ) {
    const hora = String(Math.floor(inicioMinutos / 60)).padStart(2, "0");
    const minuto = String(inicioMinutos % 60).padStart(2, "0");
    const inicio = new Date(ano, mes - 1, dia, Number(hora), Number(minuto));
    const fim = inicio.getTime() + duracaoMinutos * 60_000;

    if (inicio <= agora) {
      continue;
    }

    const sobreposto = agendamentos.some((agendamento) => {
      const inicioExistente = new Date(agendamento.inicio).getTime();
      const fimExistente =
        inicioExistente + agendamento.servico.duracaoMinutos * 60_000;

      return inicio.getTime() < fimExistente && fim > inicioExistente;
    });

    if (!sobreposto) {
      disponiveis.push(`${hora}:${minuto}`);
    }
  }

  return disponiveis;
}
