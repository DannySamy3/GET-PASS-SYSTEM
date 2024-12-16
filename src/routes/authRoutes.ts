import { Router } from "express";
import { sendVerificationCode } from "../emailService";

const router = Router();

router.route("/").post(sendVerificationCode);

export default router;
