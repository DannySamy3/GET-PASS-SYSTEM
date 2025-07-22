import mongoose, { Schema, Document } from "mongoose";

export interface IClass extends Document {
  name: string;
  duration: number;
  classInitial: string;
  fee: number;
  _id: any;
}

const classSchema: Schema = new Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  classInitial: { type: String, required: true, unique: true },
  fee: { type: Number, required: true },
});

const classModel = mongoose.model<IClass>("Class", classSchema);
export default classModel;
