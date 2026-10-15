export const AUTH_STORAGE_KEY = "libraspace-auth";

export const SYSTEM_USERS = {
  admin: {
    name: "Gopal Krishna",
    email: "gopalkrishnagopal6363@gmail.com",
    password: "krish4318",
    alternatePassword: "admin123",
    role: "admin",
  },
  librarian: {
    name: "Gopal Krishna",
    email: "gopalkrishnagopal6363@gmail.com",
    password: "krish4318",
    alternatePassword: "librarian123",
    role: "librarian",
  },
  student: {
    name: "Gopal Krishna",
    email: "gopalkrishnagopal6363@gmail.com",
    password: "krish4318",
    alternatePassword: "student123",
    role: "student",
  },
};

export const EXCLUDED_EMAILS = [
  "admin@lib.com",
  "lib@lib.com",
  "gopal@lib.com",
  "librarian@libraspace.com",
  "student@libraspace.com",
  "rahul@lib.com",
  "priya@lib.com",
  "arvind@lib.com",
  "rahul@example.com",
  "priya@example.com",
  "arun@example.com",
  "sneha@example.com",
  "kiran@example.com",
  "admin@libraspace.com",
];

export function sanitizeUserList(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((u) => {
    if (!u || !u.email) return false;
    const emailLower = u.email.toLowerCase().trim();
    if (EXCLUDED_EMAILS.includes(emailLower)) return false;
    if (emailLower.endsWith("@example.com")) return false;
    if (u.name === "devi" || u.name === "Chief Librarian" || u.name === "Admin User") return false;
    if (u.name === "Admin" && emailLower.includes("lib.com")) return false;
    if (u.name === "Librarian" && emailLower.includes("lib.com")) return false;
    return true;
  });
}

export function getHomePathForRole(role) {
  const normRole = (role || "").toLowerCase().trim();
  if (normRole === "admin") return "/admin/dashboard";
  if (normRole === "librarian") return "/librarian/dashboard";
  return "/dashboard";
}

export function getUser() {
  const tryParse = (raw) => {
    if (!raw || raw === "undefined" || raw === "null") return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (parsed.role) {
          parsed.role = String(parsed.role).toLowerCase().trim();
        }
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  };

  return (
    tryParse(sessionStorage.getItem(AUTH_STORAGE_KEY)) ||
    tryParse(sessionStorage.getItem("user")) ||
    tryParse(localStorage.getItem(AUTH_STORAGE_KEY)) ||
    tryParse(localStorage.getItem("user")) ||
    null
  );
}

export function login(user, _rememberMe = true) {
  const role = (user.role || "student").toLowerCase().trim();
  const payload = {
    name: user.name || (role === "admin" ? "Gopal Krishna" : role === "librarian" ? "Gopal Krishna" : "Gopal Krishna"),
    email: user.email || "gopalkrishnagopal6363@gmail.com",
    role: role,
  };

  const json = JSON.stringify(payload);
  localStorage.setItem(AUTH_STORAGE_KEY, json);
  sessionStorage.setItem(AUTH_STORAGE_KEY, json);
  localStorage.setItem("user", json);
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("user");
}

export function verifyUserCredentials(inputIdentifier, inputPassword, preferredRole = null) {
  const normalizedId = (inputIdentifier || "").trim().toLowerCase();
  const pass = (inputPassword || "").trim();
  const targetRole = (preferredRole || "").toLowerCase().trim();

  if (!normalizedId || !pass) return null;

  if (targetRole && SYSTEM_USERS[targetRole]) {
    const sysUser = SYSTEM_USERS[targetRole];
    const emailMatch = sysUser.email.toLowerCase() === normalizedId;
    const nameMatch = sysUser.name.toLowerCase() === normalizedId;
    const roleMatch = sysUser.role.toLowerCase() === normalizedId;
    const isIdMatch = emailMatch || nameMatch || roleMatch;

    if (isIdMatch) {
      const passMatch =
        sysUser.password === pass ||
        (sysUser.alternatePassword && sysUser.alternatePassword === pass);

      if (passMatch) {
        return {
          name: sysUser.name,
          email: sysUser.email,
          role: sysUser.role,
        };
      }
    }
  }

  const systemEntries = Object.values(SYSTEM_USERS);
  for (const sysUser of systemEntries) {
    const emailMatch = sysUser.email.toLowerCase() === normalizedId;
    const nameMatch = sysUser.name.toLowerCase() === normalizedId;
    const roleMatch = sysUser.role.toLowerCase() === normalizedId;
    const isIdMatch = emailMatch || nameMatch || roleMatch;

    if (isIdMatch) {
      const passMatch =
        sysUser.password === pass ||
        (sysUser.alternatePassword && sysUser.alternatePassword === pass);

      if (passMatch) {
        return {
          name: sysUser.name,
          email: sysUser.email,
          role: targetRole || sysUser.role,
        };
      }
    }
  }

  try {
    const raw = localStorage.getItem("users");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const u of parsed) {
          const emailMatch = (u.email || "").toLowerCase() === normalizedId;
          const nameMatch = (u.name || "").toLowerCase() === normalizedId;
          if ((emailMatch || nameMatch) && u.password === pass) {
            return {
              name: u.name,
              email: u.email,
              role: targetRole || u.role || "student",
            };
          }
        }
      }
    }
  } catch {}

  return null;
}

export function getUsersForRole(role) {
  const users = [];
  if (SYSTEM_USERS[role]) {
    users.push(SYSTEM_USERS[role]);
  }
  try {
    const raw = localStorage.getItem("users");
    if (raw) {
      const parsed = JSON.parse(raw);
      const cleanList = sanitizeUserList(parsed);
      cleanList.forEach((u) => {
        if (
          u.role?.toLowerCase() === role?.toLowerCase() &&
          !users.some((existing) => existing.email?.toLowerCase() === u.email?.toLowerCase())
        ) {
          users.push(u);
        }
      });
    }
  } catch {}
  return users;
}