import { Schema, model, InferSchemaType, Types } from 'mongoose';

const semanaPresupuestoSchema = new Schema(
  {
    cicloId: { type: Schema.Types.ObjectId, ref: 'CicloMensual', required: true, index: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    montoAsignado: { type: Number, required: true, default: 0 },
    congelada: { type: Boolean, required: true, default: false },
    cerrada: { type: Boolean, required: true, default: false },
    notaCobertura: { type: String, trim: true },
  },
  { timestamps: true }
);

export type SemanaPresupuestoDoc = InferSchemaType<typeof semanaPresupuestoSchema> & { _id: Types.ObjectId };

export const SemanaPresupuesto = model('SemanaPresupuesto', semanaPresupuestoSchema);
