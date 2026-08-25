import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      trim: true,
    },

    members: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      required: true,
      validate: {
        validator: (members) => members.length === 4,
        message: "A team must have exactly 4 members",
      },
    },

    college: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    paymentScreenshot: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Registration = mongoose.model(
  "Registration",
  registrationSchema
);

export default Registration;