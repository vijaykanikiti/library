import React, { useEffect, useState } from "react";
import {
  Settings,
  BookOpen,
  CalendarDays,
  Wallet,
  Library,
  Mail,
  Phone,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import "../../styles/system-settings.css";

const STORAGE_KEY = "libraspace_system_settings";

const DEFAULT_SETTINGS = {
  libraryName: "LibraSpace Library",
  libraryEmail: "gopalkrishnagopal6363@gmail.com",
  contactNumber: "",
  borrowingLimit: 3,
  borrowingDuration: 14,
  dailyFine: 5,
  reservationLimit: 2,
};

export default function SystemSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
        });
      }
    } catch {
      setError("Could not load saved settings.");
    }
  }, []);

  const updateSetting = (event) => {
    const { name, value } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSaved(false);
    setError("");
  };

  const handleSave = (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);

    const borrowingLimit = Number(settings.borrowingLimit);
    const borrowingDuration = Number(settings.borrowingDuration);
    const dailyFine = Number(settings.dailyFine);
    const reservationLimit = Number(settings.reservationLimit);

    if (!settings.libraryName.trim()) {
      setError("Please enter the library name.");
      return;
    }

    if (
      !settings.libraryEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.libraryEmail)
    ) {
      setError("Please enter a valid library email address.");
      return;
    }

    if (!Number.isInteger(borrowingLimit) || borrowingLimit < 1 || borrowingLimit > 20) {
      setError("Borrowing limit must be between 1 and 20 books.");
      return;
    }

    if (!Number.isInteger(borrowingDuration) || borrowingDuration < 1 || borrowingDuration > 365) {
      setError("Borrowing duration must be between 1 and 365 days.");
      return;
    }

    if (!Number.isFinite(dailyFine) || dailyFine < 0 || dailyFine > 10000) {
      setError("Daily fine must be between ₹0 and ₹10,000.");
      return;
    }

    if (!Number.isInteger(reservationLimit) || reservationLimit < 1 || reservationLimit > 20) {
      setError("Reservation limit must be between 1 and 20.");
      return;
    }

    const normalizedSettings = {
      ...settings,
      libraryName: settings.libraryName.trim(),
      libraryEmail: settings.libraryEmail.trim(),
      contactNumber: settings.contactNumber.trim(),
      borrowingLimit,
      borrowingDuration,
      dailyFine,
      reservationLimit,
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(normalizedSettings)
      );

      setSettings(normalizedSettings);
      setSaved(true);
    } catch {
      setError("Could not save settings in this browser.");
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setSaved(false);
    setError("");
  };

  const restoreDefaults = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      );
      setSettings(DEFAULT_SETTINGS);
      setSaved(true);
      setError("");
    } catch {
      setError("Could not restore default settings.");
    }
  };

  return (
    <div className="system-settings-page">
      <header className="system-settings-header">
        <div>
          <span className="system-settings-eyebrow">
            ADMINISTRATION
          </span>
          <h1>System Settings</h1>
          <p>
            Configure library information and borrowing policies.
          </p>
        </div>

        <div className="system-settings-header-icon">
          <Settings size={27} />
        </div>
      </header>

      <div className="system-settings-notice">
        <AlertCircle size={19} />
        <p>
          Changes are saved in this browser only. They will not affect
          student or librarian operations until the settings are connected
          to the backend.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <section className="system-settings-card">
          <div className="system-settings-card-heading">
            <div className="system-settings-section-icon">
              <Library size={21} />
            </div>
            <div>
              <h2>Library Information</h2>
              <p>Basic information about your library.</p>
            </div>
          </div>

          <div className="system-settings-fields">
            <label className="system-settings-field">
              <span>Library Name *</span>
              <input
                type="text"
                name="libraryName"
                value={settings.libraryName}
                onChange={updateSetting}
                placeholder="Enter library name"
                required
              />
            </label>

            <label className="system-settings-field">
              <span>Library Email *</span>
              <div className="system-settings-input-icon">
                <Mail size={17} />
                <input
                  type="email"
                  name="libraryEmail"
                  value={settings.libraryEmail}
                  onChange={updateSetting}
                  placeholder="gopalkrishnagopal6363@gmail.com"
                  required
                />
              </div>
            </label>

            <label className="system-settings-field">
              <span>Contact Number</span>
              <div className="system-settings-input-icon">
                <Phone size={17} />
                <input
                  type="tel"
                  name="contactNumber"
                  value={settings.contactNumber}
                  onChange={updateSetting}
                  placeholder="Enter contact number"
                />
              </div>
            </label>
          </div>
        </section>

        <section className="system-settings-card">
          <div className="system-settings-card-heading">
            <div className="system-settings-section-icon">
              <BookOpen size={21} />
            </div>
            <div>
              <h2>Borrowing Policies</h2>
              <p>Define how many books students can borrow.</p>
            </div>
          </div>

          <div className="system-settings-fields">
            <label className="system-settings-field">
              <span>Maximum Books per Student</span>
              <input
                type="number"
                name="borrowingLimit"
                min="1"
                max="20"
                value={settings.borrowingLimit}
                onChange={updateSetting}
                required
              />
              <small>Allowed range: 1–20 books.</small>
            </label>

            <label className="system-settings-field">
              <span>Borrowing Duration (Days)</span>
              <div className="system-settings-input-icon">
                <CalendarDays size={17} />
                <input
                  type="number"
                  name="borrowingDuration"
                  min="1"
                  max="365"
                  value={settings.borrowingDuration}
                  onChange={updateSetting}
                  required
                />
              </div>
              <small>Allowed range: 1–365 days.</small>
            </label>

            <label className="system-settings-field">
              <span>Maximum Active Reservations</span>
              <input
                type="number"
                name="reservationLimit"
                min="1"
                max="20"
                value={settings.reservationLimit}
                onChange={updateSetting}
                required
              />
              <small>Allowed range: 1–20 reservations.</small>
            </label>
          </div>
        </section>

        <section className="system-settings-card">
          <div className="system-settings-card-heading">
            <div className="system-settings-section-icon">
              <Wallet size={21} />
            </div>
            <div>
              <h2>Fine Policies</h2>
              <p>Configure the fine charged for overdue books.</p>
            </div>
          </div>

          <div className="system-settings-fields">
            <label className="system-settings-field">
              <span>Daily Fine (₹)</span>
              <div className="system-settings-input-icon">
                <Wallet size={17} />
                <input
                  type="number"
                  name="dailyFine"
                  min="0"
                  max="10000"
                  step="0.5"
                  value={settings.dailyFine}
                  onChange={updateSetting}
                  required
                />
              </div>
              <small>Enter ₹0–₹10,000 per overdue day.</small>
            </label>
          </div>
        </section>

        {error && (
          <div className="system-settings-message error" role="alert">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {saved && (
          <div className="system-settings-message success" role="status">
            <CheckCircle2 size={18} />
            Settings saved successfully in this browser.
          </div>
        )}

        <div className="system-settings-actions">
          <button
            type="button"
            className="system-settings-reset"
            onClick={resetSettings}
          >
            <RotateCcw size={17} />
            Discard Changes
          </button>

          <button
            type="button"
            className="system-settings-defaults"
            onClick={restoreDefaults}
          >
            Restore Defaults
          </button>

          <button
            type="submit"
            className="system-settings-save"
          >
            <Save size={18} />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}