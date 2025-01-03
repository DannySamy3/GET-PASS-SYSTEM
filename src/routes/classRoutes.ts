import { Express } from "express";
import { Router } from "express";
import {
  createClass,
  getAllClassInitials,
  getClassById,
  getAllClasses,
  updateClass,
  deleteClass,
} from "../controllers/classController";

const router = Router();

router.route("/").post(createClass).get(getAllClasses);
router.route("/initials/").get(getAllClassInitials);
router.route("/:id").get(getClassById).patch(updateClass).delete(deleteClass);

export default router;
