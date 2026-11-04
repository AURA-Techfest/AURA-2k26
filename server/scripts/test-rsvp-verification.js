import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  signRsvpToken,
  verifyRsvpToken,
  requireRsvpAuth,
  computeTeamRsvpBreakdown,
  verifyRegistrationCredentials,
} from "../src/controllers/rsvp.controller.js";
import { VerificationRateLimiter } from "../src/middleware/rateLimiter.middleware.js";
import Registration from "../src/models/Registration.js";

async function runVerificationTestSuite() {
  console.log("==================================================================");
  console.log("   AURA 2K26 — Registration ID + Leader Email Verification Tests  ");
  console.log("==================================================================");

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

  // Helper mock Response
  function createMockRes() {
    return {
      statusCode: 200,
      headers: {},
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(name, value) {
        this.headers[name] = value;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
  }

  // Mock database registrations
  const mockDb = new Map();

  const mockTeamAliah = {
    _id: "60d5ec49f1b2c8b1f8e4e1a1",
    registrationId: "AURA2K26-ALIAH1",
    teamName: "Quantum Pioneers",
    teamSize: 3,
    teamAffiliation: "all_aliah",
    aliahMembers: 3,
    otherInstitutionMembers: 0,
    teamLeaderName: "Siddiqur Rahman",
    teamLeaderEmail: "siddiqur@aliah.ac.in",
    teamLeaderPhone: "+91 9876543210",
    projectTitle: "Smart Crop Guardian",
    prototypeType: "IoT Device",
  };

  const mockTeamExternal = {
    _id: "60d5ec49f1b2c8b1f8e4e1a2",
    registrationId: "AURA2K26-EXT444",
    teamName: "RoboVanguard",
    teamSize: 4,
    teamAffiliation: "all_other",
    aliahMembers: 0,
    otherInstitutionMembers: 4,
    teamLeaderName: "Vikram Sen",
    teamLeaderEmail: "vikram@iem.edu.in",
    teamLeaderPhone: "+91 9123456789",
    projectTitle: "Autonomous Solar Cleaner",
    prototypeType: "Robotic System",
  };

  const mockTeamMixed = {
    _id: "60d5ec49f1b2c8b1f8e4e1a3",
    registrationId: "AURA2K26-MIX777",
    teamName: "Neural Nexus",
    teamSize: 4,
    teamAffiliation: "mixed",
    aliahMembers: 2,
    otherInstitutionMembers: 2,
    teamLeaderName: "Amina Khatun",
    teamLeaderEmail: "amina@aliah.ac.in",
    teamLeaderPhone: "+91 9988776655",
    projectTitle: "Bionic Hand",
    prototypeType: "Wearable Device",
  };

  mockDb.set(mockTeamAliah.registrationId, mockTeamAliah);
  mockDb.set(mockTeamExternal.registrationId, mockTeamExternal);
  mockDb.set(mockTeamMixed.registrationId, mockTeamMixed);

  // Stub Registration.findOne for controller testing
  const originalFindOne = Registration.findOne;
  Registration.findOne = async (query) => {
    if (query.registrationId) {
      return mockDb.get(query.registrationId) || null;
    }
    return null;
  };

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Empty & Missing Inputs
    // -------------------------------------------------------------
    console.log("\n--- Scenario 1: Empty & Missing Inputs ---");
    {
      const req = { body: {}, headers: {}, socket: { remoteAddress: "127.0.0.1" } };
      const res = createMockRes();
      await verifyRegistrationCredentials(req, res);
      assert(res.statusCode === 400, "Empty body rejected with 400");
      assert(res.jsonData.success === false, "success flag is false");
    }
    {
      const req = {
        body: { registrationId: "AURA2K26-ALIAH1", email: "" },
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      };
      const res = createMockRes();
      await verifyRegistrationCredentials(req, res);
      assert(res.statusCode === 400, "Missing email rejected with 400");
    }
    {
      const req = {
        body: { registrationId: "   ", email: "test@domain.com" },
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      };
      const res = createMockRes();
      await verifyRegistrationCredentials(req, res);
      assert(res.statusCode === 400, "Whitespace registrationId rejected with 400");
    }
    {
      const req = {
        body: { registrationId: "AURA2K26-ALIAH1", email: "invalid-email-format" },
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      };
      const res = createMockRes();
      await verifyRegistrationCredentials(req, res);
      assert(res.statusCode === 400, "Invalid email format rejected with 400");
    }

    // -------------------------------------------------------------
    // SCENARIO 2: Invalid Registration ID
    // -------------------------------------------------------------
    console.log("\n--- Scenario 2: Invalid Registration ID ---");
    {
      const req = {
        body: { registrationId: "AURA2K26-NONEXISTENT", email: "siddiqur@aliah.ac.in" },
        headers: {},
        socket: { remoteAddress: "127.0.0.2" },
      };
      const res = createMockRes();
      await verifyRegistrationCredentials(req, res);
      assert(res.statusCode === 401, "Nonexistent Registration ID rejected with 401");
      assert(
        res.jsonData.message.includes("Invalid Registration ID or Team Leader Email"),
        "Generic error message does not leak registration ID nonexistence"
      );
    }

    // -------------------------------------------------------------
    // SCENARIO 3: Valid Registration ID + Incorrect Email
    // -------------------------------------------------------------
    console.log("\n--- Scenario 3: Valid Registration ID + Incorrect Email ---");
    {
      const req = {
        body: { registrationId: "AURA2K26-ALIAH1", email: "wrong-email@example.com" },
        headers: {},
        socket: { remoteAddress: "127.0.0.3" },
      };
      const res = createMockRes();
      await verifyRegistrationCredentials(req, res);
      assert(res.statusCode === 401, "Mismatched leader email rejected with 401");
      assert(
        res.jsonData.message.includes("Invalid Registration ID or Team Leader Email"),
        "Generic message is identical to nonexistent ID (prevents enumeration)"
      );
    }

    // -------------------------------------------------------------
    // SCENARIO 4: Valid Registration ID + Correct Email
    // -------------------------------------------------------------
    console.log("\n--- Scenario 4: Valid Registration ID + Correct Email ---");
    let verifiedToken = "";
    {
      const req = {
        body: {
          registrationId: "AURA2K26-ALIAH1",
          email: "siddiqur@aliah.ac.in",
        },
        headers: {},
        socket: { remoteAddress: "127.0.0.4" },
      };
      const res = createMockRes();
      await verifyRegistrationCredentials(req, res);
      assert(res.statusCode === 200, "Valid credentials return 200 OK");
      assert(res.jsonData.success === true, "Verification success is true");
      assert(res.jsonData.registrationId === "AURA2K26-ALIAH1", "Returns Registration ID");
      assert(res.jsonData.teamName === "Quantum Pioneers", "Returns Team Name");
      assert(typeof res.jsonData.token === "string" && res.jsonData.token.includes("."), "Returns valid signed HMAC session token");
      verifiedToken = res.jsonData.token;

      // Ensure sensitive info is not leaked in verification response
      assert(res.jsonData.projectTitle === undefined, "Does not leak projectTitle in verification response");
      assert(res.jsonData.teamLeaderPhone === undefined, "Does not leak phone in verification response");
    }

    // -------------------------------------------------------------
    // SCENARIO 5: Case Insensitivity & Whitespace Normalization
    // -------------------------------------------------------------
    console.log("\n--- Scenario 5: Case & Whitespace Normalization ---");
    {
      const req = {
        body: {
          registrationId: "  aura2k26-aliah1  ", // lowercase + spaces
          email: "  SIDDIQUR@ALIAH.AC.IN  ", // uppercase + spaces
        },
        headers: {},
        socket: { remoteAddress: "127.0.0.5" },
      };
      const res = createMockRes();
      await verifyRegistrationCredentials(req, res);
      assert(res.statusCode === 200, "Handles lowercase Registration ID and uppercase email correctly");
      assert(res.jsonData.registrationId === "AURA2K26-ALIAH1", "Registration ID normalized to uppercase");
    }

    // -------------------------------------------------------------
    // SCENARIO 6: Rate Limiting on Repeated Failed Attempts
    // -------------------------------------------------------------
    console.log("\n--- Scenario 6: Rate Limiting on Brute Force Attempts ---");
    {
      const testLimiter = new VerificationRateLimiter({ maxFailures: 5, windowMs: 60000 });
      const testIp = "192.168.1.100";
      const testRegId = "AURA2K26-TESTFAIL";

      // 5 failed attempts
      for (let i = 1; i <= 5; i++) {
        testLimiter.recordFailure(testIp, testRegId);
      }

      // Check 6th attempt
      const rateCheck = testLimiter.isRateLimited(testIp, testRegId);
      assert(rateCheck.limited === true, "Rate limiter triggers after 5 failed attempts");
      assert(rateCheck.reason === "too_many_failures", "Reason is too_many_failures");
      assert(rateCheck.retryAfterSeconds > 0, "Provides retryAfterSeconds");

      // Successful verification clears failures
      testLimiter.recordSuccess(testIp, testRegId);
      const afterSuccessCheck = testLimiter.isRateLimited(testIp, testRegId);
      assert(afterSuccessCheck.limited === false, "Successful verification resets failed count");
    }

    // -------------------------------------------------------------
    // SCENARIO 7: Unauthorized Access to Subsequent RSVP Endpoints
    // -------------------------------------------------------------
    console.log("\n--- Scenario 7: Session Token Authorization Middleware ---");
    {
      // No token
      const req = { headers: {} };
      const res = createMockRes();
      let nextCalled = false;
      await requireRsvpAuth(req, res, () => { nextCalled = true; });
      assert(res.statusCode === 401, "Missing Authorization header rejected with 401");
      assert(nextCalled === false, "next() not called on missing token");
    }
    {
      // Tampered token
      const tampered = verifiedToken.slice(0, -6) + "XXXXXX";
      const req = { headers: { authorization: `Bearer ${tampered}` } };
      const res = createMockRes();
      let nextCalled = false;
      await requireRsvpAuth(req, res, () => { nextCalled = true; });
      assert(res.statusCode === 401, "Tampered session token rejected with 401");
      assert(nextCalled === false, "next() not called on tampered token");
    }
    {
      // Expired token
      const expiredToken = signRsvpToken({
        registrationId: "AURA2K26-ALIAH1",
        email: "siddiqur@aliah.ac.in",
        exp: Date.now() - 5000,
      });
      const req = { headers: { authorization: `Bearer ${expiredToken}` } };
      const res = createMockRes();
      let nextCalled = false;
      await requireRsvpAuth(req, res, () => { nextCalled = true; });
      assert(res.statusCode === 401, "Expired session token rejected with 401");
      assert(nextCalled === false, "next() not called on expired token");
    }
    {
      // Valid verified token
      const req = { headers: { authorization: `Bearer ${verifiedToken}` } };
      const res = createMockRes();
      let nextCalled = false;
      await requireRsvpAuth(req, res, () => { nextCalled = true; });
      assert(nextCalled === true, "Valid verified session token allowed through auth middleware");
      assert(req.rsvpUser.registrationId === "AURA2K26-ALIAH1", "req.rsvpUser populated with verified registrationId");
    }

    // -------------------------------------------------------------
    // SCENARIO 8: Payment Logic Preservation across Categories
    // -------------------------------------------------------------
    console.log("\n--- Scenario 8: Payment Logic Preservation ---");
    {
      // Category A: University Team
      const res = computeTeamRsvpBreakdown(mockTeamAliah);
      assert(res.teamCategory === "internal", "University team categorized as internal");
      assert(res.amountPayable === 0, "University team requires ₹0 payment");
      assert(res.internalParticipants === 3, "All 3 participants internal");
    }
    {
      // Category B: Outside University Team
      const res = computeTeamRsvpBreakdown(mockTeamExternal);
      assert(res.teamCategory === "external", "Outside university team categorized as external");
      assert(res.amountPayable === 1600, "4-member external team fee is ₹1,600 (4 * ₹400)");
      assert(res.externalParticipants === 4, "All 4 participants external");
    }
    {
      // Category C: Mixed Team (2 Internal + 2 External)
      const res = computeTeamRsvpBreakdown(mockTeamMixed);
      assert(res.teamCategory === "mixed", "Mixed team categorized as mixed");
      assert(res.amountPayable === 800, "Mixed team (2 external) fee is ₹800 (2 * ₹400)");
      assert(res.internalParticipants === 2, "2 internal participants");
      assert(res.externalParticipants === 2, "2 external participants");
    }
    {
      // Category C with different count: 1 Aliah + 3 External = ₹1,200
      const mixedTeam3Ext = {
        ...mockTeamMixed,
        aliahMembers: 1,
        otherInstitutionMembers: 3,
      };
      const res = computeTeamRsvpBreakdown(mixedTeam3Ext);
      assert(res.amountPayable === 1200, "Mixed team (3 external) fee is ₹1,200 (3 * ₹400)");
    }
    {
      // Category C with different count: 3 Aliah + 1 External = ₹400
      const mixedTeam1Ext = {
        ...mockTeamMixed,
        aliahMembers: 3,
        otherInstitutionMembers: 1,
      };
      const res = computeTeamRsvpBreakdown(mixedTeam1Ext);
      assert(res.amountPayable === 400, "Mixed team (1 external) fee is ₹400 (1 * ₹400)");
    }

  } finally {
    // Restore stubbed model method
    Registration.findOne = originalFindOne;
  }

  console.log("------------------------------------------------------------------");
  console.log(`Verification Test Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

runVerificationTestSuite();

