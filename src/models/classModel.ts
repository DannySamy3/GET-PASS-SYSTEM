import mongoose, { Schema, Document } from "mongoose";

interface IClass extends Document {
  name: string;
  duration: number;
  classInitial: string;
}

const classSchema: Schema = new Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  classInitial: { type: String, required: true, unique: true },
});

const classModel = mongoose.model<IClass>("Class", classSchema);
export default classModel;
