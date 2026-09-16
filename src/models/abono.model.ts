import { Schema, model, InferSchemaType, Types } from 'mongoose';

const abonoSchema = new Schema(
  {
    deudaId: { type: Schema.Types.ObjectId, ref: 'Deuda', required: true, index: true },
    fecha: { type: Date, required: true, default: () => new Date() },
    montoCapital: { type: Number, required: true, min: 0 },
    montoInteres: { type: Number, required: true, min: 0 },
    notas: { type: String, trim: true },
  },
  { timestamps: true }
);

export type AbonoDoc = InferSchemaType<typeof abonoSchema> & { _id: Types.ObjectId };

export const Abono = model('Abono', abonoSchema);
