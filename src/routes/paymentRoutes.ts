import { Express } from "express";
import { Router } from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentsByStudentId,
  getPaymentsBySession,
} from "../controllers/paymentController";

const router = Router();

router.route("/").post(createPayment).get(getAllPayments);
router.route("/:id").get(getPaymentsByStudentId);

router.route("/session/:sessionId").get(getPaymentsBySession);

export default router;
