import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  signRsvpToken,
  verifyRsvpToken,
  computeTeamRsvpBreakdown,
} from "../src/controllers/rsvp.controller.js";

async function testEdgeCases() {
  console.log("==================================================");
  console.log("   AURA 2K26 — RSVP Edge Case & Reliability Tests ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Mixed team with missing / sparse member text lines
  const sparseMixedTeam = {
    teamName: "Sparse Mixed Innovators",
    teamSize: 4,
    teamAffiliation: "mixed",
    aliahMembers: 1,
    otherInstitutionMembers: 3,
    teamLeaderName: "Leader From Aliah",
    teamLeaderEmail: "leader@aliah.ac.in",
    teamMemberDetails: "Only Leader Listed",
  };
  const sparseRes = computeTeamRsvpBreakdown(sparseMixedTeam);
  assert(
    sparseRes.teamCategory === "mixed",
    "Sparse mixed team categorized as mixed",
  );
  assert(
    sparseRes.amountPayable === 1200,
    "Sparse mixed team fee correctly computed as 3 * 400 = 1200",
  );
  assert(
    sparseRes.participantBreakdown.length === 4,
    "Breakdown automatically padded to team size 4",
  );

  // 2. Pure External 2-member team
  const ext2 = {
    teamName: "Duo Hackers",
    teamSize: 2,
    teamAffiliation: "all_other",
    aliahMembers: 0,
    otherInstitutionMembers: 2,
    teamLeaderName: "External One",
    teamLeaderEmail: "ext1@other.edu",
    teamMemberDetails: "Ext One | IIT | CSE\r\nExt Two | NIT | ECE",
  };
  const ext2Res = computeTeamRsvpBreakdown(ext2);
  assert(ext2Res.amountPayable === 800, "2-member external team fee is ₹800");

  // 3. Pure External 3-member team
  const ext3 = {
    teamName: "Trio Hackers",
    teamSize: 3,
    teamAffiliation: "all_other",
    aliahMembers: 0,
    otherInstitutionMembers: 3,
    teamLeaderName: "External One",
    teamLeaderEmail: "ext1@other.edu",
    teamMemberDetails: "Ext One | IIT\r\nExt Two | NIT\r\nExt Three | IIIT",
  };
  const ext3Res = computeTeamRsvpBreakdown(ext3);
  assert(
    ext3Res.amountPayable === 1200,
    "3-member external team fee is ₹1,200",
  );

  // 4. Token payload integrity
  const sessionData = {
    registrationId: "AURA2K26-XYZ123",
    email: "test@domain.com",
    teamName: "Alpha",
    exp: Date.now() + 3600000,
  };
  const signed = signRsvpToken(sessionData);
  const verified = verifyRsvpToken(signed);
  assert(
    verified.email === "test@domain.com",
    "Token preserves email accurately",
  );
  assert(verified.teamName === "Alpha", "Token preserves teamName accurately");

  console.log("--------------------------------------------------");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

testEdgeCases();
