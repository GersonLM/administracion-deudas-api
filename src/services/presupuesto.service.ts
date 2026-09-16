import { CicloMensual, CicloMensualDoc } from '../models/ciclo-mensual.model';
import { SemanaPresupuesto, SemanaPresupuestoDoc } from '../models/semana-presupuesto.model';
import { GastoSemana } from '../models/gasto-semana.model';
import { redondear } from './calculos.service';
import { CicloCalculado, GastoFijoCalculado, SemanaCalculada } from '../types';
import { AppError } from '../utils/AppError';

function medianocheUTC(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

function sumarDiasUTC(fecha: Date, dias: number): Date {
  const resultado = medianocheUTC(fecha);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

function diasEntre(desde: Date, hasta: Date): number {
  return Math.round((medianocheUTC(hasta).getTime() - medianocheUTC(desde).getTime()) / 86_400_000);
}

/**
 * Suma un mes calendario en UTC, recortando al ultimo dia del mes destino
 * si este es mas corto (31 ago + 1 mes = 30 sep, no 1 oct). Deliberadamente
 * NO se reutiliza el `sumarMeses` de calculos.service.ts: ese usa metodos
 * de fecha en hora LOCAL (por como ya esta validado con los calculos de
 * interes reales) y no recorta el dia - mezclar ambos enfoques en un mismo
 * ciclo (fechaInicio/fechaFin) podria desalinear el arranque de las
 * semanas calendario en un dia segun la zona horaria del servidor.
 */
export function sumarUnMesUTC(fecha: Date): Date {
  const base = medianocheUTC(fecha);
  const anio = base.getUTCFullYear();
  const mes = base.getUTCMonth();
  const dia = base.getUTCDate();
  const ultimoDiaMesSiguiente = new Date(Date.UTC(anio, mes + 2, 0)).getUTCDate();
  return new Date(Date.UTC(anio, mes + 1, Math.min(dia, ultimoDiaMesSiguiente)));
}

/**
 * Parte [fechaInicioCiclo, fechaFinCiclo) en semanas calendario (lunes a
 * domingo). La primera y la ultima semana quedan parciales si el ciclo no
 * arranca un lunes o no termina un domingo.
 */
export function generarRangosDeSemanas(
  fechaInicioCiclo: Date,
  fechaFinCiclo: Date
): Array<{ fechaInicio: Date; fechaFin: Date }> {
  const rangos: Array<{ fechaInicio: Date; fechaFin: Date }> = [];
  let cursor = medianocheUTC(fechaInicioCiclo);
  const fin = medianocheUTC(fechaFinCiclo);

  while (cursor < fin) {
    const diaSemana = cursor.getUTCDay(); // 0 = domingo, 1 = lunes, ... 6 = sabado
    const diasHastaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
    const finSemanaCalendario = sumarDiasUTC(cursor, diasHastaDomingo); // el domingo de esa semana
    const finExclusivo = sumarDiasUTC(finSemanaCalendario, 1); // el lunes siguiente
    const finReal = finExclusivo < fin ? finExclusivo : fin;
    rangos.push({ fechaInicio: cursor, fechaFin: finReal });
    cursor = finReal;
  }

  return rangos;
}

export async function crearSemanasParaCiclo(ciclo: CicloMensualDoc): Promise<void> {
  const rangos = generarRangosDeSemanas(ciclo.fechaInicio, ciclo.fechaFin);
  await SemanaPresupuesto.insertMany(
    rangos.map((rango) => ({
      cicloId: ciclo._id,
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
      montoAsignado: 0,
      congelada: false,
      cerrada: false,
    }))
  );
}

function totalGastosFijos(ciclo: Pick<CicloMensualDoc, 'gastosFijos'>): number {
  return ciclo.gastosFijos.reduce((suma, g) => suma + g.monto, 0);
}

/**
 * Congela (fija montoAsignado y lo persiste) las semanas cuyo rango de
 * fechas ya TERMINO (fechaFin <= hoy) - esas quedan fuera de cualquier
 * recalculo futuro, se hayan cerrado formalmente o no. Las que siguen
 * abiertas (la semana en curso y las futuras) reciben un monto calculado
 * EN VIVO (sin persistir) repartiendo por dias lo que queda del fondo del
 * mes una vez descontadas las semanas ya terminadas y los gastos fijos -
 * asi que agregar/editar un gasto fijo SI ajusta la semana en curso, solo
 * las que ya terminaron quedan intactas. Se debe llamar cada vez que se
 * lee un ciclo (mismo patron que recalcularEstadoDeDeuda en
 * deudas.service.ts).
 */
export async function sincronizarSemanas(ciclo: CicloMensualDoc): Promise<SemanaPresupuestoDoc[]> {
  const semanas = await SemanaPresupuesto.find({ cicloId: ciclo._id }).sort({ fechaInicio: 1 });
  const hoy = medianocheUTC(new Date());
  const montoDisponible = redondear(ciclo.montoIngresado - totalGastosFijos(ciclo));

  const congeladasExistentes = semanas.filter((s) => s.congelada);
  const porCongelarAhora = semanas.filter((s) => !s.congelada && s.fechaFin <= hoy);
  const abiertas = semanas.filter((s) => !s.congelada && s.fechaFin > hoy); // en curso + futuras

  const montoYaCongelado = redondear(congeladasExistentes.reduce((s, sem) => s + sem.montoAsignado, 0));
  const poolRestante = redondear(montoDisponible - montoYaCongelado);
  const pendientes = [...porCongelarAhora, ...abiertas];
  const diasRestantes = pendientes.reduce((s, sem) => s + diasEntre(sem.fechaInicio, sem.fechaFin), 0);

  const calcularCuota = (semana: SemanaPresupuestoDoc): number => {
    if (diasRestantes <= 0) return 0;
    const dias = diasEntre(semana.fechaInicio, semana.fechaFin);
    return redondear(poolRestante * (dias / diasRestantes));
  };

  if (porCongelarAhora.length > 0) {
    for (const semana of porCongelarAhora) {
      semana.montoAsignado = calcularCuota(semana);
      semana.congelada = true;
    }
    await Promise.all(porCongelarAhora.map((s) => s.save()));
  }

  for (const semana of abiertas) {
    semana.montoAsignado = calcularCuota(semana);
  }

  return semanas;
}

export async function obtenerCicloCalculado(ciclo: CicloMensualDoc): Promise<CicloCalculado> {
  const semanas = await sincronizarSemanas(ciclo);
  const gastos = await GastoSemana.find({ semanaId: { $in: semanas.map((s) => s._id) } });

  const hoy = medianocheUTC(new Date());
  const semanasCalculadas: SemanaCalculada[] = semanas.map((semana) => {
    const gastosDeSemana = gastos.filter((g) => g.semanaId.toString() === semana._id.toString());
    const gastado = redondear(gastosDeSemana.reduce((s, g) => s + g.monto, 0));
    return {
      id: semana._id.toString(),
      cicloId: semana.cicloId.toString(),
      fechaInicio: semana.fechaInicio.toISOString(),
      fechaFin: semana.fechaFin.toISOString(),
      montoAsignado: semana.montoAsignado,
      congelada: semana.congelada,
      cerrada: semana.cerrada,
      notaCobertura: semana.notaCobertura ?? undefined,
      gastado,
      restante: redondear(semana.montoAsignado - gastado),
      diasEnSemana: diasEntre(semana.fechaInicio, semana.fechaFin),
      pendienteDeCierre: !semana.cerrada && medianocheUTC(semana.fechaFin) <= hoy,
    };
  });

  const gastosFijos: GastoFijoCalculado[] = ciclo.gastosFijos.map((g) => ({
    id: (g as unknown as { _id: { toString(): string } })._id.toString(),
    descripcion: g.descripcion,
    monto: g.monto,
    fechaRegistro: g.fechaRegistro.toISOString(),
  }));

  const totalGastosFijosMonto = redondear(totalGastosFijos(ciclo));
  const montoDisponible = redondear(ciclo.montoIngresado - totalGastosFijosMonto);
  const totalAsignado = redondear(semanasCalculadas.reduce((s, sem) => s + sem.montoAsignado, 0));
  const totalGastado = redondear(semanasCalculadas.reduce((s, sem) => s + sem.gastado, 0));

  return {
    id: ciclo._id.toString(),
    fechaInicio: ciclo.fechaInicio.toISOString(),
    fechaFin: ciclo.fechaFin.toISOString(),
    montoIngresado: ciclo.montoIngresado,
    gastosFijos,
    totalGastosFijos: totalGastosFijosMonto,
    montoDisponible,
    estado: ciclo.estado,
    cierre: ciclo.cierre
      ? { tipo: ciclo.cierre.tipo, monto: ciclo.cierre.monto, destino: ciclo.cierre.destino }
      : null,
    semanas: semanasCalculadas,
    totalAsignado,
    totalGastado,
    totalRestante: redondear(totalAsignado - totalGastado),
    puedeCerrarse:
      ciclo.estado === 'abierto' && medianocheUTC(ciclo.fechaFin) <= hoy && semanasCalculadas.every((s) => s.cerrada),
  };
}

export async function obtenerCicloAbierto(): Promise<CicloMensualDoc | null> {
  return CicloMensual.findOne({ estado: 'abierto' });
}

export async function requerirSemana(semanaId: string) {
  const semana = await SemanaPresupuesto.findById(semanaId);
  if (!semana) throw new AppError(404, 'Semana no encontrada');
  return semana;
}

export async function requerirGastoSemana(gastoId: string) {
  const gasto = await GastoSemana.findById(gastoId);
  if (!gasto) throw new AppError(404, 'Gasto no encontrado');
  return gasto;
}
