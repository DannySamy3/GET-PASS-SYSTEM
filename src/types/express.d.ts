import { Request } from "express";

declare global {
  namespace Express {
    export interface Request {
      file?: Multer.File;
    }

    namespace Multer {
      interface File {
        buffer: Buffer;
        originalname: string;
      }
    }
  }
}
