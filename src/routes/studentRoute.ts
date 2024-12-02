import { Router } from "express";
import {
  getStudents,
  createStudent,
  getStudentById,
  updateStudentSponsor,
  getRegisteredStudents,
} from "../controllers/studentsController";

const router = Router();

// Fetch all students or create a new student
router.route("/").get(getStudents).post(createStudent);

router.route("/registered").get(getRegisteredStudents);

// Fetch a student by their ID
router.route("/:id").get(getStudentById).patch(updateStudentSponsor); // Use :id instead of /id

export default router;
