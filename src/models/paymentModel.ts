// import mongoose, { Schema, Document } from "mongoose";

// export interface IPayment extends Document {
//   amount: number;
//   date: Date;
//   studentId: mongoose.Schema.Types.ObjectId; // Reference to studentModel
// }

// const paymentSchema: Schema<IPayment> = new Schema({
//   amount: { type: Number, required: true },
//   date: { type: Date, required: true },
//   studentId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "studentModel", // Reference to the studentModel
//     required: true,
//   },
// });

// const paymentModel = mongoose.model<IPayment>("Payment", paymentSchema);
// export default paymentModel;
