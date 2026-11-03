import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import Registration from "../src/models/Registration.js";
import { getShortlistFilter } from "./send-acceptance-emails.js";

async function main() {
  console.log("==========================================================");
  console.log("    AURA 2K26 — Mark All Teams as Shortlisted / Selected  ");
  console.log("==========================================================");

  console.log("\n[1/3] Connecting to MongoDB Database...");
  await connectDB();

  console.log("\n[2/3] Updating registrations in database...");
  const totalCount = await Registration.countDocuments();
  console.log(`Found ${totalCount} total registrations in database.`);

  if (totalCount === 0) {
    console.log("No registrations found to update.");
    await mongoose.disconnect();
    return;
  }

  // Update using Mongoose Model
  const result = await Registration.updateMany(
    {},
    {
      $set: {
        isShortlisted: true,
        selectionStatus: "selected",
      },
    }
  );

  console.log(`\n[3/3] Verification:`);
  console.log(` • Matched documents:  ${result.matchedCount}`);
  console.log(` • Modified documents: ${result.modifiedCount}`);

  // Verify using our shortlist filter
  const filter = getShortlistFilter();
  const verifiedCount = await Registration.countDocuments(filter);
  console.log(` • Total Shortlisted / Selected Teams in DB: ${verifiedCount} of ${totalCount}`);

  console.log("\n✅ All teams have been successfully marked as shortlisted / selected in the database!");
  console.log("==========================================================\n");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("\n❌ Error updating database:", err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});

