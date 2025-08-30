import type { Request, Response, NextFunction, RequestHandler } from "express";

const TryCatch = (handler: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      next(error); // ⚠️ careful: calling next after sending res will trigger "Cannot set headers" error
    }
  };
};

export default TryCatch;
