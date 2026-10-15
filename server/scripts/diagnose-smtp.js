#!/usr/bin/env node

/**
 * Safe, Non-Destructive SMTP Diagnostic Script for AURA Techfest
 *
 * Implements Phase 2 targeted diagnostics:
 * - Environment resolution & path verification (WITHOUT exposing secrets)
 * - Credential format analysis (length, whitespace, quotes, character pattern)
 * - DNS, TCP, and TLS connectivity tests
 * - Transporter configuration inspection
 * - Detailed SMTP verification error capture
 */

import path from "path";
import fs from "fs";
import net from "net";
import tls from "tls";
import dns from "dns/promises";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Resolve .env paths
const serverEnvPath = path.resolve(__dirname, "../.env");
const serverEnvExists = fs.existsSync(serverEnvPath);
const cwdEnvPath = path.resolve(process.cwd(), ".env");
const cwdEnvExists = fs.existsSync(cwdEnvPath);

// Track before dotenv
const preEnvUser = process.env.EMAIL_USER;
const preEnvPass = process.env.EMAIL_PASS;

// Load .env explicitly
const dotenvResult = dotenv.config({ path: serverEnvPath });

// Post dotenv values (raw)
const rawUser = process.env.EMAIL_USER;
const rawPass = process.env.EMAIL_PASS;

// Masking helper
function maskEmail(email) {
  if (!email) return "<UNDEFINED>";
  const parts = email.split("@");
  if (parts.length !== 2) return "[Malformed email format]";
  const name = parts[0];
  const domain = parts[1];
  const maskedName =
    name.length <= 2
      ? name[0] + "*"
      : name.slice(0, 2) + "*".repeat(Math.max(1, name.length - 3)) + name.slice(-1);
  return `${maskedName}@${domain}`;
}

async function runDiagnostics() {
  console.log("========================================================================");
  console.log("            AURA SMTP & RUNTIME DEEP-DIVE DIAGNOSTIC                    ");
  console.log("========================================================================");

  // SECTION A: Runtime & Process Context
  console.log("\n[A] Runtime & Execution Environment:");
  console.log(`  • Node.js Version:        ${process.version}`);
  console.log(`  • Platform / OS:          ${process.platform} (${process.arch})`);
  console.log(`  • Current Working Dir:    ${process.cwd()}`);
  console.log(`  • Script Location:        ${__filename}`);
  console.log(`  • Nodemailer Package Ver: 10.0.10`);

  // SECTION B: Environment File Resolution
  console.log("\n[B] Environment File Resolution:");
  console.log(`  • Target server/.env:     ${serverEnvPath} (${serverEnvExists ? "EXISTS" : "MISSING"})`);
  console.log(`  • CWD .env:               ${cwdEnvPath} (${cwdEnvExists ? "EXISTS" : "MISSING"})`);
  console.log(`  • Dotenv Load Status:     ${dotenvResult.error ? "FAILED: " + dotenvResult.error.message : "SUCCESS"}`);
  console.log(`  • Pre-existing in Shell?: EMAIL_USER=${preEnvUser ? "YES" : "NO"}, EMAIL_PASS=${preEnvPass ? "YES" : "NO"}`);

  // SECTION C: Safe Credential Inspection (NO SECRETS PRINTED)
  console.log("\n[C] Safe Credential Shape & Pattern Analysis:");
  console.log(`  • EMAIL_USER Defined:     ${rawUser !== undefined ? "YES" : "NO"}`);
  console.log(`  • EMAIL_USER Non-Empty:   ${Boolean(rawUser && rawUser.length > 0)}`);
  console.log(`  • Sanitized EMAIL_USER:   ${maskEmail(rawUser)}`);

  if (rawUser) {
    const hasLeadingTrailingSpace = rawUser !== rawUser.trim();
    const domain = rawUser.split("@")[1] || "";
    console.log(`  • EMAIL_USER Whitespace:  ${hasLeadingTrailingSpace ? "⚠️ CONTAINS LEADING/TRAILING WHITESPACE" : "CLEAN"}`);
    console.log(`  • Domain Type:            ${domain.toLowerCase() === "gmail.com" ? "Standard Consumer Gmail (@gmail.com)" : "Custom / Google Workspace (@" + domain + ")"}`);
  }

  console.log(`  • EMAIL_PASS Defined:     ${rawPass !== undefined ? "YES" : "NO"}`);
  console.log(`  • EMAIL_PASS Non-Empty:   ${Boolean(rawPass && rawPass.length > 0)}`);

  if (rawPass !== undefined) {
    const rawLen = rawPass.length;
    const trimmed = rawPass.trim();
    const trimmedLen = trimmed.length;
    const strippedSpaces = rawPass.replace(/\s+/g, "");
    const strippedLen = strippedSpaces.length;

    const hasSpaces = /\s/.test(rawPass);
    const hasDoubleQuotes = rawPass.includes('"');
    const hasSingleQuotes = rawPass.includes("'");
    const hasBackticks = rawPass.includes("`");
    const hasNewlines = /[\r\n]/.test(rawPass);

    // Pattern checks
    // Google App Passwords are 16 letters (usually lower-case alphabets: abcd efgh ijkl mnop)
    const isOnlyAlpha16 = /^[a-zA-Z]{16}$/.test(strippedSpaces);
    const containsDigits = /\d/.test(rawPass);
    const containsSpecialChars = /[^a-zA-Z0-9\s]/.test(rawPass);

    console.log(`  • Raw Length:             ${rawLen} characters`);
    console.log(`  • Trimmed Length:         ${trimmedLen} characters`);
    console.log(`  • Length without spaces:  ${strippedLen} characters`);
    console.log(`  • Contains Internal Space:${hasSpaces ? "YES (Google often generates 4x4 with spaces: 'xxxx xxxx xxxx xxxx')" : "NO"}`);
    console.log(`  • Contains Double Quotes: ${hasDoubleQuotes ? "⚠️ YES (Quotes may be treated as part of password!)" : "NO"}`);
    console.log(`  • Contains Single Quotes: ${hasSingleQuotes ? "⚠️ YES (Quotes may be treated as part of password!)" : "NO"}`);
    console.log(`  • Contains Backticks:     ${hasBackticks ? "⚠️ YES" : "NO"}`);
    console.log(`  • Contains Linebreaks:    ${hasNewlines ? "⚠️ YES (CRLF/LF present in password!)" : "NO"}`);
    console.log(`  • Stripped Character Set: ${isOnlyAlpha16 ? "✅ EXACT 16-LETTER FORMAT (Matches Google App Password syntax)" : "⚠️ NOT 16 ALPHABETIC CHARACTERS"}`);
    console.log(`  • Contains Digits:        ${containsDigits ? "YES (Note: Google App Passwords DO NOT have numbers)" : "NO"}`);
    console.log(`  • Contains Special Chars: ${containsSpecialChars ? "YES (Note: Google App Passwords DO NOT have symbols)" : "NO"}`);
  }

  // SECTION D: Network Connectivity (DNS, TCP, TLS)
  console.log("\n[D] Network & Socket Connectivity Tests:");

  const smtpHost = "smtp.gmail.com";
  try {
    const dnsIps = await dns.resolve4(smtpHost);
    console.log(`  • DNS Lookup (smtp.gmail.com):  ✅ RESOLVED -> ${dnsIps.slice(0, 3).join(", ")}`);
  } catch (dnsErr) {
    console.log(`  • DNS Lookup:                   ❌ FAILED: ${dnsErr.message}`);
  }

  // TCP Port 465 (SSL)
  await new Promise((resolve) => {
    const socket = net.createConnection({ host: smtpHost, port: 465, timeout: 5000 });
    socket.on("connect", () => {
      console.log(`  • TCP Connect (smtp.gmail.com:465): ✅ SUCCESS`);
      socket.destroy();
      resolve();
    });
    socket.on("error", (err) => {
      console.log(`  • TCP Connect (smtp.gmail.com:465): ❌ FAILED: ${err.message}`);
      resolve();
    });
    socket.on("timeout", () => {
      console.log(`  • TCP Connect (smtp.gmail.com:465): ❌ TIMEOUT`);
      socket.destroy();
      resolve();
    });
  });

  // TLS Handshake on 465
  await new Promise((resolve) => {
    const tlsSocket = tls.connect({ host: smtpHost, port: 465, timeout: 5000 }, () => {
      console.log(`  • TLS Handshake (smtp.gmail.com:465): ✅ SUCCESS (Protocol: ${tlsSocket.getProtocol()})`);
      tlsSocket.destroy();
      resolve();
    });
    tlsSocket.on("error", (err) => {
      console.log(`  • TLS Handshake (smtp.gmail.com:465): ❌ FAILED: ${err.message}`);
      resolve();
    });
    tlsSocket.on("timeout", () => {
      console.log(`  • TLS Handshake (smtp.gmail.com:465): ❌ TIMEOUT`);
      tlsSocket.destroy();
      resolve();
    });
  });

  // SECTION E: Transporter Configurations & Detailed Verification Tests
  console.log("\n[E] Transporter Authentication Diagnostics:");

  if (!rawUser || !rawPass) {
    console.log("  ❌ Cannot run verification: EMAIL_USER or EMAIL_PASS missing.");
    return;
  }

  // Test Config 1: Default codebase configuration (service: 'gmail', user.trim(), pass.trim())
  console.log("\n  --- Test 1: Codebase Standard (service: 'gmail', pass.trim()) ---");
  await testTransporter({
    name: "Codebase Standard",
    transportConfig: {
      service: "gmail",
      auth: {
        user: rawUser.trim(),
        pass: rawPass.trim(),
      },
    },
  });

  // Test Config 2: Stripping all internal whitespace from pass
  const cleanPass = rawPass.replace(/\s+/g, "");
  if (cleanPass !== rawPass.trim()) {
    console.log("\n  --- Test 2: Whitespace-Stripped Password (removing spaces between 4-char groups) ---");
    await testTransporter({
      name: "Whitespace-Stripped",
      transportConfig: {
        service: "gmail",
        auth: {
          user: rawUser.trim(),
          pass: cleanPass,
        },
      },
    });
  }

  // Test Config 3: Explicit Host/Port 465 SSL
  console.log("\n  --- Test 3: Explicit Host (smtp.gmail.com:465, secure: true) ---");
  await testTransporter({
    name: "Explicit Host 465",
    transportConfig: {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: rawUser.trim(),
        pass: cleanPass,
      },
    },
  });

  // Test Config 4: Explicit Host/Port 587 STARTTLS
  console.log("\n  --- Test 4: Explicit Host (smtp.gmail.com:587, secure: false) ---");
  await testTransporter({
    name: "Explicit Host 587 STARTTLS",
    transportConfig: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: rawUser.trim(),
        pass: cleanPass,
      },
    },
  });

  console.log("\n========================================================================");
  console.log("                        DIAGNOSTIC COMPLETE                             ");
  console.log("========================================================================\n");
}

async function testTransporter({ name, transportConfig }) {
  const transporter = nodemailer.createTransport(transportConfig);
  try {
    await transporter.verify();
    console.log(`    ✅ SUCCESS! Authentication accepted on ${name}.`);
    return true;
  } catch (err) {
    console.log(`    ❌ FAILED on ${name}:`);
    console.log(`       • Error Code:    ${err.code || "N/A"}`);
    console.log(`       • Response Code: ${err.responseCode || "N/A"}`);
    console.log(`       • Command:       ${err.command || "N/A"}`);
    console.log(`       • Response:      ${(err.response || "").replace(/[\r\n]+/g, " ")}`);
    console.log(`       • Message:       ${err.message.replace(/[\r\n]+/g, " ")}`);
    return false;
  }
}

runDiagnostics().catch(console.error);
