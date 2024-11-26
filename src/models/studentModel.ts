import mongoose, { Schema, Document } from "mongoose";

enum RegistrationStatus {
  REGISTERED = "REGISTERED",
  PARTIAL_REGISTERED = "PARTIAL REGISTERED",
  UNREGISTERED = "NOT REGISTERED",
}

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name is required"],
    trim: true,
  },
  secondName: {
    type: String,
    required: [true, "Middle name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Surname is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Please provide phone number"],
    trim: true,
  },
  amountPaid: {
    type: String,
    required: [true, "Initial payment is needed"],
    trim: true,
  },
  nationality: {
    type: String,
    required: [true, "Nationality is required"],
    trim: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "classModel",
    required: [true, "Student class is required"],
  },
  regNo: {
    type: String,
    required: [true, "RegNo is required"],
  },
  sponsor: {
    type: String,
    required: [true, "Sponsor is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(RegistrationStatus),
    required: [true, "Status is required"],
    trim: true,
  },
  enrollmentYear: {
    type: Number,
    default: new Date().getFullYear(),
    required: [true, "Enrollment year is required"],
  },
  image: {
    type: String,
    required: false, // Set to true if the image is required
    trim: true,
  },
});

const studentModel = mongoose.model("Student", studentSchema);

export default studentModel;
