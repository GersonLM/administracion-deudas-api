import { Request, Response } from 'express';
import { Deuda } from '../models/deuda.model';
import { Abono } from '../models/abono.model';
import {
  obtenerDeudasCalculadas,
  obtenerDeudaCalculadaPorId,
  obtenerProyeccionPropia,
  actualizarDeuda as actualizarDeudaServicio,
} from '../services/deudas.service';
import { AppError } from '../utils/AppError';

export async function listarDeudas(_req: Request, res: Response) {
  const deudas = await obtenerDeudasCalculadas();
  res.json(deudas);
}

export async function obtenerDeuda(req: Request, res: Response) {
  const { deuda, calculada, abonos } = await obtenerDeudaCalculadaPorId(req.params.id);
  const proyeccionPropia = await obtenerProyeccionPropia(req.params.id, calculada);
  res.json({ ...calculada, _id: deuda._id, abonos, proyeccionPropia });
}

export async function crearDeuda(req: Request, res: Response) {
  const deuda = await Deuda.create(req.body);
  res.status(201).json(deuda);
}

export async function actualizarDeuda(req: Request, res: Response) {
  const deuda = await actualizarDeudaServicio(req.params.id, req.body);
  res.json(deuda);
}

export async function eliminarDeuda(req: Request, res: Response) {
  const deuda = await Deuda.findByIdAndDelete(req.params.id);
  if (!deuda) throw new AppError(404, 'Deuda no encontrada');
  await Abono.deleteMany({ deudaId: deuda._id });
  res.status(204).send();
}
