import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  sessionName: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  activeStatus: boolean;
  grace: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema: Schema<ISession> = new Schema(
  {
    sessionName: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    activeStatus: {
      type: Boolean,
      default: true,
    },
    grace: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt fields
  }
);

// Add validation to ensure endDate is after startDate
sessionSchema.pre("save", function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"));
  }
  next();
});

const sessionModel = mongoose.model<ISession>("Session", sessionSchema);
export default sessionModel;
