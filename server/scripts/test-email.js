#!/usr/bin/env node

/**
 * Standalone Email Automation Test Script for AURA 2K26.
 *
 * Usage:
 *   node scripts/test-email.js [optional-recipient-email]
 *
 * Example:
 *   node scripts/test-email.js test@example.com
 */

import "../src/config/env.js";
import {
  verifyEmailConfig,
  sendTestEmail,
} from "../src/services/email.service.js";

async function runEmailTest() {
  console.log("==================================================");
  console.log("    AURA 2K26 — Email Automation Diagnostic Test   ");
  console.log("==================================================");

  const targetEmail = "yousuf.mallik79@gmail.com";

  console.log(`\n1. Checking Environment Variables:`);
  console.log(
    `   - EMAIL_USER: ${process.env.EMAIL_USER ? "✅ Set (" + process.env.EMAIL_USER + ")" : "❌ Not Set"}`,
  );
  console.log(
    `   - EMAIL_PASS: ${process.env.EMAIL_PASS ? "✅ Set (App Password Hidden)" : "❌ Not Set"}`,
  );

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error(
      "\n❌ Error: EMAIL_USER and EMAIL_PASS must be defined in .env before running test.",
    );
    console.log("\nSetup Instructions:");
    console.log("  1. Enable 2-Step Verification on your Google Account.");
    console.log(
      "  2. Create a 16-character App Password at: https://myaccount.google.com/apppasswords",
    );
    console.log(
      "  3. Add EMAIL_USER=your_email@gmail.com and EMAIL_PASS=your_16_char_password to server/.env",
    );
    process.exit(1);
  }

  console.log("\n2. Verifying Gmail SMTP Server Connection...");
  const verification = await verifyEmailConfig();
  if (verification.connectionFailed || !verification.configured) {
    console.error(`\n❌ SMTP Verification Failed: ${verification.message}`);
    console.log("\nTroubleshooting Tips:");
    console.log(
      "  - Make sure you are using a 16-character Google App Password (not your personal Gmail password).",
    );
    console.log(
      "  - Ensure 2-Step Verification is active on the Gmail account.",
    );
    console.log("  - Check for typos in EMAIL_USER or EMAIL_PASS.");
    process.exit(1);
  }
  console.log(`   ✅ SMTP Connection Successful!`);

  console.log(`\n3. Sending Test Confirmation Email to: ${targetEmail}`);
  try {
    const info = await sendTestEmail(targetEmail);
    console.log(`   ✅ Test Email Sent Successfully!`);
    console.log(`   - Message ID: ${info.messageId}`);
    console.log(`   - Accepted: ${JSON.stringify(info.accepted)}`);
    console.log(
      `\n🎉 Success! Check the inbox (and Spam folder) of ${targetEmail} for the test email.`,
    );
  } catch (error) {
    console.error(`\n❌ Failed to Send Test Email: ${error.message}`);
    process.exit(1);
  }

  console.log("\n==================================================");
}

runEmailTest();
