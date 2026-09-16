import { Router } from 'express';
import { deudasRouter } from './deudas.routes';
import { abonosRouter } from './abonos.routes';
import { configuracionRouter } from './configuracion.routes';
import { resumenRouter } from './resumen.routes';
import { ciclosRouter } from './ciclos.routes';
import { semanasRouter, gastosSemanaRouter } from './semanas.routes';
import { ahorroRouter } from './ahorro.routes';
import { camioncitoRouter } from './camioncito.routes';

export const apiRouter = Router();

apiRouter.use('/deudas', deudasRouter);
apiRouter.use('/abonos', abonosRouter);
apiRouter.use('/configuracion', configuracionRouter);
apiRouter.use('/resumen', resumenRouter);
apiRouter.use('/ciclos', ciclosRouter);
apiRouter.use('/semanas', semanasRouter);
apiRouter.use('/gastos-semana', gastosSemanaRouter);
apiRouter.use('/ahorro', ahorroRouter);
apiRouter.use('/camioncito', camioncitoRouter);
