import { Request, Response } from 'express';
import { CicloMensual } from '../models/ciclo-mensual.model';
import { redondear } from '../services/calculos.service';
import {
  crearSemanasParaCiclo,
  obtenerCicloAbierto,
  obtenerCicloCalculado,
  sumarUnMesUTC,
} from '../services/presupuesto.service';
import { obtenerSaldoAhorro, registrarMovimientoAhorro } from '../services/ahorro.service';
import { AppError } from '../utils/AppError';

export async function crearCiclo(req: Request, res: Response) {
  const existente = await obtenerCicloAbierto();
  if (existente) throw new AppError(409, 'Ya hay un ciclo mensual abierto. Cerralo antes de iniciar uno nuevo.');

  const { fechaInicio, montoIngresado } = req.body;
  const fechaFin = req.body.fechaFin ?? sumarUnMesUTC(fechaInicio);

  const ciclo = await CicloMensual.create({ fechaInicio, fechaFin, montoIngresado, gastosFijos: [] });
  await crearSemanasParaCiclo(ciclo);

  res.status(201).json(await obtenerCicloCalculado(ciclo));
}

export async function obtenerCicloActivo(_req: Request, res: Response) {
  const ciclo = await obtenerCicloAbierto();
  if (!ciclo) {
    res.json(null);
    return;
  }
  res.json(await obtenerCicloCalculado(ciclo));
}

export async function actualizarCiclo(req: Request, res: Response) {
  const ciclo = await CicloMensual.findById(req.params.id);
  if (!ciclo) throw new AppError(404, 'Ciclo no encontrado');
  if (ciclo.estado === 'cerrado') throw new AppError(400, 'Este ciclo ya esta cerrado, no se puede editar.');

  ciclo.montoIngresado = req.body.montoIngresado;
  await ciclo.save();
  res.json(await obtenerCicloCalculado(ciclo));
}

export async function agregarGastoFijo(req: Request, res: Response) {
  const ciclo = await CicloMensual.findById(req.params.id);
  if (!ciclo) throw new AppError(404, 'Ciclo no encontrado');

  ciclo.gastosFijos.push({ ...req.body, fechaRegistro: new Date() });
  await ciclo.save();
  res.status(201).json(await obtenerCicloCalculado(ciclo));
}

export async function actualizarGastoFijo(req: Request, res: Response) {
  const ciclo = await CicloMensual.findById(req.params.id);
  if (!ciclo) throw new AppError(404, 'Ciclo no encontrado');

  const gasto = ciclo.gastosFijos.id(req.params.gastoId);
  if (!gasto) throw new AppError(404, 'Gasto fijo no encontrado');

  if (req.body.descripcion !== undefined) gasto.descripcion = req.body.descripcion;
  if (req.body.monto !== undefined) gasto.monto = req.body.monto;
  await ciclo.save();
  res.json(await obtenerCicloCalculado(ciclo));
}

export async function eliminarGastoFijo(req: Request, res: Response) {
  const ciclo = await CicloMensual.findById(req.params.id);
  if (!ciclo) throw new AppError(404, 'Ciclo no encontrado');

  const gasto = ciclo.gastosFijos.id(req.params.gastoId);
  if (!gasto) throw new AppError(404, 'Gasto fijo no encontrado');

  gasto.deleteOne();
  await ciclo.save();
  res.json(await obtenerCicloCalculado(ciclo));
}

export async function cerrarCiclo(req: Request, res: Response) {
  const ciclo = await CicloMensual.findById(req.params.id);
  if (!ciclo) throw new AppError(404, 'Ciclo no encontrado');

  const calculado = await obtenerCicloCalculado(ciclo);
  if (!calculado.puedeCerrarse) {
    throw new AppError(
      400,
      'El ciclo todavia no se puede cerrar: verifica que haya terminado el rango de fechas y que todas las semanas esten cerradas.'
    );
  }

  // calculado.totalAsignado solo suma semanas abiertas (ver
  // obtenerCicloCalculado) y aca ya estan todas cerradas (puedeCerrarse lo
  // exige) - se recalcula el pool realmente consumido sobre TODAS las
  // semanas, sumando tambien lo cubierto "con el mes" en cada una.
  const poolConsumido = redondear(
    calculado.semanas.reduce(
      (s, sem) => s + sem.montoAsignado + (sem.cobertura?.origen === 'mes' ? sem.cobertura.monto : 0),
      0
    )
  );
  const diferencia = redondear(calculado.montoDisponible - poolConsumido);
  const tipo: 'sobrante' | 'faltante' = diferencia >= 0 ? 'sobrante' : 'faltante';
  const monto = Math.abs(diferencia);
  const { destino } = req.body as { destino: 'ahorro' | 'siguiente_mes' };

  if (monto > 0.01 && destino === 'ahorro') {
    if (tipo === 'faltante') {
      const saldo = await obtenerSaldoAhorro();
      if (saldo < monto) {
        throw new AppError(400, `El ahorro no alcanza para cubrir el faltante (saldo actual: ${saldo}).`);
      }
    }
    await registrarMovimientoAhorro({
      monto: tipo === 'sobrante' ? monto : -monto,
      origen: 'cierre_mes',
      descripcion: `Cierre de ciclo del ${ciclo.fechaInicio.toISOString().slice(0, 10)}`,
      cicloId: ciclo._id.toString(),
    });
  }

  ciclo.estado = 'cerrado';
  ciclo.cierre = { tipo, monto, destino };
  await ciclo.save();

  res.json(await obtenerCicloCalculado(ciclo));
}
