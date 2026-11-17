import mongoose from "mongoose";

const voterSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ["participant", "volunteer", "spectator"],
      default: "spectator",
    },
    registrationId: {
      type: String,
      trim: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Voter = mongoose.model("Voter", voterSchema);

export default Voter;
