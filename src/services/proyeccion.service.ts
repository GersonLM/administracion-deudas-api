import { DeudaCalculada, Proyeccion, ProyeccionPorDeuda } from '../types';
import { calcularInteresDelMes, redondear, sumarMeses } from './calculos.service';

const LIMITE_MESES = 600;

interface DeudaSimulada {
  id: string;
  capital: number;
  interes: number;
  config: DeudaCalculada['interes'];
  prioridad: number;
  // Interes que le falta incurrir a ESTA deuda desde hoy (arranca en su
  // interesPendiente de hoy y solo crece con cada devengo futuro; los pagos
  // no lo reducen - es "cuanto interes se le va a cobrar en total de aqui en
  // adelante", no "cuanto le queda pendiente ahora mismo").
  interesFuturo: number;
  mesSaldada: number | null;
}

function interesMensualTotal(deudas: DeudaSimulada[]): number {
  return deudas.reduce((suma, d) => suma + calcularInteresDelMes({ interes: d.config }, d.capital), 0);
}

function saldada(d: DeudaSimulada): boolean {
  return d.capital <= 0.01 && d.interes <= 0.01;
}

function porDeudaVacio(activas: DeudaSimulada[]): ProyeccionPorDeuda[] {
  return activas.map((d) => ({ deudaId: d.id, mesesHastaSaldar: null, fechaEstimada: null, interesFuturo: 0 }));
}

export function calcularProyeccion(deudas: DeudaCalculada[], cuotaMensualObjetivo: number): Proyeccion {
  const activas = deudas
    .filter((d) => d.capitalPendiente + d.interesPendiente > 0.01)
    .sort((a, b) => a.prioridad - b.prioridad)
    .map<DeudaSimulada>((d) => ({
      id: d.id,
      capital: d.capitalPendiente,
      interes: d.interesPendiente,
      config: d.interes,
      prioridad: d.prioridad,
      interesFuturo: d.interesPendiente,
      mesSaldada: null,
    }));

  if (activas.length === 0) {
    return {
      mesesRestantes: 0,
      fechaEstimada: new Date().toISOString(),
      totalInteresProyectado: 0,
      totalAPagar: 0,
      cuotaInsuficiente: false,
      minimoMensualNecesario: 0,
      porDeuda: [],
    };
  }

  const interesPendienteInicial = redondear(activas.reduce((s, d) => s + d.interes, 0));
  const capitalPendienteInicial = redondear(activas.reduce((s, d) => s + d.capital, 0));

  const interesMensualHoy = interesMensualTotal(activas);
  if (cuotaMensualObjetivo <= interesMensualHoy + 0.005) {
    return {
      mesesRestantes: -1,
      fechaEstimada: null,
      totalInteresProyectado: 0,
      totalAPagar: 0,
      cuotaInsuficiente: true,
      minimoMensualNecesario: redondear(interesMensualHoy) + 1,
      porDeuda: porDeudaVacio(activas),
    };
  }

  let meses = 0;
  let totalInteresProyectado = interesPendienteInicial;
  let cuotaInsuficiente = false;
  let minimoMensualNecesario = 0;

  const quedaPendiente = () => activas.some((d) => !saldada(d));

  // El interes inicial de cada deuda ya incluye lo que lleva devengado el
  // mes en curso (ver calcularDeuda), asi que el primer pago del ciclo se
  // aplica directo contra los saldos de entrada, sin devengar de nuevo. El
  // devengo de un mes nuevo pasa al FINAL de cada vuelta, en preparacion
  // para el pago del mes siguiente - evita contar el mes actual dos veces.
  while (quedaPendiente() && meses < LIMITE_MESES) {
    meses++;

    let disponible = cuotaMensualObjetivo;
    for (const d of activas) {
      if (disponible <= 0) break;
      if (d.interes > 0) {
        const pago = Math.min(disponible, d.interes);
        d.interes = redondear(d.interes - pago);
        disponible = redondear(disponible - pago);
      }
    }
    for (const d of activas) {
      if (disponible <= 0) break;
      if (d.capital > 0) {
        const pago = Math.min(disponible, d.capital);
        d.capital = redondear(d.capital - pago);
        disponible = redondear(disponible - pago);
      }
    }

    for (const d of activas) {
      if (d.mesSaldada === null && saldada(d)) d.mesSaldada = meses;
    }

    if (quedaPendiente()) {
      let interesDevengadoProximoMes = 0;
      for (const d of activas) {
        if (saldada(d)) continue;
        const nuevo = calcularInteresDelMes({ interes: d.config }, d.capital);
        d.interes = redondear(d.interes + nuevo);
        d.interesFuturo = redondear(d.interesFuturo + nuevo);
        interesDevengadoProximoMes += nuevo;
      }
      totalInteresProyectado = redondear(totalInteresProyectado + interesDevengadoProximoMes);
    }
  }

  if (quedaPendiente()) {
    cuotaInsuficiente = true;
    minimoMensualNecesario = redondear(interesMensualTotal(activas)) + 1;
  }

  const fechaEstimada = cuotaInsuficiente ? null : sumarMeses(new Date(), meses).toISOString();

  return {
    mesesRestantes: cuotaInsuficiente ? -1 : meses,
    fechaEstimada,
    totalInteresProyectado: cuotaInsuficiente ? 0 : totalInteresProyectado,
    totalAPagar: cuotaInsuficiente ? 0 : redondear(capitalPendienteInicial + totalInteresProyectado),
    cuotaInsuficiente,
    minimoMensualNecesario,
    porDeuda: cuotaInsuficiente
      ? porDeudaVacio(activas)
      : activas.map((d) => ({
          deudaId: d.id,
          mesesHastaSaldar: d.mesSaldada,
          fechaEstimada: d.mesSaldada !== null ? sumarMeses(new Date(), d.mesSaldada).toISOString() : null,
          interesFuturo: redondear(d.interesFuturo),
        })),
  };
}
