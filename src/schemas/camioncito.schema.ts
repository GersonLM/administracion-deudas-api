import { z } from 'zod';

export const crearCategoriaCamioncitoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
});

export const actualizarCategoriaCamioncitoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
});

export const crearMovimientoCamioncitoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  categoriaId: z.string().min(1, 'La categoria es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  descripcion: z.string().trim().optional(),
  fecha: z.coerce.date().default(() => new Date()),
});

export const actualizarMovimientoCamioncitoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']).optional(),
  categoriaId: z.string().min(1).optional(),
  monto: z.number().positive().optional(),
  descripcion: z.string().trim().optional(),
  fecha: z.coerce.date().optional(),
});

export const filtrosMovimientosCamioncitoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']).optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  q: z.string().trim().optional(),
});

export const filtrosCategoriaCamioncitoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']).optional(),
});
