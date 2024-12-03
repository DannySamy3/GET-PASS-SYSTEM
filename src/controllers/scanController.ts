import { Request, Response } from "express";
import studentModel from "../models/studentModel";
import scanModel from "../models/scanModel";
import { RegistrationStatus } from "../models/studentModel";

enum ScanStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

export const addScan = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      status: "fail",
      message: "Missing required field: id",
    });
    return;
  }

  try {
    const student = await studentModel.findOne({ _id: id });

    if (!student) {
      res.status(404).json({
        status: "fail",
        message: "Student not found",
      });
      return;
    }

    let scanStatus = ScanStatus.FAILED;

    if (student.status === RegistrationStatus.REGISTERED) {
      scanStatus = ScanStatus.COMPLETED;
    } else if (student.status === RegistrationStatus.UNREGISTERED) {
      scanStatus = ScanStatus.FAILED;
    }

    const newScan = await scanModel.create({
      student: id,
      status: scanStatus,
      date: Date.now(),
    });

    res.status(201).json({
      status: "success",
      data: {
        student: {
          status: student.status,
        },
        scan: newScan,
      },
    });
  } catch (error) {
    console.error("Error in adding scan:", error);

    const newScan = await scanModel.create({
      student: id,
      status: ScanStatus.PENDING,
      date: Date.now(),
    });

    res.status(500).json({
      status: "fail",
      message:
        "Network error or internal server error. Scan status is PENDING.",
    });
  }
};

export const getScans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, date, month } = req.query;
    const criteria: any = {};

    if (status) {
      criteria.status = status;
    }

    if (date) {
      const parsedDate = new Date(date as string);

      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({
          message: "Invalid date format. Please provide a valid date string.",
        });
        return;
      }

      const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

      criteria.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (month) {
      const parsedMonth = parseInt(month as string, 10);
      if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        res.status(400).json({
          message: "Invalid month. Please provide a valid month (1-12).",
        });
        return;
      }

      const currentYear = new Date().getFullYear();

      const startOfMonth = new Date(currentYear, parsedMonth - 1, 1);
      const endOfMonth = new Date(currentYear, parsedMonth, 0, 23, 59, 59, 999);

      criteria.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const scans = await scanModel.find(criteria).populate("student");

    res.status(200).json(scans);
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: `Error fetching scans: ${error.message}` });
    } else {
      res
        .status(500)
        .json({ message: "An unknown error occurred while fetching scans." });
    }
  }
};
