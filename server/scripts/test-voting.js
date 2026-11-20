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
  pickAudienceWinner,
  isSessionRunning,
  csvCell,
  teamsCsv,
  parseFinalistUpdate,
  namesMatch,
  normalizeIndianMobile,
  parseSiteVerifyResponse,
  verifyRecaptcha,
  clientIpOf,
  resolveIpVoteCap,
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

  // 5b. Audience Choice / podium mutual exclusivity (pure picker)
  const ranked = tally.results; // Alpha 3, Beta 2, Gamma 1
  assert(
    pickAudienceWinner(ranked, []).candidateRegistrationId ===
      "AURA2K26-AAA111",
    "Picker returns the vote leader when no podium exists",
  );
  assert(
    pickAudienceWinner(ranked, ["AURA2K26-AAA111"]).candidateRegistrationId ===
      "AURA2K26-BBB222",
    "Picker skips the podiumed vote leader (1st place ≠ Audience Choice)",
  );
  assert(
    pickAudienceWinner(ranked, ["aura2k26-aaa111", "AURA2K26-BBB222"])
      .candidateRegistrationId === "AURA2K26-CCC333",
    "Picker skips multiple podiumed teams case-insensitively",
  );
  assert(
    pickAudienceWinner(ranked, [
      "AURA2K26-AAA111",
      "AURA2K26-BBB222",
      "AURA2K26-CCC333",
    ]) === null,
    "Picker returns null when every voted team holds a podium prize",
  );
  assert(
    pickAudienceWinner([], ["AURA2K26-AAA111"]) === null,
    "Picker returns null when there are no votes",
  );
  const zeroVote = [
    { candidateRegistrationId: "AURA2K26-AAA111", votes: 0 },
    { candidateRegistrationId: "AURA2K26-BBB222", votes: 2 },
  ];
  assert(
    pickAudienceWinner(zeroVote, ["AURA2K26-BBB222"]) === null,
    "Zero-vote rows are never eligible even if not podiumed",
  );

  // 5c. Session-running predicate (guards podium lock + start-session force)
  const liveSession = { status: "active", endsAt: new Date(Date.now() + 60000) };
  const expiredSession = { status: "active", endsAt: new Date(Date.now() - 1000) };
  const closedSession = { status: "closed", endsAt: new Date(Date.now() + 60000) };
  assert(isSessionRunning(liveSession) === true, "Active session with future end is running");
  assert(isSessionRunning(expiredSession) === false, "Expired active session is not running");
  assert(isSessionRunning(closedSession) === false, "Closed session is not running");
  assert(isSessionRunning(null) === false, "Missing session is not running");

  // 5d. Teams CSV export (team name + topic only — privacy requirement)
  assert(csvCell("Plain Team") === "Plain Team", "csvCell passes plain values through");
  assert(csvCell("A,B") === '"A,B"', "csvCell quotes embedded commas");
  assert(csvCell('Say "hi"') === '"Say ""hi"""', "csvCell doubles embedded quotes");
  assert(csvCell("line\nbreak") === '"line\nbreak"', "csvCell quotes line breaks");
  assert(csvCell(null) === "" && csvCell(undefined) === "", "csvCell maps null/undefined to empty");
  const teamCsv = teamsCsv([
    { teamName: '"TECHWALK"', projectTitle: "SMART BLIND STICK" },
    { teamName: "Comma, Crew", projectTitle: 'Topic with "quotes"' },
  ]);
  const csvLines = teamCsv.split("\r\n").filter(Boolean);
  assert(
    csvLines[0] === "Team Name,Topic",
    "CSV header is exactly 'Team Name,Topic'",
  );
  assert(
    csvLines[0].split(",").length === 2,
    "CSV header has exactly two columns (no personal data)",
  );
  assert(csvLines.length === 3, "CSV has header + one row per team");
  assert(
    csvLines[1] === '"""TECHWALK""",SMART BLIND STICK',
    "Real-world quoted team names escape correctly",
  );
  assert(
    csvLines[2] === '"Comma, Crew","Topic with ""quotes"""',
    "Rows with commas and quotes are fully escaped",
  );

  // 5e. Finalist toggle request parsing (strict — no truthy coercion)
  const addUpdate = parseFinalistUpdate({
    registrationId: " aura2k26-abc123 ",
    isFinalist: true,
  });
  assert(
    addUpdate !== null &&
      addUpdate.registrationId === "AURA2K26-ABC123" &&
      addUpdate.isFinalist === true,
    "Finalist update trims/uppercases the id and keeps boolean true",
  );
  assert(
    parseFinalistUpdate({ registrationId: "AURA2K26-ABC123", isFinalist: false })
      ?.isFinalist === false,
    "Finalist update accepts explicit false (removal)",
  );
  assert(
    parseFinalistUpdate({ isFinalist: true }) === null &&
      parseFinalistUpdate({ registrationId: "AURA2K26-ABC123" }) === null,
    "Finalist update rejects missing id or missing flag",
  );
  assert(
    parseFinalistUpdate({ registrationId: "AURA2K26-ABC123", isFinalist: "true" }) === null &&
      parseFinalistUpdate({ registrationId: "AURA2K26-ABC123", isFinalist: 1 }) === null,
    "Finalist update rejects non-boolean flags (no truthy coercion)",
  );

  // 5f. Strict Indian mobile normalization (one canonical form for
  // storage + dedupe; everything else is rejected)
  assert(
    normalizeIndianMobile("9876543210") === "9876543210",
    "Bare 10-digit mobile passes unchanged",
  );
  assert(
    normalizeIndianMobile("+91 98765 43210") === "9876543210" &&
      normalizeIndianMobile("+919876543210") === "9876543210",
    "+91 prefix (spaced or compact) normalizes to bare digits",
  );
  assert(
    normalizeIndianMobile("00919876543210") === "9876543210",
    "0091 prefix normalizes",
  );
  assert(
    normalizeIndianMobile("09876543210") === "9876543210",
    "Leading 0 trunk prefix normalizes",
  );
  assert(
    normalizeIndianMobile("98765-43210") === "9876543210" &&
      normalizeIndianMobile("98765 43210") === "9876543210" &&
      normalizeIndianMobile("(98765) 43210") === "9876543210",
    "Dashes, spaces and parentheses are stripped",
  );
  assert(
    normalizeIndianMobile("1234567890") === null &&
      normalizeIndianMobile("5876543210") === null,
    "Numbers not starting 6-9 are rejected",
  );
  assert(
    normalizeIndianMobile("987654321") === null &&
      normalizeIndianMobile("98765432101") === null &&
      normalizeIndianMobile("987654321012") === null,
    "Wrong lengths (9, 11, 12 digits) are rejected",
  );
  assert(
    normalizeIndianMobile("98765abc210") === null &&
      normalizeIndianMobile("987654321!") === null,
    "Letters and symbols are rejected",
  );
  assert(
    normalizeIndianMobile("") === null && normalizeIndianMobile(null) === null,
    "Empty input is rejected",
  );
  assert(
    normalizeIndianMobile("+91 1234567890") === null,
    "Invalid number after prefix strip is still rejected",
  );

  // 5g. reCAPTCHA siteverify payload parsing (pure)
  assert(
    parseSiteVerifyResponse({ success: true, score: 0.9 }) === true,
    "High score passes",
  );
  assert(
    parseSiteVerifyResponse({ success: true, score: 0.3 }) === false,
    "Score below the 0.5 default fails",
  );
  assert(
    parseSiteVerifyResponse({ success: true, score: 0.3 }, 0.2) === true,
    "Custom min score is respected",
  );
  assert(
    parseSiteVerifyResponse({ success: false, score: 0.9 }) === false,
    "success:false fails regardless of score",
  );
  assert(
    parseSiteVerifyResponse(null) === false,
    "Empty payload fails",
  );
  assert(
    parseSiteVerifyResponse({ success: true }) === true,
    "Payload without a score passes on success alone (non-v3 response)",
  );

  // 5h. reCAPTCHA gate is opt-in: off with no secret, fail-closed with one
  delete process.env.RECAPTCHA_SECRET_KEY;
  assert(
    (await verifyRecaptcha(null)) === true,
    "No RECAPTCHA_SECRET_KEY configured -> verification skipped (feature off)",
  );
  process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";
  assert(
    (await verifyRecaptcha(null)) === false &&
      (await verifyRecaptcha("")) === false,
    "Secret configured + missing token -> rejected (fail closed)",
  );
  delete process.env.RECAPTCHA_SECRET_KEY;

  // 5i. Client IP extraction — rightmost x-forwarded-for hop wins, so
  // client-spoofed left entries can't rotate past rate limits / IP caps.
  const fakeReq = (fwd, socketIp) => ({
    headers: fwd === undefined ? {} : { "x-forwarded-for": fwd },
    socket: socketIp === undefined ? {} : { remoteAddress: socketIp },
  });
  assert(
    clientIpOf(fakeReq("1.2.3.4, 5.6.7.8", "10.0.0.1")) === "5.6.7.8",
    "Rightmost forwarded-for hop (proxy-appended) wins",
  );
  assert(
    clientIpOf(fakeReq("203.0.113.77, 99.99.99.99", "10.0.0.1")) === "99.99.99.99",
    "Spoofed left entry is ignored",
  );
  assert(
    clientIpOf(fakeReq("203.0.113.77", "10.0.0.1")) === "203.0.113.77",
    "Single hop is used as-is",
  );
  assert(
    clientIpOf(fakeReq(undefined, "10.0.0.1")) === "10.0.0.1" &&
      clientIpOf(fakeReq(undefined, undefined)) === "unknown",
    "Falls back to socket address, then 'unknown'",
  );

  // 5j. One-vote-per-IP cap resolution (env VOTE_IP_SESSION_MAX)
  delete process.env.VOTE_IP_SESSION_MAX;
  assert(resolveIpVoteCap(undefined) === 1, "Unset cap defaults to 1 per IP");
  assert(resolveIpVoteCap("") === 1, "Empty cap falls back to default 1");
  assert(resolveIpVoteCap("0") === 0, "Cap 0 disables the IP limit");
  assert(resolveIpVoteCap("3") === 3, "Cap value is read from config");
  assert(resolveIpVoteCap("abc") === 1, "Garbage cap falls back to default 1");
  assert(resolveIpVoteCap("-2") === 1, "Negative cap falls back to default 1");
  delete process.env.VOTE_IP_SESSION_MAX;
  assert(resolveIpVoteCap() === 1, "No env -> default cap of 1");
  process.env.VOTE_IP_SESSION_MAX = "5";
  assert(resolveIpVoteCap() === 5, "Env value is honored when no arg given");
  delete process.env.VOTE_IP_SESSION_MAX;

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
