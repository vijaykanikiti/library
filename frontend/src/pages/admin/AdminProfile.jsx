import React, { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  LockKeyhole,
} from "lucide-react";
import { auth } from "../../services/firebase";
import "../../styles/admin-profile.css";

const STORAGE_KEY = "libraspace_admin_profile";

const DEFAULT_PROFILE = {
  fullName: "Gopal Krishna",
  email: "gopalkrishnagopal6363@gmail.com",
  phone: "",
  role: "Admin",
};

export default function AdminProfile() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let storedProfile = {};

    try {
      storedProfile = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );
    } catch {
      storedProfile = {};
    }

    const firebaseUser = auth.currentUser;

    setProfile({
      ...DEFAULT_PROFILE,
      ...storedProfile,
      email: storedProfile.email || firebaseUser?.email || "",
      fullName:
        storedProfile.fullName ||
        firebaseUser?.displayName ||
        "Administrator",
    });
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSaved(false);
    setError("");
  };

  const saveProfile = (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);

    if (!profile.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (
      !profile.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    const updatedProfile = {
      ...profile,
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      role: "Admin",
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedProfile)
      );

      setProfile(updatedProfile);
      setSaved(true);
    } catch {
      setError("Unable to save the profile in this browser.");
    }
  };

  const resetProfile = () => {
    const firebaseUser = auth.currentUser;

    const defaultProfile = {
      ...DEFAULT_PROFILE,
      fullName: firebaseUser?.displayName || "Administrator",
      email: firebaseUser?.email || "",
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultProfile)
      );

      setProfile(defaultProfile);
      setSaved(true);
      setError("");
    } catch {
      setError("Unable to restore the profile.");
    }
  };

  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="admin-profile-page">
      <header className="admin-profile-header">
        <div>
          <span className="admin-profile-eyebrow">
            ADMINISTRATION
          </span>
          <h1>My Profile</h1>
          <p>View and manage your administrator profile information.</p>
        </div>
      </header>

      <section className="admin-profile-banner">
        <div className="admin-profile-avatar">
          {initials || "A"}
        </div>

        <div className="admin-profile-banner-info">
          <h2>{profile.fullName || "Administrator"}</h2>
          <p>{profile.email || "No email available"}</p>

          <span className="admin-profile-role-badge">
            <ShieldCheck size={15} />
            Administrator
          </span>
        </div>

        <div className="admin-profile-account-status">
          <span className="admin-profile-status-dot" />
          <span>
            {auth.currentUser ? "Firebase signed in" : "Local profile"}
          </span>
        </div>
      </section>

      <div className="admin-profile-content">
        <section className="admin-profile-form-card">
          <div className="admin-profile-card-heading">
            <div className="admin-profile-section-icon">
              <UserRound size={21} />
            </div>

            <div>
              <h2>Personal Information</h2>
              <p>Update your contact information below.</p>
            </div>
          </div>

          <form onSubmit={saveProfile}>
            <div className="admin-profile-fields">
              <label className="admin-profile-field">
                <span>Full Name *</span>

                <div className="admin-profile-input">
                  <UserRound size={17} />
                  <input
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={updateField}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </label>

              <label className="admin-profile-field">
                <span>Email Address *</span>

                <div className="admin-profile-input">
                  <Mail size={17} />
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={updateField}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <small>
                  This changes the email displayed in your local profile,
                  not your Firebase login email.
                </small>
              </label>

              <label className="admin-profile-field">
                <span>Contact Number</span>

                <div className="admin-profile-input">
                  <Phone size={17} />
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={updateField}
                    placeholder="Enter your contact number"
                  />
                </div>
              </label>

              <div className="admin-profile-field">
                <span>Assigned Role</span>

                <div className="admin-profile-readonly">
                  <ShieldCheck size={17} />
                  <span>Administrator</span>
                  <LockKeyhole size={15} />
                </div>

                <small>
                  Your role is read-only on this page.
                </small>
              </div>
            </div>

            {error && (
              <div
                className="admin-profile-message error"
                role="alert"
              >
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {saved && (
              <div
                className="admin-profile-message success"
                role="status"
              >
                <CheckCircle2 size={18} />
                Profile saved successfully in this browser.
              </div>
            )}

            <div className="admin-profile-actions">
              <button
                type="button"
                className="admin-profile-reset"
                onClick={resetProfile}
              >
                <RotateCcw size={17} />
                Restore Defaults
              </button>

              <button
                type="submit"
                className="admin-profile-save"
              >
                <Save size={18} />
                Save Profile
              </button>
            </div>
          </form>
        </section>

        <aside className="admin-profile-side-card">
          <div className="admin-profile-side-icon">
            <ShieldCheck size={25} />
          </div>

          <h2>Administrator Account</h2>

          <p>
            Your administrator profile displays the information used by the
            LibraSpace interface.
          </p>

          <div className="admin-profile-side-row">
            <ShieldCheck size={17} />
            <div>
              <strong>Assigned Role</strong>
              <span>Administrator</span>
            </div>
          </div>

          <div className="admin-profile-side-row">
            <Mail size={17} />
            <div>
              <strong>Account Email</strong>
              <span>{auth.currentUser?.email || "Not available"}</span>
            </div>
          </div>

          <div className="admin-profile-side-row">
            <CalendarDays size={17} />
            <div>
              <strong>Authentication</strong>
              <span>Firebase Authentication</span>
            </div>
          </div>

          <div className="admin-profile-security-note">
            <LockKeyhole size={17} />
            <p>
              Actual role verification and account permissions must be
              enforced by the backend.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}