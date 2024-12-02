import { Express, Router } from "express";
import {
  createSponsor,
  deleteSponsor,
  editSponsor,
  getAllSponsors,
} from "../controllers/sponsorController";

const router = Router();

router.route("/").post(createSponsor).get(getAllSponsors);
router.route("/:id").delete(deleteSponsor).patch(editSponsor);

export default router;
