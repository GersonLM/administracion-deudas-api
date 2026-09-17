import { Schema, model, InferSchemaType, Types } from 'mongoose';

const interesSchema = new Schema(
  {
    tipo: { type: String, enum: ['ninguno', 'porcentaje', 'fijo'], required: true, default: 'ninguno' },
    modalidad: { type: String, enum: ['total', 'mensual'], required: true, default: 'total' },
    valor: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

// Tramos de interes YA CERRADOS (reemplazados por una edicion posterior). La
// config vigente sigue viviendo en `interes`; su "desde" se deriva del ultimo
// tramo (`hasta` del ultimo) o de `fechaInicio` si nunca se edito. Ver
// deudas.service.ts (actualizarDeuda) para donde se cierra un tramo.
const tramoInteresSchema = new Schema(
  {
    tipo: { type: String, enum: ['ninguno', 'porcentaje', 'fijo'], required: true },
    modalidad: { type: String, enum: ['total', 'mensual'], required: true },
    valor: { type: Number, required: true, min: 0 },
    desde: { type: Date, required: true },
    hasta: { type: Date, required: true },
  },
  { _id: false }
);

const deudaSchema = new Schema(
  {
    acreedor: { type: String, required: true, trim: true },
    montoCapital: { type: Number, required: true, min: 0 },
    interes: { type: interesSchema, required: true, default: () => ({ tipo: 'ninguno', modalidad: 'total', valor: 0 }) },
    historialInteres: { type: [tramoInteresSchema], required: true, default: () => [] },
    fechaInicio: { type: Date, required: true, default: () => new Date() },
    prioridad: { type: Number, required: true, default: 100 },
    estado: { type: String, enum: ['activa', 'pagada'], required: true, default: 'activa' },
    notas: { type: String, trim: true },
  },
  { timestamps: true }
);

export type DeudaDoc = InferSchemaType<typeof deudaSchema> & { _id: Types.ObjectId };

export const Deuda = model('Deuda', deudaSchema);
