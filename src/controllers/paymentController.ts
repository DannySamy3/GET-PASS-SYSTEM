import { Request, Response } from "express";
import paymentModel from "../models/paymentModel";
import sessionModel from "../models/sessionModel";
import studentModel from "../models/studentModel";

export const createPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { amount, sessionId, studentId } = req.body;

    if (!amount || !sessionId || !studentId) {
      res.status(400).json({
        status: "fail",
        message: "Amount, sessionId, or studentId is missing",
      });
      return;
    }

    // Verify that the student exists
    const student = await studentModel.findById(studentId);
    if (!student) {
      res.status(404).json({
        status: "fail",
        message: "Student not found",
      });
      return;
    }

    // Fetch the session to check the required amount
    const session = await sessionModel.findById(sessionId);

    if (!session) {
      res.status(404).json({
        status: "fail",
        message: "Session not found",
      });
      return;
    }

    // Check if payment amount matches the session amount exactly
    if (amount !== session.amount) {
      res.status(400).json({
        status: "fail",
        message: `Payment amount must be exactly ${
          session.amount
        }. The submitted amount of ${amount} is ${
          amount < session.amount ? "less than" : "greater than"
        } the required amount.`,
      });
      return;
    }

    const newPayment = await paymentModel.create({
      amount,
      sessionId,
      studentId,
      paymentStatus: "PAID",
      remainingAmount: 0,
    });

    res.status(201).json({
      status: "success",
      data: { payment: newPayment },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "ValidationError") {
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
      return;
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unknown error occurred",
      });
    }
  }
};

export const getAllPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payments = await paymentModel
      .find()
      .populate("sessionId")
      .populate("studentId");

    res.status(200).json({
      status: "success",
      results: payments.length,
      data: { payments },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unknown error occurred",
      });
    }
  }
};

export const getPaymentsByStudentId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const studentId = req.params.id;

    if (!studentId) {
      res.status(400).json({
        status: "fail",
        message: "Student ID is required",
      });
      return;
    }

    const payments = await paymentModel
      .find({ studentId })
      .populate("sessionId")
      .populate("studentId");

    if (!payments || payments.length === 0) {
      res.status(404).json({
        status: "fail",
        message: "No payments found for this student",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      results: payments.length,
      data: { payments },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unknown error occurred",
      });
    }
  }
};

export const getPaymentsBySession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payments = await paymentModel
      .find({ sessionId: req.params.sessionId })
      .populate("sessionId")
      .populate("studentId");

    res.status(200).json({
      status: "success",
      results: payments.length,
      data: { payments },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unknown error occurred",
      });
    }
  }
};

export const updatePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: studentId } = req.params;
    const { amount } = req.body;

    // Validate required fields
    if (!studentId) {
      res.status(400).json({
        status: "fail",
        message: "Student ID is required",
      });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({
        status: "fail",
        message: "Valid payment amount is required",
      });
      return;
    }

    // Find the student
    const student = await studentModel.findById(studentId);
    if (!student) {
      res.status(404).json({
        status: "fail",
        message: "Student not found",
      });
      return;
    }

    // Find the active session
    const activeSession = await sessionModel.findOne({ activeStatus: true });
    if (!activeSession) {
      res.status(404).json({
        status: "fail",
        message: "No active session found",
      });
      return;
    }

    // Find the student's payment for this session
    const existingPayment = await paymentModel.findOne({
      studentId,
      sessionId: activeSession._id,
    });

    if (!existingPayment) {
      res.status(404).json({
        status: "fail",
        message:
          "No payment record found for this student in the active session",
      });
      return;
    }

    // Calculate the total amount after adding the new payment
    const totalAmount = existingPayment.amount + amount;
    const remainingToPay = activeSession.amount - existingPayment.amount;

    // Check if the total amount would be less than the session amount
    if (totalAmount < activeSession.amount) {
      res.status(400).json({
        status: "fail",
        message: `Total payment amount (${totalAmount}) would be less than the required session amount (${activeSession.amount}). Please pay at least ${remainingToPay} to complete the payment.`,
      });
      return;
    }

    // Update the payment
    const updatedPayment = await paymentModel
      .findByIdAndUpdate(
        existingPayment._id,
        {
          amount: totalAmount,
          paymentStatus:
            totalAmount >= activeSession.amount ? "PAID" : "PENDING",
          remainingAmount: Math.max(0, activeSession.amount - totalAmount),
        },
        {
          new: true,
          runValidators: true,
        }
      )
      .populate("sessionId")
      .populate("studentId");

    // Update student's registration status if payment is complete
    if (totalAmount >= activeSession.amount) {
      await studentModel.findByIdAndUpdate(studentId, {
        status: "REGISTERED",
        registrationStatus: "REGISTERED",
      });
    }

    res.status(200).json({
      status: "success",
      data: { payment: updatedPayment },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "ValidationError") {
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unknown error occurred",
      });
    }
  }
};
