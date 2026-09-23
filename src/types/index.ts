export type TipoInteres = 'ninguno' | 'porcentaje' | 'fijo';
export type ModalidadInteres = 'total' | 'mensual';
export type EstadoDeuda = 'activa' | 'pagada';

export interface Interes {
  tipo: TipoInteres;
  modalidad: ModalidadInteres;
  valor: number;
}

export interface TramoInteres extends Interes {
  desde: string;
  hasta: string;
}

export interface DeudaCalculada {
  id: string;
  acreedor: string;
  montoCapital: number;
  interes: Interes;
  historialInteres: TramoInteres[];
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

export interface CostoTotal {
  capital: number;
  interesPagado: number;
  interesProyectado: number | null;
  interesTotal: number | null;
  total: number | null;
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
  costoActivas: CostoTotal;
  costoHistorico: CostoTotal | null;
}

export interface ProyeccionPorDeuda {
  deudaId: string;
  mesesHastaSaldar: number | null;
  fechaEstimada: string | null;
  interesFuturo: number;
}

export interface Proyeccion {
  mesesRestantes: number;
  fechaEstimada: string | null;
  totalInteresProyectado: number;
  totalAPagar: number;
  cuotaInsuficiente: boolean;
  minimoMensualNecesario: number;
  porDeuda: ProyeccionPorDeuda[];
}

export interface ProyeccionDeUnaDeuda {
  cuotaInsuficiente: boolean;
  mesesHastaSaldar: number | null;
  fechaEstimada: string | null;
  interesFuturo: number;
  interesTotalEstimado: number;
}

export interface GastoFijoCalculado {
  id: string;
  descripcion: string;
  monto: number;
  fechaRegistro: string;
}

export interface CoberturaSemana {
  origen: 'ahorro' | 'mes' | 'externo';
  monto: number;
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
  cobertura: CoberturaSemana | null;
  gastado: number;
  gastadoAcumulado: number;
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

export type TipoMovimientoCamioncito = 'ingreso' | 'egreso';

export interface CategoriaCamioncitoCalculada {
  id: string;
  tipo: TipoMovimientoCamioncito;
  nombre: string;
}

export interface MovimientoCamioncitoCalculado {
  id: string;
  tipo: TipoMovimientoCamioncito;
  categoriaId: string;
  categoriaNombre: string;
  monto: number;
  descripcion?: string;
  fecha: string;
}

export interface ResumenCamioncito {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  cantidad: number;
}

export interface ListaMovimientosCamioncito {
  movimientos: MovimientoCamioncitoCalculado[];
  resumen: ResumenCamioncito;
}
