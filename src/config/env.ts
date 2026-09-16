import 'dotenv/config';

function requerido(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa tu archivo .env (ver .env.example).`);
  }
  return valor;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  mongodbUri: requerido('MONGODB_URI', process.env.MONGODB_URI),
};
