import { Express } from "express";
import { Router } from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  getPaymentsByStudent,
  getPaymentsBySession,
} from "../controllers/paymentController";

const router = Router();

router.route("/").post(createPayment).get(getAllPayments);
router.route("/:id").get(getPaymentById);
router.route("/student/:studentId").get(getPaymentsByStudent);
router.route("/session/:sessionId").get(getPaymentsBySession);

export default router;
