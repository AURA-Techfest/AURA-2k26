#!/usr/bin/env node

/**
 * AURA 2K26 — Standalone Acceptance Email Sender Script
 *
 * Standalone CLI tool to dispatch official shortlist & acceptance notification
 * emails to hackathon teams.
 *
 * Usage:
 *   Interactive Menu (Recommended):
 *     npm run send-acceptance
 *     or: node scripts/send-acceptance-emails.js
 *
 *   CLI Flags:
 *     --dry-run             Simulate process without sending real emails or updating DB
 *     --all                 Send to all shortlisted teams directly
 *     --delay=<ms>          Delay between sends in milliseconds (default: 1500)
 *     --yes, -y             Bypass confirmation prompts (auto-confirm)
 *     --help, -h            Show usage guide
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config(); // fallback to current working directory

import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import Registration from "../src/models/Registration.js";
import {
  sendAcceptanceEmail,
  generateAcceptanceEmailHtml,
  generateAcceptanceEmailText,
  replacePlaceholders,
  verifyEmailConfig,
  getEmailTransporter,
} from "../src/services/email.service.js";

const DEFAULT_DELAY_MS = 1500;
const DEFAULT_EVENT_NAME = "AURA 2K26";
const DEFAULT_WEBSITE_URL =
  process.env.FRONTEND_URL || "https://aura2k26.com";

// Sleep utility to space out SMTP calls and avoid rate-limiting
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const formatDuration = (ms) => `${(ms / 1000).toFixed(1)}s`;

/**
 * Query filter to find shortlisted or accepted teams across standard and custom fields.
 */
export const getShortlistFilter = () => ({
  $or: [
    { isShortlisted: true },
    { shortlisted: true },
    { isAccepted: true },
    { selectionStatus: { $in: ["selected", "shortlisted", "approved", "accepted"] } },
    { status: { $in: ["selected", "shortlisted", "approved", "accepted"] } },
    { acceptanceStatus: { $in: ["selected", "shortlisted", "approved", "accepted"] } },
  ],
});

/**
 * Parse CLI arguments.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    allShortlisted: false,
    autoConfirm: false,
    delayMs: DEFAULT_DELAY_MS,
    help: false,
    targetSearch: null,
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run" || arg === "-d") {
      options.dryRun = true;
    } else if (arg === "--all" || arg === "-a") {
      options.allShortlisted = true;
    } else if (arg === "--yes" || arg === "-y") {
      options.autoConfirm = true;
    } else if (arg.startsWith("--delay=")) {
      const val = parseInt(arg.split("=")[1], 10);
      if (!isNaN(val) && val >= 0) options.delayMs = val;
    } else if (arg.startsWith("--search=")) {
      options.targetSearch = arg.split("=")[1]?.trim();
    }
  }

  return options;
}

function showHelp() {
  console.log(`
========================================================================
       AURA 2K26 — Standalone Acceptance Email Sender Script
========================================================================

USAGE:
  npm run send-acceptance
  or: node scripts/send-acceptance-emails.js [OPTIONS]

MENU OPTIONS:
  1. Send acceptance email to ALL shortlisted teams.
  2. Send acceptance email to CUSTOM selected teams.
  3. Send acceptance email to an INDIVIDUAL team.
  4. Preview email template.
  5. Exit.

CLI FLAGS:
  --dry-run, -d         Simulate process: preview emails without sending or DB changes
  --all, -a             Target all shortlisted teams directly
  --search=<term>       Quick search for a team by name, leader, email or ID
  --delay=<ms>          Delay between emails in milliseconds (default: 1500)
  --yes, -y             Bypass confirmation prompts (auto-confirm)
  --help, -h            Show this help guide

DYNAMIC PLACEHOLDERS SUPPORTED IN TEMPLATE:
  {{teamName}}          - Team Name
  {{participantName}}   - Participant / Team Leader Name
  {{eventName}}         - Event Name (e.g. AURA 2K26)
  {{websiteUrl}}        - Portal URL (e.g. https://aura2k26.com)
  {{registrationId}}    - Team Registration ID (e.g. AURA2K26-XXXXXX)
  {{projectTitle}}      - Title of project
  {{rsvpUrl}}           - Direct RSVP portal link
`);
}

/**
 * Helper to display a clean tabular list of registrations.
 */
function printTeamsTable(teams, { showSelectionIndex = true } = {}) {
  const pad = (str, len) => String(str || "").padEnd(len).slice(0, len);

  console.log(
    "--------------------------------------------------------------------------------------------------"
  );
  console.log(
    `${showSelectionIndex ? pad("#", 4) : ""}${pad("Reg ID", 17)} | ${pad("Team Name", 26)} | ${pad("Team Leader", 20)} | ${pad("Leader Email", 28)} | ${pad("Status", 10)}`
  );
  console.log(
    "--------------------------------------------------------------------------------------------------"
  );

  teams.forEach((t, idx) => {
    const regId = t.registrationId || "PENDING";
    const teamName = t.teamName || "N/A";
    const leaderName = t.teamLeaderName || "N/A";
    const email = t.teamLeaderEmail || "N/A";
    const emailStat = t.acceptanceEmailStatus || "pending";
    const statBadge =
      emailStat === "sent" ? "Sent" : emailStat === "failed" ? "Failed" : "Pending";

    const indexCol = showSelectionIndex ? pad(idx + 1, 4) : "";
    console.log(
      `${indexCol}${pad(regId, 17)} | ${pad(teamName, 26)} | ${pad(leaderName, 20)} | ${pad(email, 28)} | ${pad(statBadge, 10)}`
    );
  });
  console.log(
    "--------------------------------------------------------------------------------------------------"
  );
}

/**
 * Prompt organizer for optional subject & custom body customization.
 */
async function promptTemplateCustomization(rl, sessionState) {
  console.log("\n=================== EMAIL TEMPLATE OPTIONS ===================");
  console.log(" [1] Use default acceptance email template (Recommended)");
  console.log(" [2] Customize email subject and body message");
  console.log("==============================================================");

  const choice = (
    await rl.question("Choose an option [1-2] (default: 1): ")
  ).trim();

  if (choice === "2") {
    console.log("\n💡 Available placeholders: {{teamName}}, {{participantName}}, {{eventName}}, {{websiteUrl}}, {{registrationId}}, {{projectTitle}}, {{rsvpUrl}}");
    const currentSubj =
      sessionState.customSubject ||
      `Follow-Up: Project Acceptance — Team {{teamName}} [{{registrationId}}]`;
    console.log(`Current Subject: ${currentSubj}`);
    const inputSubject = (
      await rl.question("Enter new Subject (press Enter to keep current): ")
    ).trim();
    if (inputSubject) {
      sessionState.customSubject = inputSubject;
    }

    console.log("\nCustom message / instructions to include in the email body (optional):");
    console.log("(Type your note or press Enter to skip/keep default):");
    const inputBody = (await rl.question("> ")).trim();
    if (inputBody) {
      sessionState.customBody = inputBody;
    }
    console.log("✅ Custom email template settings applied for this session.");
  } else {
    console.log("✅ Using default acceptance template.");
  }
}

/**
 * Handle confirmation and sequential dispatch for a list of selected teams.
 */
async function executeDispatch({
  selectedTeams,
  rl,
  sessionState,
  cliOptions,
  modeName,
}) {
  if (!selectedTeams || selectedTeams.length === 0) {
    console.log("ℹ️  No recipients selected.");
    return;
  }

  // 1. Identify previous delivery stats
  const previouslySent = selectedTeams.filter(
    (t) => t.acceptanceEmailStatus === "sent"
  );
  let resendPreviouslySent = false;

  if (previouslySent.length > 0 && !cliOptions.autoConfirm) {
    console.log(
      `\n⚠️  Notice: ${previouslySent.length} of the ${selectedTeams.length} selected team(s) have ALREADY received an acceptance email.`
    );
    const resendAns = (
      await rl.question(
        "   Since this is a follow-up, re-send to previously sent teams as well? [Y/n] (default: Y - dispatch follow-up): "
      )
    )
      .trim()
      .toLowerCase();
    if (resendAns === "" || resendAns === "y" || resendAns === "yes") {
      resendPreviouslySent = true;
    }
  }

  const willActuallySendCount = resendPreviouslySent
    ? selectedTeams.length
    : selectedTeams.length - previouslySent.length;

  // 2. Pre-dispatch confirmation block
  console.log("\n========================================================================");
  console.log("                     PRE-DISPATCH CONFIRMATION                          ");
  console.log("========================================================================");
  console.log(` • Dispatch Mode:                    ${modeName}`);
  console.log(` • Total Selected Recipients:        ${selectedTeams.length}`);
  console.log(` • Previously Sent Emails:           ${previouslySent.length}`);
  console.log(` • Emails That Will Actually Be Sent: ${willActuallySendCount}`);
  console.log(` • Dispatch Delay Between Emails:    ${cliOptions.delayMs}ms`);
  console.log(` • Sender Account:                   ${process.env.EMAIL_USER || "Not configured"}`);
  console.log("------------------------------------------------------------------------");
  console.log(" Selected Teams List:");
  printTeamsTable(selectedTeams, { showSelectionIndex: true });

  if (willActuallySendCount === 0 && !cliOptions.dryRun) {
    console.log("\nℹ️  All selected teams have already received acceptance emails and re-send was not requested. Nothing to do.");
    return;
  }

  // Require typing YES
  if (!cliOptions.autoConfirm) {
    console.log("\n⚠️  SAFETY CONFIRMATION:");
    console.log("   To prevent accidental bulk emails, please confirm dispatch.");
    console.log("   Type YES (in capital letters) to proceed, or anything else to cancel.");
    const confirmInput = (await rl.question("Confirm dispatch [type YES]: ")).trim();

    if (confirmInput !== "YES") {
      console.log(`\n❌ Confirmation cancelled. You typed "${confirmInput}". Expected "YES".`);
      console.log("   No emails were sent. Returning to menu.\n");
      return;
    }
  }

  // 3. Begin Dispatch Loop
  console.log("\n🚀 Starting sequential email dispatch...\n");
  const startTime = Date.now();
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const dispatchResults = [];
  const failedRecipients = [];

  for (let i = 0; i < selectedTeams.length; i++) {
    const reg = selectedTeams[i];
    const indexStr = `[${i + 1}/${selectedTeams.length}]`;
    const teamName = reg.teamName || "Unnamed Team";
    const leaderName = reg.teamLeaderName || "Participant";
    const email = (reg.teamLeaderEmail || "").trim();
    const regId = reg.registrationId || "PENDING";

    // Check if duplicate skip is active
    if (reg.acceptanceEmailStatus === "sent" && !resendPreviouslySent) {
      console.log(
        `${indexStr} ⏭️  Skipped: "${teamName}" <${email}> — already received acceptance email previously.`
      );
      skippedCount++;
      dispatchResults.push({
        registrationId: regId,
        teamName,
        leaderName,
        email,
        status: "skipped",
        reason: "Already sent previously",
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    // Check email validity
    if (!email || !email.includes("@")) {
      console.log(`${indexStr} ❌ Failed: "${teamName}" — Invalid or missing email: "${email}"`);
      failedCount++;
      const errReason = "Invalid or missing email address";
      failedRecipients.push({ teamName, leaderName, email, error: errReason });
      dispatchResults.push({
        registrationId: regId,
        teamName,
        leaderName,
        email,
        status: "failed",
        error: errReason,
        timestamp: new Date().toISOString(),
      });

      if (!cliOptions.dryRun) {
        reg.acceptanceEmailStatus = "failed";
        reg.acceptanceEmailError = errReason;
        await reg.save();
      }
      continue;
    }

    if (cliOptions.dryRun) {
      console.log(
        `${indexStr} 🔎 [DRY RUN PREVIEW] "${teamName}" -> <${email}> (${leaderName}, ID: ${regId})`
      );
      successCount++;
      dispatchResults.push({
        registrationId: regId,
        teamName,
        leaderName,
        email,
        status: "simulated_success",
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    // Real send
    console.log(
      `${indexStr} 📧 Sending acceptance email to "${teamName}" <${email}> (Leader: ${leaderName}, ID: ${regId})...`
    );

    try {
      const sendRes = await sendAcceptanceEmail(reg, {
        force: resendPreviouslySent,
        subject: sessionState.customSubject,
        customBody: sessionState.customBody,
        eventName: DEFAULT_EVENT_NAME,
        websiteUrl: DEFAULT_WEBSITE_URL,
      });

      if (sendRes.success) {
        if (sendRes.skipped) {
          console.log(`       ⏭️  Skipped: Already delivered.`);
          skippedCount++;
          dispatchResults.push({
            registrationId: regId,
            teamName,
            leaderName,
            email,
            status: "skipped",
            reason: "Already delivered",
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log(`       ✅ Successfully sent! MsgID: ${sendRes.messageId || "N/A"}`);
          successCount++;
          reg.acceptanceEmailStatus = "sent";
          reg.acceptanceEmailSentAt = new Date();
          reg.acceptanceEmailMessageId = sendRes.messageId || "";
          reg.acceptanceEmailError = undefined;
          await reg.save();

          dispatchResults.push({
            registrationId: regId,
            teamName,
            leaderName,
            email,
            status: "sent",
            messageId: sendRes.messageId,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        const errMsg = sendRes.error || sendRes.reason || "Failed to send email";
        console.log(`       ❌ Send Failed: ${errMsg}`);
        failedCount++;
        failedRecipients.push({ teamName, leaderName, email, error: errMsg });
        reg.acceptanceEmailStatus = "failed";
        reg.acceptanceEmailError = errMsg;
        await reg.save();

        dispatchResults.push({
          registrationId: regId,
          teamName,
          leaderName,
          email,
          status: "failed",
          error: errMsg,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (sendErr) {
      console.log(`       ❌ Exception: ${sendErr.message}`);
      failedCount++;
      failedRecipients.push({ teamName, leaderName, email, error: sendErr.message });
      reg.acceptanceEmailStatus = "failed";
      reg.acceptanceEmailError = sendErr.message;
      await reg.save();

      dispatchResults.push({
        registrationId: regId,
        teamName,
        leaderName,
        email,
        status: "failed",
        error: sendErr.message,
        timestamp: new Date().toISOString(),
      });
    }

    // Delay between sends
    if (i < selectedTeams.length - 1 && cliOptions.delayMs > 0) {
      await sleep(cliOptions.delayMs);
    }
  }

  const durationMs = Date.now() - startTime;
  const duration = formatDuration(durationMs);

  // 4. Final Console Report
  console.log("\n========================================================================");
  console.log("                           FINAL DISPATCH REPORT                        ");
  console.log("========================================================================");
  console.log(` Mode:                     ${cliOptions.dryRun ? "DRY RUN (Preview Simulation)" : "REAL DISPATCH"}`);
  console.log(` Total Recipients Processed:  ${selectedTeams.length}`);
  console.log(` Successfully Sent:           ${successCount}`);
  console.log(` Skipped (Already Sent):      ${skippedCount}`);
  console.log(` Failed Deliveries:           ${failedCount}`);
  console.log(` Time Elapsed:                ${duration}`);
  console.log(` Configured Delay:            ${cliOptions.delayMs}ms`);

  if (failedRecipients.length > 0) {
    console.log("\n❌ Failed Recipients List with Error Details:");
    failedRecipients.forEach((f, idx) => {
      console.log(`   ${idx + 1}. Team "${f.teamName}" <${f.email}>: ${f.error}`);
    });
  }

  // 5. Save Execution Report to timestamped JSON & CSV files
  try {
    const reportsDir = path.resolve(__dirname, "../reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const jsonReportPath = path.join(reportsDir, `acceptance-report-${timestamp}.json`);
    const csvReportPath = path.join(reportsDir, `acceptance-report-${timestamp}.csv`);

    const reportObject = {
      timestamp: new Date().toISOString(),
      eventName: DEFAULT_EVENT_NAME,
      mode: modeName,
      dryRun: cliOptions.dryRun,
      totalRecipients: selectedTeams.length,
      successfullySent: successCount,
      skipped: skippedCount,
      failed: failedCount,
      durationMs,
      duration,
      delayMs: cliOptions.delayMs,
      results: dispatchResults,
      failedRecipients,
    };

    fs.writeFileSync(jsonReportPath, JSON.stringify(reportObject, null, 2), "utf8");

    // CSV representation
    const csvHeaders = [
      "Registration ID",
      "Team Name",
      "Team Leader",
      "Email Address",
      "Delivery Status",
      "Message ID",
      "Error Message",
      "Timestamp",
    ];

    const escapeCsv = (val) => {
      if (val === undefined || val === null) return '""';
      let s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvRows = [csvHeaders.join(",")];
    for (const r of dispatchResults) {
      csvRows.push(
        [
          escapeCsv(r.registrationId),
          escapeCsv(r.teamName),
          escapeCsv(r.leaderName),
          escapeCsv(r.email),
          escapeCsv(r.status),
          escapeCsv(r.messageId || ""),
          escapeCsv(r.error || r.reason || ""),
          escapeCsv(r.timestamp),
        ].join(",")
      );
    }

    fs.writeFileSync(csvReportPath, csvRows.join("\r\n"), "utf8");

    console.log("\n📁 Execution Report Saved:");
    console.log(`   • JSON Report: ${jsonReportPath}`);
    console.log(`   • CSV Report:  ${csvReportPath}`);
  } catch (repErr) {
    console.error("⚠️ Failed to write execution report file:", repErr.message);
  }

  console.log("========================================================================\n");
}

/**
 * Main Interactive CLI Workflow
 */
async function runInteractiveCli() {
  const cliOptions = parseArgs();

  if (cliOptions.help) {
    showHelp();
    process.exit(0);
  }

  console.log("========================================================================");
  console.log("           AURA 2K26 — Acceptance Email Sender Script (CLI)             ");
  console.log("========================================================================");

  // 1. Connect to MongoDB
  console.log("\n[1/2] Connecting to MongoDB Database...");
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ Fatal: Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  // 2. Check SMTP Configuration
  console.log("[2/2] Checking Nodemailer SMTP Configuration...");
  const smtpStatus = await verifyEmailConfig();
  let smtpReady = false;

  if (smtpStatus.configured && !smtpStatus.connectionFailed) {
    console.log(`   ✅ SMTP Status: CONNECTED (${process.env.EMAIL_USER})`);
    smtpReady = true;
  } else {
    console.log(`   ⚠️  SMTP Status: NOT READY (${smtpStatus.message})`);
    if (cliOptions.dryRun) {
      console.log("      (Notice: Continuing in Dry-Run mode without sending real emails)");
    } else {
      console.log("      (Make sure EMAIL_USER and EMAIL_PASS are set in server/.env)");
    }
  }

  const rl = readline.createInterface({ input, output });
  const sessionState = {
    customSubject: null,
    customBody: null,
  };

  try {
    let keepRunning = true;

    while (keepRunning) {
      console.log("\n========================= MAIN MENU =========================");
      console.log(" 1. Send acceptance email to ALL shortlisted teams.");
      console.log(" 2. Send acceptance email to CUSTOM selected teams.");
      console.log(" 3. Send acceptance email to an INDIVIDUAL team.");
      console.log(" 4. Preview email template.");
      console.log(" 5. Exit.");
      console.log("=============================================================");

      const choice = (
        await rl.question("Enter your choice [1-5]: ")
      ).trim();

      if (choice === "5") {
        console.log("\nExiting Acceptance Email Sender Script. Goodbye!");
        keepRunning = false;
        break;
      }

      // Option 4: Preview Email Template
      if (choice === "4") {
        console.log("\n================ EMAIL TEMPLATE PREVIEW ================");
        const dummy = {
          registrationId: "AURA2K26-DEMO01",
          teamName: "Neural Rovers",
          teamLeaderName: "Siddharth Sen",
          teamLeaderEmail: "siddharth@example.com",
          projectTitle: "Autonomous Solar-Powered Quadruped",
          teamSize: 4,
          hardwareProjectCategories: ["Robotics", "AI-Enabled Hardware", "IoT & Smart Devices"],
          teamAffiliation: "all_aliah",
          aliahMembers: 4,
          otherInstitutionMembers: 0,
        };

        const previewSubject = sessionState.customSubject
          ? replacePlaceholders(sessionState.customSubject, dummy)
          : `Follow-Up: Project Acceptance — Team ${dummy.teamName} [${dummy.registrationId}]`;

        console.log(`Subject: ${previewSubject}`);
        console.log(`Sender:  "${DEFAULT_EVENT_NAME} | Selection Committee" <${process.env.EMAIL_USER || "aura@aliah.ac.in"}>`);
        console.log("\n--- Plain-Text Email Preview ---");
        console.log(
          generateAcceptanceEmailText(dummy, {
            eventName: DEFAULT_EVENT_NAME,
            websiteUrl: DEFAULT_WEBSITE_URL,
            customBody: sessionState.customBody,
          })
        );
        console.log("--------------------------------");

        console.log("\nTemplate Actions:");
        console.log(" [1] Customize subject and body for this session");
        console.log(" [2] Send a real test email to an organizer email address");
        console.log(" [3] Return to Main Menu");

        const subChoice = (await rl.question("Select an action [1-3] (default: 3): ")).trim();

        if (subChoice === "1") {
          await promptTemplateCustomization(rl, sessionState);
        } else if (subChoice === "2") {
          const testEmailAddr = (
            await rl.question(`Enter recipient email address (default: ${process.env.EMAIL_USER}): `)
          ).trim() || process.env.EMAIL_USER;

          if (!testEmailAddr || !testEmailAddr.includes("@")) {
            console.log("❌ Invalid email address provided.");
          } else {
            console.log(`\n📧 Dispatching test acceptance email to ${testEmailAddr}...`);
            const testReg = { ...dummy, teamLeaderEmail: testEmailAddr };
            const testRes = await sendAcceptanceEmail(testReg, {
              force: true,
              subject: sessionState.customSubject,
              customBody: sessionState.customBody,
              eventName: DEFAULT_EVENT_NAME,
              websiteUrl: DEFAULT_WEBSITE_URL,
            });

            if (testRes.success) {
              console.log(`✅ Test email delivered successfully! MsgID: ${testRes.messageId}`);
            } else {
              console.log(`❌ Failed to send test email: ${testRes.error || testRes.reason}`);
            }
          }
        }
        continue;
      }

      // Check SMTP before sending in options 1, 2, 3
      if (!smtpReady && !cliOptions.dryRun) {
        console.log("\n⚠️  SMTP connection is not verified with current EMAIL_USER and EMAIL_PASS.");
        console.log("   Would you like to run in Dry-Run mode instead?");
        const switchDry = (await rl.question("Run in Dry-Run mode? [Y/n]: ")).trim().toLowerCase();
        if (switchDry === "n" || switchDry === "no") {
          console.log("Returning to menu. Please check your credentials in server/.env.");
          continue;
        }
        cliOptions.dryRun = true;
      }

      // Option 1: ALL Shortlisted Teams
      if (choice === "1") {
        console.log("\n🔍 Querying database for shortlisted teams...");
        const shortlistFilter = getShortlistFilter();
        let shortlistedTeams = await Registration.find(shortlistFilter).sort({ createdAt: 1 });

        // If no teams are marked as shortlisted yet
        if (shortlistedTeams.length === 0) {
          console.log("\n⚠️  No teams in the database currently have an explicit shortlist flag");
          console.log("   (e.g. isShortlisted: true, selectionStatus: 'selected', status: 'shortlisted', etc.).");

          console.log("\nHow would you like to handle shortlist selection?");
          console.log(" [1] View and select teams from all registered teams (Custom Selection)");
          console.log(" [2] Mark teams as shortlisted now by comma-separated numbers");
          console.log(" [3] Automatically shortlist all teams with functional prototypes (hasWorkingPrototype != 'no_prototype')");
          console.log(" [4] Return to Main Menu");

          const fallbackChoice = (await rl.question("Choose an option [1-4] (default: 1): ")).trim();

          if (fallbackChoice === "2") {
            const allRegs = await Registration.find().sort({ createdAt: 1 });
            console.log(`\nTotal registered teams: ${allRegs.length}`);
            printTeamsTable(allRegs, { showSelectionIndex: true });
            const toShortlist = (
              await rl.question("\nEnter team numbers to mark as Shortlisted (e.g. 1, 3, 5, 8): ")
            ).trim();

            const indices = toShortlist
              .split(",")
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !isNaN(n) && n >= 1 && n <= allRegs.length);

            if (indices.length === 0) {
              console.log("❌ No valid team numbers entered.");
              continue;
            }

            for (const idx of indices) {
              const regDoc = allRegs[idx - 1];
              regDoc.isShortlisted = true;
              regDoc.selectionStatus = "shortlisted";
              await regDoc.save();
            }
            console.log(`✅ Successfully marked ${indices.length} team(s) as shortlisted in database!`);
            shortlistedTeams = await Registration.find(shortlistFilter).sort({ createdAt: 1 });
          } else if (fallbackChoice === "3") {
            const prototypeMatches = await Registration.find({
              hasWorkingPrototype: { $in: ["fully_working", "minor_limitations"] },
            });
            console.log(`Found ${prototypeMatches.length} team(s) with functional prototypes.`);
            const markAns = (
              await rl.question(`Mark all ${prototypeMatches.length} teams as shortlisted in DB? [Y/n]: `)
            ).trim().toLowerCase();

            if (markAns !== "n" && markAns !== "no") {
              for (const p of prototypeMatches) {
                p.isShortlisted = true;
                p.selectionStatus = "shortlisted";
                await p.save();
              }
              console.log(`✅ Successfully updated ${prototypeMatches.length} teams as shortlisted in database!`);
              shortlistedTeams = await Registration.find(shortlistFilter).sort({ createdAt: 1 });
            } else {
              continue;
            }
          } else if (fallbackChoice === "4") {
            continue;
          } else {
            // Default: jump to custom selection from all registered teams
            const allRegs = await Registration.find().sort({ createdAt: 1 });
            if (allRegs.length === 0) {
              console.log("ℹ️  No registrations found in database.");
              continue;
            }
            printTeamsTable(allRegs, { showSelectionIndex: true });
            const selectedInput = (
              await rl.question("\nEnter comma-separated numbers of teams to accept (e.g. 1, 2, 4 or 'all'): ")
            ).trim();

            let targetTeams = [];
            if (selectedInput.toLowerCase() === "all") {
              targetTeams = allRegs;
            } else {
              const nums = selectedInput
                .split(",")
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !isNaN(n) && n >= 1 && n <= allRegs.length);
              targetTeams = nums.map((n) => allRegs[n - 1]);
            }

            if (targetTeams.length === 0) {
              console.log("❌ No valid teams selected.");
              continue;
            }

            await promptTemplateCustomization(rl, sessionState);
            await executeDispatch({
              selectedTeams: targetTeams,
              rl,
              sessionState,
              cliOptions,
              modeName: "CUSTOM SELECTION",
            });
            continue;
          }
        }

        if (shortlistedTeams.length === 0) {
          console.log("ℹ️  No shortlisted teams available.");
          continue;
        }

        console.log(`\n🎯 Found ${shortlistedTeams.length} shortlisted team(s) in database:`);
        printTeamsTable(shortlistedTeams, { showSelectionIndex: true });

        await promptTemplateCustomization(rl, sessionState);
        await executeDispatch({
          selectedTeams: shortlistedTeams,
          rl,
          sessionState,
          cliOptions,
          modeName: "ALL SHORTLISTED TEAMS",
        });
      }

      // Option 2: CUSTOM Selected Teams
      else if (choice === "2") {
        console.log("\n🔍 Loading available teams for selection...");
        const shortlistFilter = getShortlistFilter();
        let candidateTeams = await Registration.find(shortlistFilter).sort({ createdAt: 1 });

        let poolLabel = "Shortlisted Teams";
        if (candidateTeams.length === 0) {
          console.log("ℹ️  No explicit shortlist flags found in DB. Showing all registered teams.");
          candidateTeams = await Registration.find().sort({ createdAt: 1 });
          poolLabel = "All Registered Teams";
        }

        if (candidateTeams.length === 0) {
          console.log("ℹ️  No registrations found in database.");
          continue;
        }

        console.log(`\nAvailable ${poolLabel} (${candidateTeams.length} total):`);
        printTeamsTable(candidateTeams, { showSelectionIndex: true });

        console.log("Select teams using comma-separated numbers (e.g. 1, 3, 5, 8), a range (e.g. 1-5), or 'all':");
        const selectionInput = (await rl.question("Selected team numbers: ")).trim();

        let chosenTeams = [];
        if (selectionInput.toLowerCase() === "all") {
          chosenTeams = candidateTeams;
        } else {
          const selectedIndices = new Set();
          const parts = selectionInput.split(",");

          for (const part of parts) {
            const cleanPart = part.trim();
            if (cleanPart.includes("-")) {
              const [startStr, endStr] = cleanPart.split("-");
              const start = parseInt(startStr, 10);
              const end = parseInt(endStr, 10);
              if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let k = start; k <= end; k++) {
                  if (k >= 1 && k <= candidateTeams.length) selectedIndices.add(k);
                }
              }
            } else {
              const num = parseInt(cleanPart, 10);
              if (!isNaN(num) && num >= 1 && num <= candidateTeams.length) {
                selectedIndices.add(num);
              }
            }
          }

          chosenTeams = Array.from(selectedIndices)
            .sort((a, b) => a - b)
            .map((idx) => candidateTeams[idx - 1]);
        }

        if (chosenTeams.length === 0) {
          console.log("❌ No valid teams selected. Returning to menu.");
          continue;
        }

        console.log(`\n🎯 Successfully selected ${chosenTeams.length} team(s):`);
        printTeamsTable(chosenTeams, { showSelectionIndex: true });

        await promptTemplateCustomization(rl, sessionState);
        await executeDispatch({
          selectedTeams: chosenTeams,
          rl,
          sessionState,
          cliOptions,
          modeName: "CUSTOM SELECTION",
        });
      }

      // Option 3: INDIVIDUAL Team
      else if (choice === "3") {
        console.log("\n🔍 Search for an INDIVIDUAL Team");
        const searchTerm = (
          await rl.question("Enter Team Name, Team Leader Name, Email, or Registration ID: ")
        ).trim();

        if (!searchTerm) {
          console.log("❌ Search term cannot be empty.");
          continue;
        }

        const searchRegex = new RegExp(searchTerm, "i");
        const matchingTeams = await Registration.find({
          $or: [
            { teamName: searchRegex },
            { teamLeaderName: searchRegex },
            { teamLeaderEmail: searchRegex },
            { registrationId: searchRegex },
          ],
        });

        if (matchingTeams.length === 0) {
          console.log(`\n❌ No registration found matching: "${searchTerm}".`);
          continue;
        }

        let targetTeam = null;

        if (matchingTeams.length === 1) {
          targetTeam = matchingTeams[0];
          console.log("\n✅ Exactly 1 matching team found:");
          printTeamsTable([targetTeam], { showSelectionIndex: false });
        } else {
          console.log(`\n🔍 Found ${matchingTeams.length} matching teams:`);
          printTeamsTable(matchingTeams, { showSelectionIndex: true });
          const pickNum = (
            await rl.question(`Select team number [1-${matchingTeams.length}]: `)
          ).trim();
          const pickIdx = parseInt(pickNum, 10);
          if (isNaN(pickIdx) || pickIdx < 1 || pickIdx > matchingTeams.length) {
            console.log("❌ Invalid selection. Returning to menu.");
            continue;
          }
          targetTeam = matchingTeams[pickIdx - 1];
        }

        const confirmIndividual = (
          await rl.question(`\nSend acceptance email to "${targetTeam.teamName}" <${targetTeam.teamLeaderEmail}>? [Y/n]: `)
        ).trim().toLowerCase();

        if (confirmIndividual === "n" || confirmIndividual === "no") {
          console.log("Cancelled. Returning to menu.");
          continue;
        }

        await promptTemplateCustomization(rl, sessionState);
        await executeDispatch({
          selectedTeams: [targetTeam],
          rl,
          sessionState,
          cliOptions,
          modeName: `INDIVIDUAL (${targetTeam.teamName})`,
        });
      }

      // Invalid menu choice
      else {
        console.log("❌ Invalid choice. Please enter a number between 1 and 5.");
      }
    }
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log("Database disconnected. Process exited.");
  }
}

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runInteractiveCli().catch(async (err) => {
    console.error("\n❌ Fatal Error:", err);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });
}
