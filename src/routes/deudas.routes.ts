import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validarCuerpo } from '../middlewares/validar';
import { crearDeudaSchema, actualizarDeudaSchema } from '../schemas/deuda.schema';
import { crearAbonoSchema } from '../schemas/abono.schema';
import {
  listarDeudas,
  obtenerDeuda,
  crearDeuda,
  actualizarDeuda,
  eliminarDeuda,
} from '../controllers/deudas.controller';
import { listarAbonosDeDeuda, crearAbono } from '../controllers/abonos.controller';

export const deudasRouter = Router();

deudasRouter.get('/', asyncHandler(listarDeudas));
deudasRouter.post('/', validarCuerpo(crearDeudaSchema), asyncHandler(crearDeuda));
deudasRouter.get('/:id', asyncHandler(obtenerDeuda));
deudasRouter.put('/:id', validarCuerpo(actualizarDeudaSchema), asyncHandler(actualizarDeuda));
deudasRouter.delete('/:id', asyncHandler(eliminarDeuda));

deudasRouter.get('/:id/abonos', asyncHandler(listarAbonosDeDeuda));
deudasRouter.post('/:id/abonos', validarCuerpo(crearAbonoSchema), asyncHandler(crearAbono));
