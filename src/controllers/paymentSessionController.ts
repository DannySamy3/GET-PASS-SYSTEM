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

    // const handleActiveStatusChange = async () => {
    //   if (!currentSession.activeStatus && activeStatus === true) {
    //     const students = await studentModel.find({});
    //     await Promise.all(
    //       students.map(async (student) => {
    //         let payment = await paymentModel.findOne({
    //           studentId: student._id,
    //           sessionId,
    //         });
    //         if (!payment) {
    //           payment = await paymentModel.create({
    //             amount: 0,
    //             sessionId,
    //             studentId: student._id,
    //             paymentStatus: "PENDING",
    //             remainingAmount: updatedSession.amount,
    //           });
    //         }

    //         const sponsor = await sponsorModel.findById(student.sponsor);
    //         const isMetfund = sponsor?.name === "Metfund";
    //         const isRegistered =
    //           updatedSession.grace ||
    //           isMetfund ||
    //           payment.amount >= updatedSession.amount;

    //         await studentModel.findByIdAndUpdate(student._id, {
    //           sessionId,
    //           fundedAmount: payment.amount,
    //           status: isRegistered ? "REGISTERED" : "NOT REGISTERED",
    //           registrationStatus: isRegistered
    //             ? "REGISTERED"
    //             : "NOT REGISTERED",
    //         });

    //         await paymentModel.findByIdAndUpdate(payment._id, {
    //           paymentStatus: isRegistered ? "PAID" : "PENDING",
    //           remainingAmount: Math.max(
    //             0,
    //             updatedSession.amount - payment.amount
    //           ),
    //         });
    //       })
    //     );
    //   }
    // };

    const handleActiveStatusChange = async () => {
      if (!currentSession.activeStatus && activeStatus === true) {
        const students = await studentModel.find({}).populate("sponsor");

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
