import { Router } from "express";
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
} from "../controllers/paymentSessionController";

const router = Router();

router.route("/").post(createSession).get(getSessions);

router
  .route("/:id")
  .get(getSessionById)
  .patch(updateSession)
  .delete(deleteSession);

export default router;
