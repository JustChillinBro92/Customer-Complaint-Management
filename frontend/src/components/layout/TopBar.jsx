import { FlaskConical, Menu } from "lucide-react";
import "./layout.css";

export function TopBar({ mobileNav, onToggleMenu }) {
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
        <a className="active">
          Complaints <span>12</span>
        </a>
        <a>Investigations</a>
        <a>CAPA</a>
        <a>Reports</a>
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
