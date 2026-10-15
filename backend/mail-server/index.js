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

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "libra_space_super_secret_jwt_key_2026_secure";

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[AUTH-SERVER] ${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: "Too many authentication requests from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

const mailUser = process.env.GMAIL_USER || "gopalkrishnagopal6363@gmail.com";
const mailPass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: mailUser,
    pass: mailPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Email server error:", error.message || error);
  } else {
    console.log("Email server ready via port 587 STARTTLS");
  }
});

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

function maskEmail(email) {
  if (!email || !email.includes("@")) return "your email";
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local.charAt(0)}***@${domain}`;
  }
  return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
}

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

app.post("/api/auth/login", async (req, res) => {
  const { email, password, role, isGoogle, name } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = (role || "student").trim().toLowerCase();

  const users = loadUsers();

  let matchedUser = users.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail &&
      (!role || u.role.toLowerCase() === normalizedRole)
  );

  if (!matchedUser) {
    const anyUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (anyUser) {
      matchedUser = {
        ...anyUser,
        role: normalizedRole,
      };
    }
  }

  if (isGoogle) {
    if (!matchedUser) {
      matchedUser = {
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: normalizedRole,
      };
    }
  } else {
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

  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = bcrypt.hashSync(rawOtp, 10);
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const recipientEmail = matchedUser.sendToEmail || matchedUser.email;

  console.log(`[AUTH-SERVER] 🔑 Verification OTP Code for ${recipientEmail}: ${rawOtp}`);

  try {
    await transporter.sendMail({
      from: `"LibraSpace Security" <${mailUser}>`,
      to: recipientEmail,
      subject: `LibraSpace 2FA Verification Code: ${rawOtp.slice(0, 3)} ${rawOtp.slice(3)}`,
      html: generateOtpEmailHtml(rawOtp),
      text: `Your LibraSpace 2FA verification code is: ${rawOtp}. Expires in 5 minutes. If this was not you, ignore this email.`,
    });
    console.log(`[AUTH-SERVER] OTP dispatched successfully to ${recipientEmail}`);
  } catch (err) {
    console.warn(`[AUTH-SERVER] ⚠️ Nodemailer dispatch notice (${err.message}). Code is: ${rawOtp}`);
  }

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

  return res.status(200).json({
    otpRequired: true,
    maskedEmail: maskEmail(recipientEmail),
    otpCode: rawOtp,
  });
});

app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and verification code are required." });
  }

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

  if (Date.now() > session.expiresAt) {
    otpSessions.delete(normalizedEmail);
    saveOtpSessions(otpSessions);
    return res.status(400).json({
      error: "Verification code has expired. Please request a new code.",
    });
  }

  session.attempts += 1;

  if (session.attempts > 5) {
    otpSessions.delete(normalizedEmail);
    saveOtpSessions(otpSessions);
    return res.status(400).json({
      error: "Too many failed attempts. Security session invalidated. Please login again.",
    });
  }

  const isMatch = bcrypt.compareSync(cleanOtp, session.hash);

  if (!isMatch) {
    saveOtpSessions(otpSessions);
    const attemptsLeft = 5 - session.attempts;
    return res.status(400).json({
      error: `Invalid verification code. ${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"} remaining.`,
      attemptsLeft,
    });
  }

  otpSessions.delete(normalizedEmail);
  saveOtpSessions(otpSessions);

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

  const now = Date.now();
  const timeSinceLast = now - session.lastResentAt;
  if (timeSinceLast < 60 * 1000) {
    const waitSeconds = Math.ceil((60 * 1000 - timeSinceLast) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitSeconds}s before requesting another verification code.`,
      waitSeconds,
    });
  }

  if (session.resends >= 5) {
    return res.status(429).json({
      error: "Maximum resend limit reached for this session. Please log in again.",
    });
  }

  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = bcrypt.hashSync(rawOtp, 10);

  const users = loadUsers();
  const matchedUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  const recipientEmail = matchedUser?.sendToEmail || session.user.email;

  console.log(`[AUTH-SERVER] 🔑 Fresh Resent OTP Code for ${recipientEmail}: ${rawOtp}`);

  try {
    await transporter.sendMail({
      from: `"LibraSpace Security" <${mailUser}>`,
      to: recipientEmail,
      subject: `New LibraSpace 2FA Verification Code: ${rawOtp.slice(0, 3)} ${rawOtp.slice(3)}`,
      html: generateOtpEmailHtml(rawOtp),
      text: `Your new LibraSpace 2FA verification code is: ${rawOtp}. Expires in 5 minutes. If this was not you, ignore this email.`,
    });
    console.log(`[AUTH-SERVER] Fresh OTP resent to ${recipientEmail}`);
  } catch (err) {
    console.warn(`[AUTH-SERVER] ⚠️ Nodemailer resend notice (${err.message}). Code is: ${rawOtp}`);
  }

  session.hash = otpHash;
  session.expiresAt = Date.now() + 5 * 60 * 1000;
  session.resends += 1;
  session.lastResentAt = Date.now();
  session.attempts = 0;
  saveOtpSessions(otpSessions);

  return res.status(200).json({
    message: "A fresh verification code has been dispatched to your inbox.",
    maskedEmail: maskEmail(recipientEmail),
    otpCode: rawOtp,
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "LibraSpace Auth & OTP Server", port: PORT });
});

app.listen(PORT, () => {
  console.log(`LibraSpace backend server running on http://localhost:${PORT}`);
});
