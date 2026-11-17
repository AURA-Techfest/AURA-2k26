import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  MIN_VOTING_MINUTES,
  MAX_VOTING_MINUTES,
  normalizeVoterKey,
  buildTally,
} from "../src/controllers/voting.controller.js";

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

  console.log("==================================================");
  console.log(`Voting Tests: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  process.exit(failed > 0 ? 1 : 0);
}

testVoting();
