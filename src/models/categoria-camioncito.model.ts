import { Schema, model, InferSchemaType, Types } from 'mongoose';

const categoriaCamioncitoSchema = new Schema(
  {
    tipo: { type: String, enum: ['ingreso', 'egreso'], required: true },
    nombre: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type CategoriaCamioncitoDoc = InferSchemaType<typeof categoriaCamioncitoSchema> & { _id: Types.ObjectId };

export const CategoriaCamioncito = model('CategoriaCamioncito', categoriaCamioncitoSchema);
