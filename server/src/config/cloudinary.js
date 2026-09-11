import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (
  fileBuffer,
  { folder = "aura-registrations", resource_type = "auto", public_id } = {},
) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type,
    };
    if (public_id) {
      options.public_id = public_id;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(fileBuffer);
  });
};

export const uploadImage = (
  fileBuffer,
  folder = "aura-registrations/payment-screenshots",
) => {
  return uploadToCloudinary(fileBuffer, { folder, resource_type: "image" });
};

export default cloudinary;

