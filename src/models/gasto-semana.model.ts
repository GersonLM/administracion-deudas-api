import { Schema, model, InferSchemaType, Types } from 'mongoose';

const gastoSemanaSchema = new Schema(
  {
    semanaId: { type: Schema.Types.ObjectId, ref: 'SemanaPresupuesto', required: true, index: true },
    fecha: { type: Date, required: true, default: () => new Date() },
    monto: { type: Number, required: true, min: 0 },
    descripcion: { type: String, trim: true },
  },
  { timestamps: true }
);

export type GastoSemanaDoc = InferSchemaType<typeof gastoSemanaSchema> & { _id: Types.ObjectId };

export const GastoSemana = model('GastoSemana', gastoSemanaSchema);
