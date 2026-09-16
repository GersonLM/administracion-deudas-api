import bcrypt from 'bcryptjs';
import { conectarDb } from '../config/db';
import { Usuario } from '../models/usuario.model';
import { Configuracion } from '../models/configuracion.model';
import mongoose from 'mongoose';

async function seed() {
  await conectarDb();

  const email = 'lopezmenjivar99@gmail.com';
  const yaExiste = await Usuario.findOne({ email });
  if (!yaExiste) {
    const passwordHash = await bcrypt.hash('gersonDev', 10);
    await Usuario.create({ email, passwordHash, nombre: 'Gerson' });
    console.log(`Usuario creado: ${email}`);
  } else {
    console.log(`Usuario ya existia: ${email}`);
  }

  const configExistente = await Configuracion.findOne();
  if (!configExistente) {
    await Configuracion.create({ cuotaMensualObjetivo: 540, moneda: 'USD' });
    console.log('Configuracion inicial creada (cuota mensual objetivo: 540)');
  } else {
    console.log('Configuracion ya existia');
  }

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error('Error al ejecutar el seed:', error);
  process.exit(1);
});
