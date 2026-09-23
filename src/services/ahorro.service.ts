import { MovimientoAhorro, MovimientoAhorroDoc } from '../models/movimiento-ahorro.model';
import { redondear } from './calculos.service';
import { MovimientoAhorroCalculado, ResumenAhorro } from '../types';
import { AppError } from '../utils/AppError';

export async function obtenerSaldoAhorro(): Promise<number> {
  const movimientos = await MovimientoAhorro.find().select('monto');
  return redondear(movimientos.reduce((s, m) => s + m.monto, 0));
}

export async function registrarMovimientoAhorro(datos: {
  monto: number;
  origen: MovimientoAhorroDoc['origen'];
  descripcion?: string;
  fecha?: Date;
  semanaId?: string;
  cicloId?: string;
}): Promise<MovimientoAhorroDoc> {
  return MovimientoAhorro.create({
    fecha: datos.fecha ?? new Date(),
    monto: redondear(datos.monto),
    origen: datos.origen,
    descripcion: datos.descripcion,
    semanaId: datos.semanaId,
    cicloId: datos.cicloId,
  });
}

export async function eliminarMovimientoAhorro(id: string): Promise<void> {
  const movimiento = await MovimientoAhorro.findByIdAndDelete(id);
  if (!movimiento) throw new AppError(404, 'Movimiento no encontrado');
}

export async function obtenerResumenAhorro(): Promise<ResumenAhorro> {
  const movimientos = await MovimientoAhorro.find().sort({ fecha: -1 });
  const saldo = redondear(movimientos.reduce((s, m) => s + m.monto, 0));

  const movimientosCalculados: MovimientoAhorroCalculado[] = movimientos.map((m) => ({
    id: m._id.toString(),
    fecha: m.fecha.toISOString(),
    monto: m.monto,
    origen: m.origen,
    descripcion: m.descripcion ?? undefined,
  }));

  return { saldo, movimientos: movimientosCalculados };
}
