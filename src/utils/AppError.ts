export class AppError extends Error {
  constructor(public status: number, message: string, public detalles?: unknown) {
    super(message);
  }
}
