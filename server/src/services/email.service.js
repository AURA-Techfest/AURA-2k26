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

export const generateRsvpOtpEmailHtml = (registration, otp) => {
  const regId = escapeHtml(registration?.registrationId || "N/A");
  const teamName = escapeHtml(registration?.teamName || "Team");
  const leaderName = escapeHtml(registration?.teamLeaderName || "Team Leader");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AURA 2K26 RSVP Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0a0a; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #171414; border: 1px solid #3d221e; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          <tr>
            <td style="background: linear-gradient(135deg, #2b1310 0%, #150908 100%); padding: 24px; border-bottom: 2px solid #5a2820; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #ffffff;">AURA 2K26</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1.5px; color: #a87268; text-transform: uppercase;">Team RSVP & Payment Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #dedede;">Hello <strong>${leaderName}</strong>,</p>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #aba19c;">
                We received a request to access the RSVP and Payment portal for your team <strong>${teamName}</strong> (ID: <code>${regId}</code>).
              </p>
              <div style="background-color: #211917; border: 2px dashed #8b3c2d; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #d5a23a; text-transform: uppercase; margin-bottom: 8px;">Your Verification Code</span>
                <span style="display: inline-block; font-family: 'Courier New', monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ffffff; background-color: #0f0a09; padding: 10px 24px; border-radius: 8px; border: 1px solid #4a221b;">${otp}</span>
                <span style="display: block; font-size: 12px; color: #8e8077; margin-top: 10px;">This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.</span>
              </div>
              <p style="margin: 20px 0 0 0; font-size: 12px; color: #887a71; line-height: 1.5;">
                If you did not request this verification code, please ignore this email or contact <a href="mailto:aura@aliah.ac.in" style="color: #c9715a; text-decoration: none;">aura@aliah.ac.in</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #110d0d; padding: 14px 20px; text-align: center; border-top: 1px solid #291a17; font-size: 11px; color: #6e6159;">
              AURA 2K26 &bull; Aliah University, Kolkata &bull; Research & Innovation Fest
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const sendRsvpOtpEmail = async (email, otp, registration) => {
  const recipientEmail = email || registration?.teamLeaderEmail;
  if (!recipientEmail) {
    return { success: false, reason: "MISSING_RECIPIENT_EMAIL" };
  }

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.warn(
      "[AURA Email] Email service not configured. OTP generated for dev:",
      otp,
    );
    return { success: true, simulated: true, otp };
  }

  const senderUser = process.env.EMAIL_USER.trim();
  const mailOptions = {
    from: `"AURA 2K26 | RSVP Verification" <${senderUser}>`,
    to: recipientEmail.trim().toLowerCase(),
    replyTo: "aura@aliah.ac.in",
    subject: `RSVP Verification Code: ${otp} [${registration?.teamName || "AURA 2K26"}]`,
    text: `Your AURA 2K26 RSVP verification code is: ${otp}. It expires in 10 minutes.`,
    html: generateRsvpOtpEmailHtml(registration, otp),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[AURA Email] RSVP OTP sent to ${recipientEmail} (MsgID: ${info.messageId})`,
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      `[AURA Email] Failed to send RSVP OTP to ${recipientEmail}:`,
      error.message,
    );
    return { success: false, error: error.message };
  }
};

export const generateRsvpConfirmationEmailHtml = (registration, rsvp) => {
  const regId = escapeHtml(registration?.registrationId || rsvp.registrationId);
  const teamName = escapeHtml(registration?.teamName || rsvp.teamName);
  const leaderName = escapeHtml(
    registration?.teamLeaderName || rsvp.teamLeaderName,
  );
  const category = escapeHtml(rsvp.teamCategory || "standard").toUpperCase();
  const amount = rsvp.amountPayable || 0;
  const isFree = amount === 0;
  const status =
    rsvp.paymentStatus === "not_required"
      ? "Confirmed (Free RSVP)"
      : "Submitted (Pending Verification)";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AURA 2K26 RSVP Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0a0a; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #171414; border: 1px solid #3d221e; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          <tr>
            <td style="background: linear-gradient(135deg, #1b2e1a 0%, #0d170d 100%); padding: 24px; border-bottom: 2px solid #2c4c28; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #a3e635;">RSVP CONFIRMATION</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1.5px; color: #86efac; text-transform: uppercase;">AURA 2K26 &bull; Aliah University</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #dedede;">Dear <strong>${leaderName}</strong>,</p>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #aba19c;">
                We have received the RSVP submission for your team <strong>${teamName}</strong>. Below are your details:
              </p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1f1a19; border: 1px solid #3d2822; border-radius: 8px; font-size: 13px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83; width: 40%;">Registration ID</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #ffffff; font-weight: bold; font-family: monospace;">${regId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83;">Team Category</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #ffffff;">${category} TEAM</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83;">RSVP / Payment Status</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: ${isFree ? "#4ade80" : "#facc15"}; font-weight: bold;">${status}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #9a8c83;">Total Amount</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #2f201c; color: #ffffff;">₹${amount}</td>
                </tr>
                ${
                  rsvp.paymentReferenceNumber
                    ? `
                <tr>
                  <td style="padding: 10px 14px; color: #9a8c83;">Payment Reference / UTR</td>
                  <td style="padding: 10px 14px; color: #ffffff; font-family: monospace;">${escapeHtml(rsvp.paymentReferenceNumber)}</td>
                </tr>
                `
                    : ""
                }
              </table>
              <div style="background-color: #1a1615; border-left: 3px solid #d5a23a; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #cfc5bd; line-height: 1.5;">
                ${
                  isFree
                    ? "Your team is fully confirmed for on-site participation at AURA 2K26. Please carry valid college ID cards for all team members."
                    : "Your payment proof is under verification by our finance desk. You will receive an update once verified. You can also view status anytime at /rsvp."
                }
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #110d0d; padding: 14px 20px; text-align: center; border-top: 1px solid #291a17; font-size: 11px; color: #6e6159;">
              Aliah University, Newtown Campus &bull; aura@aliah.ac.in
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const sendRsvpConfirmationEmail = async (registration, rsvp) => {
  const recipientEmail = rsvp.teamLeaderEmail || registration?.teamLeaderEmail;
  if (!recipientEmail) {
    return { success: false, reason: "MISSING_RECIPIENT_EMAIL" };
  }

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.warn(
      "[AURA Email] Email service not configured. RSVP email skipped.",
    );
    return { success: true, simulated: true };
  }

  const senderUser = process.env.EMAIL_USER.trim();
  const mailOptions = {
    from: `"AURA 2K26 | Desk" <${senderUser}>`,
    to: recipientEmail.trim().toLowerCase(),
    replyTo: "aura@aliah.ac.in",
    subject: `RSVP Confirmed: ${rsvp.teamName} [${rsvp.registrationId}]`,
    text: `RSVP confirmed for team ${rsvp.teamName} (${rsvp.registrationId}). Total Amount: ₹${rsvp.amountPayable}. Status: ${rsvp.paymentStatus}.`,
    html: generateRsvpConfirmationEmailHtml(registration, rsvp),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[AURA Email] RSVP confirmation sent to ${recipientEmail} (MsgID: ${info.messageId})`,
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      `[AURA Email] Failed to send RSVP confirmation to ${recipientEmail}:`,
      error.message,
    );
    return { success: false, error: error.message };
  }
};

/**
 * Dynamic template placeholder replacement helper.
 * Replaces both {{key}} and {key} tokens.
 */
export const replacePlaceholders = (template, data = {}) => {
  if (!template || typeof template !== "string") return "";

  const replacements = {
    teamName: data.teamName || "",
    participantName:
      data.participantName || data.teamLeaderName || "Participant",
    teamLeaderName:
      data.teamLeaderName || data.participantName || "Team Leader",
    eventName: data.eventName || "AURA 2K26",
    websiteUrl:
      data.websiteUrl ||
      process.env.FRONTEND_URL ||
      "https://aura2k26.com",
    registrationId: data.registrationId || "PENDING",
    projectTitle: data.projectTitle || "N/A",
    rsvpUrl:
      data.rsvpUrl ||
      `${(data.websiteUrl || process.env.FRONTEND_URL || "https://aura2k26.com").replace(/\/+$/, "")}/rsvp`,
  };

  let result = template;
  for (const [key, val] of Object.entries(replacements)) {
    const doubleRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    const singleRegex = new RegExp(`\\{\\s*${key}\\s*\\}`, "gi");
    result = result.replace(doubleRegex, val).replace(singleRegex, val);
  }

  return result;
};

/**
 * Generate HTML for Acceptance / Shortlist Notification Email.
 */
export const generateAcceptanceEmailHtml = (registration, options = {}) => {
  const eventName = options.eventName || "AURA 2K26";
  const websiteUrl = (
    options.websiteUrl ||
    process.env.FRONTEND_URL ||
    "https://aura2k26.com"
  ).replace(/\/+$/, "");

  const rawData = {
    teamName: registration?.teamName || "Team",
    participantName: registration?.teamLeaderName || "Participant",
    teamLeaderName: registration?.teamLeaderName || "Team Leader",
    eventName,
    websiteUrl,
    registrationId: registration?.registrationId || "PENDING",
    projectTitle: registration?.projectTitle || "Hardware Innovation",
  };

  const regId = escapeHtml(rawData.registrationId);
  const teamLeaderName = escapeHtml(rawData.participantName);
  const teamName = escapeHtml(rawData.teamName);
  const projectTitle = escapeHtml(rawData.projectTitle);

  // Custom body or follow-up note
  let customBodyHtml = "";
  if (options.customBody && options.customBody.trim()) {
    const processedBody = replacePlaceholders(
      options.customBody.trim(),
      rawData,
    );
    const paragraphs = processedBody
      .split(/\r?\n\r?\n/)
      .map(
        (p) =>
          `<p style="margin: 0 0 10px 0; font-size: 13.5px; color: #334155; line-height: 1.55;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`,
      )
      .join("");
    customBodyHtml = `
      <div style="background-color: #fdf2f4; border-left: 3px solid #6f2138; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
        ${paragraphs}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventName} — Official Acceptance (Follow-Up)</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container (Pure White Card with #6f2138 Accent) -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #6f2138; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 28px 16px 28px; text-align: left; border-bottom: 1px solid #f1f5f9;">
              <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: #6f2138; text-transform: uppercase; background-color: #fdf2f4; padding: 4px 10px; border-radius: 6px; border: 1px solid #fad2db;">
                Follow-Up &bull; Official Acceptance
              </span>
              <h1 style="margin: 10px 0 2px 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a;">
                ${eventName}
              </h1>
              <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">
                Aliah University Techfest &bull; Research & Innovation
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 22px 28px;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a; line-height: 1.5;">
                Hello <strong style="color: #6f2138;">${teamLeaderName}</strong>,
              </p>
              <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #334155; line-height: 1.6;">
                This is a follow-up transmission regarding your hackathon registration. We previously dispatched acceptance emails to all shortlisted teams, but as some participants reported deliverability or spam filter issues, we are sending this direct confirmation.
              </p>
              <p style="margin: 0 0 14px 0; font-size: 13.5px; color: #334155; line-height: 1.6;">
                We are pleased to re-confirm that your team <strong style="color: #0f172a;">${teamName}</strong> has been <strong>OFFICIALLY SHORTLISTED & ACCEPTED</strong> for the live hardware demonstration and evaluation round at <strong>${eventName}</strong>!
              </p>

              <!-- Compact Details Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin: 16px 0; font-size: 13px;">
                <tr>
                  <td style="padding: 9px 14px; border-bottom: 1px solid #edf2f7; color: #64748b; width: 36%; font-weight: 600;">Registration ID</td>
                  <td style="padding: 9px 14px; border-bottom: 1px solid #edf2f7; color: #6f2138; font-family: monospace; font-weight: 800; font-size: 14px;">${regId}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 14px; border-bottom: 1px solid #edf2f7; color: #64748b; font-weight: 600;">Team Name</td>
                  <td style="padding: 9px 14px; border-bottom: 1px solid #edf2f7; color: #0f172a; font-weight: 700;">${teamName}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 14px; color: #64748b; font-weight: 600;">Project Title</td>
                  <td style="padding: 9px 14px; color: #0f172a;">${projectTitle}</td>
                </tr>
              </table>

              ${customBodyHtml}

              <!-- Key Reminders (Frontend Red Accent #6f2138) -->
              <div style="background-color: #fdf2f4; border-left: 3px solid #6f2138; padding: 12px 14px; border-radius: 6px; margin-top: 18px; font-size: 12.5px; color: #4a1523; line-height: 1.55;">
                <strong>Key Participation Reminders:</strong>
                <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                  <li>Bring your functional hardware prototype and all necessary accessories/cables.</li>
                  <li>Every team member must carry a physical college ID card for security check-in.</li>
                  <li>Venue: Aliah University, Newtown Campus, IIA/27, Action Area II, Newtown, Kolkata 700160.</li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #ffffff; padding: 16px 28px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11.5px; color: #94a3b8;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">
                Team ${eventName} &bull; Aliah University
              </p>
              <p style="margin: 0;">
                Questions or issues? Contact us directly at <a href="mailto:aura@aliah.ac.in" style="color: #6f2138; text-decoration: none; font-weight: 600;">aura@aliah.ac.in</a>.
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

/**
 * Generate plain-text version for Acceptance Follow-Up Email.
 */
export const generateAcceptanceEmailText = (registration, options = {}) => {
  const eventName = options.eventName || "AURA 2K26";
  const websiteUrl = (
    options.websiteUrl ||
    process.env.FRONTEND_URL ||
    "https://aura2k26.com"
  ).replace(/\/+$/, "");

  const rawData = {
    teamName: registration?.teamName || "Team",
    participantName: registration?.teamLeaderName || "Participant",
    teamLeaderName: registration?.teamLeaderName || "Team Leader",
    eventName,
    websiteUrl,
    registrationId: registration?.registrationId || "PENDING",
    projectTitle: registration?.projectTitle || "Hardware Innovation",
  };

  const customBody = options.customBody
    ? replacePlaceholders(options.customBody.trim(), rawData)
    : "";

  return `
========================================================================
     ${eventName} — OFFICIAL ACCEPTANCE NOTIFICATION (FOLLOW-UP)
========================================================================

Hello ${rawData.participantName},

This is a follow-up transmission regarding your hackathon registration.
We previously dispatched acceptance emails to all shortlisted teams, but
as some participants reported deliverability or spam filter issues, we are
re-issuing this direct confirmation.

We are delighted to re-confirm that your team "${rawData.teamName}"
(Registration ID: ${rawData.registrationId}) has been OFFICIALLY SHORTLISTED &
ACCEPTED for the live hardware demonstration and evaluation round at ${eventName}!

${customBody ? `NOTE FROM ORGANIZERS:\n${customBody}\n\n` : ""}SHORTLIST SUMMARY:
- Registration ID: ${rawData.registrationId}
- Team Name:       ${rawData.teamName}
- Team Leader:     ${rawData.participantName}
- Project Title:   ${rawData.projectTitle}

KEY REMINDERS:
1. Bring your functional hardware prototype and all necessary cables/supplies.
2. Every team member must present a valid physical college ID card at check-in.
3. Venue: Aliah University, Newtown Campus, IIA/27, Action Area II, Newtown, Kolkata 700160.

Support & Inquiries: aura@aliah.ac.in
Website: ${websiteUrl}

— Team ${eventName} | Aliah University
  `.trim();
};

/**
 * Send personalized Acceptance Follow-Up Email to a team registration.
 */
export const sendAcceptanceEmail = async (registration, options = {}) => {
  if (!registration) {
    return { success: false, reason: "NO_REGISTRATION_DATA" };
  }

  const force = Boolean(options && options.force);
  if (registration.acceptanceEmailStatus === "sent" && !force) {
    return { success: true, reason: "ALREADY_SENT", skipped: true };
  }

  const recipientEmail = registration.teamLeaderEmail;
  if (!recipientEmail || !recipientEmail.includes("@")) {
    return { success: false, reason: "INVALID_OR_MISSING_EMAIL" };
  }

  const transporter = getEmailTransporter();
  if (!transporter) {
    return { success: false, reason: "CREDENTIALS_NOT_CONFIGURED" };
  }

  const senderUser = process.env.EMAIL_USER.trim();
  const eventName = options.eventName || "AURA 2K26";
  const websiteUrl = (
    options.websiteUrl ||
    process.env.FRONTEND_URL ||
    "https://aura2k26.com"
  ).replace(/\/+$/, "");

  const placeholderData = {
    teamName: registration.teamName || "Team",
    participantName: registration.teamLeaderName || "Participant",
    teamLeaderName: registration.teamLeaderName || "Team Leader",
    eventName,
    websiteUrl,
    registrationId: registration.registrationId || "PENDING",
    projectTitle: registration.projectTitle || "Hardware Innovation",
  };

  const defaultSubject = `Follow-Up: Project Acceptance — Team ${placeholderData.teamName} [${placeholderData.registrationId}]`;
  const subject = options.subject
    ? replacePlaceholders(options.subject, placeholderData)
    : defaultSubject;

  const mailOptions = {
    from: `"${eventName} | Selection Committee" <${senderUser}>`,
    to: recipientEmail.trim().toLowerCase(),
    replyTo: "aura@aliah.ac.in",
    subject,
    text: generateAcceptanceEmailText(registration, {
      ...options,
      eventName,
      websiteUrl,
    }),
    html: generateAcceptanceEmailHtml(registration, {
      ...options,
      eventName,
      websiteUrl,
    }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  sendRegistrationConfirmation,
  sendRsvpOtpEmail,
  sendRsvpConfirmationEmail,
  sendAcceptanceEmail,
  generateAcceptanceEmailHtml,
  generateAcceptanceEmailText,
  replacePlaceholders,
  verifyEmailConfig,
  sendTestEmail,
  generateRegistrationEmailHtml,
  generateRegistrationEmailText,
};
