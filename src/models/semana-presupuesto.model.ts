import { Schema, model, InferSchemaType, Types } from 'mongoose';

// Como se resolvio el faltante al cerrar una semana en rojo. Solo se llena
// si la semana cerro en deficit; 'mes' es lo unico que sincronizarSemanas
// debe restar del fondo de las semanas futuras (ver presupuesto.service.ts).
const coberturaSchema = new Schema(
  {
    origen: { type: String, enum: ['ahorro', 'mes', 'externo'], required: true },
    monto: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const semanaPresupuestoSchema = new Schema(
  {
    cicloId: { type: Schema.Types.ObjectId, ref: 'CicloMensual', required: true, index: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    montoAsignado: { type: Number, required: true, default: 0 },
    congelada: { type: Boolean, required: true, default: false },
    cerrada: { type: Boolean, required: true, default: false },
    notaCobertura: { type: String, trim: true },
    cobertura: { type: coberturaSchema, default: null },
  },
  { timestamps: true }
);

export type SemanaPresupuestoDoc = InferSchemaType<typeof semanaPresupuestoSchema> & { _id: Types.ObjectId };

export const SemanaPresupuesto = model('SemanaPresupuesto', semanaPresupuestoSchema);
