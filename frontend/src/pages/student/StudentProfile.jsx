import React, { useEffect, useState } from "react";

import {
  UserRound,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  CalendarDays,
  MapPin,
  Pencil,
  Save,
  X,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../services/firebase";

import "../../styles/student-profile.css";

const defaultProfile = {
  fullName: "",
  email: "",
  studentId: "STU2026001",
  department: "Computer Science",
  phone: "",
  address: "",
  joinedDate: "2026-10-01",
};

export default function StudentProfile() {
  const [profile, setProfile] = useState(defaultProfile);

  const [formData, setFormData] = useState(defaultProfile);

  const [editing, setEditing] = useState(false);

  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let saved = null;
    try {
      const stored = localStorage.getItem("libraspace_student_profile");
      if (stored) saved = JSON.parse(stored);
    } catch {}

    const localUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("user"));
      } catch {
        return null;
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const activeUser = user || localUser;
      const initial = saved || (activeUser
        ? {
            fullName:
              activeUser.displayName ||
              activeUser.name ||
              activeUser.email?.split("@")[0] ||
              "Student",
            email: activeUser.email || "",
            studentId: activeUser.studentId || defaultProfile.studentId,
            department: activeUser.department || defaultProfile.department,
            phone: activeUser.phoneNumber || activeUser.phone || "",
            address: activeUser.address || "",
            joinedDate: activeUser.metadata?.creationTime
              ? new Date(activeUser.metadata.creationTime)
                  .toISOString()
                  .slice(0, 10)
              : defaultProfile.joinedDate,
          }
        : defaultProfile);

      setProfile(initial);
      setFormData(initial);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setMessage("");
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Please enter your full name.";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must contain at least 2 characters.";
    }

    if (
      formData.phone.trim() &&
      !/^[0-9+\-\s()]{7,20}$/.test(formData.phone.trim())
    ) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (formData.address.length > 200) {
      newErrors.address = "Address must not exceed 200 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleEdit() {
    setFormData({ ...profile });
    setErrors({});
    setMessage("");
    setEditing(true);
  }

  function handleCancel() {
    setFormData({ ...profile });
    setErrors({});
    setMessage("");
    setEditing(false);
  }

  function handleSave(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const updatedProfile = {
      ...profile,
      ...formData,
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
    };

    setProfile(updatedProfile);
    setFormData(updatedProfile);
    setEditing(false);

    try {
      localStorage.setItem(
        "libraspace_student_profile",
        JSON.stringify(updatedProfile)
      );
      const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );
      if (currentUser && currentUser.email) {
        currentUser.name = updatedProfile.fullName;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }
    } catch {}

    setMessage("Profile updated successfully.");
  }

  if (loading) {
    return (
      <div className="student-profile-loading">
        Loading your profile...
      </div>
    );
  }

  const initials =
    profile.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ST";

  return (
    <div className="student-profile-page">
      <section className="student-profile-header">
        <div>
          <span className="student-profile-eyebrow">
            <UserRound size={17} />
            STUDENT ACCOUNT
          </span>

          <h1>My Profile</h1>

          <p>
            Manage your personal information and keep your
            library profile up to date.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            className="student-profile-edit-button"
            onClick={handleEdit}
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </section>
      {message && (
        <div className="student-profile-message" role="status">
          <CheckCircle2 size={18} />

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <section className="student-profile-overview">
        <div className="student-profile-avatar">
          {initials}
        </div>

        <div className="student-profile-overview-info">
          <h2>{profile.fullName || "Student"}</h2>

          <p>{profile.email || "No email available"}</p>

          <span className="student-profile-role">
            <GraduationCap size={14} />
            Student Member
          </span>
        </div>

        <div className="student-profile-member-id">
          <span>STUDENT ID</span>
          <strong>{profile.studentId}</strong>
        </div>
      </section>
      <form
        className="student-profile-form"
        onSubmit={handleSave}
      >
        <div className="student-profile-section-heading">
          <div>
            <h2>Personal Information</h2>

            <p>
              View and manage your student account details.
            </p>
          </div>

          <UserRound size={21} />
        </div>

        <div className="student-profile-fields">
          <div className="student-profile-field">
            <label htmlFor="fullName">Full Name *</label>

            <div className="student-profile-input">
              <UserRound size={17} />

              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Enter your full name"
                maxLength={100}
              />
            </div>

            {errors.fullName && (
              <small className="student-profile-error">
                {errors.fullName}
              </small>
            )}
          </div>
          <div className="student-profile-field">
            <label htmlFor="email">Email Address</label>

            <div className="student-profile-input">
              <Mail size={17} />

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                readOnly
              />
            </div>

            <small className="student-profile-hint">
              Your email comes from Firebase Authentication.
            </small>
          </div>
          <div className="student-profile-field">
            <label htmlFor="studentId">Student ID</label>

            <div className="student-profile-input">
              <ShieldCheck size={17} />

              <input
                id="studentId"
                name="studentId"
                value={formData.studentId}
                disabled
                readOnly
              />
            </div>
          </div>
          <div className="student-profile-field">
            <label htmlFor="department">Department</label>

            <div className="student-profile-input">
              <GraduationCap size={17} />

              <input
                id="department"
                name="department"
                value={formData.department}
                disabled={!editing}
                onChange={handleChange}
                maxLength={100}
              />
            </div>
          </div>
          <div className="student-profile-field">
            <label htmlFor="phone">Phone Number</label>

            <div className="student-profile-input">
              <Phone size={17} />

              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                disabled={!editing}
                onChange={handleChange}
                placeholder="Enter phone number"
                maxLength={20}
              />
            </div>

            {errors.phone && (
              <small className="student-profile-error">
                {errors.phone}
              </small>
            )}
          </div>
          <div className="student-profile-field">
            <label htmlFor="joinedDate">Membership Date</label>

            <div className="student-profile-input">
              <CalendarDays size={17} />

              <input
                id="joinedDate"
                name="joinedDate"
                type="date"
                value={formData.joinedDate}
                disabled
                readOnly
              />
            </div>
          </div>
          <div className="student-profile-field student-profile-field-full">
            <label htmlFor="address">Address</label>

            <div className="student-profile-input student-profile-address">
              <MapPin size={17} />

              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Enter your address"
                rows={3}
                maxLength={200}
              />
            </div>

            {errors.address && (
              <small className="student-profile-error">
                {errors.address}
              </small>
            )}
          </div>
        </div>
        {editing && (
          <div className="student-profile-form-actions">
            <button
              type="button"
              className="student-profile-cancel-button"
              onClick={handleCancel}
            >
              <X size={16} />
              Cancel
            </button>

            <button
              type="submit"
              className="student-profile-save-button"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        )}
      </form>
      <section className="student-profile-membership">
        <div className="student-profile-membership-icon">
          <BookOpen size={23} />
        </div>

        <div>
          <h3>LibraSpace Student Membership</h3>

          <p>
            Explore books, manage your reservations, and track
            your borrowing activity from one place.
          </p>
        </div>
      </section>
    </div>
  );
}