import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validarCuerpo } from '../middlewares/validar';
import { movimientoAhorroSchema } from '../schemas/ahorro.schema';
import { obtenerAhorro, crearMovimientoAhorro } from '../controllers/ahorro.controller';

export const ahorroRouter = Router();

ahorroRouter.get('/', asyncHandler(obtenerAhorro));
ahorroRouter.post('/movimientos', validarCuerpo(movimientoAhorroSchema), asyncHandler(crearMovimientoAhorro));
