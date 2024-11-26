import mongoose, { Schema, Document } from "mongoose";

interface ICounter extends Document {
  modelName: string;
  sequenceValue: number;
}

const counterSchema: Schema = new Schema({
  modelName: { type: String, required: true, unique: true },
  sequenceValue: { type: Number, default: 0 },
});

const counterModel = mongoose.model<ICounter>("Counter", counterSchema);
export default counterModel;
