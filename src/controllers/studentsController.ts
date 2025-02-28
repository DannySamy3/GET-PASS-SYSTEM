import { Request, Response } from "express";
import studentModel from "../models/studentModel";
import classModel, { IClass } from "../models/classModel";
import sponsorModel from "../models/sponsorModel";

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

    // if (req.query.class) {
    //   const className = req.query.class as string;
    //   const classDoc = await classModel.findOne({ name: className });
    //   if (classDoc) {
    //     query.class = classDoc._id;
    //   } else {
    //     res.status(404).json({
    //       status: "fail",
    //       message: "Class not found",
    //     });
    //     return;
    //   }
    // }

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
  res: Response
): Promise<void> => {
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
    res.status(400).json({
      status: "fail",
      message: "Missing input fields",
    });
    return;
  }

  try {
    const getSelectedClass = await classModel.findById(classId);
    if (!getSelectedClass) {
      res.status(400).json({
        status: "fail",
        message: "The selected class doesn't exist",
      });
      return;
    }

    const getSponsor = await sponsorModel.findById(sponsorId);
    if (!getSponsor) {
      res.status(400).json({
        status: "fail",
        message: "The selected sponsor doesn't exist",
      });
      return;
    }

  

    const status =
      getSponsor.name === "Metfund" ? "REGISTERED" : "NOT REGISTERED";

    const student = new studentModel({
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      nationality,
      classId,
      sponsor: sponsorId,
      status,
      gender,

      enrollmentYear,
    });

    const savedStudent = await student.save();

    res.status(201).json({
      status: "success",
      data: { student: savedStudent },
    });
  } catch (error) {
    console.error("Error while creating student:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({
      status: "fail",
      message: errorMessage,
    });
  }
};

export const getStudentById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const studentId = req.params.id;
    const student = await studentModel.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json(student);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
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
    const students = await studentModel.find({ status: "REGISTERED" });

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
