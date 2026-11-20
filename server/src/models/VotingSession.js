import mongoose from "mongoose";

const votingSessionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 10,
      max: 480,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: String,
      default: "admin",
      trim: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const VotingSession = mongoose.model("VotingSession", votingSessionSchema);

export default VotingSession;
