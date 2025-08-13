import mongoose, { Schema, Document } from "mongoose";
import { IStudent } from "./studentModel"; // Import the IStudent interface from the student model

// Enum for scan status
enum ScanStatus {
  COMPLETED = "COMPLETED",
  ERROR = "NOT FOUND",
  FAILED = "FAILED",
}

// Enum for scan type (entry/exit)
enum ScanType {
  ENTRY = "ENTRY",
  EXIT = "EXIT",
}

// Enum for campus status
enum CampusStatus {
  IN_CAMPUS = "IN_CAMPUS",
  OUT_CAMPUS = "OUT_CAMPUS",
}

// Interface for Scan Document
export interface IScan extends Document {
  date: Date;
  status: ScanStatus;
  scanType: ScanType; // New field to track if this is entry or exit
  campusStatus: CampusStatus; // New field to track campus status after this scan
  student: mongoose.Types.ObjectId; // Reference to the Student model
}

// Scan Schema
const scanSchema: Schema<IScan> = new Schema(
  {
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(ScanStatus),
      required: true,
    },
    scanType: {
      type: String,
      enum: Object.values(ScanType),
      required: true,
    },
    campusStatus: {
      type: String,
      enum: Object.values(CampusStatus),
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student", // Reference to the Student model
      required: function (this: IScan) {
        return this.status !== ScanStatus.FAILED;
      },
    },
  },
  { timestamps: true }
);

const scanModel = mongoose.model<IScan>("Scan", scanSchema);

export default scanModel;
export { ScanStatus, ScanType, CampusStatus };
