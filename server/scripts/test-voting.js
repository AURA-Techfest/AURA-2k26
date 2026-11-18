import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  MIN_VOTING_MINUTES,
  MAX_VOTING_MINUTES,
  normalizeVoterKey,
  normalizePersonName,
  matchTeamMember,
  buildTally,
  namesMatch,
} from "../src/controllers/voting.controller.js";

import {
  WriteRateLimiter,
  voterRegisterLimiter,
  voteCastLimiter,
} from "../src/middleware/rateLimiter.middleware.js";

async function testVoting() {
  console.log("==================================================");
  console.log("   AURA 2K26 — Audience Choice Voting Tests ");
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

  // 1. Voting duration bounds (10-20 minutes decided on spot)
  assert(
    MIN_VOTING_MINUTES === 10 && MAX_VOTING_MINUTES === 20,
    "Voting window bounds are 10-20 minutes",
  );

  // 2. Voter key normalization (case-insensitive, trimmed)
  const key1 = normalizeVoterKey(" aura2k26-abc123 ", "  John Doe ");
  const key2 = normalizeVoterKey("AURA2K26-ABC123", "john doe");
  assert(key1 === key2, "Voter key normalization is consistent");
  assert(
    !key1.includes("::") === false && key1.split("::").length === 2,
    "Voter key contains registrationId and participant",
  );

  // 3. Tally computation with sample vote docs (one doc per vote cast)
  const votes = [
    { candidateRegistrationId: "AURA2K26-AAA111", candidateTeamName: "Team Alpha" },
    { candidateRegistrationId: "AURA2K26-AAA111", candidateTeamName: "Team Alpha" },
    { candidateRegistrationId: "AURA2K26-AAA111", candidateTeamName: "Team Alpha" },
    { candidateRegistrationId: "AURA2K26-BBB222", candidateTeamName: "Team Beta" },
    { candidateRegistrationId: "AURA2K26-BBB222", candidateTeamName: "Team Beta" },
    { candidateRegistrationId: "AURA2K26-CCC333", candidateTeamName: "Team Gamma" },
  ];

  const tally = buildTally(votes);
  assert(tally.votesCast === 6, "Tally counts total votes cast");
  assert(
    tally.results.length === 3,
    "Tally includes all voted candidates",
  );
  assert(
    tally.results[0].candidateTeamName === "Team Alpha" &&
      tally.results[0].votes === 3,
    "Tally sorts leader first with correct vote count",
  );
  assert(
    tally.results.every((r) => r.percentage > 0),
    "Tally computes percentage for each candidate",
  );
  assert(
    tally.winner &&
      tally.winner.candidateRegistrationId === "AURA2K26-AAA111",
    "Tally declares a leader as winner",
  );

  // 4. Empty tally
  const emptyTally = buildTally([]);
  assert(emptyTally.votesCast === 0, "Empty tally handles zero votes");
  assert(emptyTally.winner === null, "Empty tally has no winner");

  // 5. Percentage math: 1 of 4 votes = 25%
  const quarterTally = buildTally([
    { candidateRegistrationId: "AURA2K26-DDD444", candidateTeamName: "Team Delta" },
    { candidateRegistrationId: "AURA2K26-EXP0", candidateTeamName: "Team Exp0" },
    { candidateRegistrationId: "AURA2K26-EXP1", candidateTeamName: "Team Exp1" },
    { candidateRegistrationId: "AURA2K26-EXP2", candidateTeamName: "Team Exp2" },
  ]);
  assert(
    quarterTally.results[0].percentage === 25,
    "Percentage is computed correctly (1/4 = 25%)",
  );

  // 6. Participant name normalization
  assert(
    normalizePersonName("  Rahul's  Sharma. ") === "rahul sharma",
    "Person name normalization strips punctuation and collapses spaces",
  );

  // 7. Team member matching against registration records
  const reg = {
    teamLeaderName: "Rahul Sharma",
    teamMemberDetails:
      "Ananya Das | Aliah University | CSE | 3rd | 9876543210\n" +
      "Rahul Sharma Maity | Aliah University | ECE | 2nd | 9876543211",
  };

  assert(
    matchTeamMember(reg, "rahul sharma") === "Rahul Sharma",
    "Leader name matches case-insensitively",
  );
  assert(
    matchTeamMember(reg, "Ananya Das") === "Ananya Das",
    "Member name from pipe-separated row matches",
  );
  assert(
    matchTeamMember(reg, "Ananya  Das ") === "Ananya Das",
    "Extra whitespace in typed name still matches",
  );
  assert(
    matchTeamMember(reg, "Rahul Maity") === "Rahul Sharma Maity",
    "Partial multi-word name matches recorded full name",
  );
  assert(
    matchTeamMember(reg, "Rahul") === null,
    "Single first name alone is rejected (blocks extra votes)",
  );
  assert(
    matchTeamMember(reg, "Fake Person") === null,
    "Name not on the team is rejected",
  );
  assert(matchTeamMember(reg, "   ") === null, "Blank name is rejected");
  assert(
    matchTeamMember({}, "Anyone") === null,
    "Missing registration records reject every name",
  );

  // ---- namesMatch: guards who gets a Voter ID back on re-registration ----
  assert(
    namesMatch("Rahul Kumar", "rahul kumar") === true,
    "namesMatch: case + spacing differences still match",
  );
  assert(
    namesMatch("Rahul's Kumar", "Rahul Kumar") === true,
    "namesMatch: possessive apostrophe still matches",
  );
  assert(
    namesMatch("O'Brien", "Obrien") === true,
    "namesMatch: internal apostrophe still matches",
  );
  assert(
    namesMatch("Rahul Kumar", "Rahul Sharma") === false,
    "namesMatch: different names do not match",
  );
  assert(
    namesMatch("Rahul Kumar", "") === false && namesMatch("", "") === false,
    "namesMatch: blank name never matches (no ID handed out)",
  );

  // ---- Write rate limiter (public registration / vote endpoints) ----
  const limiter = new WriteRateLimiter({ windowMs: 60 * 1000, maxRequests: 3 });
  assert(limiter.consume("1.1.1.1").limited === false, "1st write allowed");
  assert(limiter.consume("1.1.1.1").limited === false, "2nd write allowed");
  assert(limiter.consume("1.1.1.1").limited === false, "3rd write allowed (at max)");
  const overLimit = limiter.consume("1.1.1.1");
  assert(
    overLimit.limited === true && overLimit.retryAfterSeconds >= 1,
    "4th write is rate limited with Retry-After seconds",
  );
  assert(
    limiter.consume("2.2.2.2").limited === false,
    "Rate limit is per-IP (another IP unaffected — venue NAT friendly)",
  );

  const shortLimiter = new WriteRateLimiter({ windowMs: 40, maxRequests: 1 });
  assert(shortLimiter.consume("3.3.3.3").limited === false, "Short-window 1st write allowed");
  assert(shortLimiter.consume("3.3.3.3").limited === true, "Short-window over limit");
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert(
    shortLimiter.consume("3.3.3.3").limited === false,
    "Window expiry resets the counter",
  );

  const cleanupLimiter = new WriteRateLimiter({ windowMs: 30, maxRequests: 5 });
  cleanupLimiter.consume("4.4.4.4");
  await new Promise((resolve) => setTimeout(resolve, 50));
  cleanupLimiter.cleanup();
  assert(
    cleanupLimiter.records.size === 0,
    "cleanup() drops expired IP windows (no memory leak)",
  );
  cleanupLimiter.consume("5.5.5.5");
  cleanupLimiter.reset();
  assert(cleanupLimiter.records.size === 0, "reset() clears all records");

  // Production instances: 60 registrations / 300 votes per minute per IP,
  // env-overridable without a redeploy (generous for venue NAT bursts).
  assert(
    voterRegisterLimiter instanceof WriteRateLimiter &&
      voterRegisterLimiter.maxRequests ===
        Number(process.env.VOTER_REGISTER_RATE_MAX || 60),
    "Voter registration limiter defaults to 60/min per IP (env-overridable)",
  );
  assert(
    voteCastLimiter instanceof WriteRateLimiter &&
      voteCastLimiter.maxRequests === Number(process.env.VOTE_CAST_RATE_MAX || 300),
    "Vote casting limiter defaults to 300/min per IP (env-overridable)",
  );

  console.log("==================================================");
  console.log(`Voting Tests: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  process.exit(failed > 0 ? 1 : 0);
}

testVoting();
