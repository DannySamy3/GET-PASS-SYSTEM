import { Router } from "express";
import {
  editImageController,
  handleImageUpload,
} from "../controllers/imageController";

const router = Router();

// router.post("/edit", upload.single("photo"), editImageController);
router.put("/edit", handleImageUpload, editImageController);

export default router;
