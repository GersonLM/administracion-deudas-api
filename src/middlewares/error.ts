import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export function manejadorNotFound(_req: Request, res: Response) {
  res.status(404).json({ error: { mensaje: 'Recurso no encontrado' } });
}

export function manejadorErrores(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { mensaje: err.message, detalles: err.detalles } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { mensaje: 'Error interno del servidor' } });
}
