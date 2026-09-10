import mongoose from "mongoose";

const sponsorshipSchema = new mongoose.Schema(
  {
    sponsoringFor: {
      type: String,
      enum: ["Platinum", "Diamond", "Gold", "Silver", "Bronze"],
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    place: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Phone must be exactly 10 digits"],
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    paymentScreenshot: {
      type: String,
      trim: true,
    },
    sponsorshipAmount: {
      type: Number,
      required: true,
    },
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Sponsorship = mongoose.model("Sponsorship", sponsorshipSchema);

export default Sponsorship;
