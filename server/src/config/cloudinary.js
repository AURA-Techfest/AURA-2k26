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
  {
    folder = "aura-registrations",
    resource_type = "auto",
    filename = undefined,
  } = {}
) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type,
    };

    if (filename) {
      uploadOptions.public_id = filename.replace(/\.[^/.]+$/, "");
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const uploadImage = (
  fileBuffer,
  folder = "aura-registrations/id-cards"
) => {
  return uploadToCloudinary(fileBuffer, {
    folder,
    resource_type: "image",
  });
};

export const uploadDocument = (
  fileBuffer,
  folder = "aura-registrations/abstract-docs",
  filename = undefined
) => {
  return uploadToCloudinary(fileBuffer, {
    folder,
    resource_type: "auto",
    filename,
  });
};

export default cloudinary;

