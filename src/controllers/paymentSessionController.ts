import { Request, Response, NextFunction } from "express";
import sessionModel from "../models/sessionModel";
import mongoose from "mongoose";

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionName, startDate, endDate, amount, activeStatus } = req.body;

    console.log(req.body);

    // Validate required fields
    if (!sessionName || !startDate || !endDate || !amount) {
      res.status(400).json({
        status: "fail",
        message: "Missing required fields",
      });
      return;
    }

    // Validate amount
    if (amount <= 0) {
      res.status(400).json({
        status: "fail",
        message: "Amount must be greater than 0",
      });
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      res.status(400).json({
        status: "fail",
        message: "End date must be after start date",
      });
      return;
    }

    // If setting activeStatus to true, set all other sessions to false
    if (activeStatus === true) {
      await sessionModel.updateMany({}, { activeStatus: false });
    }

    // Create new session
    const session = new sessionModel({
      sessionName,
      startDate: start,
      endDate: end,
      amount,
      ...(typeof activeStatus === "boolean" && { activeStatus }),
    });

    const savedSession = await session.save();

    res.status(201).json({
      status: "success",
      data: {
        session: savedSession,
      },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    next(error);
  }
};

export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessions = await sessionModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: sessions.length,
      data: {
        sessions,
      },
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    next(error);
  }
};

export const getSessionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await sessionModel.findById(req.params.id);

    if (!session) {
      res.status(404).json({
        status: "fail",
        message: "Session not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        session,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    next(error);
  }
};

export const updateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionName, startDate, endDate, amount, activeStatus, grace } =
      req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({
        status: "fail",
        message: "Invalid session ID",
      });
      return;
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      res.status(400).json({
        status: "fail",
        message: "Amount must be greater than 0",
      });
      return;
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        res.status(400).json({
          status: "fail",
          message: "End date must be after start date",
        });
        return;
      }
    }

    // If specifically setting activeStatus to true, set all other sessions to false
    if (activeStatus === true) {
      // First, update all other sessions to false
      await sessionModel.updateMany(
        { _id: { $ne: req.params.id } },
        { activeStatus: false }
      );
    }

    // Then update the target session
    const session = await sessionModel.findByIdAndUpdate(
      req.params.id,
      {
        ...(sessionName && { sessionName }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(amount && { amount }),
        ...(typeof activeStatus === "boolean" && { activeStatus }),
        ...(typeof grace === "boolean" && { grace }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!session) {
      res.status(404).json({
        status: "fail",
        message: "Session not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        session,
      },
    });
  } catch (error) {
    console.error("Error updating session:", error);
    next(error);
  }
};

export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({
        status: "fail",
        message: "Invalid session ID",
      });
      return;
    }

    const session = await sessionModel.findByIdAndDelete(req.params.id);

    if (!session) {
      res.status(404).json({
        status: "fail",
        message: "Session not found",
      });
      return;
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    next(error);
  }
};
