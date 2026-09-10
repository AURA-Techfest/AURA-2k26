import { uploadImage } from "../config/cloudinary.js";
import Sponsorship from "../models/Sponsorship.js";

const TIER_AMOUNTS = {
  Platinum: 100000,
  Diamond: 75000,
  Gold: 50000,
  Silver: 25000,
  Bronze: 10000,
};

export const createSponsorship = async (req, res) => {
  try {
    const {
      sponsoringFor,
      organizationName,
      place,
      district,
      contactPerson,
      email,
      phone,
      transactionId,
    } = req.body;

    if (
      !sponsoringFor ||
      !organizationName ||
      !contactPerson ||
      !email ||
      !phone ||
      !transactionId
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more required fields are missing",
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    if (!TIER_AMOUNTS[sponsoringFor]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sponsorship tier",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existingSponsorship = await Sponsorship.findOne({
      $or: [
        { email: trimmedEmail },
        { transactionId: transactionId.trim() },
      ],
    });

    if (existingSponsorship) {
      if (existingSponsorship.email === trimmedEmail) {
        return res.status(400).json({
          success: false,
          message: "A sponsorship application with this email already exists.",
        });
      }
      if (existingSponsorship.transactionId === transactionId.trim()) {
        return res.status(400).json({
          success: false,
          message: "A sponsorship application with this transaction ID already exists.",
        });
      }
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required",
      });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Cloudinary config missing from environment variables.");
      return res.status(500).json({
        success: false,
        message: "Cloudinary configuration is incomplete.",
      });
    }

    let paymentScreenshotUrl = "";
    try {
      const uploadResult = await uploadImage(
        req.file.buffer,
        "aura-sponsorships/payment-screenshots"
      );
      paymentScreenshotUrl = uploadResult.secure_url;
    } catch (uploadError) {
      console.error("Cloudinary upload failed:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload payment screenshot. Please try again.",
        error: uploadError.message,
      });
    }

    const newSponsorship = await Sponsorship.create({
      sponsoringFor,
      organizationName: organizationName.trim(),
      place: place?.trim(),
      district: district?.trim(),
      contactPerson: contactPerson.trim(),
      email: trimmedEmail,
      phone: phone.trim(),
      transactionId: transactionId.trim(),
      paymentScreenshot: paymentScreenshotUrl,
      sponsorshipAmount: TIER_AMOUNTS[sponsoringFor],
    });

    return res.status(201).json({
      success: true,
      message: "Sponsorship application submitted successfully!",
      data: newSponsorship,
    });
  } catch (error) {
    console.error("Sponsorship submission error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: messages,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting the sponsorship application.",
      error: error.message,
    });
  }
};

export const checkSponsorEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email query parameter is required.",
      });
    }

    const existing = await Sponsorship.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: "Email is already registered for sponsorship",
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      message: "Available for sponsorship",
    });
  } catch (error) {
    console.error("Check sponsor email error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error checking email status",
      error: error.message,
    });
  }
};
