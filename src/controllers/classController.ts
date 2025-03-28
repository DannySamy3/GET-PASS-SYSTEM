import { Request, Response } from "express";
import studentModel from "../models/studentModel"; // Import the Student model
import classModel from "../models/classModel";

export const createClass = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, duration, classInitial, fee } = req.body;
    if (!name || !duration || !classInitial || !fee) {
      res.status(400).json({
        status: "fail",
        message: "Name, duration, classInitial, or fee is missing",
      });
      return;
    }

    const newClass = await classModel.create({
      name,
      duration,
      classInitial,
      fee,
    });

    res.status(201).json({
      status: "success",
      data: { class: newClass },
    });
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.name === "ValidationError") {
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      // Handle other known errors
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
      return;
    } else {
      // Handle unknown errors
      res.status(500).json({
        status: "fail",
        message: "Internal server error",
      });
      return;
    }
  }
};

export const getAllClassInitials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const classInitials = await classModel.find({}, "classInitial"); // Fetch only the "classInitial" field
    res.status(200).json({
      success: true,
      data: classInitials.map((cls) => cls.classInitial), // Return only initials in an array
    });
  } catch (error) {
    console.error("Error fetching class initials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class initials",
    });
  }
};
export const getAllClasses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const classes = await classModel.find();
    res.status(200).json({
      success: true,
      classes,
    });
  } catch (error) {
    console.error("Error fetching classes", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
    });
  }
};

export const getClassById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const classDoc = await classModel.findById(id);

    if (!classDoc) {
      res.status(404).json({
        status: "fail",
        message: "Class not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: classDoc,
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

export const updateClass = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, duration, classInitial, fee } = req.body;

    // Validate input fields
    if (!name && !duration && !classInitial && !fee) {
      res.status(400).json({
        status: "fail",
        message: "No fields provided to update",
      });
      return;
    }

    // Fetch the current class
    const existingClass = await classModel.findById(id);
    if (!existingClass) {
      res.status(404).json({
        status: "fail",
        message: "Class not found",
      });
      return;
    }

    // Check if input fields are the same as existing values
    if (
      name === existingClass.name &&
      duration === existingClass.duration &&
      classInitial === existingClass.classInitial &&
      fee === existingClass.fee
    ) {
      res.status(400).json({
        status: "fail",
        message: "No changes detected in the input fields",
      });
      return;
    }

    // Update the class
    const updatedClass = await classModel.findByIdAndUpdate(
      id,
      { name, duration, classInitial, fee },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      message: "Class updated successfully",
      data: { class: updatedClass },
    });
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.name === "ValidationError") {
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      // Handle duplicate key error for classInitial
      if (error.name === "MongoError" && (error as any).code === 11000) {
        res.status(400).json({
          status: "fail",
          message: "A class with this initial already exists",
        });
        return;
      }

      // Handle other known errors
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
      return;
    } else {
      // Handle unknown errors
      res.status(500).json({
        status: "fail",
        message: "Internal server error",
      });
      return;
    }
  }
};

export const deleteClass = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if any students are linked to the class
    const linkedStudents = await studentModel.find({ classId: id });
    if (linkedStudents.length > 0) {
      res.status(400).json({
        message:
          "Cannot delete class. There are students linked to this class.",
      });
      return;
    }

    // Proceed to delete the class if no students are linked
    const deletedClass = await classModel.findByIdAndDelete(id);
    if (!deletedClass) {
      res.status(404).json({ message: "Class not found" });
      return;
    }

    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete class", error });
  }
};
