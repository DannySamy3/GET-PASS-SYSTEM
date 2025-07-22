import mongoose, { Schema, Document } from "mongoose";

export interface ISponsor extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
}

const sponsorSchema: Schema = new Schema({
  name: { type: String, required: true },
});

const sponsorModel = mongoose.model<ISponsor>("Sponsor", sponsorSchema);
export default sponsorModel;
