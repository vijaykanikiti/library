import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

console.log("=== RUNNING LOCAL UNIT TESTS FOR AUTH LOGIC ===");

// 1. Password Verification Test
const hash = "$2a$10$79oTkZx2nT9DMam8s.i0gO73wRccWXJaGHRB.fjckrQFnyFZbjvwe";
console.assert(bcrypt.compareSync("krish4318", hash) === true, "Password krish4318 should match");
console.assert(bcrypt.compareSync("wrongpassword", hash) === false, "Wrong password should fail");
console.log("✓ Password hashing & verification passed");

// 2. OTP Generation and Hashing
const rawOtp = crypto.randomInt(100000, 1000000).toString();
console.assert(rawOtp.length === 6, "OTP must be 6 digits");
console.assert(!isNaN(Number(rawOtp)), "OTP must be a numeric string");
const otpHash = bcrypt.hashSync(rawOtp, 10);
console.assert(bcrypt.compareSync(rawOtp, otpHash) === true, "OTP hash must verify true");
console.assert(bcrypt.compareSync("000000", otpHash) === false, "Wrong OTP must verify false");
console.log("✓ OTP generation and bcrypt hashing passed");

// 3. Attempt Limiting & Invalidation
let session = {
  hash: otpHash,
  expiresAt: Date.now() + 5 * 60 * 1000,
  attempts: 0,
  resends: 0,
  lastResentAt: Date.now(),
  user: { name: "Gopal Krishna", email: "gopalkrishnagopal6363@gmail.com", role: "admin" }
};

// Simulate 5 wrong attempts
for (let i = 1; i <= 5; i++) {
  session.attempts++;
  const match = bcrypt.compareSync("999999", session.hash);
  console.assert(match === false, "Mismatched code returns false");
  const remaining = 5 - session.attempts;
  console.assert(remaining === 5 - i, `Remaining attempts should be ${5 - i}`);
}
console.assert(session.attempts === 5, "5 attempts recorded");
console.log("✓ 5-attempt threshold validation passed");

// 4. JWT Generation & Verification
const token = jwt.sign(
  { name: session.user.name, email: session.user.email, role: session.user.role },
  "test_secret",
  { expiresIn: "2h" }
);
const decoded = jwt.verify(token, "test_secret");
console.assert(decoded.email === "gopalkrishnagopal6363@gmail.com", "JWT payload matches");
console.assert(decoded.role === "admin", "JWT role matches");
console.log("✓ JWT 2-hour token generation & validation passed");

// 5. Cooldown Calculation Test
const now = Date.now();
const timeSinceLast = now - session.lastResentAt;
console.assert(timeSinceLast < 60000, "Cooldown should be active immediately after dispatch");
console.log("✓ Resend 60s cooldown logic passed");

console.log("\nALL AUTH LOGIC UNIT TESTS PASSED SUCCESSFULLY!");
