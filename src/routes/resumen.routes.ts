import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { obtenerResumen, obtenerResumenMensual } from '../controllers/resumen.controller';

export const resumenRouter = Router();

resumenRouter.get('/mensual', asyncHandler(obtenerResumenMensual));
resumenRouter.get('/', asyncHandler(obtenerResumen));
