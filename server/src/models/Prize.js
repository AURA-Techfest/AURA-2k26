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
      min: 1,
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

const Prize = mongoose.model("Prize", prizeSchema);

export default Prize;
