import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { apiRouter } from './routes';
import { manejadorErrores, manejadorNotFound } from './middlewares/error';

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiRouter);

app.use(manejadorNotFound);
app.use(manejadorErrores);
