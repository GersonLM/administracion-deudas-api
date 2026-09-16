import { z } from 'zod';

export const crearAbonoSchema = z.object({
  fecha: z.coerce.date().default(() => new Date()),
  montoCapital: z.number().min(0),
  montoInteres: z.number().min(0),
  notas: z.string().trim().optional(),
}).refine((datos) => datos.montoCapital + datos.montoInteres > 0, {
  message: 'El abono debe tener un monto mayor a 0',
});

export const actualizarAbonoSchema = z.object({
  fecha: z.coerce.date().optional(),
  montoCapital: z.number().min(0).optional(),
  montoInteres: z.number().min(0).optional(),
  notas: z.string().trim().optional(),
});
