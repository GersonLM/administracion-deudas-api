import { z } from 'zod';

export const movimientoAhorroSchema = z.object({
  monto: z.number().refine((v) => v !== 0, 'El monto no puede ser 0'),
  descripcion: z.string().trim().optional(),
  fecha: z.coerce.date().optional(),
});
