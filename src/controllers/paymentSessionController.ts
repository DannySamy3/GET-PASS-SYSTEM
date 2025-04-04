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

    // Create new session with grace defaulted to false
    const session = new sessionModel({
      sessionName,
      startDate: start,
      endDate: end,
      amount,
      activeStatus: activeStatus || false,
      grace: false,
      gracePeriodDays: 0,
      graceRemainingDays: 0,
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
    const sessions = await sessionModel.find().sort({ createdAt: -1 }).lean(); // Use lean() for better performance

    // Calculate remaining days for each session with grace
    const sessionsWithGrace = sessions.map((session) => {
      if (session.grace && session.graceActivationDate) {
        const now = new Date();
        const daysPassed = Math.floor(
          (now.getTime() - new Date(session.graceActivationDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const remainingDays = Math.max(0, session.gracePeriodDays - daysPassed);

        return {
          ...session,
          graceRemainingDays: remainingDays,
          grace: remainingDays > 0,
        };
      }
      return {
        ...session,
        graceRemainingDays: 0,
      };
    });

    res.status(200).json({
      status: "success",
      results: sessionsWithGrace.length,
      data: {
        sessions: sessionsWithGrace,
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
    const session = await sessionModel.findById(req.params.id).lean();

    if (!session) {
      res.status(404).json({
        status: "fail",
        message: "Session not found",
      });
      return;
    }

    let sessionWithGrace = { ...session };
    if (session.grace && session.graceActivationDate) {
      const now = new Date();
      const daysPassed = Math.floor(
        (now.getTime() - new Date(session.graceActivationDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const remainingDays = Math.max(0, session.gracePeriodDays - daysPassed);

      sessionWithGrace = {
        ...session,
        graceRemainingDays: remainingDays,
        grace: remainingDays > 0,
      };
    } else {
      sessionWithGrace.graceRemainingDays = 0;
    }

    res.status(200).json({
      status: "success",
      data: {
        session: sessionWithGrace,
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
    const {
      sessionName,
      startDate,
      endDate,
      amount,
      activeStatus,
      grace,
      gracePeriodDays,
    } = req.body;

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

    // Validate grace period days if provided
    if (gracePeriodDays !== undefined && gracePeriodDays < 0) {
      res.status(400).json({
        status: "fail",
        message: "Grace period days must be 0 or greater",
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

    // Get current session to check grace status
    const currentSession = await sessionModel.findById(req.params.id);
    const updateData: any = {
      ...(sessionName && { sessionName }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(amount && { amount }),
      ...(typeof activeStatus === "boolean" && { activeStatus }),
    };

    // Handle grace period updates
    if (typeof grace === "boolean" || gracePeriodDays !== undefined) {
      if (grace === true) {
        // Grace is being activated
        updateData.grace = true;
        updateData.graceActivationDate = new Date();
        updateData.gracePeriodDays =
          gracePeriodDays || currentSession?.gracePeriodDays || 0;
        updateData.graceRemainingDays = updateData.gracePeriodDays;
      } else if (grace === false) {
        // Grace is being deactivated
        updateData.grace = false;
        updateData.graceActivationDate = undefined;
        updateData.gracePeriodDays = 0;
        updateData.graceRemainingDays = 0;
      } else if (gracePeriodDays !== undefined && currentSession?.grace) {
        // Only updating grace period days for an active grace period
        updateData.gracePeriodDays = gracePeriodDays;
        if (currentSession.graceActivationDate) {
          const now = new Date();
          const daysPassed = Math.floor(
            (now.getTime() - currentSession.graceActivationDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          updateData.graceRemainingDays = Math.max(
            0,
            gracePeriodDays - daysPassed
          );
        }
      }
    }

    // Then update the target session
    const session = await sessionModel.findByIdAndUpdate(
      req.params.id,
      updateData,
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

export const updateGraceDays = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await sessionModel.updateGraceDays();

    res.status(200).json({
      status: "success",
      message: "Grace days updated successfully",
    });
  } catch (error) {
    console.error("Error updating grace days:", error);
    next(error);
  }
};
