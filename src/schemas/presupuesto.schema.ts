import { z } from 'zod';

export const crearCicloSchema = z
  .object({
    fechaInicio: z.coerce.date(),
    fechaFin: z.coerce.date().optional(),
    montoIngresado: z.number().positive('El monto debe ser mayor a 0'),
  })
  .refine((datos) => !datos.fechaFin || datos.fechaFin > datos.fechaInicio, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fechaFin'],
  });

export const actualizarCicloSchema = z.object({
  montoIngresado: z.number().positive('El monto debe ser mayor a 0'),
});

export const gastoFijoSchema = z.object({
  descripcion: z.string().trim().min(1, 'La descripcion es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
});

export const gastoSemanaSchema = z.object({
  fecha: z.coerce.date().default(() => new Date()),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  descripcion: z.string().trim().optional(),
});

export const cerrarSemanaSchema = z.object({
  notaCobertura: z.string().trim().optional(),
});

export const cerrarCicloSchema = z.object({
  destino: z.enum(['ahorro', 'siguiente_mes']),
});
