import {
  replacePlaceholders,
  generateAcceptanceEmailHtml,
  generateAcceptanceEmailText,
  sendAcceptanceEmail,
} from "../src/services/email.service.js";
import { getShortlistFilter } from "./send-acceptance-emails.js";
import Registration from "../src/models/Registration.js";

async function runTests() {
  console.log("==================================================");
  console.log("   AURA 2K26 — Acceptance Email System Tests      ");
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

  // 1. Placeholder replacement tests
  const sampleData = {
    teamName: "Quantum Leapers",
    participantName: "Zaid Khan",
    eventName: "AURA 2K26",
    websiteUrl: "https://aura2k26.com",
    registrationId: "AURA2K26-QL999",
    projectTitle: "Quantum Key Distribution Rover",
    rsvpUrl: "https://aura2k26.com/rsvp",
  };

  const textWithPlaceholders =
    "Hello {{participantName}}, team {{teamName}} is accepted for {{eventName}}! Visit {{websiteUrl}} or {{rsvpUrl}} (ID: {{registrationId}}, Project: {{projectTitle}}).";
  const replacedText = replacePlaceholders(textWithPlaceholders, sampleData);

  assert(
    replacedText.includes(
      "Hello Zaid Khan, team Quantum Leapers is accepted for AURA 2K26!",
    ),
    "Replaces {{participantName}}, {{teamName}}, {{eventName}}",
  );
  assert(
    replacedText.includes(
      "ID: AURA2K26-QL999, Project: Quantum Key Distribution Rover",
    ),
    "Replaces {{registrationId}} and {{projectTitle}}",
  );
  assert(
    replacedText.includes("https://aura2k26.com/rsvp"),
    "Replaces {{rsvpUrl}}",
  );

  // Single-brace placeholder compatibility
  const singleBraceText =
    "Team {teamName} leader {participantName} for {eventName}";
  const replacedSingle = replacePlaceholders(singleBraceText, sampleData);
  assert(
    replacedSingle === "Team Quantum Leapers leader Zaid Khan for AURA 2K26",
    "Supports single brace {placeholder} notation",
  );

  // 2. HTML email template generation
  const mockRegistration = {
    registrationId: "AURA2K26-TEST01",
    teamName: "RoboTitans",
    teamLeaderName: "Sana Parveen",
    teamLeaderEmail: "sana@example.com",
    projectTitle: "Smart Quadcopter",
    teamSize: 3,
    hardwareProjectCategories: ["Robotics", "Drone / Autonomous Systems"],
    teamAffiliation: "all_aliah",
    aliahMembers: 3,
    otherInstitutionMembers: 0,
    acceptanceEmailStatus: "pending",
  };

  const html = generateAcceptanceEmailHtml(mockRegistration, {
    eventName: "AURA 2K26",
    websiteUrl: "https://aura2k26.com",
  });

  assert(
    html.includes("Follow-Up") && html.includes("Official Acceptance"),
    "HTML includes Follow-Up & Official Acceptance header",
  );
  assert(
    html.includes("#6f2138"),
    "HTML includes website secondary red color (#6f2138)",
  );
  assert(
    html.includes("#ffffff"),
    "HTML includes clean white background (#ffffff)",
  );
  assert(html.includes("RoboTitans"), "HTML includes team name");
  assert(html.includes("Sana Parveen"), "HTML includes leader name");
  assert(html.includes("AURA2K26-TEST01"), "HTML includes registration ID");
  assert(
    !html.includes("Confirm Attendance & RSVP"),
    "HTML does not include RSVP confirmation button",
  );

  // 3. Custom body option in HTML & Text
  const customHtml = generateAcceptanceEmailHtml(mockRegistration, {
    customBody:
      "Please report to Hall 4 at 9:00 AM sharp with your power bank.",
  });
  assert(
    customHtml.includes(
      "Please report to Hall 4 at 9:00 AM sharp with your power bank.",
    ),
    "HTML includes custom organizer note",
  );

  const text = generateAcceptanceEmailText(mockRegistration, {
    customBody: "Special instructions for live demonstration.",
  });
  assert(
    text.includes("Special instructions for live demonstration."),
    "Text includes custom organizer note",
  );

  // 4. Duplicate send protection in sendAcceptanceEmail
  const alreadySentReg = {
    ...mockRegistration,
    acceptanceEmailStatus: "sent",
  };
  const skipResult = await sendAcceptanceEmail(alreadySentReg, {
    force: false,
  });
  assert(
    skipResult.success === true &&
      skipResult.skipped === true &&
      skipResult.reason === "ALREADY_SENT",
    "Skips teams that have already received acceptance emails by default",
  );

  // 5. Shortlist query filter structure
  const filter = getShortlistFilter();
  assert(
    Array.isArray(filter.$or) && filter.$or.length >= 4,
    "Shortlist filter covers multi-field statuses",
  );

  // 6. Registration Schema fields check
  const regInstance = new Registration({
    teamName: "Test Schema Team",
    teamSize: 2,
    hasWorkingPrototype: "fully_working",
    teamAffiliation: "all_aliah",
    teamLeaderName: "Leader Schema",
    teamLeaderEmail: "leader@schema.com",
    teamLeaderPhone: "9876543210",
    teamMemberDetails: "Leader Schema | Aliah\r\nMember Schema | Aliah",
    projectTitle: "Schema Tester",
    hardwareProjectCategories: ["Robotics"],
    prototypeType: "Robotic System",
    currentWorkingStatus: "Fully functional and ready for live demonstration",
    problemStatement: "Problem description",
    solutionDescription: "Solution description",
    innovationDescription: "Innovation description",
    intendedBeneficiaries: ["General Public"],
    workingPrinciple: "Principle description",
    majorHardwareComponents: ["Arduino"],
    useAi: false,
    useIot: false,
    powerSource: "battery",
    potentialImpact: "High",
    productPotential: "yes",
    prototypeDevelopmentCost: 1500,
    auraDemoHighlight: "Live demo highlight",
    safetyHazards: ["none"],
    safetyPrecautions: "None needed",
    requiresContinuousSupervision: false,
    prototypeDevelopedByTeam: "yes",
    previouslyExhibited: false,
    registrationFeeStatus: "no_fee",
    registrationFee: 0,
    workingPrototypeDeclaration: true,
    originalityDeclaration: true,
    safetyEventRulesAgreement: true,
    mediaPermission: true,
    finalConfirmation: true,
  });

  assert(
    regInstance.acceptanceEmailStatus === "pending",
    "Registration schema has acceptanceEmailStatus default 'pending'",
  );
  assert(
    regInstance.isShortlisted === false,
    "Registration schema has isShortlisted default false",
  );
  assert(
    regInstance.selectionStatus === "pending",
    "Registration schema has selectionStatus default 'pending'",
  );

  console.log("--------------------------------------------------");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
