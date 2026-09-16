import { Schema, model, InferSchemaType, Types } from 'mongoose';

const interesSchema = new Schema(
  {
    tipo: { type: String, enum: ['ninguno', 'porcentaje', 'fijo'], required: true, default: 'ninguno' },
    modalidad: { type: String, enum: ['total', 'mensual'], required: true, default: 'total' },
    valor: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

const deudaSchema = new Schema(
  {
    acreedor: { type: String, required: true, trim: true },
    montoCapital: { type: Number, required: true, min: 0 },
    interes: { type: interesSchema, required: true, default: () => ({ tipo: 'ninguno', modalidad: 'total', valor: 0 }) },
    fechaInicio: { type: Date, required: true, default: () => new Date() },
    prioridad: { type: Number, required: true, default: 100 },
    estado: { type: String, enum: ['activa', 'pagada'], required: true, default: 'activa' },
    notas: { type: String, trim: true },
  },
  { timestamps: true }
);

export type DeudaDoc = InferSchemaType<typeof deudaSchema> & { _id: Types.ObjectId };

export const Deuda = model('Deuda', deudaSchema);
