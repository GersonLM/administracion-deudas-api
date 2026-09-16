import { Request, Response } from 'express';
import { Abono } from '../models/abono.model';
import { obtenerConfiguracion } from '../models/configuracion.model';
import { obtenerDeudasCalculadas } from '../services/deudas.service';
import { calcularProyeccion } from '../services/proyeccion.service';
import { redondear } from '../services/calculos.service';
import { ResumenGlobal } from '../types';

export async function obtenerResumen(_req: Request, res: Response) {
  const [deudas, config] = await Promise.all([obtenerDeudasCalculadas(), obtenerConfiguracion()]);
  const activas = deudas.filter((d) => d.estado === 'activa');

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const abonosDelMes = await Abono.find({ fecha: { $gte: inicioMes } }).lean();
  const abonadoMesActual = redondear(
    abonosDelMes.reduce((s, a) => s + a.montoCapital + a.montoInteres, 0)
  );

  const deudaInicialTotal = redondear(deudas.reduce((s, d) => s + d.montoCapital, 0));
  const capitalAbonado = redondear(deudas.reduce((s, d) => s + d.capitalPagado, 0));
  const interesAbonado = redondear(deudas.reduce((s, d) => s + d.interesPagado, 0));

  const resumen: ResumenGlobal = {
    deudaInicialTotal,
    totalAbonado: redondear(capitalAbonado + interesAbonado),
    capitalAbonado,
    interesAbonado,
    deudaActualTotal: redondear(deudas.reduce((s, d) => s + d.deudaActual, 0)),
    capitalPendienteTotal: redondear(deudas.reduce((s, d) => s + d.capitalPendiente, 0)),
    interesPendienteTotal: redondear(deudas.reduce((s, d) => s + d.interesPendiente, 0)),
    progresoGeneral: deudaInicialTotal > 0 ? redondear(capitalAbonado / deudaInicialTotal) : 0,
    cantidadDeudasActivas: activas.length,
    cuotaMensualObjetivo: config.cuotaMensualObjetivo,
    abonadoMesActual,
    proyeccion: calcularProyeccion(activas, config.cuotaMensualObjetivo),
  };

  res.json(resumen);
}

export async function obtenerResumenMensual(_req: Request, res: Response) {
  const [abonos, config] = await Promise.all([Abono.find().sort({ fecha: 1 }).lean(), obtenerConfiguracion()]);

  const porMes = new Map<string, { capital: number; interes: number }>();
  for (const abono of abonos) {
    const fecha = new Date(abono.fecha);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const actual = porMes.get(clave) ?? { capital: 0, interes: 0 };
    actual.capital += abono.montoCapital;
    actual.interes += abono.montoInteres;
    porMes.set(clave, actual);
  }

  const resultado = Array.from(porMes.entries()).map(([mes, { capital, interes }]) => ({
    mes,
    capitalAbonado: redondear(capital),
    interesAbonado: redondear(interes),
    totalAbonado: redondear(capital + interes),
    cuotaMensualObjetivo: config.cuotaMensualObjetivo,
    cumplioCuota: redondear(capital + interes) >= config.cuotaMensualObjetivo,
  }));

  res.json(resultado);
}
