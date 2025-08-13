import mongoose, { Schema, Document } from "mongoose";
import Counter from "./counterModel";
import classModel from "./classModel";

// Enum for registration status
export enum RegistrationStatus {
  REGISTERED = "REGISTERED",
  UNREGISTERED = "NOT REGISTERED",
}

// Enum for gender
enum Gender {
  Male = "Male",
  Female = "Female",
}

// Enum for campus status
enum CampusStatus {
  IN_CAMPUS = "IN_CAMPUS",
  OUT_CAMPUS = "OUT_CAMPUS",
}

// Interface for Student Document
export interface IStudent extends Document {
  studentNumber: number;
  firstName: string;
  secondName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  classId: Schema.Types.ObjectId;
  sponsor: Schema.Types.ObjectId; // Reference to Sponsor model
  payments: Schema.Types.ObjectId[]; // Reference to Payment model
  status: RegistrationStatus;
  gender: Gender;
  enrollmentYear: number;
  image: string;
  regNo: string;
  sessionId: Schema.Types.ObjectId; // Reference to Session model
  campusStatus: CampusStatus; // New field to track current campus status
  lastScanDate: Date; // New field to track last scan date
}

// Student Schema
const studentSchema: Schema<IStudent> = new Schema(
  {
    studentNumber: { type: Number, unique: true },
    firstName: { type: String, required: true },
    secondName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    nationality: { type: String, required: true },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "classModel", // Reference to Class model
      required: true,
    },
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor", // Reference to Sponsor model
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      required: true,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: true,
    },
    enrollmentYear: { type: Number, required: true },
    image: { type: String, required: true },
    regNo: { type: String, unique: true, required: false },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session", // Reference to Session model
      required: true,
    },
    campusStatus: {
      type: String,
      enum: Object.values(CampusStatus),
      default: CampusStatus.OUT_CAMPUS, // Default to out of campus
    },
    lastScanDate: { type: Date },
  },
  { timestamps: true }
);

// Pre-save hook to generate regNo and studentNumber
studentSchema.pre("save", async function (next) {
  console.log("Saving student document...");

  // Log the current state of 'this'
  console.log("Pre-save hook triggered for student:", this);

  try {
    if (this.isNew) {
      // Increment studentNumber from counter
      console.log("Incrementing student number...");

      const counter = await Counter.findOneAndUpdate(
        { modelName: "studentNumber" },
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true }
      );

      if (!counter) {
        console.error("Failed to increment student number. Counter not found.");
        return next(new Error("Failed to increment student number"));
      }

      this.studentNumber = counter.sequenceValue;
      console.log("Generated studentNumber:", this.studentNumber);

      // Resolve classInitial and generate regNo
      console.log("Fetching class data for classId:", this.classId);
      const classDoc = await classModel.findById(this.classId);

      // Debugging: check if classDoc is found
      if (!classDoc) {
        console.error("Class not found for classId:", this.classId);
        return next(new Error("Invalid classId: Class not found."));
      }

      // Log class information for debugging
      console.log("Class found:", classDoc);

      // Generate regNo if class is found
      this.regNo = `${classDoc.classInitial}/${this.enrollmentYear
        .toString()
        .slice(-2)}/${this.studentNumber}`;
      console.log("Generated regNo:", this.regNo);
    }

    // Proceed to save the document
    next();
  } catch (error: unknown) {
    console.error("Error in pre-save hook:", error);
    if (error instanceof Error) {
      next(error); // If it's an instance of Error, pass it to next()
    } else {
      next(new Error("An unknown error occurred.")); // Handle unknown error types
    }
  }
});

// Model definition
const studentModel = mongoose.model<IStudent>("Student", studentSchema);

export default studentModel;
