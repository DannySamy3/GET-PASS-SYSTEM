import { Request, Response } from "express";
import classModel from "../models/classModel";

export const createClass = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, duration, classInitial } = req.body;
    if (!name || !duration || !classInitial) {
      res.status(400).json({
        status: "fail",
        message: "Name, duration, or classInitial is missing",
      });
      return;
    }

    const newClass = await classModel.create({ name, duration, classInitial });

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
