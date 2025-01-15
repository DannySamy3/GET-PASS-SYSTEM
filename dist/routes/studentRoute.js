"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentsController_1 = require("../controllers/studentsController");
const router = (0, express_1.Router)();
// Fetch all students or create a new student
router.route("/").get(studentsController_1.getStudents).post(studentsController_1.createStudent);
router.route("/registered").get(studentsController_1.getRegisteredStudents);
router.route("/stats").get(studentsController_1.getClassRegistrationStats);
// Fetch a student by their ID
router.route("/:id").get(studentsController_1.getStudentById).patch(studentsController_1.editStudent); // Use :id instead of /id
exports.default = router;
