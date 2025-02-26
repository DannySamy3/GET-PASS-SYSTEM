import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Image upload failed",
        error: {
          name: err.name,
          message: err.message,
          code: err.code,
          field: err.field,
          storageErrors: err.storageErrors || [],
        },
      });
    }
  }
  // Handle other errors
  next(err);
};

export default errorHandler;
