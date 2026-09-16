import { Schema, model, InferSchemaType, Types } from 'mongoose';

const gastoFijoSchema = new Schema(
  {
    descripcion: { type: String, required: true, trim: true },
    monto: { type: Number, required: true, min: 0 },
    fechaRegistro: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

const cierreSchema = new Schema(
  {
    tipo: { type: String, enum: ['sobrante', 'faltante'], required: true },
    monto: { type: Number, required: true, min: 0 },
    destino: { type: String, enum: ['ahorro', 'siguiente_mes'], required: true },
  },
  { _id: false }
);

const cicloMensualSchema = new Schema(
  {
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    montoIngresado: { type: Number, required: true, min: 0 },
    gastosFijos: { type: [gastoFijoSchema], default: [] },
    estado: { type: String, enum: ['abierto', 'cerrado'], required: true, default: 'abierto' },
    cierre: { type: cierreSchema, default: null },
  },
  { timestamps: true }
);

export type GastoFijoDoc = InferSchemaType<typeof gastoFijoSchema> & { _id: Types.ObjectId };
export type CicloMensualDoc = InferSchemaType<typeof cicloMensualSchema> & { _id: Types.ObjectId };

export const CicloMensual = model('CicloMensual', cicloMensualSchema);
