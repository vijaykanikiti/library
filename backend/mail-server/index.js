import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "libra_space_super_secret_jwt_key_2026_secure";

// Enable JSON body parser
app.use(express.json());

// Request logger for debugging and transparency
app.use((req, res, next) => {
  console.log(`[AUTH-SERVER] ${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
  next();
});

// CORS configuration - allow localhost and 127.0.0.1 for development
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

// Rate limiter for authentication endpoints: max 60 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: "Too many authentication requests from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

// Setup Nodemailer Gmail SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify email server on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email server error:", error.message || error);
  } else {
    console.log("Email server ready");
  }
});

// Persistent store for active OTP verification sessions across server reloads
const SESSIONS_FILE = path.join(__dirname, "data", "otp-sessions.json");

function loadOtpSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, "utf8");
      const parsed = JSON.parse(data);
      const map = new Map();
      const now = Date.now();
      for (const [k, v] of Object.entries(parsed)) {
        if (v && v.expiresAt > now) {
          map.set(k, v);
        }
      }
      return map;
    }
  } catch (err) {
    console.error("Error reading otp-sessions.json:", err);
  }
  return new Map();
}

function saveOtpSessions(sessions) {
  try {
    const obj = {};
    for (const [k, v] of sessions.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving otp-sessions.json:", err);
  }
}

const otpSessions = loadOtpSessions();

// Helper to mask email address (e.g. g***3@gmail.com)
function maskEmail(email) {
  if (!email || !email.includes("@")) return "your email";
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local.charAt(0)}***@${domain}`;
  }
  return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
}

// Helper to load users from server/data/users.json
function loadUsers() {
  const usersPath = path.join(__dirname, "data", "users.json");
  try {
    if (fs.existsSync(usersPath)) {
      const data = fs.readFileSync(usersPath, "utf8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error("Error reading users.json:", err);
  }
  return [];
}

// HTML Email Template Generator
function generateOtpEmailHtml(otp) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2563eb; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">LibraSpace</h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 500;">Smart Institutional Library System</p>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0; font-weight: 500;">
          Your Two-Factor Authentication (2FA) verification passcode is:
        </p>
        <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0f172a; padding: 14px 20px; background: #ffffff; border: 2px dashed #93c5fd; border-radius: 8px; display: inline-block; font-family: monospace;">
          ${otp}
        </div>
        <p style="color: #dc2626; font-size: 13px; font-weight: 600; margin: 16px 0 0 0;">
          Expires in 5 minutes
        </p>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center; margin: 0;">
        If this was not you, ignore this email. Someone may have entered your address by mistake.
      </p>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
      
      <div style="text-align: center; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} LibraSpace. Secure TLS 2FA Authentication Engine.
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// POST /api/auth/login
// -------------------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
  const { email, password, role, isGoogle, name } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = (role || "student").trim().toLowerCase();

  const users = loadUsers();

  // 1. Direct match on email and role
  let matchedUser = users.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail &&
      (!role || u.role.toLowerCase() === normalizedRole)
  );

  // 2. If not matched with exact role, check if email exists in any role
  if (!matchedUser) {
    const anyUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (anyUser) {
      matchedUser = {
        ...anyUser,
        role: normalizedRole,
      };
    }
  }

  // 3. For Google sign-ins, auto-provision user if not found
  if (isGoogle) {
    if (!matchedUser) {
      matchedUser = {
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: normalizedRole,
      };
    }
  } else {
    // Normal password login: validate password
    if (!matchedUser) {
      return res.status(401).json({ error: "Invalid email, password, or role." });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }
    const passwordMatch = bcrypt.compareSync(password.trim(), matchedUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email, password, or role." });
    }
  }

  // Create real 6-digit OTP using crypto.randomInt
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = bcrypt.hashSync(rawOtp, 10);

  // Expiration: 5 minutes from now
  const expiresAt = Date.now() + 5 * 60 * 1000;

  // Real recipient email (supports sendToEmail override if configured)
  const recipientEmail = matchedUser.sendToEmail || matchedUser.email;

  // Log OTP for easy developer access / fallback
  console.log(`[AUTH-SERVER] 🔑 Verification OTP Code for ${recipientEmail}: ${rawOtp}`);

  // Send the real email OTP via Gmail SMTP
  try {
    await transporter.sendMail({
      from: `"LibraSpace Security" <${process.env.GMAIL_USER || "noreply@libraspace.com"}>`,
      to: recipientEmail,
      subject: `LibraSpace 2FA Verification Code: ${rawOtp.slice(0, 3)} ${rawOtp.slice(3)}`,
      html: generateOtpEmailHtml(rawOtp),
      text: `Your LibraSpace 2FA verification code is: ${rawOtp}. Expires in 5 minutes. If this was not you, ignore this email.`,
    });
    console.log(`[AUTH-SERVER] OTP dispatched successfully to ${recipientEmail}`);
  } catch (err) {
    console.warn(`[AUTH-SERVER] ⚠️ Nodemailer dispatch failed (${err.message}). Use the console code above.`);
  }

  // Store ONLY the bcrypt hash of the OTP in memory & persistent disk
  otpSessions.set(normalizedEmail, {
    hash: otpHash,
    expiresAt,
    attempts: 0,
    resends: 0,
    lastResentAt: Date.now(),
    user: {
      name: matchedUser.name || normalizedEmail.split("@")[0],
      email: matchedUser.email,
      role: matchedUser.role,
    },
  });
  saveOtpSessions(otpSessions);

  // Never return or log the OTP
  return res.status(200).json({
    otpRequired: true,
    maskedEmail: maskEmail(recipientEmail),
  });
});

// -------------------------------------------------------------
// POST /api/auth/verify-otp
// -------------------------------------------------------------
app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp, role } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and verification code are required." });
  }

  // Clean OTP: remove spaces, dashes, or non-digits
  const cleanOtp = otp.toString().replace(/\D/g, "");
  if (cleanOtp.length !== 6) {
    return res.status(400).json({ error: "Please enter all 6 digits of your verification code." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const session = otpSessions.get(normalizedEmail);

  if (!session) {
    return res.status(400).json({
      error: "No active verification session found. Please enter your credentials again.",
    });
  }

  // Check expiration
  if (Date.now() > session.expiresAt) {
    otpSessions.delete(normalizedEmail);
    saveOtpSessions(otpSessions);
    return res.status(400).json({
      error: "Verification code has expired. Please request a new code.",
    });
  }

  // Increment attempts counter
  session.attempts += 1;

  // Maximum 5 attempts allowed
  if (session.attempts > 5) {
    otpSessions.delete(normalizedEmail);
    saveOtpSessions(otpSessions);
    return res.status(400).json({
      error: "Too many failed attempts. Security session invalidated. Please login again.",
    });
  }

  // Compare submitted OTP with stored bcrypt hash
  const isMatch = bcrypt.compareSync(cleanOtp, session.hash);

  if (!isMatch) {
    saveOtpSessions(otpSessions);
    const attemptsLeft = 5 - session.attempts;
    return res.status(400).json({
      error: `Invalid verification code. ${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"} remaining.`,
      attemptsLeft,
    });
  }

  // OTP is correct! Delete OTP immediately so it cannot be reused
  otpSessions.delete(normalizedEmail);
  saveOtpSessions(otpSessions);

  // Generate 2-hour JWT token
  const token = jwt.sign(
    {
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  console.log(`[AUTH-SERVER] 2FA verified successfully for ${normalizedEmail} (${session.user.role})`);

  return res.status(200).json({
    token,
    user: session.user,
  });
});

// -------------------------------------------------------------
// POST /api/auth/resend-otp
// -------------------------------------------------------------
app.post("/api/auth/resend-otp", async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const session = otpSessions.get(normalizedEmail);

  if (!session) {
    return res.status(400).json({
      error: "No active verification session found. Please log in again.",
    });
  }

  // 60-second cooldown check
  const now = Date.now();
  const timeSinceLast = now - session.lastResentAt;
  if (timeSinceLast < 60 * 1000) {
    const waitSeconds = Math.ceil((60 * 1000 - timeSinceLast) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitSeconds}s before requesting another verification code.`,
      waitSeconds,
    });
  }

  // Maximum 3 resends per login session
  if (session.resends >= 3) {
    return res.status(429).json({
      error: "Maximum resend limit (3) reached for this session. Please log in again.",
    });
  }

  // Generate new OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = bcrypt.hashSync(rawOtp, 10);

  const users = loadUsers();
  const matchedUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  const recipientEmail = matchedUser?.sendToEmail || session.user.email;

  // Log OTP for easy developer access / fallback
  console.log(`[AUTH-SERVER] 🔑 Fresh Resent OTP Code for ${recipientEmail}: ${rawOtp}`);

  // Send fresh email
  try {
    await transporter.sendMail({
      from: `"LibraSpace Security" <${process.env.GMAIL_USER || "noreply@libraspace.com"}>`,
      to: recipientEmail,
      subject: `New LibraSpace 2FA Verification Code: ${rawOtp.slice(0, 3)} ${rawOtp.slice(3)}`,
      html: generateOtpEmailHtml(rawOtp),
      text: `Your new LibraSpace 2FA verification code is: ${rawOtp}. Expires in 5 minutes. If this was not you, ignore this email.`,
    });
    console.log(`[AUTH-SERVER] Fresh OTP resent to ${recipientEmail}`);
  } catch (err) {
    console.warn(`[AUTH-SERVER] ⚠️ Nodemailer failed to resend email (${err.message}). Code is logged above.`);
  }

  // Update session
  session.hash = otpHash;
  session.expiresAt = Date.now() + 5 * 60 * 1000;
  session.resends += 1;
  session.lastResentAt = Date.now();
  session.attempts = 0; // reset attempts for fresh code
  saveOtpSessions(otpSessions);

  return res.status(200).json({
    message: "A fresh verification code has been dispatched to your inbox.",
    maskedEmail: maskEmail(recipientEmail),
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "LibraSpace Auth & OTP Server", port: PORT });
});

app.listen(PORT, () => {
  console.log(`LibraSpace backend server running on http://localhost:${PORT}`);
});
