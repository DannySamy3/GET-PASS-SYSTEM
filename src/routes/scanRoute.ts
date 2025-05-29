import { Router } from "express";
import { addScan, getScans } from "../controllers/scanController";

const router = Router();

router.route("/scan").post(addScan);
router.route("/").get(getScans);

export default router;
