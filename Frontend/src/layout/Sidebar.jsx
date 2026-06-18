import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const Icons = {
  dashboard:   "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  projects:    "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  assignments: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7",
  utilization: "M18 20V10 M12 20V4 M6 20v-6",
  dailyUpdate: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  myWork:      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2",
  approvals:   "M9 12l2 2 4-4 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",  // ← NEW
  logout:      "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight:"M9 18l6-6-6-6",
  reconciliation: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
};

const ADMIN_LINKS = [

  { to: "/utilization", label: "Utilization", icon: "utilization" },
  { to: "/projects", label: "Projects", icon: "projects" },
  { to: "/assignments", label: "Assignments", icon: "assignments" },
  { to: "/approvals",   label: "Approvals",   icon: "approvals"   },  // ← NEW
  { to: "/reconciliation", label: "Reconciliation", icon: "reconciliation" },
];

const EMP_LINKS = [
  { to: "/my-work", label: "My Work", icon: "myWork" },
];

// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const navigate    = useNavigate();
  const role        = localStorage.getItem("role");
  const userName    = localStorage.getItem("userName") || "User";
  const [collapsed, setCollapsed] = useState(false);

  const links = role === "ADMIN" ? ADMIN_LINKS : EMP_LINKS;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("UserID");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  return (
    <div style={{ ...S.sidebar, width: collapsed ? "64px" : "220px" }}>

      {/* Brand */}
      <div style={S.brand}>
        {!collapsed && (
          <div>
            <div style={S.brandName}>QuantifyDesk</div>
          </div>
        )}
        {collapsed && <div style={S.brandIcon}>QD</div>}
        <button onClick={() => setCollapsed(!collapsed)} style={S.collapseBtn}
          title={collapsed ? "Expand" : "Collapse"}>
          <Icon d={collapsed ? Icons.chevronRight : Icons.chevronLeft} size={16} />
        </button>
      </div>

      {/* Nav links */}
      <nav style={S.nav}>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              ...S.link,
              ...(isActive ? S.linkActive : {}),
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "10px 0" : "10px 14px",
            })}
          >
            <Icon d={Icons[icon]} size={18} />
            {!collapsed && <span style={S.linkLabel}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer: user + logout */}
      <div style={S.footer}>
        {!collapsed && (
          <div style={S.userChip}>
            <div style={S.avatar}>{userName.charAt(0).toUpperCase()}</div>
            <div style={S.userInfo}>
              <div style={S.userName}>{userName}</div>
              <div style={S.userRole}>{role}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            ...S.logoutBtn,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "10px 0" : "10px 14px",
          }}
          title="Sign Out"
        >
          <Icon d={Icons.logout} size={16} />
          {!collapsed && <span style={{ marginLeft: "10px" }}>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  sidebar: {
    background: "#1e272e", color: "white",
    display: "flex", flexDirection: "column",
    height: "100vh", position: "sticky", top: 0,
    transition: "width 0.22s ease", overflow: "hidden", flexShrink: 0,
  },
  brand: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 14px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.07)", minHeight: "64px",
  },
  brandName:  { fontSize: "15px", fontWeight: "800", color: "white", letterSpacing: "-0.3px", whiteSpace: "nowrap" },
  brandIcon:  { fontSize: "13px", fontWeight: "800", color: "white", margin: "0 auto" },
  collapseBtn:{
    background: "rgba(255,255,255,0.08)", border: "none", color: "#bbb",
    cursor: "pointer", borderRadius: "6px", padding: "5px 7px",
    display: "flex", alignItems: "center", flexShrink: 0, transition: "background 0.15s",
  },
  nav: {
    flex: 1, display: "flex", flexDirection: "column",
    gap: "2px", padding: "12px 8px", overflowY: "auto",
  },
  link: {
    display: "flex", alignItems: "center", gap: "12px",
    color: "rgba(255,255,255,0.6)", textDecoration: "none",
    borderRadius: "7px", fontSize: "13.5px", fontWeight: "500",
    transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap",
  },
  linkActive: { background: "rgba(231,76,60,0.18)", color: "#ff6b6b", fontWeight: "700" },
  linkLabel:  { overflow: "hidden", textOverflow: "ellipsis" },
  footer: {
    padding: "10px 8px 14px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    display: "flex", flexDirection: "column", gap: "6px",
  },
  userChip: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "8px 10px", borderRadius: "7px",
    background: "rgba(255,255,255,0.05)", marginBottom: "4px",
  },
  avatar: {
    width: "30px", height: "30px", borderRadius: "50%",
    background: "#e74c3c", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "13px", fontWeight: "800", flexShrink: 0,
  },
  userInfo:  { overflow: "hidden" },
  userName:  { fontSize: "13px", fontWeight: "600", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  userRole:  { fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" },
  logoutBtn: {
    display: "flex", alignItems: "center", width: "100%",
    background: "transparent", border: "none",
    color: "rgba(255,255,255,0.5)", cursor: "pointer",
    borderRadius: "7px", fontSize: "13px", fontWeight: "500",
    transition: "background 0.15s, color 0.15s",
  },
};

export default Sidebar;
