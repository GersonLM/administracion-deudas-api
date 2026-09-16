import { Schema, model, InferSchemaType } from 'mongoose';

const usuarioSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    nombre: { type: String, trim: true },
  },
  { timestamps: true }
);

export type UsuarioDoc = InferSchemaType<typeof usuarioSchema>;

export const Usuario = model('Usuario', usuarioSchema);
