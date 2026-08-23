import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, trim: true },
    teamMembers: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length === 4 && arr.every((m) => m.trim().length > 0),
        message: "All 4 team member names are required",
      },
    },
    college: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    paymentScreenshot: { type: String, required: true }, // stored file path
  },
  { timestamps: true }
);

export default mongoose.model("Registration", registrationSchema);