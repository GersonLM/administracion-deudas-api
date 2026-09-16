import { Schema, model, InferSchemaType } from 'mongoose';

const configuracionSchema = new Schema({
  cuotaMensualObjetivo: { type: Number, required: true, default: 540, min: 0 },
  moneda: { type: String, required: true, default: 'USD' },
});

export type ConfiguracionDoc = InferSchemaType<typeof configuracionSchema>;

export const Configuracion = model('Configuracion', configuracionSchema);

export async function obtenerConfiguracion() {
  let config = await Configuracion.findOne();
  if (!config) {
    config = await Configuracion.create({ cuotaMensualObjetivo: 540, moneda: 'USD' });
  }
  return config;
}
