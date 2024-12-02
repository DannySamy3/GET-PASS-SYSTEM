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
  const { studentId } = req.body;

  if (!studentId) {
    res.status(400).json({
      status: "fail",
      message: "Missing required field: studentId",
    });
    return;
  }

  try {
    const student = await studentModel.findOne({ _id: studentId });

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
      student: studentId,
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
      student: studentId,
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
