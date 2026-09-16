import { Request, Response } from 'express';
import { GastoSemana } from '../models/gasto-semana.model';
import { CicloMensual } from '../models/ciclo-mensual.model';
import { redondear } from '../services/calculos.service';
import { obtenerCicloCalculado, requerirGastoSemana, requerirSemana } from '../services/presupuesto.service';
import { obtenerSaldoAhorro, registrarMovimientoAhorro } from '../services/ahorro.service';
import { AppError } from '../utils/AppError';

async function cicloCalculadoDeSemana(semanaId: string) {
  const semana = await requerirSemana(semanaId);
  const ciclo = await CicloMensual.findById(semana.cicloId);
  if (!ciclo) throw new AppError(404, 'Ciclo no encontrado');
  return obtenerCicloCalculado(ciclo);
}

export async function listarGastosDeSemana(req: Request, res: Response) {
  const gastos = await GastoSemana.find({ semanaId: req.params.id }).sort({ fecha: -1 });
  res.json(gastos);
}

export async function crearGastoDeSemana(req: Request, res: Response) {
  const semana = await requerirSemana(req.params.id);
  const gasto = await GastoSemana.create({ ...req.body, semanaId: semana._id });
  res.status(201).json({ gasto, ciclo: await cicloCalculadoDeSemana(req.params.id) });
}

export async function eliminarGastoDeSemana(req: Request, res: Response) {
  const gasto = await requerirGastoSemana(req.params.id);
  const semanaId = gasto.semanaId.toString();
  await gasto.deleteOne();
  res.json({ ciclo: await cicloCalculadoDeSemana(semanaId) });
}

export async function cerrarSemana(req: Request, res: Response) {
  const semana = await requerirSemana(req.params.id);
  if (semana.cerrada) throw new AppError(400, 'Esta semana ya esta cerrada.');

  const hoy = new Date();
  if (semana.fechaFin > hoy) {
    throw new AppError(400, 'Esta semana todavia no termina, no se puede cerrar.');
  }

  const gastos = await GastoSemana.find({ semanaId: semana._id });
  const gastado = redondear(gastos.reduce((s, g) => s + g.monto, 0));
  const restante = redondear(semana.montoAsignado - gastado);

  if (restante > 0.01) {
    await registrarMovimientoAhorro({
      monto: restante,
      origen: 'sobrante_semana',
      descripcion: `Sobrante semana del ${semana.fechaInicio.toISOString().slice(0, 10)}`,
      semanaId: semana._id.toString(),
      cicloId: semana.cicloId.toString(),
    });
  } else if (restante < -0.01) {
    const faltante = Math.abs(restante);
    const saldo = await obtenerSaldoAhorro();
    const cubierto = redondear(Math.min(faltante, Math.max(0, saldo)));

    if (cubierto > 0.01) {
      await registrarMovimientoAhorro({
        monto: -cubierto,
        origen: 'faltante_semana',
        descripcion: `Cobertura semana del ${semana.fechaInicio.toISOString().slice(0, 10)}`,
        semanaId: semana._id.toString(),
        cicloId: semana.cicloId.toString(),
      });
    }

    const sinCubrir = redondear(faltante - cubierto);
    if (sinCubrir > 0.01) {
      const nota = (req.body?.notaCobertura as string | undefined)?.trim();
      if (!nota) {
        throw new AppError(
          400,
          `Quedan ${sinCubrir} sin cubrir (el ahorro no alcanza). Agrega una nota de como lo vas a cubrir.`
        );
      }
      semana.notaCobertura = nota;
    }
  }

  semana.cerrada = true;
  await semana.save();

  res.json({ ciclo: await cicloCalculadoDeSemana(req.params.id) });
}
