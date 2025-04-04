import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  amount: number;
  sessionId: mongoose.Schema.Types.ObjectId; // Reference to session model
  studentId: mongoose.Schema.Types.ObjectId; // Reference to student model
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
      required: true,
    },
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt fields
  }
);

const paymentModel = mongoose.model<IPayment>("Payment", paymentSchema);
export default paymentModel;
