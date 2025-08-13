/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import studentModel from "../models/studentModel";
import classModel, { IClass } from "../models/classModel";
import sponsorModel from "../models/sponsorModel";
import sessionModel from "../models/sessionModel";
import paymentModel from "../models/paymentModel";
import { Router } from "express";
import mongoose from "mongoose";
import {
  uploadFileToImgur,
  handleImageUpload,
} from "../controllers/imageController";
import path from "path";
import scanModel, { ScanStatus, ScanType, CampusStatus } from "../models/scanModel";
import { RegistrationStatus } from "../models/studentModel";

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
  req: Request & { files?: { [fieldname: string]: Express.Multer.File[] } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  handleImageUpload(req, res, async function (err: any) {
    console.log(req.body); // Check input fields
    console.log(req.files); // Check the files being uploaded

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
      // Get the file from either field
      const file = req.files?.image?.[0] || req.files?.file?.[0];
      if (file) {
        try {
          const fileName = `students/${Date.now()}${path.extname(
            file.originalname
          )}`;
          imageFilePath = await uploadFileToImgur(file, fileName);
          console.log("Image uploaded successfully:", imageFilePath);
        } catch (uploadError) {
          console.error("Error uploading image to Imgur:", uploadError);
          return res.status(500).json({
            status: "fail",
            message: "Failed to upload image to Imgur",
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown upload error",
          });
        }
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

// Controller to get student registration status by ID and increment scan
export const getStudentRegistrationStatusById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const studentId = req.params.id;
    const student = await studentModel.findById(studentId);

    if (!student) {
      res.status(404).json({
        status: "fail",
        message: "Student ID not found in our records. Please check the ID and try again.",
      });
      return;
    }

    // Get scan type from query parameters (ENTRY or EXIT) - required
    const scanType = req.query.type as ScanType;
    if (!scanType || !Object.values(ScanType).includes(scanType)) {
      res.status(400).json({
        status: "fail",
        message: "Please specify scan type: 'ENTRY' for entering campus or 'EXIT' for leaving campus",
      });
      return;
    }

    // Determine scan status based on registration status
    let scanStatus = ScanStatus.FAILED;
    let campusStatus = CampusStatus.OUT_CAMPUS;
    let message = "";

    // Campus entry/exit logic - scan type is always required
    if (student.status === RegistrationStatus.REGISTERED) {
      if (scanType === ScanType.ENTRY) {
        // Check-in logic
                 if (student.campusStatus === CampusStatus.IN_CAMPUS) {
           // Student is already in campus, reject check-in
           scanStatus = ScanStatus.FAILED;
           campusStatus = CampusStatus.IN_CAMPUS;
           message = "Access Denied! Student is already inside campus.";
         } else {
           // Student is out of campus, allow check-in
           scanStatus = ScanStatus.COMPLETED;
           campusStatus = CampusStatus.IN_CAMPUS;
           message = "Access Granted! Student can now enter campus.";
         }
      } else if (scanType === ScanType.EXIT) {
        // Check-out logic
                 if (student.campusStatus === CampusStatus.OUT_CAMPUS) {
           // Student is already out of campus, reject check-out
           scanStatus = ScanStatus.FAILED;
           campusStatus = CampusStatus.OUT_CAMPUS;
           message = "Access Denied! Student is already outside campus.";
         } else {
           // Student is in campus, allow check-out
           scanStatus = ScanStatus.COMPLETED;
           campusStatus = CampusStatus.OUT_CAMPUS;
           message = "Access Granted! Student can now leave campus.";
         }
      }
         } else if (student.status === RegistrationStatus.UNREGISTERED) {
       scanStatus = ScanStatus.FAILED;
       message = "NOT REGISTERED";
     }

    // Fetch the class name using the student's classId
    let className = null;
    if (student.classId) {
      const classDoc = await classModel.findById(student.classId);
      if (classDoc && classDoc.name) {
        className = classDoc.name;
      }
    }

    // Create scan record for both successful and failed scans
    const scan = await scanModel.create({
      student: student._id,
      status: scanStatus,
      scanType: scanType,
      campusStatus: campusStatus,
      date: Date.now(),
    });

    // Update student's campus status and last scan date if scan is successful
    if (scanStatus === ScanStatus.COMPLETED) {
      await studentModel.findByIdAndUpdate(studentId, {
        campusStatus: campusStatus,
        lastScanDate: new Date(),
      });
    }

    // Return response with scan data for both success and failure
    const responseData = {
      registrationStatus: student.status,
      scan: {
        date: scan.date,
        status: scan.status,
        scanType: scan.scanType,
        campusStatus: scan.campusStatus,
      },
      student: {
        ...student.toObject(),
        campusStatus: campusStatus,
      },
      className, // Add class name to response
    };

    if (scanStatus === ScanStatus.COMPLETED) {
      // Return success response
      res.status(200).json({
        status: "success",
        data: responseData,
        message: message,
      });
    } else {
      // Return failed response with scan data
      res.status(400).json({
        status: "fail",
        data: responseData,
        message: message,
      });
    }
  } catch (error) {
    console.error("Error in getStudentRegistrationStatusById:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to get registration status or increment scan.",
    });
  }
};
