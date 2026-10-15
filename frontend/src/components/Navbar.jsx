import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LibraryBig, Home, BookOpen, Info, LogIn, UserPlus, LayoutDashboard, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { getUser, logout, getHomePathForRole } from "../utils/auth";
import "../styles/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    navigate("/login");
  };

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
          {currentUser ? (
            <>
              <Link to={getHomePathForRole(currentUser.role)} className="navbar-login">
                <LayoutDashboard size={17} />
                Dashboard ({currentUser.name?.split(" ")[0] || currentUser.role})
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="navbar-register"
                style={{ cursor: "pointer", border: "none" }}
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-login">
                <LogIn size={17} />
                Login
              </Link>
              <Link to="/register" className="navbar-register">
                <UserPlus size={17} />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}