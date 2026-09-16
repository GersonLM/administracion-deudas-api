export type TipoInteres = 'ninguno' | 'porcentaje' | 'fijo';
export type ModalidadInteres = 'total' | 'mensual';
export type EstadoDeuda = 'activa' | 'pagada';

export interface Interes {
  tipo: TipoInteres;
  modalidad: ModalidadInteres;
  valor: number;
}

export interface DeudaCalculada {
  id: string;
  acreedor: string;
  montoCapital: number;
  interes: Interes;
  fechaInicio: string;
  prioridad: number;
  estado: EstadoDeuda;
  notas?: string;
  capitalPagado: number;
  interesPagado: number;
  capitalPendiente: number;
  interesAcumulado: number;
  interesPendiente: number;
  deudaActual: number;
  progreso: number;
  interesDelMesActual: number;
}

export interface ResumenGlobal {
  deudaInicialTotal: number;
  totalAbonado: number;
  capitalAbonado: number;
  interesAbonado: number;
  deudaActualTotal: number;
  capitalPendienteTotal: number;
  interesPendienteTotal: number;
  progresoGeneral: number;
  cantidadDeudasActivas: number;
  cuotaMensualObjetivo: number;
  abonadoMesActual: number;
  proyeccion: Proyeccion;
}

export interface Proyeccion {
  mesesRestantes: number;
  fechaEstimada: string | null;
  totalInteresProyectado: number;
  totalAPagar: number;
  cuotaInsuficiente: boolean;
  minimoMensualNecesario: number;
}

export interface GastoFijoCalculado {
  id: string;
  descripcion: string;
  monto: number;
  fechaRegistro: string;
}

export interface SemanaCalculada {
  id: string;
  cicloId: string;
  fechaInicio: string;
  fechaFin: string;
  montoAsignado: number;
  congelada: boolean;
  cerrada: boolean;
  notaCobertura?: string;
  gastado: number;
  restante: number;
  diasEnSemana: number;
  pendienteDeCierre: boolean;
}

export interface CierreCiclo {
  tipo: 'sobrante' | 'faltante';
  monto: number;
  destino: 'ahorro' | 'siguiente_mes';
}

export interface CicloCalculado {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  montoIngresado: number;
  gastosFijos: GastoFijoCalculado[];
  totalGastosFijos: number;
  montoDisponible: number;
  estado: 'abierto' | 'cerrado';
  cierre: CierreCiclo | null;
  semanas: SemanaCalculada[];
  totalAsignado: number;
  totalGastado: number;
  totalRestante: number;
  puedeCerrarse: boolean;
}

export interface MovimientoAhorroCalculado {
  id: string;
  fecha: string;
  monto: number;
  origen: 'manual' | 'sobrante_semana' | 'faltante_semana' | 'cierre_mes';
  descripcion?: string;
}

export interface ResumenAhorro {
  saldo: number;
  movimientos: MovimientoAhorroCalculado[];
}
