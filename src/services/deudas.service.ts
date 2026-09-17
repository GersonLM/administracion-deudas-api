import { Deuda, DeudaDoc } from '../models/deuda.model';
import { Abono, AbonoDoc } from '../models/abono.model';
import { obtenerConfiguracion } from '../models/configuracion.model';
import { calcularDeuda, estadoSegunSaldo, redondear } from './calculos.service';
import { calcularProyeccion } from './proyeccion.service';
import { DeudaCalculada, ProyeccionDeUnaDeuda } from '../types';
import { AppError } from '../utils/AppError';

async function sincronizarEstado(deuda: DeudaDoc, calculada: DeudaCalculada): Promise<void> {
  const estado = estadoSegunSaldo(calculada.capitalPendiente, calculada.interesPendiente);
  if (estado !== deuda.estado) {
    await Deuda.updateOne({ _id: deuda._id }, { estado });
    calculada.estado = estado;
  }
}

export async function obtenerDeudasCalculadas(): Promise<DeudaCalculada[]> {
  const deudas = await Deuda.find().sort({ prioridad: 1 }).lean<DeudaDoc[]>();
  const abonos = await Abono.find({ deudaId: { $in: deudas.map((d) => d._id) } }).lean<AbonoDoc[]>();

  const resultado: DeudaCalculada[] = [];
  for (const deuda of deudas) {
    const abonosDeuda = abonos.filter((a) => a.deudaId.toString() === deuda._id.toString());
    const calculada = calcularDeuda(deuda, abonosDeuda);
    await sincronizarEstado(deuda, calculada);
    resultado.push(calculada);
  }
  return resultado;
}

export async function obtenerDeudaCalculadaPorId(id: string): Promise<{ deuda: DeudaDoc; calculada: DeudaCalculada; abonos: AbonoDoc[] }> {
  const deuda = await Deuda.findById(id).lean<DeudaDoc | null>();
  if (!deuda) throw new AppError(404, 'Deuda no encontrada');

  const abonos = await Abono.find({ deudaId: deuda._id }).sort({ fecha: -1 }).lean<AbonoDoc[]>();
  const calculada = calcularDeuda(deuda, abonos);
  await sincronizarEstado(deuda, calculada);
  return { deuda, calculada, abonos };
}

export async function recalcularEstadoDeDeuda(deudaId: string): Promise<void> {
  const deuda = await Deuda.findById(deudaId).lean<DeudaDoc | null>();
  if (!deuda) return;
  const abonos = await Abono.find({ deudaId: deuda._id }).lean<AbonoDoc[]>();
  const calculada = calcularDeuda(deuda, abonos);
  await sincronizarEstado(deuda, calculada);
}

/**
 * Si `datos.interes` cambia respecto al vigente, cierra el tramo anterior en
 * `historialInteres` (con `hasta` = ahora) antes de sobrescribir `interes`.
 * Asi lo devengado antes del cambio sigue calculandose con la tasa vieja
 * (ver configDeInteresEn en calculos.service.ts) y solo lo de aqui en
 * adelante usa la nueva.
 */
export async function actualizarDeuda(id: string, datos: Record<string, unknown>): Promise<DeudaDoc> {
  const deuda = await Deuda.findById(id);
  if (!deuda) throw new AppError(404, 'Deuda no encontrada');

  const nuevoInteres = datos.interes as DeudaDoc['interes'] | undefined;
  if (nuevoInteres) {
    const actual = deuda.interes;
    const cambio =
      nuevoInteres.tipo !== actual.tipo || nuevoInteres.modalidad !== actual.modalidad || nuevoInteres.valor !== actual.valor;
    if (cambio) {
      const ahora = new Date();
      const vigenteDesde = deuda.historialInteres.at(-1)?.hasta ?? deuda.fechaInicio;
      deuda.historialInteres.push({
        tipo: actual.tipo,
        modalidad: actual.modalidad,
        valor: actual.valor,
        desde: vigenteDesde,
        hasta: ahora,
      });
    }
  }

  Object.assign(deuda, datos);
  await deuda.save();
  return deuda;
}

/**
 * Estimacion de cuanto le falta a UNA deuda, usando la misma simulacion de
 * cartera que el resumen general (cuota mensual repartida por prioridad) -
 * no un escenario hipotetico de "toda la cuota a esta deuda sola". Null si
 * la deuda no tiene interes configurado o ya no tiene saldo pendiente (nada
 * que proyectar).
 */
export async function obtenerProyeccionPropia(deudaId: string, calculada: DeudaCalculada): Promise<ProyeccionDeUnaDeuda | null> {
  if (calculada.interes.tipo === 'ninguno') return null;
  if (calculada.capitalPendiente + calculada.interesPendiente <= 0.01) return null;

  const [todas, config] = await Promise.all([obtenerDeudasCalculadas(), obtenerConfiguracion()]);
  const activas = todas.filter((d) => d.estado === 'activa');
  const proyeccion = calcularProyeccion(activas, config.cuotaMensualObjetivo);

  if (proyeccion.cuotaInsuficiente) {
    return {
      cuotaInsuficiente: true,
      mesesHastaSaldar: null,
      fechaEstimada: null,
      interesFuturo: 0,
      interesTotalEstimado: calculada.interesPagado,
    };
  }

  const propia = proyeccion.porDeuda.find((p) => p.deudaId === deudaId);
  if (!propia) return null;

  return {
    cuotaInsuficiente: false,
    mesesHastaSaldar: propia.mesesHastaSaldar,
    fechaEstimada: propia.fechaEstimada,
    interesFuturo: propia.interesFuturo,
    interesTotalEstimado: redondear(calculada.interesPagado + propia.interesFuturo),
  };
}
