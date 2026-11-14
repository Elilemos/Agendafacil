export function inicioEstaNoFuturo(dataInicio, agora = new Date()) {
  return dataInicio.getTime() > agora.getTime();
}

