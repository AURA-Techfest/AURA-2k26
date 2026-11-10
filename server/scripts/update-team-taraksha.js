#!/usr/bin/env node

/**
 * AURA 2K26 — Update Team TARAKSHA Affiliation Script
 *
 * Updates team TARAKSHA from internal (Aliah) to external students across:
 * 1. Registration model (teamAffiliation: "all_other", aliahMembers: 0, otherInstitutionMembers: 4, fee: 1600)
 * 2. Rsvp model (teamCategory: "external", amountPayable: 1600, externalParticipants: 4, internalParticipants: 0)
 *
 * Usage:
 *   node scripts/update-team-taraksha.js
 *   node scripts/update-team-taraksha.js <MONGODB_URI>
 *   node scripts/update-team-taraksha.js --dry-run
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config(); // fallback to current working directory

import Registration from "../src/models/Registration.js";
import Rsvp from "../src/models/Rsvp.js";

async function main() {
  console.log("==================================================================");
  console.log("      AURA 2K26 — Update Team TARAKSHA Affiliation Script         ");
  console.log("==================================================================");

  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");

  // Determine connection string: CLI arg (if not flag), or env variable
  let customUri = args.find((a) => !a.startsWith("--"));
  const mongoUri =
    customUri ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI;

  if (
    !mongoUri ||
    mongoUri === "your_mongodb_connection_string" ||
    (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://"))
  ) {
    console.error("\n❌ Error: Valid MONGODB_URI is required to connect to the database.");
    console.log("\nYou can provide it either by:");
    console.log("  1. Setting MONGODB_URI in server/.env");
    console.log("  2. Passing it directly via CLI argument:");
    console.log("     node scripts/update-team-taraksha.js \"mongodb+srv://user:pass@cluster.mongodb.net/dbname\"\n");
    process.exit(1);
  }

  // Mask credentials for display
  const maskedUri = mongoUri.replace(
    /\/\/(.*?):(.*?)@/,
    "//$1:*****@"
  );
  console.log(`\nConnecting to database: ${maskedUri}`);
  if (isDryRun) {
    console.log("🔍 MODE: DRY-RUN (No database modifications will be saved)");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Successfully connected to MongoDB.\n");

    // Search for team TARAKSHA (case-insensitive regex)
    const teamRegex = new RegExp("^TARAKSHA$", "i");
    let registration = await Registration.findOne({ teamName: teamRegex });

    if (!registration) {
      console.log("Exact match for '^TARAKSHA$' not found. Searching fuzzy match...");
      registration = await Registration.findOne({
        teamName: { $regex: "TARAKSHA", $options: "i" },
      });
    }

    if (!registration) {
      console.error("❌ Error: No registration found for team 'TARAKSHA'.");
      console.log("Listing recent team names in database for reference:");
      const recent = await Registration.find({}, { teamName: 1, teamLeaderName: 1, teamLeaderEmail: 1 })
        .sort({ createdAt: -1 })
        .limit(10);
      recent.forEach((r) =>
        console.log(`  - Team: "${r.teamName}" | Leader: ${r.teamLeaderName} (${r.teamLeaderEmail})`)
      );
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log("------------------------------------------------------------------");
    console.log("Found Registration Record for Team TARAKSHA:");
    console.log(`  - Registration ID: ${registration.registrationId || registration._id}`);
    console.log(`  - Team Name:       ${registration.teamName}`);
    console.log(`  - Team Leader:     ${registration.teamLeaderName} (${registration.teamLeaderEmail})`);
    console.log(`  - Team Size:       ${registration.teamSize}`);
    console.log(`  - Current Affil:   ${registration.teamAffiliation}`);
    console.log(`  - Aliah Members:   ${registration.aliahMembers}`);
    console.log(`  - Other Members:   ${registration.otherInstitutionMembers}`);
    console.log(`  - Fee Status:      ${registration.registrationFeeStatus}`);
    console.log(`  - Fee Amount:      ₹${registration.registrationFee || 0}`);
    console.log("------------------------------------------------------------------");

    const teamSize = Number(registration.teamSize) || 4;
    const payableAmount = teamSize * 400; // ₹1,600 for 4 members

    console.log("\nProposed Updates:");
    console.log(`  1. Registration:`);
    console.log(`     • teamAffiliation:           "${registration.teamAffiliation}" -> "all_other"`);
    console.log(`     • aliahMembers:              ${registration.aliahMembers} -> 0`);
    console.log(`     • otherInstitutionMembers:   ${registration.otherInstitutionMembers} -> ${teamSize}`);
    console.log(`     • registrationFeeStatus:     "${registration.registrationFeeStatus}" -> "external_fee"`);
    console.log(`     • registrationFee:           ₹${registration.registrationFee || 0} -> ₹${payableAmount}`);

    // Check Rsvp record
    const rsvp = await Rsvp.findOne({ registration: registration._id });
    if (rsvp) {
      console.log(`  2. RSVP Record:`);
      console.log(`     • teamCategory:              "${rsvp.teamCategory}" -> "external"`);
      console.log(`     • internalParticipants:      ${rsvp.internalParticipants} -> 0`);
      console.log(`     • externalParticipants:      ${rsvp.externalParticipants} -> ${teamSize}`);
      console.log(`     • amountPayable:             ₹${rsvp.amountPayable} -> ₹${payableAmount}`);
      console.log(`     • paymentStatus:             "${rsvp.paymentStatus}" -> "pending_verification"`);
      console.log(`     • participantBreakdown:      All ${teamSize} members marked external (fee: ₹400 each)`);
    } else {
      console.log(`  2. RSVP Record: None created yet (will compute dynamically on first /rsvp login as ₹${payableAmount})`);
    }

    if (isDryRun) {
      console.log("\n[DRY RUN] No changes were written to the database.");
      await mongoose.disconnect();
      return;
    }

    // Apply updates to Registration
    registration.teamAffiliation = "all_other";
    registration.aliahMembers = 0;
    registration.otherInstitutionMembers = teamSize;
    registration.registrationFeeStatus = "external_fee";
    registration.registrationFee = payableAmount;

    await registration.save();
    console.log("\n✅ Registration document successfully updated in database!");

    // Apply updates to Rsvp if exists
    if (rsvp) {
      rsvp.teamCategory = "external";
      rsvp.internalParticipants = 0;
      rsvp.externalParticipants = teamSize;
      rsvp.totalParticipants = teamSize;
      rsvp.amountPayable = payableAmount;
      rsvp.paymentStatus = "pending_verification";

      if (Array.isArray(rsvp.participantBreakdown) && rsvp.participantBreakdown.length > 0) {
        rsvp.participantBreakdown = rsvp.participantBreakdown.map((p) => ({
          name: p.name,
          universityName: p.universityName && !p.universityName.toLowerCase().includes("aliah")
            ? p.universityName
            : "External Institution",
          isInternal: false,
          fee: 400,
          role: p.role || "Member",
        }));
      }

      await rsvp.save();
      console.log("✅ RSVP document successfully updated in database!");
    }

    console.log("\n🎉 All updates completed successfully! Team TARAKSHA is now marked as external with ₹" + payableAmount + " payable.");
    console.log("They can now log into /rsvp to view the payment QR code and submit payment proof.");

    await mongoose.disconnect();
  } catch (err) {
    console.error("\n❌ Operation failed:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

main();
