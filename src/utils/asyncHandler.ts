import { NextFunction, Request, Response } from 'express';

type ManejadorAsync = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: ManejadorAsync) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
