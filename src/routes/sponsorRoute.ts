import { Express, Router } from "express";
import {
  createSponsor,
  deleteSponsor,
  editSponsor,
  getAllSponsors,
  getSponsorById,
} from "../controllers/sponsorController";

const router = Router();

router.route("/").post(createSponsor).get(getAllSponsors);
router
  .route("/:id")
  .delete(deleteSponsor)
  .patch(editSponsor)
  .get(getSponsorById);

export default router;
