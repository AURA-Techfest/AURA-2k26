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
    // Network the registration came from — powers the admin "shared IP"
    // warning and one-click purge when someone floods registrations from
    // one connection using multiple browsers.
    registeredIp: {
      type: String,
      trim: true,
      index: true,
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

// One person = one voter, enforced by the database itself. The controller
// checks phone/email before inserting, but two concurrent registrations could
// both pass that check — the unique index makes the second insert fail so we
// can return the existing voter instead of creating a duplicate identity.
// Partial (not sparse) so only real, non-empty values are deduped and
// documents missing the field never collide with each other.
voterSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string", $gt: "" } },
  },
);

voterSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string", $gt: "" } },
  },
);

const Voter = mongoose.model("Voter", voterSchema);

export default Voter;
