import { Express } from "express";
import { Router } from "express";
import {
  createClass,
  getAllClassInitials,
  getClassById,
} from "../controllers/classController";

const router = Router();

router.route("/").post(createClass).get(getAllClassInitials);
router.route("/:id").get(getClassById);

export default router;
