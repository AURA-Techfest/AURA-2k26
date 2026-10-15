import nodemailer from "nodemailer";

export const escapeHtml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const getEmailTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user.trim(),
      pass: pass.replace(/\s+/g, ""),
    },
  });
};

export const verifyEmailConfig = async () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return {
      configured: false,
      message: "EMAIL_USER or EMAIL_PASS environment variables are missing.",
    };
  }

  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    return {
      configured: true,
      message: `SMTP connection established successfully with ${user}`,
    };
  } catch (error) {
    return {
      configured: true,
      connectionFailed: true,
      message: `SMTP verification failed: ${error.message}`,
    };
  }
};

const formatAffiliation = (affiliation, aliahCount, otherCount) => {
  if (affiliation === "all_aliah") return "All Aliah University";
  if (affiliation === "all_other") return "All External Institutions";
  if (affiliation === "mixed") {
    return `Mixed Team (Aliah: ${aliahCount || 0}, External: ${otherCount || 0})`;
  }
  return affiliation || "N/A";
};

export const generateRegistrationEmailHtml = (registration) => {
  const regId = escapeHtml(registration.registrationId || "PENDING");
  const teamLeaderName = escapeHtml(
    registration.teamLeaderName || "Participant",
  );
  const teamName = escapeHtml(registration.teamName || "N/A");
  const projectTitle = escapeHtml(registration.projectTitle || "N/A");
  const teamSize = escapeHtml(registration.teamSize || "N/A");
  const prototypeType = escapeHtml(registration.prototypeType || "N/A");
  const currentStatus = escapeHtml(registration.currentWorkingStatus || "N/A");
  const categories = Array.isArray(registration.hardwareProjectCategories)
    ? registration.hardwareProjectCategories.map(escapeHtml).join(", ")
    : escapeHtml(registration.hardwareProjectCategories || "N/A");
  const affiliation = escapeHtml(
    formatAffiliation(
      registration.teamAffiliation,
      registration.aliahMembers,
      registration.otherInstitutionMembers,
    ),
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AURA 2K26 Registration Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0a0a; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #171414; border: 1px solid #3d221e; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          
          <!-- Brand Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #6f2138 0%, #2a110a 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #a85f45;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; letter-spacing: 3px; color: #d5a23a; text-transform: uppercase;">
                      Aliah University Techfest
                    </p>
                    <h1 style="margin: 0; font-size: 34px; font-weight: 900; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">
                      AURA 2K26
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #e8ded5; letter-spacing: 1px;">
                      Aliah University's Research Aspirations
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Success Alert Badge -->
          <tr>
            <td style="padding: 28px 24px 10px 24px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(95, 166, 167, 0.12); border-left: 4px solid #5fa6a7; border-radius: 6px; padding: 14px 16px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #9ad6d1; text-transform: uppercase; letter-spacing: 1px;">
                      ✓ Registration Confirmed
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #e8ded5; line-height: 1.5;">
                      Your submission for the AURA 2K26 Hardware Techfest has been recorded.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Personalized Greeting -->
          <tr>
            <td style="padding: 16px 24px 0 24px;">
              <p style="margin: 0 0 12px 0; font-size: 16px; color: #ffffff; line-height: 1.6;">
                Hey <strong style="color: #d5a23a;">${teamLeaderName}</strong>,
              </p>
              <p style="margin: 0; font-size: 14px; color: #cfc5bd; line-height: 1.6;">
                Thank you for registering team <strong style="color: #ffffff;">${teamName}</strong> for <strong style="color: #ffffff;">AURA 2K26</strong>. Your project <strong style="color: #ffffff;">"${projectTitle}"</strong> has been successfully registered in our database.
              </p>
            </td>
          </tr>

          <!-- Prominent Registration ID Card -->
          <tr>
            <td style="padding: 20px 24px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #221a18; border: 2px dashed #a85f45; border-radius: 12px; padding: 18px; text-align: center;">
                <tr>
                  <td align="center">
                    <span style="display: block; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #d5a23a; text-transform: uppercase; margin-bottom: 6px;">
                      Your Unique Registration ID
                    </span>
                    <span style="display: inline-block; font-family: 'Courier New', Courier, monospace, monospace; font-size: 24px; font-weight: 900; letter-spacing: 3px; color: #ffffff; background-color: #120e0d; padding: 8px 18px; border-radius: 6px; border: 1px solid #5a3329;">
                      ${regId}
                    </span>
                    <span style="display: block; font-size: 12px; color: #9a8c83; margin-top: 8px;">
                      Please save this ID. It is required for verification and on-site check-in.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Registration Summary Table -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #d5a23a; text-transform: uppercase; letter-spacing: 1.5px;">
                Registration Summary
              </h2>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1f1a19; border: 1px solid #3d2822; border-radius: 8px; font-size: 13px;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83; width: 38%;">Team Name</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #ffffff; font-weight: 600;">${teamName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83;">Team Size</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #ffffff;">${teamSize} Member(s)</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83;">Affiliation</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #ffffff;">${affiliation}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83;">Project Title</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #ffffff; font-weight: 600;">${projectTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83;">Categories</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #ffffff;">${categories}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83;">Prototype Type</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #ffffff;">${prototypeType}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #9a8c83;">Working Status</td>
                  <td style="padding: 10px 14px; color: #ffffff;">${currentStatus}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Event Details & Next Steps -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #d5a23a; text-transform: uppercase; letter-spacing: 1.5px;">
                Event & Venue Information
              </h2>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1f1a19; border: 1px solid #3d2822; border-radius: 8px; padding: 14px; font-size: 13px; color: #cfc5bd; line-height: 1.6;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0;">
                      <strong style="color: #ffffff;">📍 Venue [In-Person]:</strong><br>
                      Aliah University, Newtown Campus<br>
                      IIA/27, Action Area II, Newtown, Kolkata, West Bengal 700160
                    </p>
                    <p style="margin: 0 0 8px 0;">
                      <strong style="color: #ffffff;">📌 Important Guidelines:</strong><br>
                      • All team members must carry their original College ID Card.<br>
                      • Ensure your hardware prototype complies with event safety regulations.<br>
                      • Keep this registration confirmation email and Registration ID ready during on-desk verification.
                    </p>
                    <p style="margin: 0;">
                      <strong style="color: #ffffff;">✉ Support & Inquiries:</strong><br>
                      <a href="mailto:aura@aliah.ac.in" style="color: #5fa6a7; text-decoration: none;">aura@aliah.ac.in</a> | 
                      <a href="mailto:aura.technical@aliah.ac.in" style="color: #5fa6a7; text-decoration: none;">aura.technical@aliah.ac.in</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #110e0e; padding: 24px; text-align: center; border-top: 1px solid #2a1a17;">
              <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #ffffff;">
                See you at AURA 2K26! 🚀
              </p>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #9a8c83;">
                — Team AURA 2K26 | Aliah University Research Aspirations
              </p>
              <p style="margin: 0; font-size: 11px; color: #6e625a; line-height: 1.4;">
                This is an automated confirmation email sent upon registration completion.<br>
                Please do not reply directly to this automated address.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const generateRegistrationEmailText = (registration) => {
  const regId = registration.registrationId || "PENDING";
  const teamLeaderName = registration.teamLeaderName || "Participant";
  const teamName = registration.teamName || "N/A";
  const projectTitle = registration.projectTitle || "N/A";
  const teamSize = registration.teamSize || "N/A";
  const prototypeType = registration.prototypeType || "N/A";
  const currentStatus = registration.currentWorkingStatus || "N/A";
  const categories = Array.isArray(registration.hardwareProjectCategories)
    ? registration.hardwareProjectCategories.join(", ")
    : registration.hardwareProjectCategories || "N/A";
  const affiliation = formatAffiliation(
    registration.teamAffiliation,
    registration.aliahMembers,
    registration.otherInstitutionMembers,
  );

  return `
========================================
AURA 2K26 — REGISTRATION CONFIRMATION
Aliah University's Research Aspirations
========================================

Hey ${teamLeaderName},

Your registration for AURA 2K26 has been successfully completed!

----------------------------------------
YOUR REGISTRATION ID: ${regId}
----------------------------------------
(Please keep this ID safe for event verification and check-in)

REGISTRATION SUMMARY:
- Team Name: ${teamName}
- Team Size: ${teamSize} Member(s)
- Affiliation: ${affiliation}
- Project Title: ${projectTitle}
- Categories: ${categories}
- Prototype Type: ${prototypeType}
- Working Status: ${currentStatus}

EVENT INFORMATION:
- Venue: Aliah University, Newtown Campus, IIA/27, Action Area II, Newtown, Kolkata 700160
- Contact: aura@aliah.ac.in / aura.technical@aliah.ac.in

IMPORTANT GUIDELINES:
- All team members must carry their valid College ID Cards.
- Bring your hardware prototype and ensure all necessary setup precautions are taken.

See you at AURA 2K26! 🚀
— Team AURA 2K26 | Aliah University
  `.trim();
};

/**
 * Sends registration confirmation email to the team leader.
 * Safely handles missing credentials, duplicate checks, and SMTP errors.
 *
 * @param {Object} registration - Mongoose document or plain object of registration
 * @returns {Promise<{ success: boolean, messageId?: string, reason?: string, error?: string }>}
 */
export const sendRegistrationConfirmation = async (
  registration,
  options = {},
) => {
  if (!registration) {
    return { success: false, reason: "NO_REGISTRATION_DATA" };
  }

  const force = Boolean(options && options.force);

  if (registration.emailStatus === "sent" && !force) {
    console.log(
      `[AURA Email] Email already sent for registration ID: ${registration.registrationId || registration._id}. Skipping duplicate send.`,
    );
    return { success: true, reason: "ALREADY_SENT", skipped: true };
  }

  const recipientEmail = registration.teamLeaderEmail;
  if (!recipientEmail) {
    console.warn("[AURA Email] Registration is missing teamLeaderEmail.");
    return { success: false, reason: "MISSING_RECIPIENT_EMAIL" };
  }

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.warn(
      "[AURA Email] EMAIL_USER or EMAIL_PASS is not configured in environment variables. Registration email skipped.",
    );
    return { success: false, reason: "CREDENTIALS_NOT_CONFIGURED" };
  }

  const senderUser = process.env.EMAIL_USER.trim();
  const mailOptions = {
    from: `"AURA 2K26 | Aliah University" <${senderUser}>`,
    to: recipientEmail.trim().toLowerCase(),
    replyTo: "aura@aliah.ac.in",
    subject: `Registration Confirmed: ${registration.teamName} [${registration.registrationId || "AURA 2K26"}]`,
    text: generateRegistrationEmailText(registration),
    html: generateRegistrationEmailHtml(registration),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[AURA Email] Registration confirmation sent successfully to ${recipientEmail} (MsgID: ${info.messageId})`,
    );
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(
      `[AURA Email] Failed to send registration confirmation email to ${recipientEmail}:`,
      error.message,
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

export const dummyRegistration = {
  registrationId: "AURA2K26-TEST01",
  teamLeaderName: "Test Participant",
  teamName: "Team Alpha",
  projectTitle: "Smart Autonomous Rover",
  teamSize: 4,
  prototypeType: "Working Prototype",
  currentWorkingStatus: "Ready / Operational",
  hardwareProjectCategories: ["Robotics", "IoT"],
  teamAffiliation: "all_aliah",
  aliahMembers: 4,
  otherInstitutionMembers: 0,
  teamLeaderEmail: "test@example.com",
};

export const sendTestEmail = async (targetEmail) => {
  const recipient = targetEmail || process.env.EMAIL_USER;
  if (!recipient) {
    throw new Error("No recipient email provided for test email.");
  }

  const transporter = getEmailTransporter();
  if (!transporter) {
    throw new Error(
      "EMAIL_USER or EMAIL_PASS is missing in environment variables.",
    );
  }

  const senderUser = process.env.EMAIL_USER.trim();
  const mailOptions = {
    from: `"AURA 2K26 Test" <${senderUser}>`,
    to: recipient,
    subject: "[Test] AURA 2K26 Email Automation Test",
    text: generateRegistrationEmailText(dummyRegistration),
    html: generateRegistrationEmailHtml(dummyRegistration),
  };

  return await transporter.sendMail(mailOptions);
};

export default {
  sendRegistrationConfirmation,
  verifyEmailConfig,
  sendTestEmail,
  generateRegistrationEmailHtml,
  generateRegistrationEmailText,
};
