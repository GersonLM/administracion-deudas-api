import mongoose from 'mongoose';
import { env } from './env';

export async function conectarDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
}
