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
      default: false,
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

// Add validation to ensure only one session can be active at a time
sessionSchema.pre("save", async function (next) {
  if (this.activeStatus) {
    const activeSession = await (
      this.constructor as typeof sessionModel
    ).findOne({
      activeStatus: true,
      _id: { $ne: this._id }, // Exclude current document when updating
    });

    if (activeSession) {
      // Set the previous active session to inactive
      activeSession.activeStatus = false;
      await activeSession.save();
    }
  }
  next();
});

const sessionModel = mongoose.model<ISession>("Session", sessionSchema);
export default sessionModel;
