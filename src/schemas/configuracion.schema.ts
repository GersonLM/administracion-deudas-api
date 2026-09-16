import { z } from 'zod';

export const actualizarConfiguracionSchema = z.object({
  cuotaMensualObjetivo: z.number().positive().optional(),
  moneda: z.string().trim().min(1).optional(),
});
