import { Request, Response } from "express";
import paymentModel from "../models/paymentModel";

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

    const newPayment = await paymentModel.create({
      amount,
      sessionId,
      studentId,
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

export const getPaymentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payment = await paymentModel
      .findById(req.params.id)
      .populate("sessionId")
      .populate("studentId");

    if (!payment) {
      res.status(404).json({
        status: "fail",
        message: "Payment not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: { payment },
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

export const getPaymentsByStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payments = await paymentModel
      .find({ studentId: req.params.studentId })
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
