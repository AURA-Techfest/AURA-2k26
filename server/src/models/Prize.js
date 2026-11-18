import mongoose from "mongoose";

const prizeSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    prizeType: {
      type: String,
      enum: ["first", "second", "third", "audience_choice"],
      required: true,
      index: true,
    },
    rank: {
      type: Number,
      min: 0,
      max: 3,
    },
    awardedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// At most ONE Audience Choice prize may ever exist. Partial index: only
// audience_choice docs are covered, so any number of podium prizes coexist.
// (0 audience_choice docs exist in prod today — safe to build on deploy.)
prizeSchema.index(
  { prizeType: 1 },
  { unique: true, partialFilterExpression: { prizeType: "audience_choice" } },
);

const Prize = mongoose.model("Prize", prizeSchema);

export default Prize;
