import { Express, Router } from "express";
import { createSponsor, deleteSponsor } from "../controllers/sponsorController";

const router = Router();

router.route("/").post(createSponsor);
router.route("/:id").delete(deleteSponsor);

export default router;
