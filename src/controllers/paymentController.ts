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

// export const getPaymentsByStudent = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const id = req.params.id;

//     if (!id) {
//       res.status(400).json({
//         status: "fail",
//         message: "Student ID is required",
//       });
//       return;
//     }

//     // Find the current active session
//     const activeSession = await sessionModel.findOne({ activeStatus: true });

//     if (!activeSession) {
//       res.status(404).json({
//         status: "fail",
//         message: "No active session found",
//       });
//       return;
//     }

//     const payments = await paymentModel
//       .find({
//         id,
//         sessionId: activeSession._id,
//       })
//       .populate("sessionId")
//       .populate("studentId");

//     res.status(200).json({
//       status: "success",
//       results: payments.length,
//       data: { payments },
//     });
//   } catch (error) {
//     if (error instanceof Error) {
//       res.status(500).json({
//         status: "fail",
//         message: error.message,
//       });
//     } else {
//       res.status(500).json({
//         status: "fail",
//         message: "An unknown error occurred",
//       });
//     }
//   }
// };

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
