import mongoose, { Schema, Document } from "mongoose";
import { IStudent } from "./studentModel"; // Import the IStudent interface from the student model

// Enum for scan status
enum ScanStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

// Interface for Scan Document
export interface IScan extends Document {
  date: Date;
  status: ScanStatus;
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
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "studentModel", // Reference to the Student model
      required: true,
    },
  },
  { timestamps: true }
);

const scanModel = mongoose.model<IScan>("Scan", scanSchema);

export default scanModel;
