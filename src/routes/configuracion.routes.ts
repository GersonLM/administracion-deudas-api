import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validarCuerpo } from '../middlewares/validar';
import { actualizarConfiguracionSchema } from '../schemas/configuracion.schema';
import { obtenerConfig, actualizarConfig } from '../controllers/configuracion.controller';

export const configuracionRouter = Router();

configuracionRouter.get('/', asyncHandler(obtenerConfig));
configuracionRouter.put('/', validarCuerpo(actualizarConfiguracionSchema), asyncHandler(actualizarConfig));
