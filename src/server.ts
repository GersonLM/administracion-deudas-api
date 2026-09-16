import { app } from './app';
import { env } from './config/env';
import { conectarDb } from './config/db';

async function iniciar() {
  await conectarDb();
  app.listen(env.port, () => {
    console.log(`API de administracion de deudas escuchando en http://localhost:${env.port}`);
  });
}

iniciar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});
