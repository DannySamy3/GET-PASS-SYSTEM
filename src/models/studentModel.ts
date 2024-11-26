import mongoose, { Schema, Document } from "mongoose";
import Counter from "./counterModel";
import classModel from "./classModel";

enum RegistrationStatus {
  REGISTERED = "REGISTERED",
  PARTIAL_REGISTERED = "PARTIAL REGISTERED",
  UNREGISTERED = "NOT REGISTERED",
}

enum Gender {
  Male = "Male",
  Female = "Female",
}

interface IStudent extends Document {
  studentNumber: number;
  firstName: string;
  secondName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  amountPaid: string;
  nationality: string;
  classId: Schema.Types.ObjectId;
  sponsor: string;
  status: RegistrationStatus;
  gender: Gender;
  enrollmentYear: number;
  image: string;
  regNo: string;
}

const studentSchema: Schema<IStudent> = new Schema(
  {
    studentNumber: { type: Number, unique: true },
    firstName: { type: String, required: true },
    secondName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    amountPaid: { type: String, required: true },
    nationality: { type: String, required: true },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    sponsor: { type: String, required: true },
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
    image: { type: String },
    regNo: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);

// Middleware to handle regNo generation
studentSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Increment studentNumber
    const counter = await Counter.findOneAndUpdate(
      { modelName: "studentNumber" },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    this.studentNumber = counter?.sequenceValue || 1;

    // Resolve classInitial and generate regNo
    const classDoc = await classModel.findById(this.classId);
    if (classDoc) {
      this.regNo = `${classDoc.classInitial}/${this.enrollmentYear
        .toString()
        .slice(-2)}/${this.studentNumber}`;
    } else {
      return next(new Error("Invalid classId: Class not found."));
    }
  }
  next();
});

const studentModel = mongoose.model<IStudent>("Student", studentSchema);
export default studentModel;
