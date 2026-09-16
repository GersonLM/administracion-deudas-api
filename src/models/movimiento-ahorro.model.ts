import { Schema, model, InferSchemaType, Types } from 'mongoose';

const movimientoAhorroSchema = new Schema(
  {
    fecha: { type: Date, required: true, default: () => new Date() },
    monto: { type: Number, required: true }, // positivo = abono, negativo = retiro
    origen: {
      type: String,
      enum: ['manual', 'sobrante_semana', 'faltante_semana', 'cierre_mes'],
      required: true,
      default: 'manual',
    },
    descripcion: { type: String, trim: true },
    semanaId: { type: Schema.Types.ObjectId, ref: 'SemanaPresupuesto' },
    cicloId: { type: Schema.Types.ObjectId, ref: 'CicloMensual' },
  },
  { timestamps: true }
);

export type MovimientoAhorroDoc = InferSchemaType<typeof movimientoAhorroSchema> & { _id: Types.ObjectId };

export const MovimientoAhorro = model('MovimientoAhorro', movimientoAhorroSchema);
