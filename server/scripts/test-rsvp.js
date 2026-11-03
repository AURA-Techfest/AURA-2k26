import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  computeTeamRsvpBreakdown,
  signRsvpToken,
  verifyRsvpToken,
} from "../src/controllers/rsvp.controller.js";

async function runTests() {
  console.log("==================================================");
  console.log("      AURA 2K26 — RSVP System Logic Tests         ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Category A - Pure Aliah University Team (₹0)
  const teamCategoryA = {
    teamName: "Aliah Tech Titans",
    teamSize: 3,
    teamAffiliation: "all_aliah",
    aliahMembers: 3,
    otherInstitutionMembers: 0,
    teamLeaderName: "Farhan Ahmed",
    teamLeaderEmail: "farhan@aliah.ac.in",
    teamMemberDetails: "Farhan Ahmed | Aliah University | CSE\r\nZaid Khan | Aliah University | ECE\r\nSana Parveen | Aliah University | ME",
  };

  const resA = computeTeamRsvpBreakdown(teamCategoryA);
  assert(resA.teamCategory === "internal", "Category A identified as 'internal'");
  assert(resA.amountPayable === 0, "Category A payable amount is ₹0");
  assert(resA.internalParticipants === 3, "Category A has 3 internal participants");
  assert(resA.externalParticipants === 0, "Category A has 0 external participants");
  assert(resA.participantBreakdown.every(p => p.isInternal && p.fee === 0), "All members in Category A are fee-exempt");

  // TEST 2: Category B - Pure External Team (4 members = ₹1,600)
  const teamCategoryB = {
    teamName: "RoboStorm",
    teamSize: 4,
    teamAffiliation: "all_other",
    aliahMembers: 0,
    otherInstitutionMembers: 4,
    teamLeaderName: "Amit Sharma",
    teamLeaderEmail: "amit@iem.edu.in",
    teamMemberDetails: "Amit Sharma | IEM Kolkata | CSE\r\nRahul Paul | Heritage Institute | IT\r\nSneha Roy | Narula | ECE\r\nDev Sen | Techno India | EE",
  };

  const resB = computeTeamRsvpBreakdown(teamCategoryB);
  assert(resB.teamCategory === "external", "Category B identified as 'external'");
  assert(resB.amountPayable === 1600, "Category B (4 members) payable amount is ₹1,600 (4 * 400)");
  assert(resB.internalParticipants === 0, "Category B has 0 internal participants");
  assert(resB.externalParticipants === 4, "Category B has 4 external participants");
  assert(resB.participantBreakdown.every(p => !p.isInternal && p.fee === 400), "All members in Category B are charged ₹400");

  // TEST 3: Category C - Mixed Team (2 Aliah + 2 External = ₹800)
  const teamCategoryC = {
    teamName: "Synergy Builders",
    teamSize: 4,
    teamAffiliation: "mixed",
    aliahMembers: 2,
    otherInstitutionMembers: 2,
    teamLeaderName: "Tariq Ali",
    teamLeaderEmail: "tariq@aliah.ac.in",
    teamMemberDetails: "Tariq Ali | Aliah University | CSE\r\nWasim Akram | Aliah University | ECE\r\nRohan Ghosh | Jadavpur University | ME\r\nPriya Das | Calcutta University | IT",
  };

  const resC = computeTeamRsvpBreakdown(teamCategoryC);
  assert(resC.teamCategory === "mixed", "Category C identified as 'mixed'");
  assert(resC.amountPayable === 800, "Category C (2 external) payable amount is ₹800 (2 * 400)");
  assert(resC.internalParticipants === 2, "Category C has 2 internal participants");
  assert(resC.externalParticipants === 2, "Category C has 2 external participants");

  // TEST 4: HMAC Token Signing & Tamper Verification
  const payload = {
    registrationId: "AURA2K26-TEST99",
    email: "leader@example.com",
    exp: Date.now() + 60000,
  };
  const token = signRsvpToken(payload);
  const decoded = verifyRsvpToken(token);
  assert(decoded !== null, "Token correctly signed and verified");
  assert(decoded.registrationId === "AURA2K26-TEST99", "Decoded token matches original payload");

  // Tampered token test
  const tamperedToken = token.slice(0, -4) + "XXXX";
  const tamperedDecoded = verifyRsvpToken(tamperedToken);
  assert(tamperedDecoded === null, "Tampered token is strictly rejected");

  // Expired token test
  const expiredToken = signRsvpToken({
    registrationId: "AURA2K26-EXP",
    email: "exp@example.com",
    exp: Date.now() - 1000,
  });
  const expiredDecoded = verifyRsvpToken(expiredToken);
  assert(expiredDecoded === null, "Expired token is strictly rejected");

  console.log("--------------------------------------------------");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests();

