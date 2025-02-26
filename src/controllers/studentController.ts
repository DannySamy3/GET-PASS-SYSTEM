import { Request, Response, Router } from "express";
import upload from "../middleware/uploadMiddleware";

const router = Router();

// Example route handling file upload
router.post("/upload", upload, (req: Request, res: Response) => {
  if (req.file) {
    res.send("File uploaded successfully");
  } else {
    res.status(400).send("File upload failed");
  }
});

export default router;
