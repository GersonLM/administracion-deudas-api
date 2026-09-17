import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validarCuerpo } from '../middlewares/validar';
import {
  crearCicloSchema,
  actualizarCicloSchema,
  gastoFijoSchema,
  cerrarCicloSchema,
} from '../schemas/presupuesto.schema';
import {
  crearCiclo,
  obtenerCicloActivo,
  actualizarCiclo,
  agregarGastoFijo,
  actualizarGastoFijo,
  eliminarGastoFijo,
  cerrarCiclo,
} from '../controllers/ciclos.controller';

export const ciclosRouter = Router();

ciclosRouter.get('/activo', asyncHandler(obtenerCicloActivo));
ciclosRouter.post('/', validarCuerpo(crearCicloSchema), asyncHandler(crearCiclo));
ciclosRouter.put('/:id', validarCuerpo(actualizarCicloSchema), asyncHandler(actualizarCiclo));
ciclosRouter.post('/:id/gastos-fijos', validarCuerpo(gastoFijoSchema), asyncHandler(agregarGastoFijo));
ciclosRouter.put('/:id/gastos-fijos/:gastoId', validarCuerpo(gastoFijoSchema.partial()), asyncHandler(actualizarGastoFijo));
ciclosRouter.delete('/:id/gastos-fijos/:gastoId', asyncHandler(eliminarGastoFijo));
ciclosRouter.post('/:id/cerrar', validarCuerpo(cerrarCicloSchema), asyncHandler(cerrarCiclo));
