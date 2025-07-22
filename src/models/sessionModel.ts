import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  sessionName: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  activeStatus: boolean;
  grace: boolean;
  gracePeriodDays: number;
  graceActivationDate?: Date;
  graceRemainingDays: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ISessionModel extends Model<ISession> {
  updateGraceDays(): Promise<void>;
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
    gracePeriodDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    graceActivationDate: {
      type: Date,
    },
    graceRemainingDays: {
      type: Number,
      default: 0,
      min: 0,
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

// Add validation to handle grace period
sessionSchema.pre("save", function (next) {
  if (this.isModified("grace") && this.grace === true) {
    // When grace is activated, set the activation date and remaining days
    this.graceActivationDate = new Date();
    this.graceRemainingDays = this.gracePeriodDays;
  } else if (this.isModified("grace") && this.grace === false) {
    // When grace is deactivated, clear the activation date and remaining days
    this.graceActivationDate = undefined;
    this.graceRemainingDays = 0;
  }
  next();
});

// Add validation to update remaining days and check if grace period has expired
sessionSchema.pre("save", function (next) {
  if (this.grace && this.graceActivationDate) {
    const now = new Date();
    const daysPassed = Math.floor(
      (now.getTime() - this.graceActivationDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    this.graceRemainingDays = Math.max(0, this.gracePeriodDays - daysPassed);

    if (this.graceRemainingDays <= 0) {
      this.grace = false;
      this.graceActivationDate = undefined;
      this.graceRemainingDays = 0;
    }
  }
  next();
});

// Add static method to update grace days for all sessions
sessionSchema.statics.updateGraceDays = async function () {
  const now = new Date();

  // Find only sessions that need updating (active grace sessions)
  const sessions = await this.find({
    grace: true,
    graceActivationDate: { $exists: true },
    $or: [
      { graceRemainingDays: { $gt: 0 } },
      { graceRemainingDays: { $exists: false } },
    ],
  }).select("graceActivationDate gracePeriodDays");

  const bulkOps = sessions
    .map((session: ISession) => {
      if (session.graceActivationDate) {
        const daysPassed = Math.floor(
          (now.getTime() - session.graceActivationDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const remainingDays = Math.max(0, session.gracePeriodDays - daysPassed);

        return {
          updateOne: {
            filter: { _id: session._id },
            update: {
              $set: {
                graceRemainingDays: remainingDays,
                grace: remainingDays > 0,
                ...(remainingDays <= 0 && {
                  graceActivationDate: undefined,
                }),
              },
            },
          },
        };
      }
      return null;
    })
    .filter((op: any) => op !== null);

  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps);
  }
};

const sessionModel = mongoose.model<ISession, ISessionModel>(
  "Session",
  sessionSchema
);
export default sessionModel;
