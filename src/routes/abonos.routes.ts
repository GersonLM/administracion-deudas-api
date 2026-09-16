import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validarCuerpo } from '../middlewares/validar';
import { actualizarAbonoSchema } from '../schemas/abono.schema';
import { actualizarAbono, eliminarAbono } from '../controllers/abonos.controller';

export const abonosRouter = Router();

abonosRouter.put('/:id', validarCuerpo(actualizarAbonoSchema), asyncHandler(actualizarAbono));
abonosRouter.delete('/:id', asyncHandler(eliminarAbono));
