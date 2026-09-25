# AURA 2K26 — Aliah University Techfest

Official full-stack web platform for **AURA 2K26** (Aliah University's Research Aspirations), the flagship hardware innovation techfest of Aliah University, Kolkata.

---

## 📧 Email Automation System (Nodemailer + Gmail SMTP)

The backend includes automated registration confirmation emails powered by **Nodemailer** and **Gmail SMTP**, requiring zero paid email third-party services.

### How It Works

```text
User Submits Registration Form
           ↓
Backend Validates Input & Files
           ↓
Saves Registration to MongoDB
           ↓
Generates Unique Human-Friendly ID (AURA2K26-XXXXXX)
           ↓
Sends Confirmation Email to Team Leader
           ↓
Updates Email Status (sent / failed) in DB
           ↓
Returns Successful Registration Response to Client
```

> **Reliability Guarantee**: If an email cannot be delivered (e.g. SMTP downtime or missing credentials), the registration is **never** deleted. The database records `emailStatus: "failed"` and the API returns a success response with the generated `registrationId`.

---

## ⚙️ Environment Variables Setup

Add the following variables to your `server/.env` file:

```env
# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=your_mongodb_connection_string

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Automation (Gmail SMTP)
EMAIL_USER=your-aura-email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

> ⚠️ **Important Security Rules:**
> - Never commit your `.env` file to Git.
> - Never use your personal Google account password for `EMAIL_PASS`. Always generate a dedicated **Google App Password**.
> - Do not prefix email environment variables with `VITE_`.

---

## 🔑 How to Generate a Google App Password

1. Log into your Google Account (preferably a dedicated account for AURA like `auratechfest@gmail.com`).
2. Go to **Google Account Settings** → **Security**: [https://myaccount.google.com/security](https://myaccount.google.com/security)
3. Ensure **2-Step Verification** is turned **ON**.
4. In the search bar at the top of Google Account settings, search for **App Passwords** (or visit [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
5. Enter an app name (e.g., `AURA 2K26 Backend`).
6. Click **Create**.
7. Google will display a **16-character password** (e.g., `abcd efgh ijkl mnop`).
8. Copy this 16-character code (without spaces) and paste it as `EMAIL_PASS` in your `server/.env`.

---

## 🚀 Render Deployment Instructions

When deploying the backend service on Render:

1. Open your [Render Dashboard](https://dashboard.render.com).
2. Select your **AURA 2K26 Backend** service.
3. Navigate to **Environment** in the left sidebar.
4. Click **Add Environment Variable**:
   - Key: `EMAIL_USER` | Value: `your-aura-email@gmail.com`
   - Key: `EMAIL_PASS` | Value: `your_16_character_app_password`
5. Click **Save Changes**.
6. Render will automatically redeploy the service with email automation active.

---

## 🧪 Testing Email Automation

### Standalone CLI Diagnostic Test
You can test your Gmail SMTP connection and email delivery without creating dummy data in your database:

```bash
# In the server directory
pnpm run test:email [optional-recipient@example.com]
```

Or using Node:
```bash
node scripts/test-email.js recipient@example.com
```

### What the Test Verifies:
1. Validates presence of `EMAIL_USER` and `EMAIL_PASS` in `.env`.
2. Tests SMTP handshake with Google's mail servers.
3. Dispatches a branded test email matching the AURA 2K26 template.

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Invalid login: 535-5.7.8 Username and Password not accepted` | Using standard password instead of App Password or 2FA disabled. | Turn on 2-Step Verification on Google and generate a new 16-character App Password. |
| `EMAIL_USER or EMAIL_PASS not set` warning | Environment variables missing from `.env` or Render. | Add `EMAIL_USER` and `EMAIL_PASS` to `server/.env` locally or Render dashboard in production. |
| Registration succeeds but email is not received | Email went to Spam / Promotions folder or invalid email provided. | Check Spam folder, verify recipient address, and check server logs. |
| Emails send locally but fail on Render | Environment variables not configured in Render. | Go to Render → Environment → Add `EMAIL_USER` and `EMAIL_PASS` → Redeploy. |

---

## 💻 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, TanStack Query, Lucide Icons
- **Backend**: Node.js, Express 5, MongoDB (Mongoose), Cloudinary, Multer
- **Email Service**: Nodemailer (Gmail SMTP)
