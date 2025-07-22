import { Request, Response, NextFunction } from "express";
import sessionModel from "../models/sessionModel";
import studentModel from "../models/studentModel";
import mongoose from "mongoose";
import paymentModel from "../models/paymentModel";
import sponsorModel from "../models/sponsorModel";

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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    // 1. startDate must be today or in the future
    if (start < today) {
      res.status(400).json({
        status: "fail",
        message: "Session start date cannot be before today.",
      });
      return;
    }

    // 2. endDate must be after startDate (already present)
    if (end <= start) {
      res.status(400).json({
        status: "fail",
        message: "End date must be after start date",
      });
      return;
    }

    // 3. No duplicate startDate or endDate
    const duplicateDateSession = await sessionModel.findOne({
      $or: [
        { startDate: start },
        { endDate: end },
      ],
    });
    if (duplicateDateSession) {
      res.status(400).json({
        status: "fail",
        message: "A session with the same start or end date already exists.",
      });
      return;
    }

    // 4. No overlapping date ranges
    const overlappingSession = await sessionModel.findOne({
      $or: [
        // New session starts inside an existing session
        { startDate: { $lte: start }, endDate: { $gte: start } },
        // New session ends inside an existing session
        { startDate: { $lte: end }, endDate: { $gte: end } },
        // New session completely covers an existing session
        { startDate: { $gte: start }, endDate: { $lte: end } },
      ],
    });
    if (overlappingSession) {
      res.status(400).json({
        status: "fail",
        message: "Session date range overlaps with an existing session.",
      });
      return;
    }

    // 5. No creating a session whose date range is entirely before all existing sessions
    const allSessions = await sessionModel.find({}).sort({ startDate: 1 });
    if (allSessions.length > 0) {
      const earliestSession = allSessions[0];
      if (end < earliestSession.startDate) {
        res.status(400).json({
          status: "fail",
          message: "Cannot create a session entirely before all existing sessions.",
        });
        return;
      }
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

    // 6. Carry over overpayments from the most recent previous session
    // Find the most recent previous session (ending before this session starts)
    const previousSession = await sessionModel.findOne({ endDate: { $lt: start } }).sort({ endDate: -1 });
    if (previousSession) {
      // For each student, check if they overpaid in the previous session
      const previousPayments = await paymentModel.find({ sessionId: previousSession._id });
      for (const payment of previousPayments) {
        if (payment.amount > previousSession.amount) {
          const overpaidAmount = payment.amount - previousSession.amount;
          // Create a payment record in the new session for the overpaid amount
          await paymentModel.create({
            amount: overpaidAmount,
            sessionId: savedSession._id,
            studentId: payment.studentId,
            paymentStatus: overpaidAmount >= amount ? "PAID" : "PENDING",
            remainingAmount: Math.max(0, amount - overpaidAmount),
          });
        }
      }
    }

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

    // Automatically deactivate sessions whose endDate is before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiredSessionIds = sessions
      .filter(session => session.activeStatus && new Date(session.endDate) < today)
      .map(session => session._id);
    if (expiredSessionIds.length > 0) {
      await sessionModel.updateMany(
        { _id: { $in: expiredSessionIds } },
        { activeStatus: false }
      );
      // Optionally, update the in-memory sessions array as well
      sessions.forEach(session => {
        if (expiredSessionIds.includes(session._id)) {
          session.activeStatus = false;
        }
      });
    }

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

    const sessionId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ status: "fail", message: "Invalid session ID" });
      return;
    }

    if (amount !== undefined && amount <= 0) {
      res
        .status(400)
        .json({ status: "fail", message: "Amount must be greater than 0" });
      return;
    }

    if (gracePeriodDays !== undefined && gracePeriodDays < 0) {
      res.status(400).json({
        status: "fail",
        message: "Grace period days must be 0 or greater",
      });
      return;
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      res
        .status(400)
        .json({ status: "fail", message: "End date must be after start date" });
      return;
    }

    const currentSession = await sessionModel.findById(sessionId);
    if (!currentSession) {
      res.status(404).json({ status: "fail", message: "Session not found" });
      return;
    }

    const updateData: any = {
      ...(sessionName && { sessionName }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(amount && { amount }),
      ...(typeof activeStatus === "boolean" && { activeStatus }),
    };

    // Handle grace logic
    if (typeof grace === "boolean") {
      updateData.grace = grace;
      if (grace) {
        updateData.graceActivationDate = new Date();
        updateData.gracePeriodDays =
          gracePeriodDays ?? currentSession.gracePeriodDays ?? 0;
        updateData.graceRemainingDays = updateData.gracePeriodDays;
      } else {
        updateData.graceActivationDate = undefined;
        updateData.gracePeriodDays = 0;
        updateData.graceRemainingDays = 0;
      }
    } else if (gracePeriodDays !== undefined && currentSession.grace) {
      updateData.gracePeriodDays = gracePeriodDays;
      const daysPassed = Math.floor(
        (Date.now() - (currentSession.graceActivationDate?.getTime() || 0)) /
          (1000 * 60 * 60 * 24)
      );
      updateData.graceRemainingDays = Math.max(0, gracePeriodDays - daysPassed);
    }

    // If activating this session, deactivate others
    if (activeStatus === true) {
      // Fetch the session's start and end dates (use updated values if provided, else current)
      const newStartDate = startDate ? new Date(startDate) : currentSession.startDate;
      const newEndDate = endDate ? new Date(endDate) : currentSession.endDate;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Check for any session (other than this one) with an earlier start or end date and not expired
      const earlierActiveSession = await sessionModel.findOne({
        _id: { $ne: sessionId },
        endDate: { $gte: today }, // Only consider sessions that are not expired
        $or: [
          { startDate: { $lt: newStartDate } },
          { endDate: { $lt: newEndDate } },
        ],
      });
      if (earlierActiveSession) {
        res.status(400).json({
          status: "fail",
          message: "Cannot activate this session while another non-expired session exists with an earlier date range.",
        });
        return;
      }

      await sessionModel.updateMany(
        { _id: { $ne: sessionId } },
        { activeStatus: false }
      );
    }

    // Update session
    const updatedSession = await sessionModel.findByIdAndUpdate(
      sessionId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSession) {
      res.status(404).json({
        status: "fail",
        message: "Session update failed",
      });
      return;
    }

    // If amount was updated, check all students' payments for this session
    if (amount !== undefined) {
      const students = await studentModel.find({ sessionId });
      for (const student of students) {
        const payment = await paymentModel.findOne({ studentId: student._id, sessionId });
        if (!payment || payment.amount < updatedSession.amount) {
          await studentModel.findByIdAndUpdate(student._id, {
            status: "NOT REGISTERED",
            registrationStatus: "NOT REGISTERED",
          });
        } else {
          await studentModel.findByIdAndUpdate(student._id, {
            status: "REGISTERED",
            registrationStatus: "REGISTERED",
          });
        }
      }
    }

    const handleGraceChange = async () => {
      const students = await studentModel.find({ sessionId });

      // Grace turned OFF
      if (currentSession.grace && grace === false) {
        await Promise.all(
          students.map(async (student) => {
            // Get sponsor info
            const sponsor = await sponsorModel.findById(student.sponsor);
            const isMetfund = sponsor?.name?.toLowerCase() === "metfund";

            // Get payment info
            const payment = await paymentModel.findOne({
              studentId: student._id,
              sessionId,
            });

            if (isMetfund) {
              // Metfund-sponsored student is always registered and fully paid
              await studentModel.findByIdAndUpdate(student._id, {
                status: "REGISTERED",
                registrationStatus: "REGISTERED",
              });

              if (payment) {
                await paymentModel.findByIdAndUpdate(payment._id, {
                  paymentStatus: "PAID",
                  remainingAmount: 0,
                });
              } else {
                // If no payment exists, create it
                await paymentModel.create({
                  studentId: student._id,
                  sessionId,
                  amount: updatedSession.amount,
                  paymentStatus: "PAID",
                  remainingAmount: 0,
                });
              }
            } else {
              // Non-Metfund logic
              const hasPaidEnough =
                payment && payment.amount >= updatedSession.amount;

              if (!hasPaidEnough) {
                await studentModel.findByIdAndUpdate(student._id, {
                  status: "NOT REGISTERED",
                  registrationStatus: "NOT REGISTERED",
                });

                if (payment) {
                  await paymentModel.findByIdAndUpdate(payment._id, {
                    paymentStatus: "PENDING",
                    remainingAmount: updatedSession.amount - payment.amount,
                  });
                }
              }
            }
          })
        );
      }

      // Grace turned ON
      if (!currentSession.grace && grace === true) {
        await Promise.all(
          students.map(async (student) => {
            await studentModel.findByIdAndUpdate(student._id, {
              status: "REGISTERED",
              registrationStatus: "REGISTERED",
            });

            const payment = await paymentModel.findOne({
              studentId: student._id,
              sessionId,
            });

            if (payment) {
              await paymentModel.findByIdAndUpdate(payment._id, {
                paymentStatus: "PAID",
                remainingAmount: updatedSession.amount - payment.amount,
              });
            }
          })
        );
      }
    };

    const handleActiveStatusChange = async () => {
      if (!currentSession.activeStatus && activeStatus === true) {
        const students = await studentModel.find({}).populate("sponsor");

        // Turn off grace for this session
        await sessionModel.findByIdAndUpdate(sessionId, {
          grace: false,
          graceActivationDate: undefined,
          gracePeriodDays: 0,
          graceRemainingDays: 0,
        });

        await Promise.all(
          students.map(async (student) => {
            const sponsor = student.sponsor as any;
            const isMetfund = sponsor?.name?.toLowerCase() === "metfund";

            let payment = await paymentModel.findOne({
              studentId: student._id,
              sessionId,
            });

            if (!payment) {
              payment = await paymentModel.create({
                studentId: student._id,
                sessionId,
                amount: isMetfund ? updatedSession.amount : 0,
                paymentStatus: isMetfund ? "PAID" : "PENDING",
                remainingAmount: isMetfund ? 0 : updatedSession.amount,
              });
            }

            const hasPaidEnough = payment.amount >= updatedSession.amount;

            const isRegistered = isMetfund || hasPaidEnough;

            await studentModel.findByIdAndUpdate(student._id, {
              sessionId,
              fundedAmount: payment.amount,
              status: isRegistered ? "REGISTERED" : "NOT REGISTERED",
              registrationStatus: isRegistered
                ? "REGISTERED"
                : "NOT REGISTERED",
            });

            await paymentModel.findByIdAndUpdate(payment._id, {
              paymentStatus: isRegistered ? "PAID" : "PENDING",
              remainingAmount: Math.max(
                0,
                updatedSession.amount - payment.amount
              ),
            });
          })
        );
      }
    };

    await Promise.all([handleGraceChange(), handleActiveStatusChange()]);

    res.status(200).json({
      status: "success",
      data: { session: updatedSession },
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

    // First delete all payments associated with this session
    await paymentModel.deleteMany({ sessionId: req.params.id });

    // Then delete the session
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
