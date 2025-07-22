import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  amount: number;
  sessionId: mongoose.Schema.Types.ObjectId; // Reference to session model
  studentId: mongoose.Schema.Types.ObjectId; // Reference to student model
  paymentStatus: "PAID" | "PENDING";
  remainingAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema: Schema<IPayment> = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session", // Reference to the session model
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student", // Reference to the student model
      required: [true, "Payment must be associated with a student"],
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING"],
      required: true,
      default: "PENDING",
    },
    remainingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt fields
  }
);

// Add a pre-save middleware to validate studentId
paymentSchema.pre("save", function (next) {
  if (!this.studentId) {
    next(new Error("Payment must be associated with a student"));
  } else {
    next();
  }
});

const paymentModel = mongoose.model<IPayment>("Payment", paymentSchema);
export default paymentModel;
