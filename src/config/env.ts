import 'dotenv/config';

function requerido(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa tu archivo .env (ver .env.example).`);
  }
  return valor;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  // Admite varios origenes separados por coma (ej. tu sitio en Netlify Y
  // localhost para seguir probando en tu maquina al mismo tiempo).
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
  mongodbUri: requerido('MONGODB_URI', process.env.MONGODB_URI),
};
