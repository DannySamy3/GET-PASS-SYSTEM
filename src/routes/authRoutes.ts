import { Router } from "express";
import {
  finalizeRegistration,
  resendVerificationCode,
  sendVerificationCode,
  verifyToken,
} from "../emailService";

const router = Router();

router.route("/").post(sendVerificationCode);
router.route("/verifyToken").post(verifyToken);
router.route("/resendToken").post(resendVerificationCode);
router.route("/registerUser").post(finalizeRegistration);

export default router;
