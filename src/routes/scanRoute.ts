import { Router } from "express";
import { addScan, getScans, getStudentCampusStatus, getAllStudentsCampusStatus } from "../controllers/scanController";

const router = Router();

router.route("/scan").post(addScan);
router.route("/").get(getScans);
router.route("/campus-status/:studentId").get(getStudentCampusStatus);
router.route("/campus-status").get(getAllStudentsCampusStatus);

export default router;
