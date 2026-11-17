#!/usr/bin/env node

/**
 * AURA 2K26 — Export Team Names & Topics to CSV
 *
 * Uses the live RSVP admin list + RSVP details endpoint to build a CSV with:
 *   teamName,projectTitle
 *
 * Usage:
 *   node scripts/export-team-topics.js [API_BASE]
 *   node scripts/export-team-topics.js https://aura-2k26.onrender.com
 *
 * If ADMIN_JWT_SECRET / JWT_SECRET is set, it is used to sign RSVP access
 * tokens; otherwise the app's default fallback secret is used.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const API_BASE = (process.argv[2] || process.env.API_URL || "https://aura-2k26.onrender.com").replace(/\/$/, "");
const TOKEN_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "aura_2k26_rsvp_secret_salt_98371";

function signRsvpToken(registrationId) {
  const payload = { registrationId, exp: Date.now() + 10 * 60 * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

function escapeCsv(val) {
  const s = String(val ?? "").trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  console.log("==================================================================");
  console.log("      AURA 2K26 — Export Team Names & Topics to CSV            ");
  console.log("==================================================================");
  console.log("API:", API_BASE);

  // 1) Get the full RSVP list (teamName + registrationId)
  const listRes = await fetch(`${API_BASE}/api/rsvp/admin/list`);
  if (!listRes.ok) throw new Error(`RSVP list failed: ${listRes.status}`);
  const listData = await listRes.json();
  const rsvps = listData.rsvps || [];
  console.log(`📋 RSVPs found: ${rsvps.length}`);

  const rows = [];
  for (const r of rsvps) {
    const registrationId = r.registrationId;
    let topic = "";
    try {
      const token = signRsvpToken(registrationId);
      const detailRes = await fetch(`${API_BASE}/api/rsvp/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (detailRes.ok) {
        const d = await detailRes.json();
        topic = d.registration?.projectTitle || "";
      }
    } catch {
      // leave topic blank
    }
    rows.push([r.teamName, topic]);
  }

  const csv = ["teamName,projectTitle", ...rows.map((r) => `${escapeCsv(r[0])},${escapeCsv(r[1])}`)].join("\n");
  const outPath = path.resolve(__dirname, "../team-topics.csv");
  fs.writeFileSync(outPath, csv + "\n", "utf8");

  console.log(`✅ Exported ${rows.length} teams/topics to:`);
  console.log(`   ${outPath}`);
}

main().catch((err) => {
  console.error("❌ Export failed:", err.message);
  process.exit(1);
});
