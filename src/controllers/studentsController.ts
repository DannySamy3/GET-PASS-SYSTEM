import { Request, Response } from "express";
import studentModel from "../models/studentModel";
import classModel from "../models/classModel";

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
