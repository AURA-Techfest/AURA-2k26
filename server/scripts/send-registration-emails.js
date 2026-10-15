#!/usr/bin/env node

/**
 * AURA 2K26 — Registration Email Batch Dispatcher & Management Script
 *
 * This script allows you to easily dispatch confirmation emails to existing users
 * with an interactive prompt or via command-line flags.
 *
 * Usage:
 *   Interactive prompt:
 *     node scripts/send-registration-emails.js
 *     or: pnpm run send-emails
 *
 *   CLI Flags:
 *     --dry-run             Preview without sending emails or modifying DB
 *     --pending             Send only to registrations with emailStatus != 'sent' (default)
 *     --all                 Force re-send to all registrations (including already sent)
 *     --failed-only         Send only to registrations with emailStatus == 'failed'
 *     --email=<email>       Target a single registration by team leader email
 *     --id=<regId>          Target a single registration by registrationId or _id
 *     --assign-ids-only     Assign permanent AURA2K26 IDs to records missing one without sending
 *     --delay=<ms>          Delay between sends in milliseconds (default: 1200)
 *     --yes, -y             Skip confirmation prompt
 *     --help, -h            Show usage help
 */

import path from "path";
import { fileURLToPath } from "url";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config(); // fallback to cwd

import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import Registration from "../src/models/Registration.js";
import {
  sendRegistrationConfirmation,
  verifyEmailConfig,
} from "../src/services/email.service.js";
import { generateRegistrationId } from "../src/controllers/registration.controller.js";

const DEFAULT_DELAY_MS = 1200;

// Sleep utility to space out SMTP requests and prevent Gmail throttling
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Format elapsed time in seconds
const formatDuration = (ms) => `${(ms / 1000).toFixed(1)}s`;

/**
 * Generates and saves a unique registration ID if the document lacks one.
 */
async function ensureRegistrationId(registration, { dryRun = false } = {}) {
  if (registration.registrationId && registration.registrationId.trim()) {
    return { id: registration.registrationId, newlyAssigned: false };
  }

  // Generate unique ID
  let newId = generateRegistrationId();
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const existing = await Registration.findOne({ registrationId: newId });
    if (!existing) {
      isUnique = true;
    } else {
      newId = generateRegistrationId();
      attempts++;
    }
  }

  if (!dryRun) {
    registration.registrationId = newId;
    await registration.save();
  }

  return { id: newId, newlyAssigned: true };
}

/**
 * Parse command-line arguments into a clean options object.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    pendingOnly: false,
    failedOnly: false,
    all: false,
    force: false,
    targetEmail: null,
    targetId: null,
    assignIdsOnly: false,
    autoConfirm: false,
    delayMs: DEFAULT_DELAY_MS,
    help: false,
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run" || arg === "-d") {
      options.dryRun = true;
    } else if (arg === "--pending" || arg === "-p") {
      options.pendingOnly = true;
    } else if (arg === "--failed-only" || arg === "--failed") {
      options.failedOnly = true;
    } else if (arg === "--all" || arg === "-a") {
      options.all = true;
      options.force = true;
    } else if (arg === "--force" || arg === "-f") {
      options.force = true;
    } else if (arg === "--assign-ids-only") {
      options.assignIdsOnly = true;
    } else if (arg === "--yes" || arg === "-y") {
      options.autoConfirm = true;
    } else if (arg.startsWith("--email=")) {
      options.targetEmail = arg.split("=")[1]?.trim();
    } else if (arg.startsWith("--id=")) {
      options.targetId = arg.split("=")[1]?.trim();
    } else if (arg.startsWith("--delay=")) {
      const parsedDelay = parseInt(arg.split("=")[1], 10);
      if (!isNaN(parsedDelay) && parsedDelay >= 0) {
        options.delayMs = parsedDelay;
      }
    }
  }

  return options;
}

function showHelp() {
  console.log(`
========================================================================
    AURA 2K26 — Registration Email Batch Dispatcher & Management Script
========================================================================

USAGE:
  pnpm run send-emails [OPTIONS]
  or: node scripts/send-registration-emails.js [OPTIONS]

MODES & FILTERING:
  (No options)          Starts full interactive menu guide
  --dry-run, -d         Simulate process: preview emails without sending or DB changes
  --pending, -p         Send only to registrations where email has not been sent (default)
  --all, -a             Force re-send confirmation emails to ALL registrations
  --failed-only         Send only to registrations marked as 'failed'
  --email=<email>       Target a single registration by Team Leader Email
  --id=<id>             Target a single registration by Registration ID or Mongo ID
  --assign-ids-only     Assign missing AURA2K26 IDs to all registrations without sending emails

EXECUTION CONTROLS:
  --yes, -y             Bypass confirmation prompts (auto-confirm)
  --delay=<ms>          Delay between emails in milliseconds (default: 1200ms)
  --help, -h            Display this help manual

EXAMPLES:
  # Interactive mode with prompts:
  pnpm run send-emails

  # Safe dry-run preview:
  node scripts/send-registration-emails.js --dry-run

  # Send to one specific team leader to test:
  node scripts/send-registration-emails.js --email=leader@example.com

  # Send to all pending registrations without confirmation prompt:
  node scripts/send-registration-emails.js --pending --yes
`);
}

async function main() {
  const cliOptions = parseArgs();

  if (cliOptions.help) {
    showHelp();
    process.exit(0);
  }

  console.log("========================================================================");
  console.log("          AURA 2K26 — Registration Email Dispatcher & Management         ");
  console.log("========================================================================");

  // 1. Connect to Database
  console.log("\n[1/3] Connecting to MongoDB Database...");
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ Fatal: Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  // 2. Verify SMTP Configuration
  console.log("\n[2/3] Checking Email Service Credentials & SMTP Connection...");
  const smtpStatus = await verifyEmailConfig();
  let smtpReady = false;

  if (smtpStatus.configured && !smtpStatus.connectionFailed) {
    console.log(`   ✅ SMTP Status: CONNECTED (${process.env.EMAIL_USER})`);
    smtpReady = true;
  } else {
    console.log(`   ⚠️  SMTP Status: NOT READY`);
    console.log(`      Detail: ${smtpStatus.message}`);
    if (cliOptions.dryRun) {
      console.log("      (Note: Continuing because --dry-run mode is active)");
    } else {
      console.log("\n      💡 Troubleshooting:");
      console.log("         - Use a 16-character Google App Password (not your normal Gmail password).");
      console.log("         - Ensure 2-Step Verification is active on your Google Account.");
      console.log("         - Create an App Password at: https://myaccount.google.com/apppasswords");
      console.log("         - Put EMAIL_USER and EMAIL_PASS into server/.env");
    }
  }

  // 3. Scan database registrations
  console.log("\n[3/3] Scanning Existing Registrations in Database...");
  const allRegistrations = await Registration.find().sort({ createdAt: 1 });
  const totalCount = allRegistrations.length;

  const missingIdCount = allRegistrations.filter(
    (r) => !r.registrationId || !r.registrationId.trim(),
  ).length;
  const pendingCount = allRegistrations.filter(
    (r) => r.emailStatus === "pending" || !r.emailStatus,
  ).length;
  const failedCount = allRegistrations.filter((r) => r.emailStatus === "failed").length;
  const sentCount = allRegistrations.filter((r) => r.emailStatus === "sent").length;

  console.log(`   📊 Database Overview:`);
  console.log(`      • Total Registrations:       ${totalCount}`);
  console.log(`      • Missing Registration ID:   ${missingIdCount}`);
  console.log(`      • Email Status - Pending:    ${pendingCount}`);
  console.log(`      • Email Status - Failed:     ${failedCount}`);
  console.log(`      • Email Status - Sent:       ${sentCount}`);

  if (totalCount === 0) {
    console.log("\nℹ️  No registrations found in the database. Nothing to do.");
    await mongoose.disconnect();
    process.exit(0);
  }

  const rl = readline.createInterface({ input, output });

  try {
    let mode = "pending";
    let isDryRun = cliOptions.dryRun;
    let forceSend = cliOptions.force;
    let targetEmail = cliOptions.targetEmail;
    let targetId = cliOptions.targetId;
    let assignOnly = cliOptions.assignIdsOnly;

    // Check if user provided explicit flags
    const hasFlags =
      cliOptions.pendingOnly ||
      cliOptions.failedOnly ||
      cliOptions.all ||
      cliOptions.dryRun ||
      cliOptions.targetEmail ||
      cliOptions.targetId ||
      cliOptions.assignIdsOnly;

    if (!hasFlags) {
      // Interactive Prompt Menu
      console.log("\n========================= SELECT AN ACTION =========================");
      console.log(" [1] Send emails to all PENDING & FAILED registrations (Recommended)");
      console.log(" [2] Dry Run (Preview all emails and recipient list without sending)");
      console.log(" [3] Send email to a SINGLE registration (by email or ID)");
      console.log(" [4] Force re-send emails to ALL registrations (including sent)");
      console.log(" [5] Assign Registration IDs only (saves IDs to DB, sends NO emails)");
      console.log(" [6] Exit");
      console.log("=====================================================================");

      const choice = (await rl.question("Enter your choice [1-6] (default: 1): ")).trim();

      if (choice === "6") {
        console.log("Operation cancelled by user. Exiting...");
        rl.close();
        await mongoose.disconnect();
        process.exit(0);
      } else if (choice === "2") {
        isDryRun = true;
        mode = "all";
      } else if (choice === "3") {
        const inputTarget = (
          await rl.question("Enter Team Leader Email or Registration ID: ")
        ).trim();
        if (!inputTarget) {
          console.log("❌ No input provided. Exiting.");
          rl.close();
          await mongoose.disconnect();
          process.exit(1);
        }
        if (inputTarget.includes("@")) {
          targetEmail = inputTarget;
        } else {
          targetId = inputTarget;
        }
        mode = "single";
        forceSend = true;
      } else if (choice === "4") {
        mode = "all";
        forceSend = true;
      } else if (choice === "5") {
        assignOnly = true;
      } else {
        mode = "pending"; // Default
      }
    } else {
      if (cliOptions.failedOnly) mode = "failed";
      else if (cliOptions.all) mode = "all";
      else if (cliOptions.targetEmail || cliOptions.targetId) mode = "single";
      else if (cliOptions.assignIdsOnly) assignOnly = true;
      else if (cliOptions.pendingOnly) mode = "pending";
    }

    // Determine target list
    let targets = [];

    if (assignOnly) {
      targets = allRegistrations.filter(
        (r) => !r.registrationId || !r.registrationId.trim(),
      );
      if (targets.length === 0) {
        console.log("\n✅ All registrations already have a valid Registration ID!");
        rl.close();
        await mongoose.disconnect();
        process.exit(0);
      }
    } else if (mode === "single") {
      targets = allRegistrations.filter((r) => {
        if (targetEmail && r.teamLeaderEmail?.toLowerCase() === targetEmail.toLowerCase()) {
          return true;
        }
        if (targetId && (r.registrationId === targetId || r._id.toString() === targetId)) {
          return true;
        }
        return false;
      });

      if (targets.length === 0) {
        console.log(`\n❌ No registration found matching: ${targetEmail || targetId}`);
        rl.close();
        await mongoose.disconnect();
        process.exit(1);
      }
    } else if (mode === "failed") {
      targets = allRegistrations.filter((r) => r.emailStatus === "failed");
    } else if (mode === "all") {
      targets = allRegistrations;
    } else {
      // mode === 'pending'
      targets = allRegistrations.filter((r) => r.emailStatus !== "sent");
    }

    console.log(`\n🎯 Filtered Target Count: ${targets.length} registration(s)`);

    if (targets.length === 0) {
      console.log("ℹ️  No registrations match the selected criteria.");
      rl.close();
      await mongoose.disconnect();
      process.exit(0);
    }

    // Check SMTP readiness if not in dry-run or assign-only
    if (!isDryRun && !assignOnly && !smtpReady) {
      console.log("\n❌ Cannot send real emails because SMTP is not configured or failed login.");
      console.log("   Would you like to run in --dry-run mode instead?");
      const switchDry = (await rl.question("Run in Dry-Run mode? [Y/n]: ")).trim().toLowerCase();
      if (switchDry === "n" || switchDry === "no") {
        console.log("Exiting. Please update server/.env with valid EMAIL_USER and EMAIL_PASS.");
        rl.close();
        await mongoose.disconnect();
        process.exit(1);
      }
      isDryRun = true;
    }

    // Missing ID confirmation: auto-generate IDs for records lacking one?
    const targetsMissingId = targets.filter(
      (r) => !r.registrationId || !r.registrationId.trim(),
    );
    let autoAssignMissingIds = true;

    if (targetsMissingId.length > 0 && !assignOnly) {
      console.log(
        `\n⚠️  Notice: ${targetsMissingId.length} of the targeted registrations do NOT have a Registration ID.`,
      );
      console.log(
        "   Each confirmation email requires an ID (e.g. AURA2K26-XXXXXX) for event check-in.",
      );
      if (!cliOptions.autoConfirm) {
        const idChoice = (
          await rl.question(
            "   Automatically generate and save unique Registration IDs for them? [Y/n]: ",
          )
        )
          .trim()
          .toLowerCase();
        if (idChoice === "n" || idChoice === "no") {
          autoAssignMissingIds = false;
        }
      }
    }

    // Execution Confirmation
    if (!cliOptions.autoConfirm) {
      console.log("\n-------------------------------------------------------------");
      if (assignOnly) {
        console.log(
          `Ready to generate & save Registration IDs for ${targets.length} registrations.`,
        );
      } else if (isDryRun) {
        console.log(
          `[DRY RUN] Ready to simulate sending emails to ${targets.length} registrations.`,
        );
      } else {
        console.log(
          `⚠️  READY TO SEND ${targets.length} REAL CONFIRMATION EMAIL(S) from ${process.env.EMAIL_USER}.`,
        );
        console.log(`Estimated dispatch time: ~${formatDuration(targets.length * cliOptions.delayMs)}`);
      }
      console.log("-------------------------------------------------------------");

      const confirm = (await rl.question("Proceed with execution? [y/N]: "))
        .trim()
        .toLowerCase();
      if (confirm !== "y" && confirm !== "yes") {
        console.log("Operation cancelled by user. Exiting...");
        rl.close();
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    rl.close();

    // Begin Execution
    console.log("\n🚀 Starting dispatch process...\n");
    const startTime = Date.now();
    let successCount = 0;
    let failedList = [];
    let skippedCount = 0;
    let newlyAssignedIdsCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const reg = targets[i];
      const indexStr = `[${i + 1}/${targets.length}]`;

      // Handle ID generation
      let regId = reg.registrationId;
      if (!regId || !regId.trim()) {
        if (autoAssignMissingIds || assignOnly) {
          const idRes = await ensureRegistrationId(reg, { dryRun: isDryRun });
          regId = idRes.id;
          if (idRes.newlyAssigned) newlyAssignedIdsCount++;
        } else {
          regId = "PENDING";
        }
      }

      if (assignOnly) {
        console.log(
          `${indexStr} 🆔 Assigned ID ${regId} to Team: "${reg.teamName}" (${reg.teamLeaderEmail})`,
        );
        successCount++;
        continue;
      }

      const teamName = reg.teamName || "Unnamed Team";
      const email = reg.teamLeaderEmail || "Missing Email";
      const leaderName = reg.teamLeaderName || "Participant";

      console.log(
        `${indexStr} ${isDryRun ? "🔎 [DRY RUN]" : "📧 Sending:"} "${teamName}" -> <${email}> (${leaderName}, ID: ${regId})`,
      );

      if (isDryRun) {
        console.log(`       Preview: Subject: Registration Confirmed: ${teamName} [${regId}]`);
        successCount++;
        continue;
      }

      // Check for valid email format
      if (!email || !email.includes("@")) {
        console.log(`       ❌ Skipped: Invalid or missing email address (${email})`);
        failedList.push({ team: teamName, email, error: "Invalid email address format" });
        reg.emailStatus = "failed";
        await reg.save();
        continue;
      }

      try {
        const sendResult = await sendRegistrationConfirmation(reg, { force: forceSend });

        if (sendResult.success) {
          if (sendResult.skipped) {
            console.log(`       ⏭️  Already sent previously. Skipped.`);
            skippedCount++;
          } else {
            console.log(`       ✅ Successfully sent! MsgID: ${sendResult.messageId || "N/A"}`);
            reg.emailStatus = "sent";
            reg.emailSentAt = new Date();
            if (sendResult.messageId) {
              reg.emailMessageId = sendResult.messageId;
            }
            await reg.save();
            successCount++;
          }
        } else {
          console.log(`       ❌ Send Failed: ${sendResult.error || sendResult.reason || "Unknown error"}`);
          failedList.push({
            team: teamName,
            email,
            error: sendResult.error || sendResult.reason || "Failed to send",
          });
          reg.emailStatus = "failed";
          await reg.save();
        }
      } catch (sendErr) {
        console.log(`       ❌ Exception: ${sendErr.message}`);
        failedList.push({ team: teamName, email, error: sendErr.message });
        reg.emailStatus = "failed";
        await reg.save();
      }

      // Delay between emails if not the last item
      if (i < targets.length - 1 && cliOptions.delayMs > 0) {
        await sleep(cliOptions.delayMs);
      }
    }

    const duration = formatDuration(Date.now() - startTime);

    // Final Summary Report
    console.log("\n========================================================================");
    console.log("                           DISPATCH SUMMARY                             ");
    console.log("========================================================================");
    console.log(` Mode:                     ${isDryRun ? "DRY RUN (Preview Only)" : assignOnly ? "ASSIGN IDS ONLY" : "REAL DISPATCH"}`);
    console.log(` Total Targets Processed:  ${targets.length}`);
    console.log(` Successfully Completed:   ${successCount}`);
    console.log(` Skipped (Already Sent):   ${skippedCount}`);
    console.log(` Failed:                   ${failedList.length}`);
    console.log(` Registration IDs Created: ${newlyAssignedIdsCount}`);
    console.log(` Total Time Elapsed:       ${duration}`);

    if (failedList.length > 0) {
      console.log("\n❌ Failed Recipients List:");
      failedList.forEach((f, idx) => {
        console.log(`   ${idx + 1}. Team "${f.team}" <${f.email}>: ${f.error}`);
      });
      console.log(
        "\n💡 Tip: You can retry sending to failed registrations anytime using:",
      );
      console.log("   pnpm run send-emails --failed-only");
    }

    console.log("========================================================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (err) => {
  console.error("\n❌ Unexpected Fatal Error:", err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
