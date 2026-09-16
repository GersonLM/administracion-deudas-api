import { Request, Response } from 'express';
import { obtenerConfiguracion, Configuracion } from '../models/configuracion.model';

export async function obtenerConfig(_req: Request, res: Response) {
  const config = await obtenerConfiguracion();
  res.json(config);
}

export async function actualizarConfig(req: Request, res: Response) {
  const actual = await obtenerConfiguracion();
  const actualizada = await Configuracion.findByIdAndUpdate(actual._id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json(actualizada);
}
