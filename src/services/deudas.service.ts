import { Deuda, DeudaDoc } from '../models/deuda.model';
import { Abono, AbonoDoc } from '../models/abono.model';
import { calcularDeuda, estadoSegunSaldo } from './calculos.service';
import { DeudaCalculada } from '../types';
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
