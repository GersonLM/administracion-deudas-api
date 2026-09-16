import { CategoriaCamioncito } from '../models/categoria-camioncito.model';
import { MovimientoCamioncito } from '../models/movimiento-camioncito.model';
import { redondear } from './calculos.service';
import {
  CategoriaCamioncitoCalculada,
  ListaMovimientosCamioncito,
  MovimientoCamioncitoCalculado,
  TipoMovimientoCamioncito,
} from '../types';
import { AppError } from '../utils/AppError';

const CATEGORIAS_POR_DEFECTO: Array<{ tipo: TipoMovimientoCamioncito; nombre: string }> = [
  { tipo: 'ingreso', nombre: 'Agua' },
  { tipo: 'ingreso', nombre: 'Iglesia' },
  { tipo: 'ingreso', nombre: 'Viajes' },
  { tipo: 'egreso', nombre: 'Diesel' },
  { tipo: 'egreso', nombre: 'Taller' },
  { tipo: 'egreso', nombre: 'Mantenimiento' },
  { tipo: 'egreso', nombre: 'Uso personal' },
];

async function sembrarCategoriasSiHaceFalta(): Promise<void> {
  const hayAlguna = await CategoriaCamioncito.exists({});
  if (!hayAlguna) {
    await CategoriaCamioncito.insertMany(CATEGORIAS_POR_DEFECTO);
  }
}

export async function obtenerCategorias(tipo?: TipoMovimientoCamioncito): Promise<CategoriaCamioncitoCalculada[]> {
  await sembrarCategoriasSiHaceFalta();
  const filtro = tipo ? { tipo } : {};
  const categorias = await CategoriaCamioncito.find(filtro).sort({ tipo: 1, nombre: 1 });
  return categorias.map((c) => ({ id: c._id.toString(), tipo: c.tipo, nombre: c.nombre }));
}

export async function crearCategoria(datos: { tipo: TipoMovimientoCamioncito; nombre: string }) {
  await sembrarCategoriasSiHaceFalta();
  return CategoriaCamioncito.create(datos);
}

export async function actualizarCategoria(id: string, nombre: string) {
  const categoria = await CategoriaCamioncito.findByIdAndUpdate(id, { nombre }, { new: true, runValidators: true });
  if (!categoria) throw new AppError(404, 'Categoria no encontrada');
  return categoria;
}

export async function eliminarCategoria(id: string): Promise<void> {
  const enUso = await MovimientoCamioncito.exists({ categoriaId: id });
  if (enUso) {
    throw new AppError(400, 'No se puede eliminar: hay movimientos registrados con esta categoria.');
  }
  const categoria = await CategoriaCamioncito.findByIdAndDelete(id);
  if (!categoria) throw new AppError(404, 'Categoria no encontrada');
}

export interface FiltrosMovimientos {
  tipo?: TipoMovimientoCamioncito;
  desde?: Date;
  hasta?: Date;
  q?: string;
}

export async function listarMovimientos(filtros: FiltrosMovimientos): Promise<ListaMovimientosCamioncito> {
  const filtro: Record<string, unknown> = {};
  if (filtros.tipo) filtro.tipo = filtros.tipo;

  if (filtros.desde || filtros.hasta) {
    const rangoFecha: Record<string, Date> = {};
    if (filtros.desde) rangoFecha.$gte = filtros.desde;
    if (filtros.hasta) rangoFecha.$lte = filtros.hasta;
    filtro.fecha = rangoFecha;
  }

  if (filtros.q && filtros.q.trim()) {
    const regex = new RegExp(filtros.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const categoriasQueCoinciden = await CategoriaCamioncito.find({ nombre: regex }).select('_id');
    filtro.$or = [{ descripcion: regex }, { categoriaId: { $in: categoriasQueCoinciden.map((c) => c._id) } }];
  }

  const movimientos = await MovimientoCamioncito.find(filtro).sort({ fecha: -1, createdAt: -1 });
  const categorias = await CategoriaCamioncito.find({
    _id: { $in: movimientos.map((m) => m.categoriaId) },
  });
  const nombrePorCategoria = new Map(categorias.map((c) => [c._id.toString(), c.nombre]));

  const movimientosCalculados: MovimientoCamioncitoCalculado[] = movimientos.map((m) => ({
    id: m._id.toString(),
    tipo: m.tipo,
    categoriaId: m.categoriaId.toString(),
    categoriaNombre: nombrePorCategoria.get(m.categoriaId.toString()) ?? '(categoria eliminada)',
    monto: m.monto,
    descripcion: m.descripcion ?? undefined,
    fecha: m.fecha.toISOString(),
  }));

  const totalIngresos = redondear(
    movimientosCalculados.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  );
  const totalEgresos = redondear(
    movimientosCalculados.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  );

  return {
    movimientos: movimientosCalculados,
    resumen: {
      totalIngresos,
      totalEgresos,
      balance: redondear(totalIngresos - totalEgresos),
      cantidad: movimientosCalculados.length,
    },
  };
}

export async function requerirCategoria(id: string) {
  const categoria = await CategoriaCamioncito.findById(id);
  if (!categoria) throw new AppError(404, 'Categoria no encontrada');
  return categoria;
}

export async function requerirMovimiento(id: string) {
  const movimiento = await MovimientoCamioncito.findById(id);
  if (!movimiento) throw new AppError(404, 'Movimiento no encontrado');
  return movimiento;
}
