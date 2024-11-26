import { Request, Response } from "express";
import classModel from "../models/classModel";

const createClass = async (req: Request, res: Response) => {
  try {
    const { name, duration } = req.body;
    if (!name || !duration) {
      return res.status(400).json({
        status: "fail",
        message: "Name or duration is missing",
      });
    }

    const query = await classModel.create({ name, duration });

    res.status(201).json({
      status: "success",
      data: { class: query },
    });
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          status: "fail",
          message: error.message,
        });
      }

      // Handle other known errors
      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      // Handle unknown errors
      return res.status(500).json({
        status: "fail",
        message: "Internal server error",
      });
    }
  }
};

export default createClass;
