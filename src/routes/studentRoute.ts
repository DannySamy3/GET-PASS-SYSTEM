import { Router } from "express";
import { getStudents } from "../controllers/studentsController";

const router = Router();

router.route("/").get(getStudents);

export default router;
