import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      "MongoDB connection failed: MONGODB_URI is missing from environment variables."
    );
    console.error(
      "Check that server/.env exists and contains a line like: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
};