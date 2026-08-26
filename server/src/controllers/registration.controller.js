import cloudinary from "../config/cloudinary.js";
import Registration from "../models/Registration.js";

export const createRegistration = async (req, res) => {
  try {
    const { teamName, members, college, phone, email } = req.body;

    // Check required fields
    if (!teamName || !members || !college || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Check that exactly 4 members are provided
    let parsedMembers;

    try {
      parsedMembers =
        typeof members === "string" ? JSON.parse(members) : members;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid members format",
      });
    }

    if (!Array.isArray(parsedMembers) || parsedMembers.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Exactly 4 team members are required",
      });
    }

    // Check payment screenshot
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required",
      });
    }

    // Upload payment screenshot to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
       console.log("Uploading payment screenshot to Cloudinary...");

       const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "aura-registrations/payment-screenshots",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
        
      );
       console.log("Uploaded payment screenshot to Cloudinary...");
      uploadStream.end(req.file.buffer);
    });
     

    // Create registration
    const registration = await Registration.create({
      teamName,
      members: parsedMembers,
      college,
      phone,
      email,
      paymentScreenshot: uploadResult.secure_url,
    });
    console.log("Registration saved to MongoDB:", registration._id);

    
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: registration,
    });
  } catch (error) {
    console.error("Registration error:", error);
        console.log("📝 Form submission failed:", {
          teamName
        });
    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering",
      error: error.message,
    });
  }
};