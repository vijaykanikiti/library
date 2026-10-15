import React from "react";
import { Link } from "react-router-dom";
import {
  LibraryBig,
  Home,
  BookOpen,
  Info,
  LogIn,
  UserPlus,
} from "lucide-react";

import ThemeToggle from "./ThemeToggle";
import "../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="library-navbar">
      <div className="navbar-container">
        <Link to="/" className="library-brand">
          <span className="brand-icon">
            <LibraryBig size={27} />
          </span>

          <span>
            <strong>LibraSpace</strong>
            <small>Your world of knowledge</small>
          </span>
        </Link>

        <div className="navbar-links">
          <Link to="/">
            <Home size={17} />
            Home
          </Link>

          <a href="#categories">
            <BookOpen size={17} />
            Categories
          </a>

          <a href="#about">
            <Info size={17} />
            About
          </a>
        </div>

        <div className="navbar-actions">
          <ThemeToggle />

          <Link to="/login" className="navbar-login">
            <LogIn size={17} />
            Login
          </Link>

          <Link to="/register" className="navbar-register">
            <UserPlus size={17} />
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}