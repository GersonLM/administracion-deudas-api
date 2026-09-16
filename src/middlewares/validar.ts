import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

export function validarCuerpo(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      next(new AppError(400, 'Datos invalidos', resultado.error.flatten()));
      return;
    }
    req.body = resultado.data;
    next();
  };
}

export function validarQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(req.query);
    if (!resultado.success) {
      next(new AppError(400, 'Parametros invalidos', resultado.error.flatten()));
      return;
    }
    (req as Request & { queryValidada: unknown }).queryValidada = resultado.data;
    next();
  };
}
