import { Request, Response } from 'express';
import { Abono } from '../models/abono.model';
import { Deuda } from '../models/deuda.model';
import { recalcularEstadoDeDeuda } from '../services/deudas.service';
import { AppError } from '../utils/AppError';

export async function listarAbonosDeDeuda(req: Request, res: Response) {
  const abonos = await Abono.find({ deudaId: req.params.id }).sort({ fecha: -1 });
  res.json(abonos);
}

export async function crearAbono(req: Request, res: Response) {
  const deuda = await Deuda.findById(req.params.id);
  if (!deuda) throw new AppError(404, 'Deuda no encontrada');

  const abono = await Abono.create({ ...req.body, deudaId: deuda._id });
  await recalcularEstadoDeDeuda(deuda._id.toString());
  res.status(201).json(abono);
}

export async function actualizarAbono(req: Request, res: Response) {
  const abono = await Abono.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!abono) throw new AppError(404, 'Abono no encontrado');
  await recalcularEstadoDeDeuda(abono.deudaId.toString());
  res.json(abono);
}

export async function eliminarAbono(req: Request, res: Response) {
  const abono = await Abono.findByIdAndDelete(req.params.id);
  if (!abono) throw new AppError(404, 'Abono no encontrado');
  await recalcularEstadoDeDeuda(abono.deudaId.toString());
  res.status(204).send();
}
