import { Router } from "express";
import {
  editImageController,
  handleImageUpload,
} from "../controllers/imageController";
import { upload } from "../gcpStorage";

const router = Router();

// router.post("/edit", upload.single("photo"), editImageController);
router.post("/edit", handleImageUpload, editImageController);

export default router;
