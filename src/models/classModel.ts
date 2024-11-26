import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Class is required"] },
  duration: { type: Number, default: 3 },
});

const classModel = mongoose.model("class", classSchema);

export default classModel;
