import { Router } from "express";
import { addScan, getScans } from "../controllers/scanController";

const router = Router();

router.route("/:id").get(addScan);
router.route("/").get(getScans);

export default router;
