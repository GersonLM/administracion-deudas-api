import { Request, Response } from 'express';
import { eliminarMovimientoAhorro, obtenerResumenAhorro, registrarMovimientoAhorro } from '../services/ahorro.service';

export async function obtenerAhorro(_req: Request, res: Response) {
  res.json(await obtenerResumenAhorro());
}

export async function crearMovimientoAhorro(req: Request, res: Response) {
  const movimiento = await registrarMovimientoAhorro({
    monto: req.body.monto,
    origen: 'manual',
    descripcion: req.body.descripcion,
    fecha: req.body.fecha,
  });
  res.status(201).json(movimiento);
}

export async function eliminarMovimiento(req: Request, res: Response) {
  await eliminarMovimientoAhorro(req.params.id);
  res.status(204).send();
}
