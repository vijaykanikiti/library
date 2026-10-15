import React from "react";
import { Sun, Moon, Eye, Check, Palette, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import "../styles/theme-toggle.css";

export default function DashboardThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      id: "light",
      name: "Light Mode",
      tag: "Daylight Clarity",
      desc: "Clean, high-contrast crisp theme optimal for daytime study",
      icon: Sun,
      color: "#4f46e5",
      bgPreview: "#f5f7fb",
      borderPreview: "#e2e8f0",
    },
    {
      id: "dark",
      name: "Dark Mode",
      tag: "Night Comfort",
      desc: "Deep midnight contrast that minimizes eye fatigue in dim light",
      icon: Moon,
      color: "#818cf8",
      bgPreview: "#0b1120",
      borderPreview: "#334155",
    },
    {
      id: "eye-comfort",
      name: "Eye Comfort",
      tag: "Sepia Paper Tone",
      desc: "Warm amber tone crafted specifically for long reading hours",
      icon: Eye,
      color: "#8b6845",
      bgPreview: "#f4efe4",
      borderPreview: "#e3d7c5",
    },
  ];

  return (
    <section className="dashboard-theme-section" aria-label="Theme mode switcher">
      <div className="dashboard-theme-header">
        <div className="dashboard-theme-title">
          <span className="dashboard-theme-eyebrow">
            <Palette size={14} />
            READING ATMOSPHERE & DISPLAY
          </span>
          <h3>Theme Mode Changer</h3>
          <p>
            Choose your preferred viewing comfort for daytime study, night reading, or eye protection.
          </p>
        </div>

        <div className="dashboard-theme-active-indicator">
          <Sparkles size={14} />
          <span>Active: {themeOptions.find((t) => t.id === theme)?.name || "Light Mode"}</span>
        </div>
      </div>

      <div className="dashboard-theme-grid">
        {themeOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              className={`dashboard-theme-card ${isActive ? "active" : ""}`}
              onClick={() => setTheme(opt.id)}
              aria-pressed={isActive}
              aria-label={`Switch theme to ${opt.name}`}
            >
              <div className="dashboard-theme-card-top">
                <div className="dashboard-theme-icon-box" style={{ color: opt.color }}>
                  <Icon size={20} />
                </div>

                {isActive && (
                  <span className="dashboard-theme-badge">
                    <Check size={12} strokeWidth={3} />
                    Active
                  </span>
                )}
              </div>

              <div className="dashboard-theme-card-body">
                <strong>{opt.name}</strong>
                <span className="dashboard-theme-tag">{opt.tag}</span>
                <p>{opt.desc}</p>
              </div>

              <div className="dashboard-theme-swatch">
                <span
                  className="theme-swatch-bg"
                  style={{ background: opt.bgPreview, borderColor: opt.borderPreview }}
                />
                <span
                  className="theme-swatch-primary"
                  style={{ background: opt.color }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
