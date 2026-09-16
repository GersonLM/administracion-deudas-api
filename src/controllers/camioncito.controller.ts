import { Request, Response } from 'express';
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  listarMovimientos,
  requerirCategoria,
  requerirMovimiento,
  FiltrosMovimientos,
} from '../services/camioncito.service';
import { MovimientoCamioncito } from '../models/movimiento-camioncito.model';
import { TipoMovimientoCamioncito } from '../types';

function query<T>(req: Request): T {
  return (req as Request & { queryValidada: T }).queryValidada;
}

export async function listarCategorias(req: Request, res: Response) {
  const { tipo } = query<{ tipo?: TipoMovimientoCamioncito }>(req);
  res.json(await obtenerCategorias(tipo));
}

export async function crearCategoriaController(req: Request, res: Response) {
  const categoria = await crearCategoria(req.body);
  res.status(201).json(categoria);
}

export async function actualizarCategoriaController(req: Request, res: Response) {
  const categoria = await actualizarCategoria(req.params.id, req.body.nombre);
  res.json(categoria);
}

export async function eliminarCategoriaController(req: Request, res: Response) {
  await eliminarCategoria(req.params.id);
  res.status(204).send();
}

export async function listarMovimientosController(req: Request, res: Response) {
  const filtros = query<FiltrosMovimientos>(req);
  res.json(await listarMovimientos(filtros));
}

export async function crearMovimientoController(req: Request, res: Response) {
  await requerirCategoria(req.body.categoriaId);
  const movimiento = await MovimientoCamioncito.create(req.body);
  res.status(201).json(movimiento);
}

export async function actualizarMovimientoController(req: Request, res: Response) {
  if (req.body.categoriaId) await requerirCategoria(req.body.categoriaId);
  const movimiento = await requerirMovimiento(req.params.id);
  Object.assign(movimiento, req.body);
  await movimiento.save();
  res.json(movimiento);
}

export async function eliminarMovimientoController(req: Request, res: Response) {
  const movimiento = await requerirMovimiento(req.params.id);
  await movimiento.deleteOne();
  res.status(204).send();
}
