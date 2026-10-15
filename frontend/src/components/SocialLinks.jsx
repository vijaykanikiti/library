import React from "react";
import "./SocialLinks.css";

export const SOCIAL_LINKS = [
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com",
    iconClass: "bi bi-github",
    color: "#24292e",
    hoverColor: "#171515",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://linkedin.com",
    iconClass: "bi bi-linkedin",
    color: "#0a66c2",
    hoverColor: "#004182",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    url: "https://x.com",
    iconClass: "bi bi-twitter-x",
    color: "#000000",
    hoverColor: "#1d9bf0",
  },
  {
    id: "instagram",
    name: "Instagram",
    url: "https://instagram.com",
    iconClass: "bi bi-instagram",
    color: "#e4405f",
    hoverColor: "#c13584",
  },
];

/**
 * Renders a row of circular social media icon buttons.
 */
export function SocialLinksRow({ size = "md", className = "" }) {
  return (
    <div className={`social-links-row social-size-${size} ${className}`} role="navigation" aria-label="Social media links">
      {SOCIAL_LINKS.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`social-icon-btn social-btn-${item.id}`}
          title={`Follow LibraSpace on ${item.name}`}
          aria-label={item.name}
        >
          <i className={item.iconClass} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

/**
 * Renders a vertical list of social media links with icons and text labels.
 */
export function SocialLinksList({ className = "" }) {
  return (
    <div className={`social-links-list ${className}`}>
      {SOCIAL_LINKS.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`social-list-item social-list-${item.id}`}
          title={`Open ${item.name}`}
        >
          <i className={item.iconClass} aria-hidden="true" />
          <span>{item.name}</span>
        </a>
      ))}
    </div>
  );
}

export default SocialLinksRow;
