import { FlaskConical, Menu } from "lucide-react";
import "./layout.css";

export function TopBar({
  mobileNav,
  onToggleMenu,
  onNavigate,
  activeView = "complaints",
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <FlaskConical size={20} />
        </div>
        <div>
          <strong>QMS / Complaint Intelligence</strong>
          <span>Pharmaceutical quality operations</span>
        </div>
      </div>
      <nav className={mobileNav ? "nav-links open" : "nav-links"}>
        <a
          className={activeView === "complaints" ? "active" : ""}
          onClick={() => onNavigate("complaints")}
        >
          Complaints
        </a>
        <a
          className={activeView === "records" ? "active" : ""}
          onClick={() => onNavigate("records")}
        >
          Records
        </a>
      </nav>
      <div className="top-actions">
        <button
          className="icon-button"
          aria-label="Open menu"
          onClick={onToggleMenu}
        >
          <Menu size={19} />
        </button>
        <div className="user-chip">
          <span>AR</span>
          <div>
            <b>Alex R.</b>
            <small>QA operations</small>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <span>QMS Complaint Intelligence</span>
      <span>
        All records are audit-trailed · <a>Data handling policy</a>
      </span>
    </footer>
  );
}
