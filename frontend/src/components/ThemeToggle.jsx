import React, { useState, useRef, useEffect } from "react";

import {
  Sun,
  Moon,
  Eye,
  ChevronDown,
  Check,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";

import "../styles/theme-toggle.css";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  const themes = [
    {
      value: "light",
      label: "Light Mode",
      icon: Sun,
    },
    {
      value: "dark",
      label: "Dark Mode",
      icon: Moon,
    },
    {
      value: "eye-comfort",
      label: "Eye Comfort",
      icon: Eye,
    },
  ];

  const selectedTheme =
    themes.find((item) => item.value === theme) || themes[0];

  const SelectedIcon = selectedTheme.icon;

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="theme-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="theme-dropdown-trigger"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Selected theme: ${selectedTheme.label}`}
      >
        <SelectedIcon size={18} />

        <span>{selectedTheme.label}</span>

        <ChevronDown
          size={16}
          className={`theme-chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="theme-dropdown-menu"
          role="listbox"
          aria-label="Select website theme"
        >
          <div className="theme-dropdown-heading">
            Appearance
          </div>

          {themes.map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              key={value}
              role="option"
              aria-selected={theme === value}
              className={`theme-dropdown-option ${
                theme === value ? "selected" : ""
              }`}
              onClick={() => handleThemeChange(value)}
            >
              <span className="theme-option-icon">
                <Icon size={18} />
              </span>

              <span className="theme-option-label">
                {label}
              </span>

              {theme === value && (
                <Check size={17} className="theme-selected-check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}