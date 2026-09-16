import { z } from 'zod';

const interesSchema = z.object({
  tipo: z.enum(['ninguno', 'porcentaje', 'fijo']),
  modalidad: z.enum(['total', 'mensual']),
  valor: z.number().min(0),
});

export const crearDeudaSchema = z.object({
  acreedor: z.string().trim().min(1, 'El acreedor es requerido'),
  montoCapital: z.number().positive('El monto debe ser mayor a 0'),
  interes: interesSchema.default({ tipo: 'ninguno', modalidad: 'total', valor: 0 }),
  fechaInicio: z.coerce.date().default(() => new Date()),
  prioridad: z.number().int().default(100),
  notas: z.string().trim().optional(),
});

export const actualizarDeudaSchema = z.object({
  acreedor: z.string().trim().min(1).optional(),
  montoCapital: z.number().positive().optional(),
  interes: interesSchema.optional(),
  fechaInicio: z.coerce.date().optional(),
  prioridad: z.number().int().optional(),
  estado: z.enum(['activa', 'pagada']).optional(),
  notas: z.string().trim().optional(),
});
