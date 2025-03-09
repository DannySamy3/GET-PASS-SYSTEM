import { Router } from "express";
import { editImageController } from "../controllers/imageController";
import { upload } from "../gcpStorage";

const router = Router();

router.post("/edit", upload.single("photo"), editImageController);

export default router;
