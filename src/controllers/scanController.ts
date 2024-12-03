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

export const getScansByCriteria = async (req: Request, res: Response) => {
  try {
    const { status, date } = req.query; // Extract query parameters
    const criteria: any = {};
    if (status) criteria.status = status; // Add status filter if provided
    if (date) criteria.date = { $gte: new Date(date as string) }; // Add date filter if provided

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

// Controller to get all scans
export const getAllScans = async (req: Request, res: Response) => {
  try {
    const scans = await scanModel.find().populate("student"); // Fetch all scans with populated student field
    res.status(200).json(scans); // Send the scans as JSON response
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
