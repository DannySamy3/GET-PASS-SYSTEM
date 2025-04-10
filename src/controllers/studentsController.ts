/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import studentModel from "../models/studentModel";
import classModel, { IClass } from "../models/classModel";
import sponsorModel from "../models/sponsorModel";
import { upload, uploadToGCS } from "../gcpStorage"; // Corrected import path
import sessionModel from "../models/sessionModel";
import paymentModel from "../models/paymentModel";
import { Router } from "express";
import mongoose from "mongoose";

interface ClassStats {
  registered: { [key: string]: number };
  unregistered: { [key: string]: number };
}

export const getStudents = async (req: Request, res: Response) => {
  try {
    const query: any = {};

    if (req.query.name) {
      const name = req.query.name as string;
      const nameRegex = new RegExp(name, "i"); // 'i' makes the regex case-insensitive
      query.$or = [
        { firstName: nameRegex },
        { secondName: nameRegex },
        { lastName: nameRegex },
      ];
    }

    if (req.query.regNo) {
      query.regNo = req.query.regNo as string;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const students = await studentModel.find(query).skip(skip).limit(limit);

    const total = await studentModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: {
        students,
        total,
        totalPages,
        currentPage: page,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({
      status: "fail",
      message: errorMessage,
    });
  }
};

export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  upload.single("image")(req, res, async function (err: any) {
    console.log(req.body); // Check input fields
    console.log(req.file); // Check the file being uploaded

    if (err) {
      return res
        .status(400)
        .json({ message: "Image upload failed", error: err });
    }

    const {
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      nationality,
      classId,
      enrollmentYear,
      sponsorId,
      gender,
    } = req.body;

    // Validate ObjectId fields
    if (!mongoose.Types.ObjectId.isValid(sponsorId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid sponsor ID format",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid class ID format",
      });
    }

    if (
      !firstName ||
      !secondName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !nationality ||
      !classId ||
      !enrollmentYear ||
      !sponsorId ||
      !gender
    ) {
      return res.status(400).json({
        status: "fail",
        message: "Missing input fields",
      });
    }

    try {
      let imageFilePath;
      if (req.file) {
        imageFilePath = await uploadToGCS(req.file);
      }

      // Get current active session
      const currentSession = await sessionModel.findOne({ activeStatus: true });
      if (!currentSession) {
        return res.status(404).json({
          status: "fail",
          message: "No active session found",
        });
      }

      const getSelectedClass = await classModel.findById(classId);
      if (!getSelectedClass) {
        return res.status(400).json({
          status: "fail",
          message: "The selected class doesn't exist",
        });
      }

      const getSponsor = await sponsorModel.findById(sponsorId);
      if (!getSponsor) {
        return res.status(400).json({
          status: "fail",
          message: "The selected sponsor doesn't exist",
        });
      }

      let registrationStatus: string;
      // Check if sponsor is Metfund
      if (getSponsor.name === "Metfund") {
        registrationStatus = "REGISTERED";
      } else {
        // For other sponsors, check grace period status
        if (currentSession.grace) {
          // During grace period, all students are registered regardless of amount
          registrationStatus = "REGISTERED";
        } else {
          // Without grace period, students start as not registered
          registrationStatus = "NOT REGISTERED";
        }
      }

      const student = new studentModel({
        firstName,
        secondName,
        lastName,
        email,
        phoneNumber,
        nationality,
        classId,
        sponsor: sponsorId,
        registrationStatus,
        status: registrationStatus,
        gender,
        image: imageFilePath,
        enrollmentYear,
        sessionId: currentSession._id,
      });

      const savedStudent = await student.save();

      // Create payment record
      await paymentModel.create({
        amount: getSponsor.name === "Metfund" ? currentSession.amount : 0, // Full amount for Metfund, 0 for others
        sessionId: currentSession._id,
        studentId: savedStudent._id,
        paymentStatus: registrationStatus === "REGISTERED" ? "PAID" : "PENDING",
        remainingAmount:
          getSponsor.name === "Metfund" ? 0 : currentSession.amount, // 0 for Metfund, full amount for others
      });

      res.status(201).json({
        status: "success",
        data: { student: savedStudent },
        message: `Student created successfully with status: ${registrationStatus}`,
      });
    } catch (error) {
      console.error("Error while creating student:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";
      return res.status(500).json({
        status: "fail",
        message: errorMessage,
      });
    }
  });
};

export const getStudentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const student = await studentModel
      .findById(req.params.id)
      .populate("sessionId");

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    next(error); // Pass error to Express error handler
  }
};
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const student = await studentModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating student",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const student = await studentModel.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting student",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateStudentSponsor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { studentId, sponsorId } = req.body;

  // Validate inputs
  if (!studentId || !sponsorId) {
    res.status(400).json({
      status: "fail",
      message: "Missing required fields: studentId or sponsorId",
    });
    return;
  }

  try {
    // Check if student exists
    const student = await studentModel.findById(studentId);
    if (!student) {
      res.status(404).json({
        status: "fail",
        message: "Student not found",
      });
      return;
    }

    // Check if sponsor exists
    const sponsor = await sponsorModel.findById(sponsorId);
    if (!sponsor) {
      res.status(404).json({
        status: "fail",
        message: "Sponsor not found",
      });
      return;
    }

    // Update the student's sponsor
    student.sponsor = sponsorId;
    await student.save();

    res.status(200).json({
      status: "success",
      message: "Sponsor updated successfully",
      data: {
        student: {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          currentSponsor: sponsor.name,
        },
      },
    });
  } catch (error) {
    console.error("Error updating student sponsor:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({
      status: "fail",
      message: errorMessage,
    });
  }
};

export const getRegisteredStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = await studentModel.find({
      status: "REGISTERED",
    });

    if (students.length === 0) {
      res.status(404).json({
        status: "fail",
        message: "No registered students found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: students,
      studentNumber: students.length,
    });
  } catch (error) {
    console.error("Error retrieving registered students:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({
      status: "fail",
      message: errorMessage,
    });
  }
};

// Define the structure for the response
interface ClassStats {
  registered: { [classInitial: string]: number };
  unregistered: { [classInitial: string]: number };
  classInitials: string[]; // Array of class initials only
}

export const getClassRegistrationStats = async (
  req: Request,
  res: Response
) => {
  try {
    // Fetch all classes with their initials (only classInitial, not the full class details)
    const classes: IClass[] = await classModel.find({}, { classInitial: 1 });

    // Initialize response structure
    const stats: ClassStats = {
      registered: {},
      unregistered: {},
      classInitials: classes.map((classDoc) => classDoc.classInitial), // Populate with only class initials
    };

    // Iterate through classes and calculate stats
    for (const classDoc of classes) {
      // We directly use classDoc._id which is already an ObjectId
      const classId = classDoc._id;

      const classInitial = classDoc.classInitial;

      // Count registered students
      const registeredCount = await studentModel.countDocuments({
        classId: classId, // No need to call toString() here
        status: "REGISTERED",
      });

      // Count unregistered students
      const unregisteredCount = await studentModel.countDocuments({
        classId: classId, // No need to call toString() here
        status: "NOT REGISTERED",
      });

      // Populate stats
      stats.registered[classInitial] = registeredCount;
      stats.unregistered[classInitial] = unregisteredCount;
    }

    // Send response
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching class registration stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // Use 'id' instead of '_id' to match the route parameter
    const updates = req.body;

    // Validate studentId
    if (!id) {
      res.status(400).json({
        message: "Student ID is required.",
      });
      return;
    }

    // Find and update student
    const updatedStudent = await studentModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedStudent) {
      res.status(404).json({
        message: "Student not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Student updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      message: "Internal server error.",
    });
  }
};
