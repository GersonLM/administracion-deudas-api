import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validarCuerpo, validarQuery } from '../middlewares/validar';
import {
  crearCategoriaCamioncitoSchema,
  actualizarCategoriaCamioncitoSchema,
  crearMovimientoCamioncitoSchema,
  actualizarMovimientoCamioncitoSchema,
  filtrosMovimientosCamioncitoSchema,
  filtrosCategoriaCamioncitoSchema,
} from '../schemas/camioncito.schema';
import {
  listarCategorias,
  crearCategoriaController,
  actualizarCategoriaController,
  eliminarCategoriaController,
  listarMovimientosController,
  crearMovimientoController,
  actualizarMovimientoController,
  eliminarMovimientoController,
} from '../controllers/camioncito.controller';

export const camioncitoRouter = Router();

camioncitoRouter.get('/categorias', validarQuery(filtrosCategoriaCamioncitoSchema), asyncHandler(listarCategorias));
camioncitoRouter.post('/categorias', validarCuerpo(crearCategoriaCamioncitoSchema), asyncHandler(crearCategoriaController));
camioncitoRouter.put(
  '/categorias/:id',
  validarCuerpo(actualizarCategoriaCamioncitoSchema),
  asyncHandler(actualizarCategoriaController)
);
camioncitoRouter.delete('/categorias/:id', asyncHandler(eliminarCategoriaController));

camioncitoRouter.get(
  '/movimientos',
  validarQuery(filtrosMovimientosCamioncitoSchema),
  asyncHandler(listarMovimientosController)
);
camioncitoRouter.post('/movimientos', validarCuerpo(crearMovimientoCamioncitoSchema), asyncHandler(crearMovimientoController));
camioncitoRouter.put(
  '/movimientos/:id',
  validarCuerpo(actualizarMovimientoCamioncitoSchema),
  asyncHandler(actualizarMovimientoController)
);
camioncitoRouter.delete('/movimientos/:id', asyncHandler(eliminarMovimientoController));
