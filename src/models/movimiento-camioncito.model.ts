import { Schema, model, InferSchemaType, Types } from 'mongoose';

const movimientoCamioncitoSchema = new Schema(
  {
    tipo: { type: String, enum: ['ingreso', 'egreso'], required: true },
    categoriaId: { type: Schema.Types.ObjectId, ref: 'CategoriaCamioncito', required: true, index: true },
    monto: { type: Number, required: true, min: 0.01 },
    descripcion: { type: String, trim: true },
    fecha: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

export type MovimientoCamioncitoDoc = InferSchemaType<typeof movimientoCamioncitoSchema> & { _id: Types.ObjectId };

export const MovimientoCamioncito = model('MovimientoCamioncito', movimientoCamioncitoSchema);
