import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validarCuerpo } from '../middlewares/validar';
import { gastoSemanaSchema, cerrarSemanaSchema } from '../schemas/presupuesto.schema';
import {
  listarGastosDeSemana,
  crearGastoDeSemana,
  eliminarGastoDeSemana,
  cerrarSemana,
} from '../controllers/semanas.controller';

export const semanasRouter = Router();

semanasRouter.get('/:id/gastos', asyncHandler(listarGastosDeSemana));
semanasRouter.post('/:id/gastos', validarCuerpo(gastoSemanaSchema), asyncHandler(crearGastoDeSemana));
semanasRouter.post('/:id/cerrar', validarCuerpo(cerrarSemanaSchema), asyncHandler(cerrarSemana));

export const gastosSemanaRouter = Router();
gastosSemanaRouter.delete('/:id', asyncHandler(eliminarGastoDeSemana));
