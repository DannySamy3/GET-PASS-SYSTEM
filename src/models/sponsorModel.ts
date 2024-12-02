import mongoose, { Schema, Document } from "mongoose";

export interface IClass extends Document {
  name: string;
  duration: number;
  classInitial: string;
}

const sponsorSchema: Schema = new Schema({
  name: { type: String, required: true },

  Amount: { type: String, required: true },
});

const sponsorModel = mongoose.model<IClass>("sponsor", sponsorSchema);
export default sponsorModel;
