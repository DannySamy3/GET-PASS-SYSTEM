import { Router } from "express";
import {
  addScan,
  getAllScans,
  getScansByCriteria,
} from "../controllers/scanController";

const router = Router();

router.route("/:id").get(addScan);
router.route("/").get(getAllScans);
router.route("/criteria").get(getScansByCriteria);

export default router;
