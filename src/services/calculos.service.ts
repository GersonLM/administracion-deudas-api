import { DeudaDoc } from '../models/deuda.model';
import { AbonoDoc } from '../models/abono.model';
import { DeudaCalculada, Interes } from '../types';

export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function mesesTranscurridos(desde: Date, hasta: Date): number {
  let meses = (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());
  if (hasta.getDate() < desde.getDate()) meses -= 1;
  return Math.max(0, meses);
}

export function sumarMeses(fecha: Date, cantidad: number): Date {
  const resultado = new Date(fecha);
  resultado.setMonth(resultado.getMonth() + cantidad);
  return resultado;
}

const MESES_POR_ANIO = 12;

/**
 * El % que se ingresa para una deuda con interes mensual es una tasa ANUAL
 * (ej. 6 = 6% anual), igual que una tasa de interes de un prestamo comun.
 * La tasa mensual efectiva que se aplica sobre el saldo es valorAnual / 12.
 */
export function tasaMensualDesdeAnual(valorAnual: number): number {
  return valorAnual / MESES_POR_ANIO;
}

/**
 * Interes que genera la deuda EN EL MES ACTUAL sobre el capital pendiente
 * (para 'fijo' es el monto fijo, sin importar el capital).
 */
export function calcularInteresDelMes(
  deuda: Pick<DeudaDoc, 'interes'>,
  capitalPendiente: number
): number {
  const { tipo, modalidad, valor } = deuda.interes;
  if (tipo === 'ninguno' || modalidad === 'total') return 0;
  if (tipo === 'fijo') return valor;
  return (Math.max(0, capitalPendiente) * tasaMensualDesdeAnual(valor)) / 100;
}

/**
 * La config de interes que regia en una fecha dada. `historialInteres` solo
 * guarda tramos YA CERRADOS (ver deuda.model.ts); si ninguno cubre la fecha
 * (lo mas comun: la deuda nunca se edito, o la fecha es posterior al ultimo
 * cambio), la config vigente (`deuda.interes`) es la que aplica.
 */
export function configDeInteresEn(
  deuda: Pick<DeudaDoc, 'interes' | 'historialInteres'>,
  fecha: Date
): Interes {
  const tramo = (deuda.historialInteres ?? []).find((t) => fecha >= t.desde && fecha < t.hasta);
  return tramo ?? deuda.interes;
}

/**
 * Interes pendiente de una deuda con interes MENSUAL (fijo o porcentaje).
 *
 * El interes que el usuario registra en un abono es la palabra final de
 * cuanto se cobro ese mes - no una comparacion contra una formula. Por eso
 * el "reloj" del interes se reinicia en la fecha del ultimo abono (o en
 * fechaInicio si todavia no hay ninguno): lo que se pago ahi salda TODO lo
 * devengado hasta esa fecha, sin dejar diferencia pendiente si se pago
 * menos de lo que la formula hubiera sugerido. Desde esa fecha se cuenta
 * de nuevo, igual que una deuda recien creada.
 *
 * Como no puede haber otro abono entre la fecha base y hoy (por definicion
 * es el ultimo), el capital pendiente no cambia en ese tramo. Lo que SI
 * puede cambiar mes a mes es la tasa/config de interes, si el usuario edito
 * la deuda en algun punto de ese tramo: cada mes (completo + el actual) se
 * cobra con la config que regia AL INICIO de ese mes (sin prorrateo por
 * dias), usando el historial de tramos cerrados.
 */
function calcularInteresPendienteMensual(
  deuda: Pick<DeudaDoc, 'interes' | 'historialInteres'>,
  capitalPendiente: number,
  fechaBaseInteres: Date,
  hasta: Date
): number {
  const mesesCompletosDesdeUltimoPago = mesesTranscurridos(fechaBaseInteres, hasta);
  let total = 0;
  for (let k = 0; k <= mesesCompletosDesdeUltimoPago; k++) {
    const inicioDelMes = sumarMeses(fechaBaseInteres, k);
    const config = configDeInteresEn(deuda, inicioDelMes);
    total += calcularInteresDelMes({ interes: config }, capitalPendiente);
  }
  return total;
}

export function calcularDeuda(deuda: DeudaDoc, abonos: AbonoDoc[]): DeudaCalculada {
  const abonosOrdenados = [...abonos].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const capitalPagado = redondear(abonosOrdenados.reduce((s, a) => s + a.montoCapital, 0));
  const interesPagado = redondear(abonosOrdenados.reduce((s, a) => s + a.montoInteres, 0));
  const capitalPendiente = redondear(Math.max(0, deuda.montoCapital - capitalPagado));
  const interesDelMesActual = redondear(calcularInteresDelMes(deuda, capitalPendiente));

  const { tipo, modalidad, valor } = deuda.interes;
  let interesPendiente: number;
  if (tipo === 'ninguno') {
    interesPendiente = 0;
  } else if (modalidad === 'total') {
    // Interes de una sola vez: no se reinicia con los abonos, se va pagando
    // igual que el capital hasta saldar el monto original.
    const interesTotalUnaVez = tipo === 'fijo' ? valor : (deuda.montoCapital * valor) / 100;
    interesPendiente = Math.max(0, interesTotalUnaVez - interesPagado);
  } else {
    const ultimoAbono = abonosOrdenados[abonosOrdenados.length - 1];
    const fechaBaseInteres = ultimoAbono ? ultimoAbono.fecha : deuda.fechaInicio;
    interesPendiente = calcularInteresPendienteMensual(deuda, capitalPendiente, fechaBaseInteres, new Date());
  }
  interesPendiente = redondear(interesPendiente);

  const interesAcumulado = redondear(interesPendiente + interesPagado);
  const deudaActual = redondear(capitalPendiente + interesPendiente);
  const progreso = deuda.montoCapital > 0 ? redondear(capitalPagado / deuda.montoCapital) : 0;

  return {
    id: deuda._id.toString(),
    acreedor: deuda.acreedor,
    montoCapital: deuda.montoCapital,
    interes: deuda.interes,
    historialInteres: (deuda.historialInteres ?? []).map((t) => ({
      tipo: t.tipo,
      modalidad: t.modalidad,
      valor: t.valor,
      desde: t.desde.toISOString(),
      hasta: t.hasta.toISOString(),
    })),
    fechaInicio: deuda.fechaInicio.toISOString(),
    prioridad: deuda.prioridad,
    estado: deuda.estado,
    notas: deuda.notas ?? undefined,
    capitalPagado,
    interesPagado,
    capitalPendiente,
    interesAcumulado,
    interesPendiente,
    deudaActual,
    progreso,
    interesDelMesActual,
  };
}

export function estadoSegunSaldo(capitalPendiente: number, interesPendiente: number): 'activa' | 'pagada' {
  return capitalPendiente <= 0.01 && interesPendiente <= 0.01 ? 'pagada' : 'activa';
}
