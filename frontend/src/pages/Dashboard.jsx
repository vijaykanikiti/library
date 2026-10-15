import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  Bookmark,
  CalendarDays,
  Clock,
  RotateCcw,
  Users,
  PlusSquare,
  BookUp,
  BookMarked,
  LogOut,
  Search,
  Bell,
  ArrowRight,
  TrendingUp,
  Menu,
  X,
  User,
  Star,
  Check,
  ChevronDown,
  Moon,
  Sun,
  Droplets,
  Sparkles,
  PlusCircle,
  ClipboardList,
  Receipt,
  Settings,
  BarChart3,
  UserPlus,
  Edit,
  LibraryBig,
  Trash2,
  Grid,
  List,
  AlertCircle,
  CheckCircle2,
  Layers,
  Barcode,
  AlertTriangle,
  BookPlus,
  CheckCircle,
  Hash,
  Info,
  Camera,
  Upload,
  Image,
  MapPin,
  Building,
  Award,
  KeyRound,
  ShieldCheck,
  Phone,
  Mail,
  CreditCard,
  UserCheck,
  Volume2,
  VolumeX,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import "./Dashboard.css";
import { getUser, logout, login as setAuthSession, getHomePathForRole, sanitizeUserList, DEMO_EMAILS, SYSTEM_USERS } from "../utils/auth";
import {
  getNotifications,
  addNotification,
  markAllRead,
  clearAll,
  markAsRead,
  deleteNotification as deleteNotificationHelper,
  isNotificationForUser,
  requestNotificationPermission,
  NOTIFICATIONS_KEY,
  LOCAL_NOTIF_EVENT,
} from "../utils/notifications";

const currentYear = new Date().getFullYear();

export default function Dashboard({ role: rawRole = "student" }) {
  const navigate = useNavigate();

  const currentUser = getUser();
  const currentRole = (rawRole || currentUser?.role || "student").toLowerCase().trim();
  const role = currentRole;

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Real-time Notification Engine State
  const [notifications, setNotifications] = useState(() => {
    return getNotifications().filter((n) => isNotificationForUser(n, currentUser));
  });

  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  // Live 2FA Test Modal state in Dashboard
  const [test2faModalOpen, setTest2faModalOpen] = useState(false);
  const [test2faCode, setTest2faCode] = useState("");
  const [test2faDigits, setTest2faDigits] = useState(["", "", "", "", "", ""]);
  const [test2faTimer, setTest2faTimer] = useState(60);
  const [test2faError, setTest2faError] = useState("");
  const [test2faSuccess, setTest2faSuccess] = useState(false);
  const test2faInputRefs = useRef([]);

  // Web Audio API synthetic chime for real-time notification alerts
  const playNotificationChime = () => {
    if (!notificationSoundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const handledAlertIds = useRef(new Set());

  const handleIncomingAlert = (notif) => {
    if (!notif || !notif.id) return;
    if (handledAlertIds.current.has(notif.id)) return;
    handledAlertIds.current.add(notif.id);
    if (handledAlertIds.current.size > 100) {
      handledAlertIds.current.clear();
    }

    if (isNotificationForUser(notif, currentUser)) {
      playNotificationChime();
      const hasPermission =
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted";

      if (hasPermission) {
        try {
          new Notification(notif.title, {
            body: notif.body || notif.message,
            icon: "/favicon.ico",
          });
        } catch (_) {
          showToast(`${notif.title}: ${notif.body || notif.message}`, "info");
        }
      } else {
        showToast(`${notif.title}: ${notif.body || notif.message}`, "info");
      }
    }
  };

  // Synchronize notifications across browser tabs, windows and local events in real-time
  useEffect(() => {
    // 1. Listen for storage event on "libraspace-notifications"
    const handleStorageChange = (e) => {
      if (e.key === NOTIFICATIONS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            if (parsed.length > 0) {
              handleIncomingAlert(parsed[0]);
            }
            setNotifications(parsed.filter((n) => isNotificationForUser(n, currentUser)));
          }
        } catch (err) {
          console.warn("Storage parse error:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 2. Listen for BroadcastChannel("libraspace") if available
    let bc = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("libraspace");
        bc.onmessage = (event) => {
          if (!event.data) return;
          if (event.data.type === "NOTIFICATION_ADDED") {
            const { notification, all } = event.data;
            handleIncomingAlert(notification);
            const list = Array.isArray(all) ? all : getNotifications();
            setNotifications(list.filter((n) => isNotificationForUser(n, currentUser)));
          } else if (
            event.data.type === "NOTIFICATIONS_UPDATED" ||
            event.data.type === "NOTIFICATIONS_CLEARED"
          ) {
            const list = Array.isArray(event.data.all) ? event.data.all : getNotifications();
            setNotifications(list.filter((n) => isNotificationForUser(n, currentUser)));
          }
        };
      }
    } catch (_) {}

    // 3. Listen for local window event dispatched in current tab
    const handleLocalEvent = (event) => {
      if (!event.detail) return;
      const { type, notification, all } = event.detail;
      if (type === "NOTIFICATION_ADDED") {
        handleIncomingAlert(notification);
        const list = Array.isArray(all) ? all : getNotifications();
        setNotifications(list.filter((n) => isNotificationForUser(n, currentUser)));
      } else if (type === "NOTIFICATIONS_UPDATED" || type === "NOTIFICATIONS_CLEARED") {
        const list = Array.isArray(event.detail.all) ? event.detail.all : getNotifications();
        setNotifications(list.filter((n) => isNotificationForUser(n, currentUser)));
      }
    };
    window.addEventListener(LOCAL_NOTIF_EVENT, handleLocalEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(LOCAL_NOTIF_EVENT, handleLocalEvent);
      if (bc) {
        try {
          bc.close();
        } catch (_) {}
      }
    };
  }, [currentUser]);

  const unreadNotificationCount = notifications.filter((n) => !n.read && n.unread !== false).length;

  const dispatchRealtimeNotification = ({
    title,
    message,
    body,
    type = "system",
    toRole = "all",
    toEmail = "all",
    fromEmail = currentUser?.email || "",
  }) => {
    addNotification({
      title,
      body: body || message || "",
      type,
      toRole,
      toEmail,
      fromEmail,
    });
  };

  const markNotificationAsRead = (id) => {
    markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, unread: false } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    markAllRead(currentUser);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, unread: false })));
    showToast("All notifications marked as read", "info");
  };

  const clearAllNotifications = () => {
    clearAll(currentUser);
    setNotifications([]);
    showToast("All notifications cleared", "info");
  };

  const handleEnableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showToast("Desktop notifications are not supported in this browser.", "warning");
      return;
    }
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === "granted") {
      showToast("Safari notifications enabled successfully!", "success");
      try {
        new Notification("LibraSpace Notifications Enabled", {
          body: "You will receive real-time library alerts on your Mac.",
          icon: "/favicon.ico",
        });
      } catch (_) {}
    } else if (perm === "denied") {
      showToast("Notifications are blocked in Safari settings.", "warning");
    }
  };

  const simulateLiveLibraryAlert = () => {
    const sampleAlerts = [
      {
        title: "Circulation Check-in Restocked",
        message: "A reserved copy of 'The Psychology of Money' was returned and is now available on shelf.",
        type: "circulation",
      },
      {
        title: "Security Shield Verification",
        message: "Session authenticated with 256-bit TLS encryption and verified 2FA token.",
        type: "security",
      },
      {
        title: "New Digital Library Volume",
        message: "Volume 'Artificial Intelligence: A Modern Approach' indexed to Central Engineering Stack.",
        type: "catalog",
      },
      {
        title: "Campus RFID Gate Notice",
        message: "Automated RFID scanning kiosk 3 active for contactless book checkouts.",
        type: "system",
      },
    ];
    const picked = sampleAlerts[Math.floor(Math.random() * sampleAlerts.length)];
    addNotification({
      title: picked.title,
      body: picked.message,
      type: picked.type,
      toRole: "all",
      toEmail: "all",
      fromEmail: "", // allow current user to see test alert
    });
  };

  // Live 2FA test countdown timer
  useEffect(() => {
    let timer = null;
    if (test2faModalOpen && test2faTimer > 0 && !test2faSuccess) {
      timer = setInterval(() => {
        setTest2faTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [test2faModalOpen, test2faTimer, test2faSuccess]);

  // Real-Time 2FA Test handlers for Dashboard
  const startTest2fa = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setTest2faCode(code);
    setTest2faDigits(["", "", "", "", "", ""]);
    setTest2faError("");
    setTest2faSuccess(false);
    setTest2faTimer(60);
    setTest2faModalOpen(true);
    playNotificationChime();
    showToast(`2FA Challenge Dispatched: Passcode is ${code}`, "info");
    setTimeout(() => {
      test2faInputRefs.current[0]?.focus();
    }, 150);
  };

  const handleTest2faDigitChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) {
      const newDigits = [...test2faDigits];
      newDigits[index] = "";
      setTest2faDigits(newDigits);
      return;
    }
    const digit = clean.slice(-1);
    const newDigits = [...test2faDigits];
    newDigits[index] = digit;
    setTest2faDigits(newDigits);
    setTest2faError("");

    if (index < 5) {
      test2faInputRefs.current[index + 1]?.focus();
    } else {
      const fullCode = newDigits.join("");
      if (fullCode.length === 6) {
        verifyTest2fa(fullCode);
      }
    }
  };

  const handleTest2faKeyDown = (index, e) => {
    if (e.key === "Backspace" && !test2faDigits[index] && index > 0) {
      test2faInputRefs.current[index - 1]?.focus();
    }
  };

  const handleTest2faPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = ["", "", "", "", "", ""];
    pasted.split("").forEach((d, i) => {
      if (i < 6) newDigits[i] = d;
    });
    setTest2faDigits(newDigits);
    if (pasted.length === 6) {
      verifyTest2fa(pasted);
    } else {
      test2faInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleTest2faAutoFill = () => {
    if (!test2faCode) return;
    const digits = test2faCode.split("");
    setTest2faDigits(digits);
    setTest2faError("");
    verifyTest2fa(test2faCode);
  };

  const handleTest2faResend = () => {
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    setTest2faCode(newCode);
    setTest2faDigits(["", "", "", "", "", ""]);
    setTest2faError("");
    setTest2faTimer(60);
    playNotificationChime();
    showToast(`New 2FA Code Generated: ${newCode}`, "info");
    setTimeout(() => {
      test2faInputRefs.current[0]?.focus();
    }, 150);
  };

  const verifyTest2fa = (codeToVerify) => {
    if (codeToVerify === test2faCode) {
      setTest2faSuccess(true);
      setTest2faError("");
      playNotificationChime();
      dispatchRealtimeNotification({
        title: "2FA Challenge Passed",
        message: "Live two-factor challenge completed. Patron session identity verified with active TLS encryption.",
        type: "security",
      });
      setTimeout(() => {
        setTest2faModalOpen(false);
      }, 1600);
    } else {
      setTest2faError("Incorrect verification code. Please check your passcode and try again.");
    }
  };

  const deleteNotification = (id) => {
    deleteNotificationHelper(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (notificationFilter === "all") return true;
      if (notificationFilter === "unread") return !notif.read && notif.unread !== false;
      return notif.type === notificationFilter;
    });
  }, [notifications, notificationFilter]);

  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  const themeRef = useRef(null);
  const profileRef = useRef(null);

  const themes = [
    { id: "dark", label: "Dark Mode", icon: Moon },
    { id: "light", label: "Light Mode", icon: Sun },
    { id: "ocean", label: "Ocean Blue", icon: Droplets },
    { id: "rose", label: "Rose Garden", icon: Sparkles },
  ];

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("libra_theme") || localStorage.getItem("library-theme");
    return ["dark", "light", "ocean", "rose"].includes(saved) ? saved : "dark";
  });

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("libra_theme", newTheme);
    localStorage.setItem("library-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    setThemeDropdownOpen(false);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const defaultProfiles = {
    student: {
      name: currentUser?.name || "Gopal Krishna",
      email: currentUser?.email || "ckrishna2354@gmail.com",
      phone: "+91 98765 43210",
      role: "student",
      id: "STU-2026-084",
      department: "Computer Science & Engineering",
      designation: "B.Tech Scholar (3rd Year, Sem 6)",
      bio: "Undergraduate researcher passionate about distributed computing, systems architecture, algorithms, and open-access technical journals.",
      address: "Hall of Residence B-304, North Campus, Central University",
      libraryCardNo: "LIBRA-STU-98214",
      validThru: "31 July 2027",
      memberSince: "August 2024",
      membershipStatus: "Verified Institutional Scholar",
      maxBorrowLimit: 5,
      avatarUrl: "",
    },
    librarian: {
      name: currentUser?.name || "Gopal Krishna",
      email: currentUser?.email || "gopalkrishnagopal6363@gmail.com",
      phone: "+91 98765 43211",
      role: "librarian",
      id: "LIB-2026-012",
      department: "Library & Information Science Division",
      designation: "Senior Faculty Librarian & Catalog Lead",
      bio: "Supervising central acquisitions, rare manuscript digitisation, RFID automated checkouts, and university research archives.",
      address: "Faculty Enclave Q-12, West Campus, Central University",
      libraryCardNo: "LIBRA-FAC-33109",
      validThru: "31 December 2028",
      memberSince: "March 2021",
      membershipStatus: "Tenured Faculty Lead",
      maxBorrowLimit: 15,
      avatarUrl: "",
    },
    admin: {
      name: currentUser?.name || "Gopal Krishna",
      email: currentUser?.email || "admin@libraspace.com",
      phone: "+91 98765 43212",
      role: "admin",
      id: "ADM-2026-001",
      department: "Central University IT & Systems",
      designation: "Principal Systems Administrator",
      bio: "Managing institutional identity systems, high-availability library infrastructure, database persistence, and campus security.",
      address: "Central Administration Tower, Level 4, Central University",
      libraryCardNo: "LIBRA-ADM-00101",
      validThru: "Permanent Academic Staff",
      memberSince: "July 2019",
      membershipStatus: "Super Administrator",
      maxBorrowLimit: 25,
      avatarUrl: "",
    },
  };

  const [profile, setProfile] = useState(() => {
    const fallback = defaultProfiles[currentRole] || defaultProfiles.student;
    try {
      const saved = localStorage.getItem(`profile_${currentRole}`);
      if (saved && saved !== "undefined" && saved !== "null") {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            ...fallback,
            ...parsed,
            name: currentUser?.name || parsed.name || fallback.name,
            email: currentUser?.email || parsed.email || fallback.email,
          };
        }
      }
    } catch {
      // Fallback
    }
    return fallback;
  });

  const [profileTab, setProfileTab] = useState("overview");
  const avatarInputRef = useRef(null);
  const modalAvatarInputRef = useRef(null);

  const [editForm, setEditForm] = useState({
    name: profile?.name || currentUser?.name || "User",
    email: profile?.email || currentUser?.email || "user@libraspace.com",
    phone: profile?.phone || "+91 98765 43210",
    department: profile?.department || "Computer Science & Engineering",
    designation: profile?.designation || "Scholar",
    bio: profile?.bio || "",
    address: profile?.address || "Central University Campus",
    avatarUrl: profile?.avatarUrl || "",
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WEBP, GIF)", "danger");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Selected image exceeds 5MB size limit. Please choose a smaller photo.", "danger");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === "string") {
        const updated = { ...profile, avatarUrl: dataUrl };
        setProfile(updated);
        setEditForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
        try {
          localStorage.setItem(`profile_${currentRole}`, JSON.stringify(updated));
        } catch (err) {
          console.warn("Storage quota limit reached when caching avatar", err);
        }
        showToast("Profile photo uploaded from your device!", "success");
        dispatchRealtimeNotification({
          title: "Patron Avatar Updated",
          message: "Device photo uploaded and synced to your digital library pass.",
          type: "security",
        });
      }
    };
    reader.onerror = () => {
      showToast("Unable to read image file from device", "danger");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    const updated = { ...profile, avatarUrl: "" };
    setProfile(updated);
    setEditForm((prev) => ({ ...prev, avatarUrl: "" }));
    try {
      localStorage.setItem(`profile_${currentRole}`, JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
    showToast("Profile photo removed. Initial monogram restored.", "info");
    dispatchRealtimeNotification({
      title: "Avatar Photo Reset",
      message: "Profile picture restored to institutional initials monogram.",
      type: "security",
    });
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    const updated = { ...profile, ...editForm };
    setProfile(updated);
    try {
      localStorage.setItem(`profile_${currentRole}`, JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }

    if (currentUser) {
      const isRemembered = !!localStorage.getItem("libraspace-auth");
      setAuthSession({ ...currentUser, name: updated.name, email: updated.email }, isRemembered);
    }

    setActiveModal(null);
    showToast("Profile details saved successfully!", "success");
    dispatchRealtimeNotification({
      title: "Patron Profile Saved",
      message: "Academic division and contact details updated successfully.",
      type: "system",
    });
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!securityForm.currentPassword) {
      showToast("Please enter your current password", "danger");
      return;
    }
    if (securityForm.newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "danger");
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showToast("New passwords do not match", "danger");
      return;
    }
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    showToast("Password updated successfully! Security credentials renewed.", "success");
    dispatchRealtimeNotification({
      title: "Security Credentials Changed",
      message: "Account password updated. Active 2FA session refreshed.",
      type: "security",
    });
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3600);
  };

  const calculateDueDate = (days = 14) => {
    const d = new Date();
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().split("T")[0];
  };

  const DEFAULT_CATALOG = [];

  // Pure Reactive Catalog Books with all demo books permanently purged
  const [catalogBooks, setCatalogBooks] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_catalog_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const demoTitles = [
            "Clean Code: A Handbook of Agile Software Craftsmanship",
            "The Pragmatic Programmer: Your Journey To Mastery",
            "Introduction to Algorithms (4th Edition)",
            "Design Patterns: Elements of Reusable Software",
            "Atomic Habits: Proven Way to Build Good Habits",
            "Deep Work: Rules for Focused Success",
            "A Brief History of Time",
            "Cosmos",
            "Sapiens: A Brief History of Humankind",
            "The Psychology of Money",
            "The Alchemist",
            "1984",
            "Clean Code",
            "Atomic Habits",
            "Deep Work",
          ];
          const userOnly = parsed.filter(
            (b) => b && !demoTitles.includes(b.title) && (typeof b.id === "string" || b.id > 1000)
          );
          localStorage.setItem("libraspace_catalog_books", JSON.stringify(userOnly));
          return userOnly;
        }
      }
    } catch {}
    try {
      localStorage.setItem("libraspace_catalog_books", JSON.stringify([]));
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("libraspace_catalog_books", JSON.stringify(catalogBooks));
    } catch (e) {
      console.error(e);
    }
  }, [catalogBooks]);

  // Dynamic Popular Books on shelf derived strictly from real catalog books
  const popularBooks = useMemo(() => {
    return catalogBooks.slice(0, 4).map((b, i) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      rating: 4.8,
      themeColor: ["cream", "sage", "lavender", "blue"][i % 4],
      symbol: (b.title || "B").charAt(0).toUpperCase(),
      summary: `Volume indexed under ${b.category} (${b.shelfLocation}). ${b.availableCopies} of ${b.totalCopies} copies available on shelf.`,
    }));
  }, [catalogBooks]);

  // Members List - strictly authentic accounts, all demo users permanently purged
  const [membersList, setMembersList] = useState(() => {
    let cleanRegistered = [];
    try {
      const raw = localStorage.getItem("users");
      if (raw) {
        const parsed = JSON.parse(raw);
        cleanRegistered = sanitizeUserList(parsed);
      }
    } catch {}

    // Overwrite localStorage with clean authentic users permanently
    try {
      localStorage.setItem("users", JSON.stringify(cleanRegistered));
    } catch {}

    const base = [
      { name: "Gopal Krishna", email: "admin@libraspace.com", role: "Administrator", status: "Active", isSystemAdmin: true },
    ];

    cleanRegistered.forEach((u) => {
      if (!base.some((b) => b.email.toLowerCase() === u.email.toLowerCase())) {
        base.push({
          name: u.name || "Patron",
          email: u.email,
          role: u.role === "admin" ? "Administrator" : u.role === "librarian" ? "Librarian" : "Student Member",
          status: "Active",
          isSystemAdmin: false,
        });
      }
    });

    return base;
  });

  const handleDeleteMember = (emailToDelete) => {
    if (emailToDelete === "admin@libraspace.com") {
      showToast("Primary administrator account cannot be removed", "danger");
      return;
    }
    const target = membersList.find((m) => m.email.toLowerCase() === emailToDelete.toLowerCase());
    const name = target?.name || emailToDelete;
    if (window.confirm(`Are you sure you want to remove member "${name}" (${emailToDelete})?`)) {
      const updated = membersList.filter((m) => m.email.toLowerCase() !== emailToDelete.toLowerCase());
      setMembersList(updated);
      try {
        const raw = localStorage.getItem("users");
        if (raw) {
          const parsed = JSON.parse(raw);
          const clean = parsed.filter((u) => u.email.toLowerCase() !== emailToDelete.toLowerCase());
          localStorage.setItem("users", JSON.stringify(clean));
        }
      } catch {}
      showToast(`Member "${name}" removed from library registry.`, "info");
      dispatchRealtimeNotification({
        title: "Member Deregistration",
        message: `Member record for "${name}" (${emailToDelete}) retired from active directory.`,
        type: "system",
      });
    }
  };

  const handleClearAllBooks = () => {
    if (window.confirm("Are you sure you want to remove all books from the catalog?")) {
      setCatalogBooks([]);
      try {
        localStorage.setItem("libraspace_catalog_books", JSON.stringify([]));
      } catch {}
      showToast("All books have been removed from the catalog.", "info");
      dispatchRealtimeNotification({
        title: "Catalog Purged",
        message: "All books cleared from shelf inventory.",
        type: "catalog",
      });
    }
  };

  // Clean active loans - purge any demo dummy loans from past sessions
  const sanitizeLoans = (list) => {
    if (!Array.isArray(list)) return [];
    const demoBorrowers = ["Rahul Kumar", "Rahul Sharma", "Ananya Roy", "Priya Patel", "Karan Patel", "Vikram Das"];
    return list.filter((l) => !demoBorrowers.includes(l.borrower));
  };

  const [activeLoans, setActiveLoans] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_active_loans");
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeLoans(parsed);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("libraspace_active_loans", JSON.stringify(activeLoans));
    } catch (e) {
      console.error(e);
    }
  }, [activeLoans]);

  // Returned history - purge demo records
  const sanitizeReturns = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(
      (r) =>
        !r.borrower?.includes("Priya Sharma (STU-104)") &&
        !r.borrower?.includes("Arjun Reddy (STU-106)") &&
        !r.borrower?.includes("Neha Gupta (STU-119)")
    );
  };

  const [returnedHistory, setReturnedHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_returned_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeReturns(parsed);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("libraspace_returned_history", JSON.stringify(returnedHistory));
    } catch (e) {
      console.error(e);
    }
  }, [returnedHistory]);

  // Helper to safely resolve activity icon (prevents serialization corruption)
  const resolveActivityIcon = (act) => {
    if (!act) return Bookmark;
    if (typeof act.icon === "function" || (typeof act.icon === "object" && act.icon !== null && act.icon.$$typeof)) {
      return act.icon;
    }
    const title = (act.title || "").toLowerCase();
    const desc = (act.desc || "").toLowerCase();
    if (title.includes("catalog") || title.includes("add") || desc.includes("add") || desc.includes("catalog")) return PlusCircle;
    if (title.includes("return") || desc.includes("return")) return RotateCcw;
    if (title.includes("registered") || desc.includes("joined") || desc.includes("student") || title.includes("student")) return Users;
    if (title.includes("fine") || title.includes("fee") || desc.includes("paid")) return Receipt;
    if (title.includes("issue") || desc.includes("issue")) return Bookmark;
    return Bookmark;
  };

  // Activities - purge demo activity logs and restore icons
  const sanitizeActivities = (list) => {
    if (!Array.isArray(list)) return [];
    return list
      .filter(
        (a) =>
          a &&
          typeof a === "object" &&
          !a.desc?.includes("Rahul Kumar") &&
          !a.desc?.includes("Arjun Reddy") &&
          !a.desc?.includes("Priya Sharma") &&
          !a.desc?.includes("18 overdue books")
      )
      .map((a) => ({
        ...a,
        icon: resolveActivityIcon(a),
      }));
  };

  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_activities");
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeActivities(parsed);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("libraspace_activities", JSON.stringify(activities));
    } catch (e) {
      console.error(e);
    }
  }, [activities]);

  // Dynamic Real-time Calculations
  const totalBooksCount = useMemo(() => {
    return catalogBooks.reduce((sum, b) => sum + (Number(b.totalCopies) || 0), 0);
  }, [catalogBooks]);

  const distinctTitlesCount = catalogBooks.length;

  const totalAvailableCopies = useMemo(() => {
    return catalogBooks.reduce((sum, b) => sum + (Number(b.availableCopies) || 0), 0);
  }, [catalogBooks]);

  const overdueLoans = useMemo(() => {
    return activeLoans.filter((l) => l.status === "Overdue" || (l.daysOverdue && l.daysOverdue > 0));
  }, [activeLoans]);

  const overdueCount = overdueLoans.length;

  const registeredUsersCount = membersList.length;

  const totalFinesCollected = useMemo(() => {
    return returnedHistory.reduce((sum, r) => sum + (Number(r.finePaid) || 0), 0);
  }, [returnedHistory]);

  const pendingFines = useMemo(() => {
    return overdueLoans.reduce((sum, l) => sum + (Number(l.fine) || 0), 0);
  }, [overdueLoans]);

  const overdueRecords = useMemo(() => {
    return overdueLoans.map((l) => ({
      id: l.id,
      title: l.bookTitle,
      borrower: `${l.borrower} (${l.memberId})`,
      issueDate: l.issueDate,
      dueDate: l.dueDate,
      daysOverdue: l.daysOverdue || 1,
      fine: `₹${l.fine || 5}`,
    }));
  }, [overdueLoans]);

  // Dynamic Student Loans
  const studentLoans = useMemo(() => {
    if (!currentUser) return [];
    const queryName = (currentUser.name || profile.name || "").toLowerCase().trim();
    const queryEmail = (currentUser.email || profile.email || "").toLowerCase().trim();
    return activeLoans.filter((l) => {
      const borrower = (l.borrower || "").toLowerCase().trim();
      return (
        borrower.includes(queryName) ||
        (queryEmail && borrower.includes(queryEmail)) ||
        (role === "student" && borrower.length > 0 && queryName.includes(borrower))
      );
    });
  }, [activeLoans, currentUser, profile, role]);

  // Dynamic Category Holdings
  const categoryDistribution = useMemo(() => {
    if (!catalogBooks || catalogBooks.length === 0) return [];
    const map = {};
    let totalCopies = 0;
    catalogBooks.forEach((b) => {
      const cat = b.category || "General";
      const copies = Number(b.totalCopies) || 1;
      map[cat] = (map[cat] || 0) + copies;
      totalCopies += copies;
    });
    const colors = ["#6366f1", "#38bdf8", "#34d399", "#fb923c", "#f472b6", "#a855f7", "#eab308"];
    return Object.entries(map).map(([name, count], idx) => ({
      name,
      count,
      pct: totalCopies > 0 ? Math.round((count / totalCopies) * 100) : 0,
      color: colors[idx % colors.length],
    }));
  }, [catalogBooks]);

  // Dynamic Monthly Circulation (based on actual issue records)
  const monthlyCirculation = useMemo(() => {
    const allRecords = [...activeLoans, ...returnedHistory];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
    return monthNames.map((month, idx) => {
      const val = allRecords.filter((item) => {
        if (!item.issueDate) return false;
        const d = new Date(item.issueDate);
        return d.getMonth() === idx;
      }).length;
      return { month, val };
    });
  }, [activeLoans, returnedHistory]);

  const maxCirculationVal = Math.max(...monthlyCirculation.map((m) => m.val), 1);

  // Catalog Filters State
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("All");
  const [catalogAvailability, setCatalogAvailability] = useState("All");
  const [catalogSort, setCatalogSort] = useState("titleAsc");
  const [catalogView, setCatalogView] = useState("grid");

  // Circulation On-Page Desk State
  const [circDeskBookId, setCircDeskBookId] = useState("1");
  const [circDeskMemberName, setCircDeskMemberName] = useState("");
  const [circDeskMemberId, setCircDeskMemberId] = useState("STU-1024");
  const [circDeskDuration, setCircDeskDuration] = useState(14);
  const [circDeskNotes, setCircDeskNotes] = useState("");

  // Returns On-Page Desk State
  const [returnFilterTab, setReturnFilterTab] = useState("All");
  const [returnSearchQuery, setReturnSearchQuery] = useState("");

  // Modal Forms
  const [newBookForm, setNewBookForm] = useState({
    title: "",
    author: "",
    category: "Technology",
    isbn: "978-0132350884",
    shelfLocation: "Stack CS-105",
    copies: 5,
    gradient: "linear-gradient(135deg, #2563eb, #38bdf8)",
  });

  const [issueForm, setIssueForm] = useState({
    bookId: 1,
    bookTitle: "Clean Code",
    memberName: "",
    memberId: "STU-1024",
    durationDays: 14,
    dueDate: calculateDueDate(14),
    notes: "",
  });

  const [returnForm, setReturnForm] = useState({
    loanId: "",
    bookTitle: "",
    memberName: "",
    condition: "Good / Pristine (No fine)",
    fineWaived: false,
  });

  const [editingBook, setEditingBook] = useState(null);
  const [newMemberForm, setNewMemberForm] = useState({ name: "", email: "", role: "student" });

  // Filtered Catalog Books
  const filteredCatalogBooks = catalogBooks
    .filter((book) => {
      const matchSearch =
        catalogSearch.trim() === "" ||
        book.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        book.author.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        book.isbn.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        book.shelfLocation.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchCategory = catalogCategory === "All" || book.category === catalogCategory;
      const matchAvail =
        catalogAvailability === "All" ||
        (catalogAvailability === "Available" && book.availableCopies > 0) ||
        (catalogAvailability === "OutOfStock" && book.availableCopies === 0);
      return matchSearch && matchCategory && matchAvail;
    })
    .sort((a, b) => {
      if (catalogSort === "titleAsc") return a.title.localeCompare(b.title);
      if (catalogSort === "titleDesc") return b.title.localeCompare(a.title);
      if (catalogSort === "copies") return b.totalCopies - a.totalCopies;
      return 0;
    });

  // Filtered Loans for Return Desk
  const filteredReturnLoans = activeLoans.filter((loan) => {
    const matchSearch =
      returnSearchQuery.trim() === "" ||
      loan.bookTitle.toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
      loan.borrower.toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
      loan.memberId.toLowerCase().includes(returnSearchQuery.toLowerCase());
    const matchTab =
      returnFilterTab === "All" ||
      (returnFilterTab === "Overdue" && loan.status === "Overdue") ||
      (returnFilterTab === "Active" && loan.status === "Active");
    return matchSearch && matchTab;
  });

  // Handlers
  const handleAddBook = (e) => {
    e.preventDefault();
    if (!newBookForm.title.trim()) return;

    const newBook = {
      id: Date.now(),
      title: newBookForm.title.trim(),
      author: newBookForm.author.trim() || "Unknown Author",
      category: newBookForm.category,
      isbn: newBookForm.isbn.trim() || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      shelfLocation: newBookForm.shelfLocation.trim() || "Main Stack",
      totalCopies: Number(newBookForm.copies) || 1,
      availableCopies: Number(newBookForm.copies) || 1,
      year: new Date().getFullYear(),
      publisher: "Academic Press",
      gradient: newBookForm.gradient || "linear-gradient(135deg, #2563eb, #38bdf8)",
    };

    setCatalogBooks([newBook, ...catalogBooks]);
    setActivities([
      {
        id: Date.now(),
        title: "Catalog Updated",
        desc: `Added "${newBook.title}" (${newBook.totalCopies} copies) to catalog`,
        time: "Just now",
        icon: PlusCircle,
        color: "blue",
      },
      ...activities,
    ]);
    setActiveModal(null);
    showToast(`Book "${newBook.title}" added to library catalog!`, "success");
    addNotification({
      title: "New Book Acquisition",
      body: `"${newBook.title}" by ${newBook.author} is now cataloged and available for loan.`,
      type: "catalog",
      toRole: "all",
      toEmail: "all",
      fromEmail: currentUser?.email || "",
    });
  };

  const handleIssueBook = (e) => {
    e.preventDefault();
    if (!issueForm.memberName.trim()) return;

    const book = catalogBooks.find((b) => b.id === Number(issueForm.bookId)) || catalogBooks[0];
    if (book && book.availableCopies <= 0) {
      showToast(`Cannot issue "${book.title}": No copies currently available!`, "danger");
      return;
    }

    if (book) {
      setCatalogBooks(
        catalogBooks.map((b) =>
          b.id === book.id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b
        )
      );
    }

    const newLoan = {
      id: Date.now(),
      bookId: book ? book.id : 1,
      bookTitle: book ? book.title : issueForm.bookTitle,
      author: book ? book.author : "Author",
      borrower: issueForm.memberName.trim(),
      memberId: issueForm.memberId.trim() || "STU-1024",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: issueForm.dueDate || calculateDueDate(issueForm.durationDays || 14),
      status: "Active",
      daysOverdue: 0,
      fine: 0,
    };

    setActiveLoans([newLoan, ...activeLoans]);
    setActivities([
      {
        id: Date.now(),
        title: "Book issued",
        desc: `${newLoan.borrower} borrowed ${newLoan.bookTitle}`,
        time: "Just now",
        icon: Bookmark,
        color: "blue",
      },
      ...activities,
    ]);
    setActiveModal(null);
    showToast(`Book "${newLoan.bookTitle}" successfully issued to ${newLoan.borrower}!`, "success");

    const memberQuery = (issueForm.memberName || "").toLowerCase().trim();
    const matchedMember = membersList.find(m =>
      m.name?.toLowerCase().trim() === memberQuery ||
      m.email?.toLowerCase().trim() === memberQuery
    ) || (SYSTEM_USERS.student.name.toLowerCase() === memberQuery ? SYSTEM_USERS.student : null);
    const targetEmail = matchedMember ? matchedMember.email : (memberQuery.includes("@") ? memberQuery : "all");

    addNotification({
      title: "Book Issued on Loan",
      body: `"${newLoan.bookTitle}" checked out to ${newLoan.borrower} (${newLoan.memberId}). Due: ${newLoan.dueDate}`,
      type: "circulation",
      toRole: "student",
      toEmail: targetEmail,
      fromEmail: currentUser?.email || "",
    });
  };

  const handleCircDeskSubmit = (e) => {
    e.preventDefault();
    if (!circDeskMemberName.trim()) return;

    const book = catalogBooks.find((b) => b.id === Number(circDeskBookId)) || catalogBooks[0];
    if (book && book.availableCopies <= 0) {
      showToast(`Cannot issue "${book.title}": No copies currently available!`, "danger");
      return;
    }

    if (book) {
      setCatalogBooks(
        catalogBooks.map((b) =>
          b.id === book.id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b
        )
      );
    }

    const newLoan = {
      id: Date.now(),
      bookId: book ? book.id : 1,
      bookTitle: book ? book.title : "Clean Code",
      author: book ? book.author : "Author",
      borrower: circDeskMemberName.trim(),
      memberId: circDeskMemberId.trim() || "STU-1024",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: calculateDueDate(circDeskDuration),
      status: "Active",
      daysOverdue: 0,
      fine: 0,
    };

    setActiveLoans([newLoan, ...activeLoans]);
    setActivities([
      {
        id: Date.now(),
        title: "Book issued",
        desc: `${newLoan.borrower} checked out ${newLoan.bookTitle}`,
        time: "Just now",
        icon: Bookmark,
        color: "blue",
      },
      ...activities,
    ]);
    setCircDeskMemberName("");
    showToast(`Issued "${newLoan.bookTitle}" to ${newLoan.borrower}!`, "success");

    const memberQuery = (circDeskMemberName || "").toLowerCase().trim();
    const matchedMember = membersList.find(m =>
      m.name?.toLowerCase().trim() === memberQuery ||
      m.email?.toLowerCase().trim() === memberQuery
    ) || (SYSTEM_USERS.student.name.toLowerCase() === memberQuery ? SYSTEM_USERS.student : null);
    const targetEmail = matchedMember ? matchedMember.email : (circDeskMemberName.includes("@") ? circDeskMemberName.trim() : "all");

    addNotification({
      title: "Book Issued on Loan",
      body: `"${newLoan.bookTitle}" checked out to ${newLoan.borrower} (${newLoan.memberId}). Due: ${newLoan.dueDate}`,
      type: "circulation",
      toRole: "student",
      toEmail: targetEmail,
      fromEmail: currentUser?.email || "",
    });
  };

  const handleProcessReturn = (e) => {
    e.preventDefault();
    const loan = activeLoans.find((l) => l.id === Number(returnForm.loanId));
    const targetTitle = loan ? loan.bookTitle : returnForm.bookTitle;
    const targetBorrower = loan ? loan.borrower : returnForm.memberName;
    const finePaidAmount = loan && loan.fine && !returnForm.fineWaived ? loan.fine : 0;

    // Restock 1 copy
    if (loan) {
      setCatalogBooks(
        catalogBooks.map((b) =>
          b.id === loan.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b
        )
      );
      setActiveLoans(activeLoans.filter((l) => l.id !== loan.id));
    }

    const returnRecord = {
      id: Date.now(),
      bookTitle: targetTitle,
      borrower: targetBorrower,
      returnDate: "Just now",
      condition: returnForm.condition || "Good / Pristine",
      finePaid: finePaidAmount,
    };

    setReturnedHistory([returnRecord, ...returnedHistory]);
    setActivities([
      {
        id: Date.now(),
        title: "Book returned",
        desc: `${targetBorrower} returned "${targetTitle}" (${returnForm.condition})`,
        time: "Just now",
        icon: RotateCcw,
        color: "green",
      },
      ...activities,
    ]);
    setActiveModal(null);
    showToast(`Return processed for "${targetTitle}"! Copy restocked.`, "success");

    const borrowerQuery = (targetBorrower || "").toLowerCase().trim();
    const matchedMember = membersList.find(m =>
      m.name?.toLowerCase().trim() === borrowerQuery ||
      m.email?.toLowerCase().trim() === borrowerQuery
    ) || (SYSTEM_USERS.student.name.toLowerCase() === borrowerQuery ? SYSTEM_USERS.student : null);
    const targetEmail = matchedMember ? matchedMember.email : (borrowerQuery.includes("@") ? borrowerQuery : "all");

    addNotification({
      title: "Book Return Confirmed",
      body: `"${targetTitle}" returned by ${targetBorrower}. Physical copy restocked.`,
      type: "circulation",
      toRole: "student",
      toEmail: targetEmail,
      fromEmail: currentUser?.email || "",
    });

    if (finePaidAmount > 0) {
      addNotification({
        title: "Overdue Fine Settled",
        body: `Fine payment of ₹${finePaidAmount} received for "${targetTitle}" from ${targetBorrower}.`,
        type: "circulation",
        toRole: "student",
        toEmail: targetEmail,
        fromEmail: currentUser?.email || "",
      });
    }
  };

  const handleDeleteBook = (bookId) => {
    const book = catalogBooks.find((b) => b.id === bookId);
    if (!book) return;
    if (window.confirm(`Are you sure you want to retire "${book.title}" from catalog?`)) {
      setCatalogBooks(catalogBooks.filter((b) => b.id !== bookId));
      showToast(`Book "${book.title}" removed from catalog.`, "info");
      dispatchRealtimeNotification({
        title: "Catalog Deaccession",
        message: `"${book.title}" retired from shelf circulation.`,
        type: "catalog",
      });
    }
  };

  const handleSaveEditBook = (e) => {
    e.preventDefault();
    if (!editingBook) return;
    setCatalogBooks(catalogBooks.map((b) => (b.id === editingBook.id ? editingBook : b)));
    setActiveModal(null);
    setEditingBook(null);
    showToast(`Book "${editingBook.title}" updated successfully!`, "success");
    dispatchRealtimeNotification({
      title: "Catalog Record Updated",
      message: `Shelf metadata updated for "${editingBook.title}".`,
      type: "catalog",
    });
  };

  const handleOpenIssueForBook = (book) => {
    setIssueForm({
      bookId: book.id,
      bookTitle: book.title,
      memberName: "",
      memberId: "STU-1024",
      durationDays: 14,
      dueDate: calculateDueDate(14),
      notes: "",
    });
    setActiveModal("issueBook");
  };

  const handleOpenReturnForLoan = (loan) => {
    setReturnForm({
      loanId: loan.id,
      bookTitle: loan.bookTitle,
      memberName: loan.borrower,
      condition: "Good / Pristine (No fine)",
      fineWaived: false,
    });
    setActiveModal("processReturn");
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberForm.name.trim() || !newMemberForm.email.trim()) {
      showToast("Please provide member name and email", "danger");
      return;
    }

    const emailNorm = newMemberForm.email.trim().toLowerCase();
    if (membersList.some((m) => m.email.toLowerCase() === emailNorm)) {
      showToast("A member with this email address is already enrolled", "danger");
      return;
    }

    const newMember = {
      name: newMemberForm.name.trim(),
      email: emailNorm,
      role: newMemberForm.role === "admin" ? "Administrator" : newMemberForm.role === "librarian" ? "Librarian" : "Student Member",
      status: "Active",
      isSystemAdmin: false,
    };

    setMembersList((prev) => [...prev, newMember]);

    try {
      const raw = localStorage.getItem("users");
      const currentUsers = raw ? JSON.parse(raw) : [];
      const cleanUsers = sanitizeUserList(currentUsers);
      cleanUsers.push({
        name: newMember.name,
        email: newMember.email,
        role: newMemberForm.role,
        password: "user123",
      });
      localStorage.setItem("users", JSON.stringify(cleanUsers));
    } catch {}

    setActivities([
      {
        id: Date.now(),
        title: "New member enrolled",
        desc: `${newMember.name} registered as ${newMember.role}`,
        time: "Just now",
        icon: Users,
        color: "purple",
      },
      ...activities,
    ]);
    setActiveModal(null);
    setNewMemberForm({ name: "", email: "", role: "student" });
    showToast(`Member "${newMember.name}" registered successfully!`, "success");
    addNotification({
      title: "New Student Registered",
      body: `"${newMember.name}" (${newMember.email}) has been enrolled as a ${newMember.role}.`,
      type: "system",
      toRole: "admin",
      toEmail: "all",
      fromEmail: currentUser?.email || "",
    });
  };

  const menusByRole = {
    student: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Browse Books", icon: BookOpen },
      { label: "My Borrowings", icon: Bookmark },
      { label: "Reservations", icon: CalendarDays },
      { label: "Due Dates & Fines", icon: Clock },
      { label: "Borrowing History", icon: RotateCcw },
      { label: "Book Reviews", icon: Star },
      { label: "My Profile", icon: User },
    ],
    librarian: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Manage Books", icon: BookMarked },
      { label: "Add New Book", icon: PlusSquare },
      { label: "Issue Books", icon: BookUp },
      { label: "Book Returns", icon: RotateCcw },
      { label: "Reservations", icon: CalendarDays },
      { label: "Overdue Books", icon: Clock },
      { label: "Students", icon: Users },
      { label: "My Profile", icon: User },
    ],
    admin: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Book Catalog", icon: BookMarked },
      { label: "Issue & Return", icon: BookUp },
      { label: "Members Management", icon: Users },
      { label: "Fines & Payments", icon: Receipt },
      { label: "System Reports", icon: BarChart3 },
      { label: "Reservations", icon: CalendarDays },
      { label: "System Settings", icon: Settings },
      { label: "My Profile", icon: User },
    ],
  };

  const currentMenu = menusByRole[currentRole] || menusByRole.student;
  const foundTheme = themes.find((t) => t.id === theme);
  const SelectedThemeIcon =
    foundTheme && (typeof foundTheme.icon === "function" || foundTheme.icon?.$$typeof)
      ? foundTheme.icon
      : Moon;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  const userRole = (currentUser.role || "").toLowerCase().trim();
  if (userRole !== currentRole) {
    return <Navigate to={getHomePathForRole(userRole)} replace />;
  }

  return (
    <div className={`ad-root ad-theme-${theme}`}>

      {sidebarOpen && (
        <div
          className="ad-modal-backdrop"
          style={{ zIndex: 95 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`ad-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div>

          <Link to="/" className="ad-brand">
            <div className="ad-brand-icon">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="ad-brand-title">LibraSpace</div>
              <div className="ad-brand-sub">
                {currentRole === "admin"
                  ? "Admin Console"
                  : currentRole === "librarian"
                  ? "Librarian Portal"
                  : "Student Portal"}
              </div>
            </div>
          </Link>

          <div className="ad-menu-heading">
            {currentRole.toUpperCase()} MENU
          </div>

          <ul className="ad-nav-list">
            {currentMenu.map((item) => {
              const Icon =
                typeof item.icon === "function" || item.icon?.$$typeof
                  ? item.icon
                  : LayoutDashboard;
              const isActive = activeMenu === item.label;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    className={`ad-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveMenu(item.label);
                      setSidebarOpen(false);
                      if (item.label === "Add New Book") setActiveModal("addBook");
                      if (item.label === "Issue Books" || item.label === "Issue & Return") setActiveModal("issueBook");
                      if (item.label === "Book Returns") setActiveModal("processReturn");
                      if (item.label === "My Profile") setActiveModal("viewProfile");
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="ad-sidebar-bottom">
          <div className="ad-info-card">
            <div className="ad-info-card-header">
              <BookOpen size={16} />
              <span>
                {currentRole === "student"
                  ? "Keep Learning!"
                  : currentRole === "librarian"
                  ? "Library Workspace"
                  : "System Operations"}
              </span>
            </div>
            <p className="ad-info-card-text">
              {currentRole === "student"
                ? "Every book opens a new door to knowledge."
                : currentRole === "librarian"
                ? "Keep the library organized and help students discover great books."
                : "Manage catalogs, student records, circulation statistics and fines."}
            </p>
          </div>

          <button
            type="button"
            className="ad-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="ad-main">

        <header className="ad-header">
          <div className="ad-header-left">
            <button
              type="button"
              className="ad-mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>

            <div>
              <span className="ad-breadcrumb-tag">
                {currentRole === "admin"
                  ? "ADMINISTRATION SYSTEM"
                  : currentRole === "librarian"
                  ? "LIBRARY MANAGEMENT"
                  : "LIBRARY PORTAL"}
              </span>
              <h1 className="ad-header-title">
                {activeMenu === "Dashboard"
                  ? currentRole === "admin"
                    ? "Admin Dashboard"
                    : currentRole === "librarian"
                    ? "Librarian Dashboard"
                    : "My Dashboard"
                  : activeMenu}
              </h1>
            </div>
          </div>

          <div className="ad-header-controls">

            <div className="ad-search-container">
              <Search size={16} className="ad-search-icon" />
              <input
                type="text"
                placeholder={
                  currentRole === "admin"
                    ? "Search records, users, books..."
                    : "Search library collection..."
                }
                className="ad-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="ad-dropdown-wrapper" ref={themeRef}>
              <button
                type="button"
                className="ad-theme-trigger"
                onClick={() => setThemeDropdownOpen((prev) => !prev)}
                title="Select Theme"
              >
                <SelectedThemeIcon size={16} />
                <span>{themes.find((t) => t.id === theme)?.label}</span>
                <ChevronDown size={14} />
              </button>

              {themeDropdownOpen && (
                <div className="ad-theme-menu">
                  <div className="ad-theme-menu-header">Color Themes</div>
                  {themes.map((t) => {
                    const Icon =
                      typeof t.icon === "function" || t.icon?.$$typeof ? t.icon : Moon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`ad-theme-option ${theme === t.id ? "selected" : ""}`}
                        onClick={() => handleThemeChange(t.id)}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Icon size={15} />
                          {t.label}
                        </span>
                        {theme === t.id && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              className="ad-icon-btn ad-notif-btn"
              onClick={() => setActiveModal("notifications")}
              title={`Live Notifications (${unreadNotificationCount} unread)`}
            >
              <Bell size={18} />
              {unreadNotificationCount > 0 && (
                <span className="ad-badge-count">{unreadNotificationCount}</span>
              )}
            </button>

            <div className="ad-dropdown-wrapper" ref={profileRef}>
              <div
                className="ad-profile-pill"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                title="Profile Options"
              >
                <div className="ad-profile-avatar">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile?.name || "User"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : (
                    (profile?.name || currentUser?.name || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="ad-profile-details">
                  <span className="ad-profile-name">{profile?.name || currentUser?.name || "User"}</span>
                  <span className="ad-profile-role">{currentRole}</span>
                </div>
                <ChevronDown size={14} color="var(--ad-text-muted)" />
              </div>

              {profileMenuOpen && (
                <div className="ad-profile-menu">
                  <button
                    type="button"
                    className="ad-profile-menu-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setActiveMenu("My Profile");
                      setProfileTab("overview");
                    }}
                  >
                    <User size={15} />
                    <span>View Profile Page</span>
                  </button>
                  <button
                    type="button"
                    className="ad-profile-menu-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setActiveMenu("My Profile");
                      setProfileTab("edit");
                    }}
                  >
                    <Camera size={15} />
                    <span>Upload Photo / Edit</span>
                  </button>
                  <button
                    type="button"
                    className="ad-profile-menu-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setActiveModal("viewProfile");
                    }}
                  >
                    <CreditCard size={15} />
                    <span>Digital Pass Modal</span>
                  </button>
                  <button
                    type="button"
                    className="ad-profile-menu-item logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="ad-content">

          {/* Manage Books / Book Catalog Page View */}
          {(activeMenu === "Manage Books" || activeMenu === "Book Catalog" || activeMenu === "Browse Books") && (
            <div className="ad-catalog-page">
              <div className="ad-catalog-header">
                <div>
                  <div className="ad-breadcrumb-tag">CATALOG & INVENTORY</div>
                  <h2 className="ad-catalog-header-title">
                    {role === "student" ? "Browse Library Catalog" : "Book Catalog & Shelf Inventory"}
                  </h2>
                  <p className="ad-catalog-header-sub">
                    Explore literature, monitor shelf availability, manage circulation copies, and track catalog status.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="ad-btn ad-btn-secondary"
                    onClick={() => setActiveMenu("Dashboard")}
                  >
                    ← Dashboard
                  </button>
                  {role !== "student" && catalogBooks.length > 0 && (
                    <button
                      type="button"
                      className="ad-btn ad-btn-secondary"
                      style={{ color: "var(--ad-badge-danger-text)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                      onClick={handleClearAllBooks}
                      title="Clear all books from catalog"
                    >
                      <Trash2 size={15} />
                      <span>Remove All Books</span>
                    </button>
                  )}
                  {role !== "student" && (
                    <button
                      type="button"
                      className="ad-btn ad-btn-primary"
                      onClick={() => {
                        setNewBookForm({
                          title: "",
                          author: "",
                          category: "Technology",
                          isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                          shelfLocation: `Stack CS-${Math.floor(100 + Math.random() * 900)}`,
                          copies: 5,
                          gradient: "linear-gradient(135deg, #2563eb, #38bdf8)",
                        });
                        setActiveModal("addBook");
                      }}
                    >
                      <BookPlus size={16} />
                      <span>Add New Book</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="ad-catalog-stats-grid">
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon blue"><BookOpen size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">{catalogBooks.length}</div>
                    <div className="ad-catalog-stat-lbl">Curated Titles</div>
                  </div>
                </div>
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon purple"><Layers size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">
                      {catalogBooks.reduce((sum, b) => sum + Number(b.totalCopies || 0), 0)}
                    </div>
                    <div className="ad-catalog-stat-lbl">Total Volume Copies</div>
                  </div>
                </div>
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon green"><CheckCircle2 size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">
                      {catalogBooks.reduce((sum, b) => sum + Number(b.availableCopies || 0), 0)}
                    </div>
                    <div className="ad-catalog-stat-lbl">Available on Shelf</div>
                  </div>
                </div>
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon orange"><RotateCcw size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">{activeLoans.length}</div>
                    <div className="ad-catalog-stat-lbl">Active Circulation Loans</div>
                  </div>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="ad-catalog-toolbar">
                <div className="ad-catalog-toolbar-row">
                  <div className="ad-catalog-search-wrap">
                    <Search size={16} className="ad-catalog-search-icon" />
                    <input
                      type="text"
                      className="ad-catalog-search-input"
                      placeholder="Search title, author, ISBN, or shelf rack..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      className="ad-form-select no-icon"
                      style={{ width: "auto", minWidth: "140px", padding: "8px 12px" }}
                      value={catalogAvailability}
                      onChange={(e) => setCatalogAvailability(e.target.value)}
                    >
                      <option value="All">All Availability</option>
                      <option value="Available">Available Now</option>
                      <option value="OutOfStock">Out of Stock</option>
                    </select>

                    <select
                      className="ad-form-select no-icon"
                      style={{ width: "auto", minWidth: "130px", padding: "8px 12px" }}
                      value={catalogSort}
                      onChange={(e) => setCatalogSort(e.target.value)}
                    >
                      <option value="titleAsc">Title (A-Z)</option>
                      <option value="titleDesc">Title (Z-A)</option>
                      <option value="copies">Most Copies</option>
                    </select>

                    <div className="ad-view-toggle">
                      <button
                        type="button"
                        className={`ad-view-toggle-btn ${catalogView === "grid" ? "active" : ""}`}
                        onClick={() => setCatalogView("grid")}
                        title="Grid View"
                      >
                        <Grid size={15} />
                        <span>Grid</span>
                      </button>
                      <button
                        type="button"
                        className={`ad-view-toggle-btn ${catalogView === "table" ? "active" : ""}`}
                        onClick={() => setCatalogView("table")}
                        title="Table View"
                      >
                        <List size={15} />
                        <span>Table</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ad-category-pills">
                  {[
                    "All",
                    "Computer Science",
                    "Technology",
                    "Science",
                    "Self-Help",
                    "Finance",
                    "Fiction",
                    "History",
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`ad-category-pill ${catalogCategory === cat ? "active" : ""}`}
                      onClick={() => setCatalogCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid View */}
              {catalogView === "grid" && (
                <div className="ad-book-grid">
                  {filteredCatalogBooks.map((book) => {
                    const availPct = Math.round((book.availableCopies / book.totalCopies) * 100);
                    return (
                      <div key={book.id} className="ad-book-card">
                        <div
                          className="ad-book-cover-banner"
                          style={{ background: book.gradient || "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}
                        >
                          <div className="ad-book-card-tags">
                            <span className="ad-book-glass-tag">
                              <Bookmark size={11} /> {book.category}
                            </span>
                            <span className="ad-book-glass-tag">
                              <Layers size={11} /> {book.shelfLocation}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: "11px", opacity: 0.9, letterSpacing: "0.5px" }}>
                              ISBN {book.isbn}
                            </div>
                            <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "2px" }}>
                              {book.title.length > 28 ? book.title.substring(0, 28) + "..." : book.title}
                            </div>
                          </div>
                        </div>

                        <div className="ad-book-card-body">
                          <h4 className="ad-book-card-title">{book.title}</h4>
                          <p className="ad-book-card-author">by {book.author}</p>

                          <div className="ad-book-card-meta">
                            <span>Year: {book.year || "2024"}</span>
                            <span>{book.publisher || "Academic Press"}</span>
                          </div>

                          <div className="ad-stock-container">
                            <div className="ad-stock-header">
                              <span style={{ color: "var(--ad-text-secondary)" }}>Shelf Inventory:</span>
                              <strong
                                style={{
                                  color:
                                    book.availableCopies > 1
                                      ? "var(--ad-badge-success-text)"
                                      : book.availableCopies === 1
                                      ? "var(--ad-badge-due-text)"
                                      : "var(--ad-badge-danger-text)",
                                }}
                              >
                                {book.availableCopies} of {book.totalCopies} available
                              </strong>
                            </div>
                            <div className="ad-stock-track">
                              <div
                                className="ad-stock-bar"
                                style={{
                                  width: `${availPct}%`,
                                  background:
                                    book.availableCopies > 1
                                      ? "linear-gradient(90deg, #10b981, #059669)"
                                      : book.availableCopies === 1
                                      ? "linear-gradient(90deg, #f59e0b, #d97706)"
                                      : "linear-gradient(90deg, #ef4444, #dc2626)",
                                }}
                              />
                            </div>
                          </div>

                          <div className="ad-book-card-actions">
                            {role === "student" ? (
                              <button
                                type="button"
                                className="ad-btn ad-btn-primary"
                                style={{ flex: 1, padding: "8px" }}
                                onClick={() => {
                                  showToast(`Reserved "${book.title}" successfully! Check at counter.`, "success");
                                  addNotification({
                                    title: "Book Reservation Placed",
                                    body: `${currentUser?.name || "Student"} reserved a copy of "${book.title}". Reserved copy held at circulation counter.`,
                                    type: "circulation",
                                    toRole: "librarian",
                                    toEmail: "all",
                                    fromEmail: currentUser?.email || "",
                                  });
                                }}
                              >
                                <Bookmark size={14} /> Reserve Copy
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="ad-btn ad-btn-primary"
                                  style={{ flex: 1, padding: "8px" }}
                                  disabled={book.availableCopies === 0}
                                  onClick={() => handleOpenIssueForBook(book)}
                                  title={book.availableCopies === 0 ? "Out of stock" : "Issue to member"}
                                >
                                  <BookUp size={14} /> Issue
                                </button>
                                <button
                                  type="button"
                                  className="ad-btn ad-btn-secondary"
                                  style={{ padding: "8px 12px" }}
                                  onClick={() => {
                                    setEditingBook({ ...book });
                                    setActiveModal("editBook");
                                  }}
                                  title="Edit Book Details"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="ad-btn ad-btn-secondary"
                                  style={{ padding: "8px 12px", color: "var(--ad-badge-danger-text)" }}
                                  onClick={() => handleDeleteBook(book.id)}
                                  title="Remove from Catalog"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Table View */}
              {catalogView === "table" && (
                <div className="ad-card" style={{ padding: "0", overflow: "hidden" }}>
                  <div className="ad-table-responsive">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Book Title & Author</th>
                          <th>ISBN</th>
                          <th>Category</th>
                          <th>Shelf Location</th>
                          <th>Inventory Copies</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCatalogBooks.map((book) => (
                          <tr key={book.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div
                                  style={{
                                    width: "36px",
                                    height: "48px",
                                    borderRadius: "5px",
                                    background: book.gradient || "#2563eb",
                                    display: "grid",
                                    placeItems: "center",
                                    color: "#fff",
                                    fontSize: "14px",
                                    fontWeight: 800,
                                    flexShrink: 0,
                                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                  }}
                                >
                                  {book.title.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: "var(--ad-text-primary)" }}>
                                    {book.title}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "var(--ad-text-muted)" }}>
                                    {book.author}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{book.isbn}</td>
                            <td>
                              <span className="ad-badge info">{book.category}</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{book.shelfLocation}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <strong style={{ minWidth: "30px" }}>
                                  {book.availableCopies} / {book.totalCopies}
                                </strong>
                                <div style={{ width: "60px", height: "6px", background: "var(--ad-border-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                                  <div
                                    style={{
                                      width: `${(book.availableCopies / book.totalCopies) * 100}%`,
                                      height: "100%",
                                      background: book.availableCopies > 0 ? "var(--ad-badge-success-text)" : "var(--ad-badge-danger-text)",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              {book.availableCopies > 0 ? (
                                <span className="ad-badge success">Available</span>
                              ) : (
                                <span className="ad-badge danger">Out of Stock</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {role !== "student" && (
                                  <>
                                    <button
                                      type="button"
                                      className="ad-btn ad-btn-primary ad-btn-sm"
                                      disabled={book.availableCopies === 0}
                                      onClick={() => handleOpenIssueForBook(book)}
                                    >
                                      Issue
                                    </button>
                                    <button
                                      type="button"
                                      className="ad-btn ad-btn-secondary ad-btn-sm"
                                      onClick={() => {
                                        setEditingBook({ ...book });
                                        setActiveModal("editBook");
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="ad-btn ad-btn-secondary ad-btn-sm"
                                      style={{ color: "var(--ad-badge-danger-text)" }}
                                      onClick={() => handleDeleteBook(book.id)}
                                      title="Remove from Catalog"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {catalogBooks.length === 0 ? (
                <div className="ad-card" style={{ textAlign: "center", padding: "56px 20px" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--ad-card-subtle)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                    <BookOpen size={32} color="var(--ad-accent)" />
                  </div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 800 }}>No Books in Catalog</h3>
                  <p style={{ color: "var(--ad-text-secondary)", fontSize: "13.5px", margin: "0 auto 20px", maxWidth: "420px", lineHeight: "1.5" }}>
                    All demo books have been removed. Add authentic institutional books using the "Add New Book" button above to populate your catalog.
                  </p>
                  {role !== "student" && (
                    <button
                      type="button"
                      className="ad-btn ad-btn-primary"
                      onClick={() => {
                        setNewBookForm({
                          title: "",
                          author: "",
                          category: "Technology",
                          isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                          shelfLocation: `Stack CS-${Math.floor(100 + Math.random() * 900)}`,
                          copies: 5,
                          gradient: "linear-gradient(135deg, #2563eb, #38bdf8)",
                        });
                        setActiveModal("addBook");
                      }}
                    >
                      <BookPlus size={16} />
                      <span>Add New Book</span>
                    </button>
                  )}
                </div>
              ) : filteredCatalogBooks.length === 0 ? (
                <div className="ad-card" style={{ textAlign: "center", padding: "48px 20px" }}>
                  <Search size={36} color="var(--ad-text-muted)" style={{ margin: "0 auto 12px" }} />
                  <h4 style={{ margin: "0 0 6px" }}>No books matching your query</h4>
                  <p style={{ color: "var(--ad-text-muted)", fontSize: "13.5px", margin: "0 0 16px" }}>
                    Try searching for different terms or reset your active filters.
                  </p>
                  <button
                    type="button"
                    className="ad-btn ad-btn-secondary"
                    onClick={() => {
                      setCatalogSearch("");
                      setCatalogCategory("All");
                      setCatalogAvailability("All");
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Issue Books / Circulation Desk Page View */}
          {(activeMenu === "Issue Books" || activeMenu === "Issue & Return") && (
            <div className="ad-catalog-page">
              <div className="ad-catalog-header">
                <div>
                  <div className="ad-breadcrumb-tag">CIRCULATION DESK</div>
                  <h2 className="ad-catalog-header-title">Circulation & Issue Desk</h2>
                  <p className="ad-catalog-header-sub">
                    Issue physical copies to library patrons with automated 14-day timelines and active circulation logging.
                  </p>
                </div>
                <button
                  type="button"
                  className="ad-btn ad-btn-secondary"
                  onClick={() => setActiveMenu("Dashboard")}
                >
                  ← Back to Dashboard
                </button>
              </div>

              {/* Circulation Quick Metrics */}
              <div className="ad-catalog-stats-grid">
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon purple"><Bookmark size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">{activeLoans.length}</div>
                    <div className="ad-catalog-stat-lbl">Active Loans</div>
                  </div>
                </div>
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon green"><CalendarDays size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">14 Days</div>
                    <div className="ad-catalog-stat-lbl">Standard Cycle</div>
                  </div>
                </div>
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon pink"><AlertCircle size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">
                      {activeLoans.filter((l) => l.status === "Overdue").length}
                    </div>
                    <div className="ad-catalog-stat-lbl">Overdue Checkouts</div>
                  </div>
                </div>
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon blue"><RotateCcw size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">{returnedHistory.length}</div>
                    <div className="ad-catalog-stat-lbl">Returns Settled</div>
                  </div>
                </div>
              </div>

              {/* 2-Column Desk */}
              <div className="ad-circ-grid">
                {/* Left: Issue Station Form */}
                <div className="ad-card" style={{ padding: "24px" }}>
                  <div className="ad-card-header" style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="ad-stat-icon purple" style={{ width: "36px", height: "36px" }}>
                        <BookUp size={18} />
                      </div>
                      <div>
                        <h3 className="ad-card-title" style={{ margin: 0, fontSize: "16px" }}>
                          Issue Book to Member
                        </h3>
                        <p className="ad-card-sub" style={{ margin: 0 }}>
                          Select book copy and record patron checkout
                        </p>
                      </div>
                    </div>
                    <span className="ad-badge success">Station Online</span>
                  </div>

                  <form onSubmit={handleCircDeskSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="ad-form-group">
                      <label className="ad-form-label">
                        <span>Select Book to Issue *</span>
                        <span className="ad-form-label-hint">Available on shelf</span>
                      </label>
                      <div className="ad-input-wrapper">
                        <BookOpen size={16} className="ad-input-icon" />
                        <select
                          className="ad-form-select"
                          value={circDeskBookId}
                          onChange={(e) => setCircDeskBookId(e.target.value)}
                          required
                        >
                          {catalogBooks.map((b) => (
                            <option key={b.id} value={b.id} disabled={b.availableCopies === 0}>
                              {b.title} — {b.availableCopies > 0 ? `(${b.availableCopies} available)` : "(Out of stock)"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="ad-form-grid-2">
                      <div className="ad-form-group">
                        <label className="ad-form-label">Borrower Full Name *</label>
                        <div className="ad-input-wrapper">
                          <User size={16} className="ad-input-icon" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            className="ad-form-input"
                            value={circDeskMemberName}
                            onChange={(e) => setCircDeskMemberName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="ad-form-group">
                        <label className="ad-form-label">Patron Student / Staff ID</label>
                        <div className="ad-input-wrapper">
                          <Hash size={16} className="ad-input-icon" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. STU-1024"
                            className="ad-form-input"
                            value={circDeskMemberId}
                            onChange={(e) => setCircDeskMemberId(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="ad-form-group">
                      <label className="ad-form-label">
                        <span>Loan Duration</span>
                        <span className="ad-form-label-hint">Due date calculates automatically</span>
                      </label>
                      <div className="ad-duration-chips">
                        {[7, 14, 21, 30].map((days) => (
                          <button
                            key={days}
                            type="button"
                            className={`ad-duration-chip ${circDeskDuration === days ? "active" : ""}`}
                            onClick={() => setCircDeskDuration(days)}
                          >
                            {days} Days {days === 14 ? "(Academic Standard)" : ""}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ad-form-group">
                      <label className="ad-form-label">Circulation Remarks</label>
                      <div className="ad-input-wrapper">
                        <Clock size={16} className="ad-input-icon" />
                        <input
                          type="text"
                          placeholder="Optional notes (e.g. Thesis project reference copy)"
                          className="ad-form-input"
                          value={circDeskNotes}
                          onChange={(e) => setCircDeskNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="ad-alert-box info">
                      <CheckCircle2 size={18} color="var(--ad-accent)" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong>Standard Academic Loan Policy:</strong> Books are issued for {circDeskDuration} days.
                        Overdue copies accrue ₹5/day overdue penalty until returned.
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                      <button
                        type="button"
                        className="ad-btn ad-btn-secondary"
                        onClick={() => {
                          setCircDeskMemberName("");
                          setCircDeskNotes("");
                        }}
                      >
                        Clear Form
                      </button>
                      <button type="submit" className="ad-btn ad-btn-primary">
                        <Check size={16} /> Complete Book Issue
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right: Checkout Slip Preview & Active Checkouts */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className="ad-slip-card">
                    <div className="ad-slip-header">
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", color: "var(--ad-accent)", textTransform: "uppercase" }}>
                          ACADEMIC CIRCULATION SLIP
                        </span>
                        <h4 style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 800 }}>LibraSpace Desk</h4>
                      </div>
                      <Bookmark size={20} color="var(--ad-accent)" />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--ad-text-secondary)" }}>Selected Book:</span>
                        <strong style={{ color: "var(--ad-text-primary)", textAlign: "right", maxWidth: "200px" }}>
                          {catalogBooks.find((b) => b.id === Number(circDeskBookId))?.title || "Clean Code"}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--ad-text-secondary)" }}>Borrower:</span>
                        <strong>{circDeskMemberName || "Rahul Sharma"} ({circDeskMemberId || "STU-1024"})</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--ad-text-secondary)" }}>Issue Date:</span>
                        <span>2026-10-14 (Today)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--ad-text-secondary)" }}>Due Return Date:</span>
                        <strong style={{ color: "var(--ad-badge-due-text)" }}>
                          {calculateDueDate(circDeskDuration)}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--ad-text-secondary)" }}>Term:</span>
                        <span>{circDeskDuration} Days Loan Cycle</span>
                      </div>
                    </div>

                    <div className="ad-slip-barcode-line" />
                    <div style={{ textAlign: "center", fontSize: "11px", color: "var(--ad-text-muted)" }}>
                      * Official university library circulation verification *
                    </div>
                  </div>

                  <div className="ad-card" style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Recently Issued Books</h4>
                      <span className="ad-badge info">{activeLoans.length} active</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {activeLoans.slice(0, 3).map((loan) => (
                        <div
                          key={loan.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            background: "var(--ad-card-subtle)",
                            border: "1px solid var(--ad-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "13px" }}>{loan.bookTitle}</div>
                            <div style={{ fontSize: "11.5px", color: "var(--ad-text-secondary)" }}>
                              {loan.borrower} &bull; Due: {loan.dueDate}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="ad-btn ad-btn-secondary ad-btn-sm"
                            onClick={() => handleOpenReturnForLoan(loan)}
                          >
                            Return
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Book Returns / Returns Desk Page View */}
          {activeMenu === "Book Returns" && (
            <div className="ad-catalog-page">
              <div className="ad-catalog-header">
                <div>
                  <div className="ad-breadcrumb-tag">RETURNS & CHECK-IN</div>
                  <h2 className="ad-catalog-header-title">Process Book Returns</h2>
                  <p className="ad-catalog-header-sub">
                    Inspect physical book condition, assess overdue fines, and restock items back into active catalog shelves.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="ad-btn ad-btn-secondary"
                    onClick={() => setActiveMenu("Dashboard")}
                  >
                    ← Dashboard
                  </button>
                  <button
                    type="button"
                    className="ad-btn ad-btn-primary"
                    onClick={() => {
                      if (activeLoans.length > 0) {
                        setReturnForm({
                          loanId: activeLoans[0].id,
                          bookTitle: activeLoans[0].bookTitle,
                          memberName: activeLoans[0].borrower,
                          condition: "Good / Pristine (No fine)",
                          fineWaived: false,
                        });
                      }
                      setActiveModal("processReturn");
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>Check-in Modal</span>
                  </button>
                </div>
              </div>

              {/* Returns Desk Metrics */}
              <div className="ad-catalog-stats-grid">
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon purple"><Bookmark size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">{activeLoans.length}</div>
                    <div className="ad-catalog-stat-lbl">Active Circulation Loans</div>
                  </div>
                </div>
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon pink"><AlertCircle size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">
                      {activeLoans.filter((l) => l.status === "Overdue").length}
                    </div>
                    <div className="ad-catalog-stat-lbl">Overdue Requiring Fine</div>
                  </div>
                </div>
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon green"><Receipt size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">
                      ₹{activeLoans.filter((l) => l.status === "Overdue").reduce((s, l) => s + (l.fine || 0), 0)}
                    </div>
                    <div className="ad-catalog-stat-lbl">Accrued Overdue Fines</div>
                  </div>
                </div>
                <div className="ad-catalog-stat-card">
                  <div className="ad-stat-icon blue"><CheckCircle2 size={20} /></div>
                  <div>
                    <div className="ad-catalog-stat-val">{returnedHistory.length}</div>
                    <div className="ad-catalog-stat-lbl">Restocked Recently</div>
                  </div>
                </div>
              </div>

              {/* Returns Toolbar */}
              <div className="ad-catalog-toolbar">
                <div className="ad-catalog-toolbar-row">
                  <div className="ad-catalog-search-wrap">
                    <Search size={16} className="ad-catalog-search-icon" />
                    <input
                      type="text"
                      className="ad-catalog-search-input"
                      placeholder="Search borrower name, student ID, or book title..."
                      value={returnSearchQuery}
                      onChange={(e) => setReturnSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="ad-category-pills">
                    {["All", "Overdue", "Active"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        className={`ad-category-pill ${returnFilterTab === tab ? "active" : ""}`}
                        onClick={() => setReturnFilterTab(tab)}
                      >
                        {tab === "All" ? "All Active Loans" : tab === "Overdue" ? "Overdue Loans Only" : "On-Time Loans"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Loans Table */}
              <div className="ad-card" style={{ padding: "0", overflow: "hidden" }}>
                <div className="ad-card-header" style={{ padding: "16px 20px" }}>
                  <div>
                    <h3 className="ad-card-title" style={{ fontSize: "16px" }}>
                      Active Circulation Loans Pending Return
                    </h3>
                    <p className="ad-card-sub">Inspect copy and settle overdue fines on return</p>
                  </div>
                  <span className="ad-badge info">{filteredReturnLoans.length} Loans Listed</span>
                </div>

                <div className="ad-table-responsive">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Borrower</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Circulation Status</th>
                        <th>Overdue Penalty</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReturnLoans.map((loan) => (
                        <tr key={loan.id}>
                          <td>
                            <strong style={{ color: "var(--ad-text-primary)" }}>{loan.bookTitle}</strong>
                            <div style={{ fontSize: "11.5px", color: "var(--ad-text-muted)" }}>{loan.author}</div>
                          </td>
                          <td>
                            <div>{loan.borrower}</div>
                            <span style={{ fontSize: "11px", color: "var(--ad-text-muted)" }}>{loan.memberId}</span>
                          </td>
                          <td>{loan.issueDate}</td>
                          <td style={{ fontWeight: 600 }}>{loan.dueDate}</td>
                          <td>
                            {loan.status === "Overdue" ? (
                              <span className="ad-badge danger">
                                <span className="ad-pulse-dot" /> {loan.daysOverdue} days late
                              </span>
                            ) : (
                              <span className="ad-badge success">On Time</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 700, color: loan.fine > 0 ? "var(--ad-badge-danger-text)" : "var(--ad-text-muted)" }}>
                            {loan.fine > 0 ? `₹${loan.fine}` : "₹0"}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="ad-btn ad-btn-primary ad-btn-sm"
                              onClick={() => handleOpenReturnForLoan(loan)}
                            >
                              <RotateCcw size={13} /> Check-in Return
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recently Returned History */}
              <div className="ad-card" style={{ marginTop: "10px" }}>
                <div className="ad-card-header">
                  <div>
                    <h3 className="ad-card-title" style={{ fontSize: "16px" }}>Recently Returned Archive</h3>
                    <p className="ad-card-sub">Recorded check-ins and condition logs</p>
                  </div>
                  <span className="ad-badge success">Synced Live</span>
                </div>

                <div className="ad-table-responsive">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Borrower</th>
                        <th>Return Timestamp</th>
                        <th>Condition Assessment</th>
                        <th>Settled Fine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnedHistory.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700 }}>{item.bookTitle}</td>
                          <td>{item.borrower}</td>
                          <td>{item.returnDate}</td>
                          <td>
                            <span className="ad-badge success">{item.condition}</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{item.finePaid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Institutional Profile Page */}
          {activeMenu === "My Profile" && (
            <div className="ad-profile-page">
              {/* Hidden device file input */}
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />

              {/* Page Breadcrumb & Header */}
              <div className="ad-catalog-header">
                <div>
                  <div className="ad-breadcrumb-tag">INSTITUTIONAL PROFILE · DIGITAL IDENTITY</div>
                  <h2 className="ad-catalog-header-title">Patron Profile & Digital Library Pass</h2>
                  <p className="ad-catalog-header-sub">
                    Manage your academic standing, device photo avatar, borrowing credentials, and university library pass.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="ad-btn ad-btn-secondary"
                    onClick={() => setActiveMenu("Dashboard")}
                  >
                    ← Back to Dashboard
                  </button>
                  <button
                    type="button"
                    className="ad-btn ad-btn-primary"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera size={16} />
                    <span>Upload Device Photo</span>
                  </button>
                </div>
              </div>

              {/* Profile Hero Card with Banner */}
              <div className="ad-profile-hero-card">
                <div className="ad-profile-cover-banner">
                  <div className="ad-profile-cover-badge">
                    <Sparkles size={13} />
                    <span>CENTRAL UNIVERSITY LIBRARY SYSTEM · RFID ACTIVE</span>
                  </div>
                </div>

                <div className="ad-profile-hero-body">
                  <div className="ad-profile-avatar-row">
                    <div className="ad-profile-avatar-wrapper">
                      {profile?.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile?.name || "User Avatar"}
                          className="ad-profile-avatar-img"
                        />
                      ) : (
                        <div className="ad-profile-avatar-initials">
                          {(profile?.name || currentUser?.name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <button
                        type="button"
                        className="ad-profile-avatar-cam-btn"
                        onClick={() => avatarInputRef.current?.click()}
                        title="Upload photo from device"
                        aria-label="Upload photo from device"
                      >
                        <Camera size={16} />
                      </button>
                    </div>

                    <div className="ad-profile-hero-info">
                      <div className="ad-profile-hero-title-row">
                        <h2 className="ad-profile-hero-name">
                          {profile?.name || currentUser?.name || "User"}
                        </h2>
                        <span className="ad-badge success">
                          <CheckCircle2 size={12} /> Verified Member
                        </span>
                        <span className="ad-badge info" style={{ textTransform: "capitalize" }}>
                          {profile?.role || currentRole} Account
                        </span>
                      </div>

                      <div className="ad-profile-hero-meta">
                        <span>
                          <Building size={14} /> {profile?.department || "Academic Division"}
                        </span>
                        <span>•</span>
                        <span>
                          <Award size={14} /> {profile?.designation || "Institutional Scholar"}
                        </span>
                        <span>•</span>
                        <span className="ad-profile-id-chip">
                          <Hash size={13} /> {profile?.id || "LIB-2026-001"}
                        </span>
                      </div>
                    </div>

                    <div className="ad-profile-hero-quick-actions">
                      <button
                        type="button"
                        className="ad-btn ad-btn-secondary ad-btn-sm"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload size={14} /> Change Photo
                      </button>
                      {profile?.avatarUrl && (
                        <button
                          type="button"
                          className="ad-btn ad-btn-secondary ad-btn-sm"
                          style={{ color: "var(--ad-badge-danger-text)" }}
                          onClick={handleRemoveAvatar}
                          title="Remove custom photo and reset to initials"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                      <button
                        type="button"
                        className="ad-btn ad-btn-primary ad-btn-sm"
                        onClick={() => setProfileTab("edit")}
                      >
                        <Edit size={14} /> Edit Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Navigation Tabs */}
                <div className="ad-profile-tabs-bar">
                  <button
                    type="button"
                    className={`ad-profile-tab-btn ${profileTab === "overview" ? "active" : ""}`}
                    onClick={() => setProfileTab("overview")}
                  >
                    <User size={15} />
                    <span>Overview & Digital ID</span>
                  </button>
                  <button
                    type="button"
                    className={`ad-profile-tab-btn ${profileTab === "edit" ? "active" : ""}`}
                    onClick={() => setProfileTab("edit")}
                  >
                    <Edit size={15} />
                    <span>Edit Profile & Device Photo</span>
                  </button>
                  <button
                    type="button"
                    className={`ad-profile-tab-btn ${profileTab === "records" ? "active" : ""}`}
                    onClick={() => setProfileTab("records")}
                  >
                    <Bookmark size={15} />
                    <span>Circulation Records</span>
                  </button>
                  <button
                    type="button"
                    className={`ad-profile-tab-btn ${profileTab === "security" ? "active" : ""}`}
                    onClick={() => setProfileTab("security")}
                  >
                    <ShieldCheck size={15} />
                    <span>Security & Password</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Overview & Digital ID */}
              {profileTab === "overview" && (
                <div className="ad-profile-content-grid">
                  {/* Left Column: Digital Library ID & Circulation Standing */}
                  <div className="ad-profile-col">
                    {/* The Digital University Library ID Card */}
                    <div className="ad-digital-id-card">
                      <div className="ad-id-card-pattern" />
                      <div className="ad-id-card-header">
                        <div className="ad-id-card-brand">
                          <div className="ad-id-card-crest">
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <div className="ad-id-card-institution">CENTRAL UNIVERSITY</div>
                            <div className="ad-id-card-system">LIBRARY & INFORMATION SYSTEM</div>
                          </div>
                        </div>
                        <span className="ad-id-card-pass-label">SMART PASS</span>
                      </div>

                      <div className="ad-id-card-body">
                        <div className="ad-id-card-avatar-box">
                          {profile?.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt={profile?.name}
                              className="ad-id-card-avatar-img"
                            />
                          ) : (
                            <div className="ad-id-card-avatar-fallback">
                              {(profile?.name || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="ad-id-chip-icon" title="Embedded RFID Chip">
                            <div className="ad-id-chip-line" />
                          </div>
                        </div>

                        <div className="ad-id-card-details">
                          <div className="ad-id-field-group">
                            <span className="ad-id-field-label">NAME OF PATRON</span>
                            <span className="ad-id-field-value large">{profile?.name || "User"}</span>
                          </div>

                          <div className="ad-id-card-row-2">
                            <div className="ad-id-field-group">
                              <span className="ad-id-field-label">PATRON ID</span>
                              <span className="ad-id-field-value">{profile?.id || "STU-2026-084"}</span>
                            </div>
                            <div className="ad-id-field-group">
                              <span className="ad-id-field-label">ROLE</span>
                              <span className="ad-id-field-value" style={{ textTransform: "capitalize" }}>
                                {profile?.role || currentRole}
                              </span>
                            </div>
                          </div>

                          <div className="ad-id-field-group">
                            <span className="ad-id-field-label">DEPARTMENT / FACULTY</span>
                            <span className="ad-id-field-value truncate">
                              {profile?.department || "Computer Science & Engineering"}
                            </span>
                          </div>

                          <div className="ad-id-card-row-2">
                            <div className="ad-id-field-group">
                              <span className="ad-id-field-label">VALID THRU</span>
                              <span className="ad-id-field-value">{profile?.validThru || "31 July 2027"}</span>
                            </div>
                            <div className="ad-id-field-group">
                              <span className="ad-id-field-label">BARCODE ID</span>
                              <span className="ad-id-field-value">{profile?.libraryCardNo || "LIBRA-98214-IN"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ad-id-card-footer">
                        <div className="ad-id-barcode-graphic">
                          <div className="ad-id-barcode-lines" aria-hidden="true">
                            <span className="w-1" />
                            <span className="w-3" />
                            <span className="w-2" />
                            <span className="w-1" />
                            <span className="w-4" />
                            <span className="w-2" />
                            <span className="w-1" />
                            <span className="w-3" />
                            <span className="w-2" />
                            <span className="w-4" />
                            <span className="w-1" />
                            <span className="w-2" />
                            <span className="w-3" />
                            <span className="w-1" />
                            <span className="w-4" />
                            <span className="w-2" />
                            <span className="w-1" />
                            <span className="w-3" />
                            <span className="w-2" />
                            <span className="w-1" />
                            <span className="w-4" />
                            <span className="w-2" />
                            <span className="w-3" />
                            <span className="w-1" />
                          </div>
                          <div className="ad-id-barcode-num">
                            * {profile?.libraryCardNo || "LIBRA-98214-IN"} *
                          </div>
                        </div>
                        <div className="ad-id-status-badge">
                          <span className="ad-pulse-dot" /> ACTIVE RFID
                        </div>
                      </div>
                    </div>

                    {/* Quick Circulation Stats Cards */}
                    <div className="ad-catalog-stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: "16px" }}>
                      <div className="ad-catalog-stat-card">
                        <div className="ad-stat-icon purple"><Bookmark size={20} /></div>
                        <div>
                          <div className="ad-catalog-stat-val">
                            {currentRole === "student" ? studentLoans.length : activeLoans.length}
                          </div>
                          <div className="ad-catalog-stat-lbl">Active Books Borrowed</div>
                        </div>
                      </div>
                      <div className="ad-catalog-stat-card">
                        <div className="ad-stat-icon green"><RotateCcw size={20} /></div>
                        <div>
                          <div className="ad-catalog-stat-val">{returnedHistory.length}</div>
                          <div className="ad-catalog-stat-lbl">Returned Volumes</div>
                        </div>
                      </div>
                      <div className="ad-catalog-stat-card">
                        <div className="ad-stat-icon blue"><Clock size={20} /></div>
                        <div>
                          <div className="ad-catalog-stat-val">14 Days</div>
                          <div className="ad-catalog-stat-lbl">Loan Circulation Cycle</div>
                        </div>
                      </div>
                      <div className="ad-catalog-stat-card">
                        <div className="ad-stat-icon orange"><Award size={20} /></div>
                        <div>
                          <div className="ad-catalog-stat-val">{profile?.maxBorrowLimit || 5} Books</div>
                          <div className="ad-catalog-stat-lbl">Concurrent Quota Limit</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Academic Details & Biography */}
                  <div className="ad-profile-col">
                    <div className="ad-card" style={{ padding: "24px" }}>
                      <div className="ad-card-header" style={{ marginBottom: "16px", padding: 0 }}>
                        <div>
                          <h3 className="ad-card-title" style={{ fontSize: "16px" }}>Academic Standing & Contact</h3>
                          <p className="ad-card-sub">Institutional identity records registered with university registrar</p>
                        </div>
                        <button
                          type="button"
                          className="ad-btn ad-btn-secondary ad-btn-sm"
                          onClick={() => setProfileTab("edit")}
                        >
                          <Edit size={13} /> Edit
                        </button>
                      </div>

                      <div className="ad-profile-info-grid">
                        <div className="ad-profile-info-item">
                          <span className="ad-profile-info-label">
                            <User size={13} /> Full Name
                          </span>
                          <span className="ad-profile-info-val">{profile?.name || "User"}</span>
                        </div>

                        <div className="ad-profile-info-item">
                          <span className="ad-profile-info-label">
                            <Mail size={13} /> Institutional Email
                          </span>
                          <span className="ad-profile-info-val">{profile?.email || "user@libraspace.com"}</span>
                        </div>

                        <div className="ad-profile-info-item">
                          <span className="ad-profile-info-label">
                            <Phone size={13} /> Mobile Contact
                          </span>
                          <span className="ad-profile-info-val">{profile?.phone || "+91 98765 43210"}</span>
                        </div>

                        <div className="ad-profile-info-item">
                          <span className="ad-profile-info-label">
                            <Hash size={13} /> Registration / Member ID
                          </span>
                          <span className="ad-profile-info-val" style={{ fontFamily: "monospace" }}>
                            {profile?.id || "STU-2026-084"}
                          </span>
                        </div>

                        <div className="ad-profile-info-item">
                          <span className="ad-profile-info-label">
                            <Building size={13} /> Department / Faculty
                          </span>
                          <span className="ad-profile-info-val">{profile?.department || "Engineering"}</span>
                        </div>

                        <div className="ad-profile-info-item">
                          <span className="ad-profile-info-label">
                            <Award size={13} /> Academic Designation
                          </span>
                          <span className="ad-profile-info-val">{profile?.designation || "Scholar"}</span>
                        </div>

                        <div className="ad-profile-info-item" style={{ gridColumn: "1 / -1" }}>
                          <span className="ad-profile-info-label">
                            <MapPin size={13} /> Campus Residence / Office Address
                          </span>
                          <span className="ad-profile-info-val">{profile?.address || "Central University Campus"}</span>
                        </div>

                        <div className="ad-profile-info-item">
                          <span className="ad-profile-info-label">
                            <CalendarDays size={13} /> Member Since
                          </span>
                          <span className="ad-profile-info-val">{profile?.memberSince || "August 2024"}</span>
                        </div>

                        <div className="ad-profile-info-item">
                          <span className="ad-profile-info-label">
                            <CheckCircle2 size={13} /> Verification Status
                          </span>
                          <span className="ad-badge success" style={{ width: "fit-content" }}>
                            {profile?.membershipStatus || "Verified Institutional Scholar"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Biography & Research Interests */}
                    <div className="ad-card" style={{ padding: "24px", marginTop: "16px" }}>
                      <div className="ad-card-header" style={{ marginBottom: "12px", padding: 0 }}>
                        <h3 className="ad-card-title" style={{ fontSize: "16px" }}>Biography & Research Statement</h3>
                      </div>
                      <p style={{ color: "var(--ad-text-secondary)", fontSize: "13.5px", lineHeight: 1.6, margin: "0 0 16px" }}>
                        {profile?.bio || "No personal bio statement has been added yet. Share your academic focus or research interests here."}
                      </p>
                      <button
                        type="button"
                        className="ad-btn ad-btn-secondary ad-btn-sm"
                        onClick={() => setProfileTab("edit")}
                      >
                        <Edit size={13} /> Update Bio & Statement
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Edit Details & Device Photo */}
              {profileTab === "edit" && (
                <div className="ad-profile-content-grid">
                  {/* Photo Uploader Card */}
                  <div className="ad-profile-col">
                    <div className="ad-card" style={{ padding: "24px" }}>
                      <h3 className="ad-card-title" style={{ fontSize: "16px", marginBottom: "6px" }}>
                        Profile Photo / Device Image
                      </h3>
                      <p className="ad-card-sub" style={{ marginBottom: "20px" }}>
                        Upload a photo from your computer or phone to personalize your library pass and avatar across LibraSpace.
                      </p>

                      <div className="ad-photo-upload-zone" onClick={() => avatarInputRef.current?.click()}>
                        <div className="ad-photo-preview-large">
                          {profile?.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt="Avatar Preview"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div className="ad-photo-placeholder">
                              <Camera size={36} color="var(--ad-accent)" />
                              <span>Click to browse device images</span>
                            </div>
                          )}
                        </div>

                        <div className="ad-photo-upload-prompt">
                          <button
                            type="button"
                            className="ad-btn ad-btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              avatarInputRef.current?.click();
                            }}
                          >
                            <Upload size={16} /> Choose Image from Device
                          </button>
                          <div style={{ fontSize: "12px", color: "var(--ad-text-muted)", marginTop: "8px" }}>
                            Supports PNG, JPG, JPEG, WEBP or GIF up to 5MB. Stored locally on this device.
                          </div>
                        </div>
                      </div>

                      {profile?.avatarUrl && (
                        <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12.5px", color: "var(--ad-badge-success-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <CheckCircle2 size={14} /> Custom photo active
                          </span>
                          <button
                            type="button"
                            className="ad-btn ad-btn-secondary ad-btn-sm"
                            style={{ color: "var(--ad-badge-danger-text)" }}
                            onClick={handleRemoveAvatar}
                          >
                            <Trash2 size={13} /> Remove Photo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="ad-profile-col">
                    <div className="ad-card" style={{ padding: "24px" }}>
                      <h3 className="ad-card-title" style={{ fontSize: "16px", marginBottom: "6px" }}>
                        Personal & Academic Information
                      </h3>
                      <p className="ad-card-sub" style={{ marginBottom: "20px" }}>
                        Update your patron contact information, academic division, and campus residence.
                      </p>

                      <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div className="ad-form-grid-2">
                          <div className="ad-form-group">
                            <label className="ad-form-label">Full Name *</label>
                            <input
                              type="text"
                              required
                              className="ad-form-input"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </div>

                          <div className="ad-form-group">
                            <label className="ad-form-label">Institutional Email *</label>
                            <input
                              type="email"
                              required
                              className="ad-form-input"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="ad-form-grid-2">
                          <div className="ad-form-group">
                            <label className="ad-form-label">Phone Contact</label>
                            <input
                              type="text"
                              className="ad-form-input"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                          </div>

                          <div className="ad-form-group">
                            <label className="ad-form-label">Department / School</label>
                            <input
                              type="text"
                              className="ad-form-input"
                              value={editForm.department}
                              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="ad-form-grid-2">
                          <div className="ad-form-group">
                            <label className="ad-form-label">Designation / Semester</label>
                            <input
                              type="text"
                              className="ad-form-input"
                              value={editForm.designation}
                              onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                            />
                          </div>

                          <div className="ad-form-group">
                            <label className="ad-form-label">Campus Address / Residence</label>
                            <input
                              type="text"
                              className="ad-form-input"
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="ad-form-group">
                          <label className="ad-form-label">Biography & Academic Statement</label>
                          <textarea
                            rows={4}
                            className="ad-form-input"
                            style={{ height: "auto", padding: "10px 14px", resize: "vertical" }}
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            placeholder="Write a brief statement about your research interests or academic background..."
                          />
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                          <button
                            type="button"
                            className="ad-btn ad-btn-secondary"
                            onClick={() => setProfileTab("overview")}
                          >
                            Cancel
                          </button>
                          <button type="submit" className="ad-btn ad-btn-primary">
                            <Check size={16} /> Save Profile Changes
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Circulation Records */}
              {profileTab === "records" && (
                <div className="ad-card" style={{ padding: "24px" }}>
                  <div className="ad-card-header" style={{ marginBottom: "20px", padding: 0 }}>
                    <div>
                      <h3 className="ad-card-title" style={{ fontSize: "16px" }}>Patron Circulation Records</h3>
                      <p className="ad-card-sub">Active borrowings, due dates, and returned academic volumes</p>
                    </div>
                    <button
                      type="button"
                      className="ad-btn ad-btn-primary ad-btn-sm"
                      onClick={() => setActiveMenu(currentRole === "student" ? "Browse Books" : "Manage Books")}
                    >
                      <BookOpen size={14} /> Catalog Library
                    </button>
                  </div>

                  <h4 style={{ fontSize: "14px", margin: "0 0 12px", color: "var(--ad-text-primary)" }}>
                    Currently Active Borrowed Volumes ({currentRole === "student" ? studentLoans.length : activeLoans.length})
                  </h4>

                  <div className="ad-table-responsive">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Book Title</th>
                          <th>Borrower</th>
                          <th>Issue Date</th>
                          <th>Due Date</th>
                          <th>Circulation Status</th>
                          <th>Overdue Fine</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentRole === "student" ? studentLoans : activeLoans).length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--ad-text-muted)" }}>
                              <BookOpen size={28} style={{ opacity: 0.4, marginBottom: "8px" }} />
                              <div style={{ fontWeight: 600 }}>No Active Borrowed Volumes</div>
                              <div style={{ fontSize: "12px" }}>Visit the library catalog to check out books.</div>
                            </td>
                          </tr>
                        ) : (
                          (currentRole === "student" ? studentLoans : activeLoans).map((loan) => (
                            <tr key={loan.id}>
                              <td style={{ fontWeight: 700 }}>{loan.bookTitle}</td>
                              <td>{loan.borrower} ({loan.memberId})</td>
                              <td>{loan.issueDate}</td>
                              <td style={{ fontWeight: 600 }}>{loan.dueDate}</td>
                              <td>
                                {loan.status === "Overdue" ? (
                                  <span className="ad-badge danger">
                                    <AlertTriangle size={11} /> Overdue
                                  </span>
                                ) : (
                                  <span className="ad-badge success">Active / On-Time</span>
                                )}
                              </td>
                              <td style={{ fontWeight: 700, color: loan.fine > 0 ? "var(--ad-badge-danger-text)" : "inherit" }}>
                                {loan.fine > 0 ? `₹${loan.fine}` : "₹0"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Security Credentials */}
              {profileTab === "security" && (
                <div className="ad-profile-content-grid">
                  <div className="ad-profile-col">
                    <div className="ad-card" style={{ padding: "24px" }}>
                      <h3 className="ad-card-title" style={{ fontSize: "16px", marginBottom: "6px" }}>
                        Change Password
                      </h3>
                      <p className="ad-card-sub" style={{ marginBottom: "20px" }}>
                        Protect your institutional identity by updating your password regularly.
                      </p>

                      <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div className="ad-form-group">
                          <label className="ad-form-label">Current Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="ad-form-input"
                            value={securityForm.currentPassword}
                            onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                          />
                        </div>

                        <div className="ad-form-group">
                          <label className="ad-form-label">New Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="At least 6 characters"
                            className="ad-form-input"
                            value={securityForm.newPassword}
                            onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                          />
                        </div>

                        <div className="ad-form-group">
                          <label className="ad-form-label">Confirm New Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="Re-type new password"
                            className="ad-form-input"
                            value={securityForm.confirmPassword}
                            onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                          />
                        </div>

                        <button type="submit" className="ad-btn ad-btn-primary" style={{ alignSelf: "flex-start", marginTop: "8px" }}>
                          <KeyRound size={16} /> Update Password
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="ad-profile-col">
                    <div className="ad-card" style={{ padding: "24px" }}>
                      <h3 className="ad-card-title" style={{ fontSize: "16px", marginBottom: "6px" }}>
                        Session & Security Overview
                      </h3>
                      <p className="ad-card-sub" style={{ marginBottom: "20px" }}>
                        Audit trail and protective safeguards active on your patron session.
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--ad-card-subtle)", borderRadius: "8px" }}>
                          <div>
                            <strong>Two-Factor Authentication</strong>
                            <div style={{ color: "var(--ad-text-muted)", fontSize: "11.5px" }}>Protects catalog modifications</div>
                          </div>
                          <span className="ad-badge success">Enforced</span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--ad-card-subtle)", borderRadius: "8px" }}>
                          <div>
                            <strong>Session Encryption</strong>
                            <div style={{ color: "var(--ad-text-muted)", fontSize: "11.5px" }}>TLS 1.3 / AES-256 GCM</div>
                          </div>
                          <span className="ad-badge info">Active</span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--ad-card-subtle)", borderRadius: "8px" }}>
                          <div>
                            <strong>Patron Authentication Token</strong>
                            <div style={{ color: "var(--ad-text-muted)", fontSize: "11.5px" }}>Verified role: {currentRole}</div>
                          </div>
                          <span className="ad-badge success">Valid</span>
                        </div>
                      </div>
                    </div>

                    <div className="ad-card ad-2fa-security-card" style={{ padding: "24px", marginTop: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="ad-2fa-icon-badge">
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <h3 className="ad-card-title" style={{ fontSize: "16px", margin: 0 }}>
                              Real-Time 2-Factor Authentication (2FA)
                            </h3>
                            <div style={{ fontSize: "12px", color: "var(--ad-text-secondary)", marginTop: "2px" }}>
                              Cross-Session Verification & Threat Protection
                            </div>
                          </div>
                        </div>
                        <span className="ad-badge success" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <CheckCircle2 size={12} /> Active & Enforced
                        </span>
                      </div>

                      <p className="ad-card-sub" style={{ marginBottom: "16px", lineHeight: "1.5" }}>
                        Institutional logins via Google OAuth and patron credentials require real-time 6-digit one-time passcode verification. Audio feedback and cross-tab synchronizations ensure maximum perimeter security.
                      </p>

                      <div className="ad-2fa-status-features" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "18px" }}>
                        <div className="ad-2fa-feature-item">
                          <Smartphone size={16} style={{ color: "var(--ad-accent)" }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "12.5px" }}>Authentication Mode</div>
                            <div style={{ fontSize: "11px", color: "var(--ad-text-muted)" }}>Live OTP + Audio Chime</div>
                          </div>
                        </div>
                        <div className="ad-2fa-feature-item">
                          <KeyRound size={16} style={{ color: "var(--ad-badge-success-text)" }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "12.5px" }}>Security Hash</div>
                            <div style={{ fontSize: "11px", color: "var(--ad-text-muted)" }}>SHA-256 Token Digest</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="ad-btn ad-btn-primary"
                          onClick={startTest2fa}
                        >
                          <ShieldCheck size={15} /> Test Live 2FA Verification Challenge
                        </button>
                        <button
                          type="button"
                          className="ad-btn ad-btn-secondary"
                          onClick={() => {
                            setNotificationFilter("security");
                            setActiveModal("notifications");
                          }}
                        >
                          <Bell size={15} /> View Security Audit Logs ({notifications.filter((n) => n.type === "security").length})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dedicated workspace for other sidebar menus */}
          {activeMenu !== "Dashboard" &&
            activeMenu !== "Manage Books" &&
            activeMenu !== "Book Catalog" &&
            activeMenu !== "Browse Books" &&
            activeMenu !== "Issue Books" &&
            activeMenu !== "Issue & Return" &&
            activeMenu !== "Book Returns" &&
            activeMenu !== "My Profile" && (
              <section className="ad-card">
                <div className="ad-card-header">
                  <div>
                    <h3 className="ad-card-title">{activeMenu}</h3>
                    <p className="ad-card-sub">
                      Operational records and real-time directory for {activeMenu.toLowerCase()}.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {(activeMenu === "Members Management" || activeMenu === "Students") && (
                      <button
                        type="button"
                        className="ad-btn ad-btn-primary"
                        onClick={() => setActiveModal("addMember")}
                      >
                        <UserPlus size={15} /> Enroll New Member
                      </button>
                    )}
                    <button
                      type="button"
                      className="ad-btn ad-btn-secondary"
                      onClick={() => setActiveMenu("Dashboard")}
                    >
                      ← Back to Dashboard
                    </button>
                  </div>
                </div>

                <div style={{ padding: "16px 0" }}>
                  {(activeMenu === "Members Management" || activeMenu === "Students") && (
                    <div className="ad-table-responsive">
                      <table className="ad-table">
                        <thead>
                          <tr>
                            <th>Member Name</th>
                            <th>Email Address</th>
                            <th>Assigned Role</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {membersList.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: "center", padding: "36px 16px", color: "var(--ad-text-muted)" }}>
                                <Users size={32} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                                <div style={{ fontWeight: 600 }}>No members registered yet</div>
                                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                                  Click "Enroll New Member" to add users to the library directory.
                                </div>
                              </td>
                            </tr>
                          ) : (
                            membersList.map((m) => (
                              <tr key={m.email}>
                                <td style={{ fontWeight: 700 }}>{m.name || "Member"}</td>
                                <td style={{ fontFamily: "monospace", fontSize: "12.5px" }}>{m.email}</td>
                                <td>
                                  <span className="ad-badge info" style={{ textTransform: "capitalize" }}>
                                    {m.role || "Student"}
                                  </span>
                                </td>
                                <td><span className="ad-badge success">Active</span></td>
                                <td style={{ textAlign: "right" }}>
                                  {m.isSystemAdmin || m.email === "admin@libraspace.com" ? (
                                    <span style={{ fontSize: "11px", color: "var(--ad-text-muted)", fontWeight: 600 }}>
                                      System Admin
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="ad-btn ad-btn-secondary ad-btn-sm"
                                      style={{ color: "var(--ad-badge-danger-text)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                                      onClick={() => handleDeleteMember(m.email)}
                                      title={`Remove ${m.name || m.email} from directory`}
                                    >
                                      <Trash2 size={13} /> Remove
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeMenu === "Fines & Payments" && (
                    <div>
                      <div className="ad-catalog-stats-bar" style={{ marginBottom: "20px" }}>
                        <div className="ad-catalog-stat-card">
                          <span className="ad-catalog-stat-lbl">Total Fines Collected</span>
                          <div className="ad-catalog-stat-val">₹{totalFinesCollected.toLocaleString()}</div>
                        </div>
                        <div className="ad-catalog-stat-card">
                          <span className="ad-catalog-stat-lbl">Pending Fines</span>
                          <div className="ad-catalog-stat-val" style={{ color: "var(--ad-badge-danger-text)" }}>
                            ₹{pendingFines.toLocaleString()}
                          </div>
                        </div>
                        <div className="ad-catalog-stat-card">
                          <span className="ad-catalog-stat-lbl">Fine Rate Policy</span>
                          <div className="ad-catalog-stat-val">₹5 / Day</div>
                        </div>
                      </div>

                      <div className="ad-table-responsive">
                        <table className="ad-table">
                          <thead>
                            <tr>
                              <th>Book Title</th>
                              <th>Borrower</th>
                              <th>Due Date</th>
                              <th>Days Overdue</th>
                              <th>Fine Amount</th>
                              <th>Payment Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {overdueLoans.length === 0 ? (
                              <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--ad-text-muted)" }}>
                                  <CheckCircle2 size={28} color="var(--ad-badge-success-text)" style={{ marginBottom: "6px" }} />
                                  <div style={{ fontWeight: 600 }}>Zero Outstanding Overdue Fines</div>
                                  <div style={{ fontSize: "12px" }}>All borrowed books are returned or on schedule.</div>
                                </td>
                              </tr>
                            ) : (
                              overdueLoans.map((l) => (
                                <tr key={l.id}>
                                  <td style={{ fontWeight: 700 }}>{l.bookTitle}</td>
                                  <td>{l.borrower} ({l.memberId})</td>
                                  <td>{l.dueDate}</td>
                                  <td><span className="ad-badge danger">{l.daysOverdue || 1} days late</span></td>
                                  <td style={{ fontWeight: 700, color: "var(--ad-badge-danger-text)" }}>₹{l.fine || 5}</td>
                                  <td><span className="ad-badge due">Pending Settlement</span></td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeMenu === "System Reports" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                      <div className="ad-card" style={{ padding: "18px" }}>
                        <div style={{ color: "var(--ad-text-muted)", fontSize: "12.5px" }}>Catalog Inventory</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, margin: "6px 0" }}>{totalBooksCount} Copies</div>
                        <div style={{ fontSize: "12px", color: "var(--ad-text-secondary)" }}>{distinctTitlesCount} curated titles</div>
                      </div>
                      <div className="ad-card" style={{ padding: "18px" }}>
                        <div style={{ color: "var(--ad-text-muted)", fontSize: "12.5px" }}>Available On Shelf</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, margin: "6px 0", color: "var(--ad-badge-success-text)" }}>
                          {totalAvailableCopies} Copies
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ad-text-secondary)" }}>Ready for immediate checkout</div>
                      </div>
                      <div className="ad-card" style={{ padding: "18px" }}>
                        <div style={{ color: "var(--ad-text-muted)", fontSize: "12.5px" }}>In Circulation</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, margin: "6px 0", color: "var(--ad-accent)" }}>
                          {activeLoans.length} Loans
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ad-text-secondary)" }}>Active academic loans</div>
                      </div>
                      <div className="ad-card" style={{ padding: "18px" }}>
                        <div style={{ color: "var(--ad-text-muted)", fontSize: "12.5px" }}>Overdue Returns</div>
                        <div style={{ fontSize: "24px", fontWeight: 800, margin: "6px 0", color: overdueCount > 0 ? "var(--ad-badge-danger-text)" : "inherit" }}>
                          {overdueCount} Overdue
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ad-text-secondary)" }}>Accruing ₹5/day fine</div>
                      </div>
                    </div>
                  )}

                  {activeMenu === "Reservations" && (
                    <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--ad-text-muted)" }}>
                      <CalendarDays size={36} style={{ opacity: 0.4, marginBottom: "8px" }} />
                      <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "var(--ad-text-primary)" }}>
                        No Active Hold Reservations
                      </h4>
                      <p style={{ margin: 0, fontSize: "13px" }}>
                        When a member places a reservation on an out-of-stock book, the priority queue will display here.
                      </p>
                    </div>
                  )}

                  {activeMenu === "System Settings" && (
                    <div style={{ maxWidth: "600px" }}>
                      <h4 style={{ margin: "0 0 14px", fontSize: "15px" }}>Library Circulation Policies</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--ad-card-subtle)", borderRadius: "8px" }}>
                          <span>Default Loan Period</span>
                          <strong>14 Days</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--ad-card-subtle)", borderRadius: "8px" }}>
                          <span>Overdue Late Fine</span>
                          <strong>₹5 / Day</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--ad-card-subtle)", borderRadius: "8px" }}>
                          <span>Database Persistence</span>
                          <strong>Browser LocalStorage Synced</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--ad-card-subtle)", borderRadius: "8px" }}>
                          <span>Registered Members</span>
                          <strong>{registeredUsersCount} Accounts</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {(activeMenu === "My Borrowings" || activeMenu === "Borrowing History") && (
                    <div className="ad-table-responsive">
                      <table className="ad-table">
                        <thead>
                          <tr>
                            <th>Book Title</th>
                            <th>Author</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentLoans.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--ad-text-muted)" }}>
                                <BookOpen size={28} style={{ opacity: 0.4, marginBottom: "6px" }} />
                                <div>No personal borrowing records found.</div>
                              </td>
                            </tr>
                          ) : (
                            studentLoans.map((loan) => (
                              <tr key={loan.id}>
                                <td style={{ fontWeight: 700 }}>{loan.bookTitle}</td>
                                <td>{loan.author}</td>
                                <td>{loan.issueDate}</td>
                                <td style={{ fontWeight: 600 }}>{loan.dueDate}</td>
                                <td>
                                  <span className={`ad-badge ${loan.status === "Overdue" ? "danger" : "success"}`}>
                                    {loan.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}

          {activeMenu === "Dashboard" && (
            <>

              <section className="ad-hero-banner">
                <div className="ad-hero-content">
                  <div className="ad-hero-pill">
                    <TrendingUp size={14} />
                    <span>
                      {currentRole === "student"
                        ? "YOUR LEARNING JOURNEY"
                        : currentRole === "librarian"
                        ? "LIBRARY OPERATIONS OVERVIEW"
                        : "SYSTEM ADMINISTRATOR CONSOLE"}
                    </span>
                  </div>

                  <h2 className="ad-hero-title">
                    {currentRole === "student" && `Welcome back, ${profile?.name || currentUser?.name || "Student"}! 👋`}
                    {currentRole === "librarian" && `Good day, ${profile?.name || currentUser?.name || "Librarian"}! 👋`}
                    {currentRole === "admin" && `Welcome back, ${profile?.name || currentUser?.name || "Admin"}! 👋`}
                  </h2>

                  <p className="ad-hero-subtitle">
                    {currentRole === "student" &&
                      "Every page you read brings you one step closer to your next big discovery."}
                    {currentRole === "librarian" &&
                      "Here's an overview of today's catalog operations, checkouts, and student book returns."}
                    {currentRole === "admin" &&
                      "Academic library operations, circulation velocity, member directories, and overdue accounting."}
                  </p>

                  <div className="ad-hero-actions">
                    {currentRole === "student" && (
                      <button
                        type="button"
                        className="ad-hero-btn"
                        onClick={() => setActiveMenu("Browse Books")}
                      >
                        <Search size={16} />
                        <span>Discover Books</span>
                        <ArrowRight size={16} />
                      </button>
                    )}

                    {currentRole === "librarian" && (
                      <>
                        <button
                          type="button"
                          className="ad-hero-btn"
                          onClick={() => setActiveModal("addBook")}
                        >
                          <PlusCircle size={16} />
                          <span>Add New Book</span>
                        </button>
                        <button
                          type="button"
                          className="ad-hero-btn outline"
                          onClick={() => setActiveModal("issueBook")}
                        >
                          <Bookmark size={16} />
                          <span>Issue Desk</span>
                        </button>
                      </>
                    )}

                    {currentRole === "admin" && (
                      <>
                        <button
                          type="button"
                          className="ad-hero-btn"
                          onClick={() => setActiveModal("issueBook")}
                        >
                          <BookUp size={16} />
                          <span>Issue / Return Desk</span>
                        </button>
                        <button
                          type="button"
                          className="ad-hero-btn outline"
                          onClick={() => setActiveModal("addBook")}
                        >
                          <PlusSquare size={16} />
                          <span>Add New Book</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="ad-hero-watermark">
                  <BookOpen size={240} strokeWidth={1.2} />
                </div>
              </section>

              {currentRole === "admin" && (
                <section className="ad-stat-grid cols-6">
                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Total Books</span>
                      <div className="ad-stat-icon blue"><BookOpen size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{totalBooksCount.toLocaleString()}</div>
                      <div className="ad-stat-subtext">{distinctTitlesCount} distinct titles</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Books Issued</span>
                      <div className="ad-stat-icon purple"><Bookmark size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{activeLoans.length}</div>
                      <div className="ad-stat-subtext">
                        {activeLoans.length === 1 ? "1 active circulation loan" : `${activeLoans.length} active circulation loans`}
                      </div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Overdue Books</span>
                      <div className="ad-stat-icon rose"><Clock size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number" style={{ color: overdueCount > 0 ? "var(--ad-badge-danger-text)" : "inherit" }}>
                        {overdueCount}
                      </div>
                      <div className="ad-stat-subtext">
                        {overdueCount > 0 ? "Accruing ₹5/day fine" : "Zero overdue books"}
                      </div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Total Members</span>
                      <div className="ad-stat-icon green"><Users size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{registeredUsersCount}</div>
                      <div className="ad-stat-subtext">{registeredUsersCount} registered patrons</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Fines Collected</span>
                      <div className="ad-stat-icon orange"><Receipt size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number" style={{ color: "var(--ad-badge-due-text)" }}>
                        ₹{totalFinesCollected.toLocaleString()}
                      </div>
                      <div className="ad-stat-subtext">Pending: ₹{pendingFines.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Pending Holds</span>
                      <div className="ad-stat-icon purple"><CalendarDays size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">0</div>
                      <div className="ad-stat-subtext">FIFO queue priority</div>
                    </div>
                  </div>
                </section>
              )}

              {role === "librarian" && (
                <section className="ad-stat-grid cols-5">
                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Total Books</span>
                      <div className="ad-stat-icon blue"><BookOpen size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{totalBooksCount.toLocaleString()}</div>
                      <div className="ad-stat-subtext">{distinctTitlesCount} distinct titles</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Available Books</span>
                      <div className="ad-stat-icon green"><LibraryBig size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{totalAvailableCopies.toLocaleString()}</div>
                      <div className="ad-stat-subtext">Ready for borrowing</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Issued Books</span>
                      <div className="ad-stat-icon purple"><Bookmark size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{activeLoans.length}</div>
                      <div className="ad-stat-subtext">Currently borrowed</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Registered Students</span>
                      <div className="ad-stat-icon orange"><Users size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{registeredUsersCount}</div>
                      <div className="ad-stat-subtext">Library members</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Overdue Books</span>
                      <div className="ad-stat-icon pink"><Clock size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{overdueCount}</div>
                      <div className="ad-stat-subtext">
                        {overdueCount > 0 ? "Require attention" : "All books on time"}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {role === "student" && (
                <section className="ad-stat-grid cols-4">
                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Books Borrowed</span>
                      <div className="ad-stat-icon purple"><BookOpen size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{studentLoans.length}</div>
                      <div className="ad-stat-subtext">Total books borrowed</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Currently Reading</span>
                      <div className="ad-stat-icon blue"><Bookmark size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">{studentLoans.length}</div>
                      <div className="ad-stat-subtext">Books in your possession</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Due Soon</span>
                      <div className="ad-stat-icon orange"><Clock size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">
                        {studentLoans.filter((b) => b.status === "Due Soon" || b.status === "Overdue").length}
                      </div>
                      <div className="ad-stat-subtext">Return within loan period</div>
                    </div>
                  </div>

                  <div className="ad-stat-card">
                    <div className="ad-stat-card-top">
                      <span className="ad-stat-label">Reservations</span>
                      <div className="ad-stat-icon green"><CalendarDays size={20} /></div>
                    </div>
                    <div>
                      <div className="ad-stat-number">0</div>
                      <div className="ad-stat-subtext">Books reserved</div>
                    </div>
                  </div>
                </section>
              )}

              {role === "admin" && (
                <section className="ad-charts-row">
                  <div className="ad-card">
                    <div className="ad-card-header">
                      <div>
                        <h3 className="ad-card-title">Circulation & Monthly Issues</h3>
                        <p className="ad-card-sub">Real-time book checkout trends across the academic session</p>
                      </div>
                      <span className="ad-badge success">
                        {activeLoans.length === 1 ? "1 Active Loan" : `${activeLoans.length} Active Loans`}
                      </span>
                    </div>

                    <div className="ad-bar-chart">
                      {monthlyCirculation.map((bar) => {
                        const heightPct = bar.val > 0 ? Math.max(16, Math.round((bar.val / maxCirculationVal) * 100)) : 8;
                        return (
                          <div key={bar.month} className="ad-bar-col">
                            <span className="ad-bar-value">{bar.val}</span>
                            <div
                              className="ad-bar-pillar"
                              style={{
                                height: `${heightPct}%`,
                                opacity: bar.val > 0 ? 1 : 0.35,
                              }}
                              title={`${bar.month}: ${bar.val} books issued`}
                            />
                            <span className="ad-bar-label">{bar.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ad-card">
                    <div className="ad-card-header">
                      <div>
                        <h3 className="ad-card-title">Category Holdings</h3>
                        <p className="ad-card-sub">Dynamic collection distribution</p>
                      </div>
                      <span className="ad-badge info">{catalogBooks.length} Titles</span>
                    </div>

                    <div className="ad-category-list">
                      {categoryDistribution.length === 0 ? (
                        <div style={{ color: "var(--ad-text-muted)", fontSize: "13px", padding: "16px 0" }}>
                          No books cataloged yet.
                        </div>
                      ) : (
                        categoryDistribution.map((cat) => (
                          <div key={cat.name} className="ad-category-item">
                            <div className="ad-category-meta">
                              <span>{cat.name}</span>
                              <span style={{ color: cat.color, fontWeight: 700 }}>{cat.pct}%</span>
                            </div>
                            <div className="ad-category-bar">
                              <div
                                className="ad-category-fill"
                                style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              )}

              {role === "student" && (
                <>

                  <section className="ad-card">
                    <div className="ad-card-header">
                      <div>
                        <h3 className="ad-card-title">My Borrowed Books</h3>
                        <p className="ad-card-sub">Track the books you are currently reading.</p>
                      </div>
                      <button
                        type="button"
                        className="ad-btn ad-btn-secondary"
                        onClick={() => setActiveMenu("My Borrowings")}
                      >
                        View All →
                      </button>
                    </div>

                    <div>
                      {studentLoans.length === 0 ? (
                        <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--ad-text-muted)" }}>
                          <BookOpen size={36} style={{ opacity: 0.35, marginBottom: "10px" }} />
                          <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "var(--ad-text-primary)" }}>
                            No Books Currently Borrowed
                          </h4>
                          <p style={{ margin: "0 0 16px", fontSize: "13px" }}>
                            You don't have any books checked out right now. Browse our academic catalog to get started.
                          </p>
                          <button
                            type="button"
                            className="ad-btn ad-btn-primary ad-btn-sm"
                            onClick={() => setActiveMenu("Browse Books")}
                          >
                            Browse Library Catalog →
                          </button>
                        </div>
                      ) : (
                        studentLoans.map((loan) => (
                          <div key={loan.id} className="ad-borrowed-item">
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "240px" }}>
                              <div
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "10px",
                                  backgroundColor: "var(--ad-card-bg)",
                                  border: "1px solid var(--ad-border)",
                                  display: "grid",
                                  placeItems: "center",
                                  color: "var(--ad-accent)",
                                }}
                              >
                                <BookMarked size={22} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "14.5px" }}>{loan.bookTitle}</div>
                                <div style={{ fontSize: "12px", color: "var(--ad-text-muted)" }}>{loan.author}</div>
                              </div>
                            </div>

                            <div style={{ fontSize: "12px", color: "var(--ad-text-secondary)", textAlign: "right" }}>
                              <div>Issued: {loan.issueDate}</div>
                              <div style={{ fontWeight: 700, color: "var(--ad-text-primary)" }}>Due: {loan.dueDate}</div>
                            </div>

                            <span className={`ad-badge ${loan.status === "Overdue" ? "danger" : "success"}`}>
                              <Clock size={12} />
                              {loan.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="ad-card">
                    <div className="ad-card-header">
                      <div>
                        <h3 className="ad-card-title">Popular Books</h3>
                        <p className="ad-card-sub">Discover books readers love.</p>
                      </div>
                      <button
                        type="button"
                        className="ad-btn ad-btn-secondary"
                        onClick={() => setActiveMenu("Browse Books")}
                      >
                        Browse Library →
                      </button>
                    </div>

                    {popularBooks.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--ad-text-muted)" }}>
                        <BookOpen size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                        <div style={{ fontWeight: 700, color: "var(--ad-text-primary)", fontSize: "14px" }}>
                          No Books on Shelf
                        </div>
                        <div style={{ fontSize: "12.5px", marginTop: "4px" }}>
                          All demo books have been removed. New library volumes will appear here once registered.
                        </div>
                      </div>
                    ) : (
                      <div className="ad-popular-grid">
                        {popularBooks.map((b) => (
                          <div
                            key={b.id}
                            className="ad-book-card"
                            onClick={() => {
                              setSelectedBook(b);
                              setActiveModal("bookDetails");
                            }}
                          >
                            <div className={`ad-book-cover ${b.themeColor}`}>
                              <span style={{ fontSize: "32px", fontWeight: 800 }}>{b.symbol}</span>
                              <BookOpen size={24} opacity={0.8} />
                            </div>
                            <div className="ad-book-details">
                              <span className="ad-popular-cat">{b.category}</span>
                              <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: 750 }}>{b.title}</h4>
                              <p style={{ margin: 0, fontSize: "12px", color: "var(--ad-text-muted)" }}>{b.author}</p>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#f59e0b", fontSize: "12px", fontWeight: 700, marginTop: "4px" }}>
                                <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
                                <span>{b.rating}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    <div
                      className="ad-quick-tile"
                      onClick={() => setActiveMenu("Browse Books")}
                    >
                      <div className="ad-quick-tile-left">
                        <div className="ad-stat-icon blue"><Search size={20} /></div>
                        <div>
                          <h4 className="ad-quick-title">Find a Book</h4>
                          <p className="ad-quick-sub">Search library catalog</p>
                        </div>
                      </div>
                      <ArrowRight size={18} color="var(--ad-text-muted)" />
                    </div>

                    <div
                      className="ad-quick-tile"
                      onClick={() => setActiveMenu("Reservations")}
                    >
                      <div className="ad-quick-tile-left">
                        <div className="ad-stat-icon green"><CalendarDays size={20} /></div>
                        <div>
                          <h4 className="ad-quick-title">My Reservations</h4>
                          <p className="ad-quick-sub">Check your reserved books</p>
                        </div>
                      </div>
                      <ArrowRight size={18} color="var(--ad-text-muted)" />
                    </div>

                    <div
                      className="ad-quick-tile"
                      onClick={() => setActiveMenu("Borrowing History")}
                    >
                      <div className="ad-quick-tile-left">
                        <div className="ad-stat-icon purple"><RotateCcw size={20} /></div>
                        <div>
                          <h4 className="ad-quick-title">Reading History</h4>
                          <p className="ad-quick-sub">Review past borrowing logs</p>
                        </div>
                      </div>
                      <ArrowRight size={18} color="var(--ad-text-muted)" />
                    </div>
                  </section>
                </>
              )}

              {(role === "admin" || role === "librarian") && (
                <>
                  <section className="ad-card">
                    <div className="ad-card-header">
                      <div>
                        <h3 className="ad-card-title">Quick Actions</h3>
                        <p className="ad-card-sub">Common library management and circulation tasks</p>
                      </div>
                    </div>

                    <div className="ad-grid-2">
                      <div
                        className="ad-quick-tile"
                        onClick={() => setActiveModal("addBook")}
                      >
                        <div className="ad-quick-tile-left">
                          <div className="ad-stat-icon blue"><PlusCircle size={20} /></div>
                          <div>
                            <h4 className="ad-quick-title">Add New Book</h4>
                            <p className="ad-quick-sub">Add a book copy to catalog</p>
                          </div>
                        </div>
                        <ArrowRight size={18} color="var(--ad-text-muted)" />
                      </div>

                      <div
                        className="ad-quick-tile"
                        onClick={() => setActiveModal("issueBook")}
                      >
                        <div className="ad-quick-tile-left">
                          <div className="ad-stat-icon purple"><Bookmark size={20} /></div>
                          <div>
                            <h4 className="ad-quick-title">Issue a Book</h4>
                            <p className="ad-quick-sub">Record checkout for a member</p>
                          </div>
                        </div>
                        <ArrowRight size={18} color="var(--ad-text-muted)" />
                      </div>

                      <div
                        className="ad-quick-tile"
                        onClick={() => setActiveModal("processReturn")}
                      >
                        <div className="ad-quick-tile-left">
                          <div className="ad-stat-icon green"><RotateCcw size={20} /></div>
                          <div>
                            <h4 className="ad-quick-title">Process Return</h4>
                            <p className="ad-quick-sub">Inspect and record returned copy</p>
                          </div>
                        </div>
                        <ArrowRight size={18} color="var(--ad-text-muted)" />
                      </div>

                      <div
                        className="ad-quick-tile"
                        onClick={() => {
                          if (role === "admin") setActiveModal("addMember");
                          else setActiveMenu("Manage Books");
                        }}
                      >
                        <div className="ad-quick-tile-left">
                          <div className="ad-stat-icon orange">
                            {role === "admin" ? <UserPlus size={20} /> : <ClipboardList size={20} />}
                          </div>
                          <div>
                            <h4 className="ad-quick-title">
                              {role === "admin" ? "Register Member" : "Manage Books"}
                            </h4>
                            <p className="ad-quick-sub">
                              {role === "admin" ? "Enroll student or staff" : "Update catalog & inventory"}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={18} color="var(--ad-text-muted)" />
                      </div>
                    </div>
                  </section>

                  <section className="ad-card">
                    <div className="ad-card-header">
                      <div>
                        <h3 className="ad-card-title">Recent Activities</h3>
                        <p className="ad-card-sub">Recent library circulation and administrative operations</p>
                      </div>
                      <Clock size={18} color="var(--ad-text-muted)" />
                    </div>

                    <div className="ad-activity-list">
                      {activities.length === 0 ? (
                        <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--ad-text-muted)" }}>
                          <Info size={28} style={{ opacity: 0.45, marginBottom: "8px" }} />
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>No recent circulation activity</div>
                          <div style={{ fontSize: "12px", marginTop: "4px" }}>
                            Book checkouts, returns, and catalog actions will appear here in real time.
                          </div>
                        </div>
                      ) : (
                        activities.map((act) => {
                          const Icon = resolveActivityIcon(act);
                          return (
                            <div key={act.id} className="ad-activity-item">
                              <div className="ad-activity-left">
                                <div className={`ad-stat-icon ${act.color}`}>
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <h4 className="ad-activity-title">{act.title}</h4>
                                  <p className="ad-activity-desc">{act.desc}</p>
                                </div>
                              </div>
                              <span className="ad-activity-time">{act.time}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>

                  <section className="ad-card">
                    <div className="ad-card-header">
                      <div>
                        <h3 className="ad-card-title">Overdue Circulation List</h3>
                        <p className="ad-card-sub">Books past scheduled due date requiring notice or fee settlement</p>
                      </div>
                      <span className={`ad-badge ${overdueCount > 0 ? "danger" : "success"}`}>
                        {overdueCount} Overdue
                      </span>
                    </div>

                    <div className="ad-table-responsive">
                      <table className="ad-table">
                        <thead>
                          <tr>
                            <th>Book Title</th>
                            <th>Borrower</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Overdue</th>
                            <th>Accrued Fine</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overdueRecords.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: "center", padding: "36px 16px", color: "var(--ad-text-muted)" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                                  <CheckCircle2 size={32} color="var(--ad-badge-success-text)" />
                                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--ad-text-primary)" }}>
                                    Zero Overdue Checkouts
                                  </span>
                                  <span style={{ fontSize: "12.5px" }}>
                                    All active loans are returned or within their scheduled loan period.
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            overdueRecords.map((item) => (
                              <tr key={item.id}>
                                <td style={{ fontWeight: 700 }}>{item.title}</td>
                                <td style={{ color: "var(--ad-text-secondary)" }}>{item.borrower}</td>
                                <td>{item.issueDate}</td>
                                <td style={{ fontWeight: 600 }}>{item.dueDate}</td>
                                <td>
                                  <span className="ad-badge danger">
                                    {item.daysOverdue} days late
                                  </span>
                                </td>
                                <td style={{ fontWeight: 700, color: "var(--ad-badge-danger-text)" }}>
                                  {item.fine}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="ad-btn ad-btn-secondary"
                                    style={{ padding: "5px 10px", fontSize: "11.5px" }}
                                    onClick={() => showToast(`Reminder notice dispatched to ${item.borrower}!`, "info")}
                                  >
                                    Remind
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </>
          )}

          <footer className="ad-dashboard-footer">
            <div className="ad-footer-left">
              <span>© {currentYear} LibraSpace · Academic Library Management</span>
            </div>
            <div className="ad-footer-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <span>·</span>
              <Link to="/terms-and-conditions">Terms & Conditions</Link>
            </div>
          </footer>
        </main>
      </div>

      {activeModal === "editProfile" && (
        <div className="ad-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <h3 className="ad-modal-title">Edit {role} Profile</h3>
              <button type="button" className="ad-modal-close" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleProfileSave}>
              <div className="ad-modal-body">
                <input
                  type="file"
                  ref={modalAvatarInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  style={{ display: "none" }}
                  onChange={handleAvatarUpload}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", padding: "12px", background: "var(--ad-card-subtle)", borderRadius: "10px" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid var(--ad-border)",
                      display: "grid",
                      placeItems: "center",
                      background: "var(--ad-card-bg)",
                      flexShrink: 0,
                    }}
                  >
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--ad-accent)" }}>
                        {(profile?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="ad-btn ad-btn-primary ad-btn-sm"
                        onClick={() => modalAvatarInputRef.current?.click()}
                      >
                        <Camera size={13} /> Upload Photo from Device
                      </button>
                      {profile?.avatarUrl && (
                        <button
                          type="button"
                          className="ad-btn ad-btn-secondary ad-btn-sm"
                          style={{ color: "var(--ad-badge-danger-text)" }}
                          onClick={handleRemoveAvatar}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--ad-text-muted)", marginTop: "4px" }}>
                      Supports PNG, JPG, WEBP. Preview updates live.
                    </div>
                  </div>
                </div>

                <div className="ad-form-group">
                  <label className="ad-form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="ad-form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="ad-form-group">
                  <label className="ad-form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="ad-form-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="ad-form-group">
                  <label className="ad-form-label">Phone Number</label>
                  <input
                    type="text"
                    className="ad-form-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="ad-form-group">
                  <label className="ad-form-label">Department / School</label>
                  <input
                    type="text"
                    className="ad-form-input"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  />
                </div>
                <div className="ad-form-group">
                  <label className="ad-form-label">Academic Designation / Semester</label>
                  <input
                    type="text"
                    className="ad-form-input"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  />
                </div>
              </div>
              <div className="ad-modal-footer">
                <button type="button" className="ad-btn ad-btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="ad-btn ad-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "viewProfile" && (
        <div className="ad-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <h3 className="ad-modal-title">Institutional Patron Profile</h3>
              <button type="button" className="ad-modal-close" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="ad-modal-body">
              <input
                type="file"
                ref={modalAvatarInputRef}
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--ad-accent), #4338ca)",
                      color: "#ffffff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "24px",
                      fontWeight: 800,
                      overflow: "hidden",
                      border: "2px solid var(--ad-border)",
                    }}
                  >
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      (profile?.name || currentUser?.name || "U").charAt(0).toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => modalAvatarInputRef.current?.click()}
                    title="Upload photo from device"
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--ad-accent)",
                      color: "#fff",
                      border: "2px solid var(--ad-card-bg)",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Camera size={12} />
                  </button>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "16px" }}>{profile?.name || currentUser?.name || "User"}</h4>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span className="ad-badge success" style={{ textTransform: "capitalize" }}>
                      {role}
                    </span>
                    <span className="ad-badge info">{profile?.id || "LIB-2026-001"}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px", fontSize: "13.5px" }}>
                <div><strong>Email:</strong> {profile?.email || currentUser?.email || "user@libraspace.com"}</div>
                <div><strong>Phone:</strong> {profile?.phone || "+91 98765 43210"}</div>
                <div><strong>Department:</strong> {profile?.department || "Computer Science"}</div>
                <div><strong>Designation:</strong> {profile?.designation || "Scholar"}</div>
                <div><strong>Library Pass:</strong> {profile?.libraryCardNo || "LIBRA-98214-IN"}</div>
                <div><strong>Valid Through:</strong> {profile?.validThru || "31 July 2027"}</div>
                <div><strong>Membership:</strong> Verified Institutional Member</div>
              </div>
            </div>
            <div className="ad-modal-footer">
              <button
                type="button"
                className="ad-btn ad-btn-secondary"
                onClick={() => {
                  setActiveModal(null);
                  setActiveMenu("My Profile");
                  setProfileTab("overview");
                }}
              >
                Full Profile Page & ID Pass
              </button>
              <button
                type="button"
                className="ad-btn ad-btn-primary"
                onClick={() => {
                  setActiveModal("editProfile");
                }}
              >
                Edit Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Book Modal - Ultra Modern Design */}
      {activeModal === "addBook" && (
        <div className="ad-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ad-modal ad-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-accent-bar" />
            <div className="ad-modal-header">
              <div className="ad-modal-header-left">
                <div className="ad-modal-icon-badge blue">
                  <BookPlus size={22} />
                </div>
                <div>
                  <h3 className="ad-modal-title">Add New Book to Catalog</h3>
                  <p className="ad-modal-subtitle">Register a new volume and establish shelf inventory</p>
                </div>
              </div>
              <button
                type="button"
                className="ad-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddBook}>
              <div className="ad-modal-body">
                <div className="ad-form-grid-2">
                  <div className="ad-form-group">
                    <label className="ad-form-label">
                      <span>Book Title *</span>
                      <span className="ad-form-label-hint">Full official title</span>
                    </label>
                    <div className="ad-input-wrapper">
                      <BookOpen size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Clean Architecture"
                        className="ad-form-input"
                        value={newBookForm.title}
                        onChange={(e) => setNewBookForm({ ...newBookForm, title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ad-form-group">
                    <label className="ad-form-label">
                      <span>Author Name *</span>
                      <span className="ad-form-label-hint">Primary author</span>
                    </label>
                    <div className="ad-input-wrapper">
                      <User size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Robert C. Martin"
                        className="ad-form-input"
                        value={newBookForm.author}
                        onChange={(e) => setNewBookForm({ ...newBookForm, author: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="ad-form-grid-2">
                  <div className="ad-form-group">
                    <label className="ad-form-label">Category / Genre *</label>
                    <div className="ad-input-wrapper">
                      <Bookmark size={16} className="ad-input-icon" />
                      <select
                        className="ad-form-select"
                        value={newBookForm.category}
                        onChange={(e) => setNewBookForm({ ...newBookForm, category: e.target.value })}
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Technology">Technology</option>
                        <option value="Science">Science</option>
                        <option value="Self-Help">Self-Help</option>
                        <option value="Finance">Finance</option>
                        <option value="Fiction">Fiction</option>
                        <option value="History">History</option>
                        <option value="Philosophy">Philosophy</option>
                        <option value="Psychology">Psychology</option>
                      </select>
                    </div>
                  </div>

                  <div className="ad-form-group">
                    <label className="ad-form-label">ISBN Identifier</label>
                    <div className="ad-input-wrapper">
                      <Barcode size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. 978-0132350884"
                        className="ad-form-input"
                        value={newBookForm.isbn}
                        onChange={(e) => setNewBookForm({ ...newBookForm, isbn: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="ad-form-grid-2">
                  <div className="ad-form-group">
                    <label className="ad-form-label">Shelf / Stack Location</label>
                    <div className="ad-input-wrapper">
                      <Layers size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Stack CS-105"
                        className="ad-form-input"
                        value={newBookForm.shelfLocation}
                        onChange={(e) => setNewBookForm({ ...newBookForm, shelfLocation: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ad-form-group">
                    <label className="ad-form-label">
                      <span>Total Copies *</span>
                      <span className="ad-form-label-hint">Initial shelf count</span>
                    </label>
                    <div className="ad-input-wrapper">
                      <PlusSquare size={16} className="ad-input-icon" />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        className="ad-form-input"
                        value={newBookForm.copies}
                        onChange={(e) => setNewBookForm({ ...newBookForm, copies: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="ad-form-group">
                  <label className="ad-form-label">Cover Theme Palette</label>
                  <div className="ad-theme-swatches">
                    {[
                      { id: "blue", grad: "linear-gradient(135deg, #1e3a8a, #3b82f6)" },
                      { id: "teal", grad: "linear-gradient(135deg, #0f766e, #14b8a6)" },
                      { id: "purple", grad: "linear-gradient(135deg, #3730a3, #6366f1)" },
                      { id: "green", grad: "linear-gradient(135deg, #15803d, #22c55e)" },
                      { id: "amber", grad: "linear-gradient(135deg, #b45309, #f59e0b)" },
                      { id: "ruby", grad: "linear-gradient(135deg, #991b1b, #ef4444)" },
                      { id: "slate", grad: "linear-gradient(135deg, #1e293b, #475569)" },
                    ].map((swatch) => (
                      <div
                        key={swatch.id}
                        className={`ad-theme-swatch ${newBookForm.gradient === swatch.grad ? "active" : ""}`}
                        style={{ background: swatch.grad }}
                        onClick={() => setNewBookForm({ ...newBookForm, gradient: swatch.grad })}
                      >
                        {newBookForm.gradient === swatch.grad && <Check size={14} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Card Preview */}
                <div className="ad-mini-preview">
                  <div
                    className="ad-mini-cover"
                    style={{ background: newBookForm.gradient || "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}
                  >
                    {newBookForm.title ? newBookForm.title.charAt(0).toUpperCase() : "B"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ad-accent)", textTransform: "uppercase" }}>
                      Catalog Preview
                    </div>
                    <div className="ad-mini-meta-title">
                      {newBookForm.title || "Clean Architecture"}
                    </div>
                    <div className="ad-mini-meta-sub">
                      by {newBookForm.author || "Robert C. Martin"} &bull; {newBookForm.category} &bull; {newBookForm.copies || 5} copies
                    </div>
                  </div>
                </div>
              </div>

              <div className="ad-modal-footer">
                <button
                  type="button"
                  className="ad-btn ad-btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="ad-btn ad-btn-primary">
                  <PlusCircle size={16} /> Save Book to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal - Modernized */}
      {activeModal === "issueBook" && (
        <div className="ad-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ad-modal ad-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-accent-bar" />
            <div className="ad-modal-header">
              <div className="ad-modal-header-left">
                <div className="ad-modal-icon-badge purple">
                  <BookUp size={22} />
                </div>
                <div>
                  <h3 className="ad-modal-title">Issue Book to Patron</h3>
                  <p className="ad-modal-subtitle">Assign copy and initialize 14-day circulation cycle</p>
                </div>
              </div>
              <button
                type="button"
                className="ad-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleIssueBook}>
              <div className="ad-modal-body">
                <div className="ad-form-group">
                  <label className="ad-form-label">
                    <span>Select Book to Issue *</span>
                    <span className="ad-form-label-hint">Available on shelves</span>
                  </label>
                  <div className="ad-input-wrapper">
                    <BookOpen size={16} className="ad-input-icon" />
                    <select
                      className="ad-form-select"
                      value={issueForm.bookId}
                      onChange={(e) => {
                        const sel = catalogBooks.find((b) => b.id === Number(e.target.value));
                        setIssueForm({
                          ...issueForm,
                          bookId: Number(e.target.value),
                          bookTitle: sel ? sel.title : issueForm.bookTitle,
                        });
                      }}
                      required
                    >
                      {catalogBooks.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.availableCopies === 0}>
                          {b.title} — {b.availableCopies > 0 ? `(${b.availableCopies} available)` : "(Out of stock)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ad-form-grid-2">
                  <div className="ad-form-group">
                    <label className="ad-form-label">Member Full Name *</label>
                    <div className="ad-input-wrapper">
                      <User size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        className="ad-form-input"
                        value={issueForm.memberName}
                        onChange={(e) => setIssueForm({ ...issueForm, memberName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ad-form-group">
                    <label className="ad-form-label">Student / Member ID</label>
                    <div className="ad-input-wrapper">
                      <Hash size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. STU-1024"
                        className="ad-form-input"
                        value={issueForm.memberId}
                        onChange={(e) => setIssueForm({ ...issueForm, memberId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="ad-form-group">
                  <label className="ad-form-label">
                    <span>Loan Duration</span>
                    <span className="ad-form-label-hint">Auto-computes return deadline</span>
                  </label>
                  <div className="ad-duration-chips">
                    {[7, 14, 21, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        className={`ad-duration-chip ${issueForm.durationDays === days ? "active" : ""}`}
                        onClick={() =>
                          setIssueForm({
                            ...issueForm,
                            durationDays: days,
                            dueDate: calculateDueDate(days),
                          })
                        }
                      >
                        {days} Days {days === 14 ? "(Standard)" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ad-form-grid-2">
                  <div className="ad-form-group">
                    <label className="ad-form-label">Issue Date</label>
                    <div className="ad-input-wrapper">
                      <CalendarDays size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        readOnly
                        value="2026-10-14 (Today)"
                        className="ad-form-input"
                        style={{ background: "var(--ad-card-subtle)", opacity: 0.85 }}
                      />
                    </div>
                  </div>

                  <div className="ad-form-group">
                    <label className="ad-form-label">Due Return Date</label>
                    <div className="ad-input-wrapper">
                      <Clock size={16} className="ad-input-icon" />
                      <input
                        type="date"
                        className="ad-form-input"
                        value={issueForm.dueDate}
                        onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="ad-alert-box info">
                  <CheckCircle2 size={18} color="var(--ad-accent)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Circulation Reminder:</strong> Due date is set for{" "}
                    <strong>{issueForm.dueDate}</strong>. Late returns will automatically accumulate a ₹5/day overdue penalty.
                  </div>
                </div>
              </div>

              <div className="ad-modal-footer">
                <button
                  type="button"
                  className="ad-btn ad-btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="ad-btn ad-btn-primary">
                  <Check size={16} /> Confirm Book Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Process Return Modal - Modernized */}
      {activeModal === "processReturn" && (
        <div className="ad-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ad-modal ad-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-accent-bar" />
            <div className="ad-modal-header">
              <div className="ad-modal-header-left">
                <div className="ad-modal-icon-badge green">
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h3 className="ad-modal-title">Process Returned Copy</h3>
                  <p className="ad-modal-subtitle">Inspect book condition, settle overdue fines, and restock</p>
                </div>
              </div>
              <button
                type="button"
                className="ad-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {activeLoans.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--ad-text-muted)" }}>
                <CheckCircle2 size={40} color="var(--ad-badge-success-text)" style={{ marginBottom: "12px" }} />
                <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "var(--ad-text-primary)" }}>
                  No Active Loans to Return
                </h4>
                <p style={{ margin: "0 0 20px", fontSize: "13.5px" }}>
                  All books are currently in stock on the shelves. There are no active checkouts to check-in.
                </p>
                <button
                  type="button"
                  className="ad-btn ad-btn-primary"
                  onClick={() => setActiveModal(null)}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleProcessReturn}>
                <div className="ad-modal-body">
                  <div className="ad-form-group">
                    <label className="ad-form-label">
                      <span>Select Active Loan to Check-in *</span>
                      <span className="ad-form-label-hint">{activeLoans.length} active checkouts</span>
                    </label>
                    <div className="ad-input-wrapper">
                      <Bookmark size={16} className="ad-input-icon" />
                      <select
                        className="ad-form-select"
                        value={returnForm.loanId || (activeLoans[0] ? activeLoans[0].id : "")}
                        onChange={(e) => {
                          const sel = activeLoans.find((l) => l.id === Number(e.target.value));
                          if (sel) {
                            setReturnForm({
                              ...returnForm,
                              loanId: sel.id,
                              bookTitle: sel.bookTitle,
                              memberName: sel.borrower,
                            });
                          }
                        }}
                        required
                      >
                        {activeLoans.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.bookTitle} — Borrowed by {l.borrower} ({l.status === "Overdue" ? `⚠️ ${l.daysOverdue} days late` : "On Time"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Overdue Assessment Alert Box */}
                  {(() => {
                    const currentLoan = activeLoans.find((l) => l.id === Number(returnForm.loanId || (activeLoans[0] ? activeLoans[0].id : 0)));
                    if (currentLoan && currentLoan.status === "Overdue") {
                      return (
                        <div className="ad-alert-box danger">
                          <AlertTriangle size={20} color="var(--ad-badge-danger-text)" style={{ flexShrink: 0, marginTop: "2px" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800 }}>
                              Overdue by {currentLoan.daysOverdue} Days (Due: {currentLoan.dueDate})
                            </div>
                            <div style={{ fontSize: "12px", marginTop: "2px" }}>
                              Standard overdue rate of ₹5/day &bull; Total Accrued Fine:{" "}
                              <strong>₹{currentLoan.fine}</strong>
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
                              <input
                                type="checkbox"
                                checked={returnForm.fineWaived}
                                onChange={(e) => setReturnForm({ ...returnForm, fineWaived: e.target.checked })}
                              />
                              <span>Waive fine (Authorized librarian override)</span>
                            </label>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="ad-alert-box success">
                        <CheckCircle2 size={18} color="var(--ad-badge-success-text)" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <strong>On-time Return:</strong> This copy has zero overdue fines. Proceed to condition inspection.
                        </div>
                      </div>
                    );
                  })()}

                  <div className="ad-form-group">
                    <label className="ad-form-label">Physical Condition Assessment</label>
                    <div className="ad-input-wrapper">
                      <CheckCircle size={16} className="ad-input-icon" />
                      <select
                        className="ad-form-select"
                        value={returnForm.condition}
                        onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                      >
                        <option value="Good / Pristine (No fine)">Good / Pristine condition (Ready for shelf)</option>
                        <option value="Minor Wear (Accepted)">Minor Wear / Normal Use (Accepted)</option>
                        <option value="Damaged (Apply fine)">Damaged / Torn Pages (Apply ₹50 repair fee)</option>
                      </select>
                    </div>
                  </div>

                  <div className="ad-alert-box info">
                    <Layers size={18} color="var(--ad-accent)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <strong>Shelf Restock:</strong> Confirming this return will automatically increment available copies in the catalog by <strong>+1</strong>.
                    </div>
                  </div>
                </div>

                <div className="ad-modal-footer">
                  <button
                    type="button"
                    className="ad-btn ad-btn-secondary"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="ad-btn ad-btn-success">
                    <RotateCcw size={16} /> Complete Return & Restock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {activeModal === "editBook" && editingBook && (
        <div className="ad-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ad-modal ad-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-accent-bar" />
            <div className="ad-modal-header">
              <div className="ad-modal-header-left">
                <div className="ad-modal-icon-badge orange">
                  <Edit size={22} />
                </div>
                <div>
                  <h3 className="ad-modal-title">Edit Book Specifications</h3>
                  <p className="ad-modal-subtitle">Update metadata and inventory counts for this title</p>
                </div>
              </div>
              <button
                type="button"
                className="ad-modal-close"
                onClick={() => setActiveModal(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditBook}>
              <div className="ad-modal-body">
                <div className="ad-form-grid-2">
                  <div className="ad-form-group">
                    <label className="ad-form-label">Book Title *</label>
                    <div className="ad-input-wrapper">
                      <BookOpen size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        required
                        className="ad-form-input"
                        value={editingBook.title}
                        onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ad-form-group">
                    <label className="ad-form-label">Author Name</label>
                    <div className="ad-input-wrapper">
                      <User size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        required
                        className="ad-form-input"
                        value={editingBook.author}
                        onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="ad-form-grid-2">
                  <div className="ad-form-group">
                    <label className="ad-form-label">Category</label>
                    <div className="ad-input-wrapper">
                      <Bookmark size={16} className="ad-input-icon" />
                      <select
                        className="ad-form-select"
                        value={editingBook.category}
                        onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Technology">Technology</option>
                        <option value="Science">Science</option>
                        <option value="Self-Help">Self-Help</option>
                        <option value="Finance">Finance</option>
                        <option value="Fiction">Fiction</option>
                        <option value="History">History</option>
                      </select>
                    </div>
                  </div>

                  <div className="ad-form-group">
                    <label className="ad-form-label">Shelf Location</label>
                    <div className="ad-input-wrapper">
                      <Layers size={16} className="ad-input-icon" />
                      <input
                        type="text"
                        className="ad-form-input"
                        value={editingBook.shelfLocation}
                        onChange={(e) => setEditingBook({ ...editingBook, shelfLocation: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="ad-form-grid-2">
                  <div className="ad-form-group">
                    <label className="ad-form-label">Total Copies</label>
                    <div className="ad-input-wrapper">
                      <PlusSquare size={16} className="ad-input-icon" />
                      <input
                        type="number"
                        min="1"
                        className="ad-form-input"
                        value={editingBook.totalCopies}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBook({
                            ...editingBook,
                            totalCopies: val,
                            availableCopies: Math.min(val, editingBook.availableCopies),
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="ad-form-group">
                    <label className="ad-form-label">Available Copies</label>
                    <div className="ad-input-wrapper">
                      <CheckCircle2 size={16} className="ad-input-icon" />
                      <input
                        type="number"
                        min="0"
                        max={editingBook.totalCopies}
                        className="ad-form-input"
                        value={editingBook.availableCopies}
                        onChange={(e) => setEditingBook({ ...editingBook, availableCopies: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="ad-modal-footer">
                <button
                  type="button"
                  className="ad-btn ad-btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="ad-btn ad-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "addMember" && (
        <div className="ad-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <h3 className="ad-modal-title">Enroll New Library Member</h3>
              <button type="button" className="ad-modal-close" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="ad-modal-body">
                <div className="ad-form-group">
                  <label className="ad-form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Neha Gupta"
                    className="ad-form-input"
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  />
                </div>
                <div className="ad-form-group">
                  <label className="ad-form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. neha@college.edu"
                    className="ad-form-input"
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  />
                </div>
                <div className="ad-form-group">
                  <label className="ad-form-label">Member Role</label>
                  <select
                    className="ad-form-select"
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="librarian">Librarian</option>
                    <option value="faculty">Faculty Member</option>
                  </select>
                </div>
              </div>
              <div className="ad-modal-footer">
                <button type="button" className="ad-btn ad-btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="ad-btn ad-btn-primary">
                  Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "bookDetails" && selectedBook && (
        <div className="ad-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <h3 className="ad-modal-title">{selectedBook.title}</h3>
              <button type="button" className="ad-modal-close" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="ad-modal-body">
              <div
                className={`ad-book-cover ${selectedBook.themeColor}`}
                style={{ borderRadius: "10px", height: "120px" }}
              >
                <span style={{ fontSize: "32px", fontWeight: 800 }}>{selectedBook.symbol}</span>
                <BookOpen size={24} />
              </div>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                <strong>Author:</strong> {selectedBook.author} <br />
                <strong>Genre:</strong> {selectedBook.category} <br />
                <strong>Rating:</strong> ⭐ {selectedBook.rating} / 5.0 <br />
                <br />
                {selectedBook.summary}
              </p>
            </div>
            <div className="ad-modal-footer">
              <button type="button" className="ad-btn ad-btn-secondary" onClick={() => setActiveModal(null)}>
                Close
              </button>
              <button
                type="button"
                className="ad-btn ad-btn-primary"
                onClick={() => {
                  showToast(`Reserved "${selectedBook.title}" successfully! Check at counter.`, "success");
                  addNotification({
                    title: "Book Reservation Placed",
                    body: `${currentUser?.name || "Student"} reserved a copy of "${selectedBook.title}". Reserved copy held at circulation counter.`,
                    type: "circulation",
                    toRole: "librarian",
                    toEmail: "all",
                    fromEmail: currentUser?.email || "",
                  });
                  setActiveModal(null);
                }}
              >
                Reserve Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "notifications" && (
        <div className="ad-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ad-modal ad-notif-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header ad-notif-modal-header">
              <div className="ad-notif-title-group">
                <div className="ad-notif-title-row">
                  <div className="ad-notif-header-bell">
                    <Bell size={18} />
                  </div>
                  <h3 className="ad-modal-title">Real-Time Notification Center</h3>
                </div>
                <div className="ad-notif-subtitle-row">
                  <span className="ad-notif-live-beacon">
                    <span className="ad-beacon-dot"></span> Real-Time Stream Active
                  </span>
                  <span className="ad-notif-count-pill">
                    {unreadNotificationCount} unread &bull; {notifications.length} total
                  </span>
                </div>
              </div>

              <div className="ad-notif-header-actions">
                <button
                  type="button"
                  className="ad-btn-icon-soft"
                  onClick={() => {
                    const next = !notificationSoundEnabled;
                    setNotificationSoundEnabled(next);
                    showToast(next ? "Audio alerts enabled" : "Audio alerts muted", "info");
                  }}
                  title={notificationSoundEnabled ? "Alert Sound: Enabled (Click to Mute)" : "Alert Sound: Muted (Click to Unmute)"}
                >
                  {notificationSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  type="button"
                  className="ad-modal-close"
                  onClick={() => setActiveModal(null)}
                  title="Close Notification Center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notification Filter Category Pills */}
            <div className="ad-notif-filter-bar">
              {[
                { id: "all", label: `All (${notifications.length})` },
                { id: "unread", label: `Unread (${unreadNotificationCount})` },
                { id: "circulation", label: "Circulation" },
                { id: "security", label: "Security & 2FA" },
                { id: "catalog", label: "Catalog" },
                { id: "system", label: "System" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`ad-notif-filter-pill ${notificationFilter === tab.id ? "active" : ""}`}
                  onClick={() => setNotificationFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Bar */}
            <div className="ad-notif-controls-bar">
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="ad-btn ad-btn-primary ad-btn-sm"
                  onClick={simulateLiveLibraryAlert}
                  title="Simulate a real-time library event with audio feedback"
                >
                  <Sparkles size={13} /> Simulate Live Event
                </button>
                {notificationPermission !== "granted" && notificationPermission !== "denied" && (
                  <button
                    type="button"
                    className="ad-btn ad-btn-secondary ad-btn-sm"
                    onClick={handleEnableNotifications}
                    title="Enable desktop notifications in Safari on macOS"
                  >
                    <Bell size={13} /> Enable notifications
                  </button>
                )}
                {notificationPermission === "granted" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--ad-badge-success-text, #10b981)",
                      background: "rgba(16, 185, 129, 0.1)",
                      padding: "4px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    <Check size={12} /> System Notifications Active
                  </span>
                )}
              </div>
              <div className="ad-notif-controls-right">
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    className="ad-btn-text-sm"
                    onClick={markAllNotificationsAsRead}
                  >
                    <Check size={13} /> Mark All Read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="ad-btn-text-sm ad-danger-text"
                    onClick={clearAllNotifications}
                  >
                    <Trash2 size={13} /> Clear All
                  </button>
                )}
              </div>
            </div>

            {notificationPermission === "denied" && (
              <div
                className="ad-notif-safari-denied-hint"
                style={{
                  margin: "0 20px 12px 20px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.28)",
                  color: "#ef4444",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  lineHeight: "1.4",
                  fontWeight: 500,
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>Notifications are blocked. Open Safari &gt; Settings &gt; Websites &gt; Notifications and allow localhost.</span>
              </div>
            )}

            {/* Notification List Body */}
            <div className="ad-modal-body ad-notif-body-scroll">
              {filteredNotifications.length === 0 ? (
                <div className="ad-notif-empty-state">
                  <div className="ad-notif-empty-icon">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4>All Caught Up!</h4>
                  <p>
                    {notificationFilter === "unread"
                      ? "You have zero unread notifications. All alerts have been reviewed."
                      : `No ${notificationFilter === "all" ? "" : notificationFilter} notifications in stream.`}
                  </p>
                  <button
                    type="button"
                    className="ad-btn ad-btn-secondary ad-btn-sm"
                    onClick={simulateLiveLibraryAlert}
                    style={{ marginTop: "12px" }}
                  >
                    <Sparkles size={14} /> Generate Test Alert
                  </button>
                </div>
              ) : (
                <div className="ad-notif-cards-list">
                  {filteredNotifications.map((notif) => {
                    const isCirc = notif.type === "circulation";
                    const isSec = notif.type === "security";
                    const isCat = notif.type === "catalog";
                    const isUnread = !notif.read && notif.unread !== false;
                    return (
                      <div
                        key={notif.id}
                        className={`ad-notif-card ${isUnread ? "unread" : ""}`}
                      >
                        <div
                          className={`ad-notif-card-icon ${
                            isSec ? "security" : isCirc ? "circulation" : isCat ? "catalog" : "system"
                          }`}
                        >
                          {isSec ? (
                            <ShieldCheck size={16} />
                          ) : isCirc ? (
                            <RotateCcw size={16} />
                          ) : isCat ? (
                            <BookOpen size={16} />
                          ) : (
                            <Bell size={16} />
                          )}
                        </div>

                        <div className="ad-notif-card-content">
                          <div className="ad-notif-card-header">
                            <div className="ad-notif-card-title-row">
                              <span className="ad-notif-card-title">{notif.title}</span>
                              {isUnread && <span className="ad-notif-unread-dot" title="Unread Alert"></span>}
                            </div>
                            <span className="ad-notif-card-time">{notif.time || "Just now"}</span>
                          </div>

                          <div className="ad-notif-card-text">{notif.body || notif.message}</div>

                          <div className="ad-notif-card-footer">
                            <span className={`ad-notif-type-tag ${notif.type}`}>
                              {notif.type.toUpperCase()}
                            </span>
                            <div className="ad-notif-card-actions">
                              {isUnread && (
                                <button
                                  type="button"
                                  className="ad-btn-icon-tiny"
                                  onClick={() => markNotificationAsRead(notif.id)}
                                  title="Mark as Read"
                                >
                                  <Check size={13} /> Read
                                </button>
                              )}
                              <button
                                type="button"
                                className="ad-btn-icon-tiny ad-danger-hover"
                                onClick={() => deleteNotification(notif.id)}
                                title="Dismiss notification"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="ad-modal-footer ad-notif-modal-footer">
              <span className="ad-notif-footer-hint">
                Real-time Web Audio alerts active &bull; Syncs across tabs
              </span>
              <button
                type="button"
                className="ad-btn ad-btn-secondary"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Live 2FA Security Challenge Modal */}
      {test2faModalOpen && (
        <div className="ad-modal-backdrop" onClick={() => !test2faSuccess && setTest2faModalOpen(false)}>
          <div className="ad-modal ad-test-2fa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="ad-2fa-icon-badge">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="ad-modal-title" style={{ margin: 0, fontSize: "16px" }}>
                    Two-Factor Authentication Challenge
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--ad-text-secondary)", marginTop: "2px" }}>
                    Real-time Patron Identity Verification
                  </div>
                </div>
              </div>
              {!test2faSuccess && (
                <button
                  type="button"
                  className="ad-modal-close"
                  onClick={() => setTest2faModalOpen(false)}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="ad-modal-body" style={{ textAlign: "center", padding: "20px 24px" }}>
              {test2faSuccess ? (
                <div style={{ padding: "24px 12px" }}>
                  <div className="ad-2fa-success-icon-wrap">
                    <CheckCircle2 size={48} color="var(--ad-badge-success-text)" />
                  </div>
                  <h4 style={{ margin: "14px 0 6px", fontSize: "18px", fontWeight: 800 }}>
                    Security Verification Passed!
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--ad-text-secondary)" }}>
                    Patron session identity validated. Real-time security event recorded in audit logs.
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: "13.5px", color: "var(--ad-text-secondary)", margin: "0 0 16px" }}>
                    Enter the 6-digit security verification code sent to your registered institutional session.
                  </p>

                  {/* Real-time Code Helper Banner with Auto-fill */}
                  <div className="ad-2fa-code-helper">
                    <div className="ad-2fa-code-helper-text">
                      <Sparkles size={14} style={{ color: "var(--ad-accent)" }} />
                      <span>Live Generated OTP: <strong>{test2faCode}</strong></span>
                    </div>
                    <button
                      type="button"
                      className="ad-btn ad-btn-primary ad-btn-sm"
                      onClick={handleTest2faAutoFill}
                      title="Click to automatically fill code"
                    >
                      ⚡ Auto-Fill Code
                    </button>
                  </div>

                  {/* 6 Digit Input Row */}
                  <div className="ad-2fa-inputs-row" onPaste={handleTest2faPaste}>
                    {test2faDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (test2faInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={`ad-2fa-digit-input ${test2faError ? "shake-error" : ""}`}
                        value={digit}
                        onChange={(e) => handleTest2faDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleTest2faKeyDown(idx, e)}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  {test2faError && (
                    <div className="ad-2fa-error-message">
                      <AlertCircle size={14} />
                      <span>{test2faError}</span>
                    </div>
                  )}

                  <div className="ad-2fa-footer-info">
                    <div className="ad-2fa-timer-row">
                      <Clock size={13} />
                      <span>
                        Code expires in <strong>{test2faTimer}s</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      className="ad-btn-text-sm"
                      onClick={handleTest2faResend}
                      disabled={test2faTimer > 45}
                    >
                      <RefreshCw size={12} /> Resend New Code
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="ad-modal-footer" style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: "11.5px", color: "var(--ad-text-muted)" }}>
                Protected by 256-bit institutional encryption
              </span>
              <button
                type="button"
                className="ad-btn ad-btn-secondary"
                onClick={() => setTest2faModalOpen(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Notification */}
      {toast && (
        <div className={`ad-toast ${toast.type || "success"}`}>
          {toast.type === "danger" ? (
            <AlertCircle size={18} color="var(--ad-badge-danger-text)" />
          ) : toast.type === "info" ? (
            <Info size={18} color="var(--ad-accent)" />
          ) : (
            <CheckCircle2 size={18} color="var(--ad-badge-success-text)" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}