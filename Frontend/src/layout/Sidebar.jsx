// src/layout/Sidebar.jsx
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Cookies from "js-cookie";

// ── SVG Icons matching Figma design ──────────────────────────────────────────
const Icon = ({ name, size = 20, className = "" }) => {
  switch (name) {
    case "utilization":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M18 20V10 M12 20V4 M6 20v-6" />
        </svg>
      );
    case "reconciliation":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "timesheetUpload":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <polyline points="9 15 12 12 15 15" />
          <line x1="12" y1="12" x2="12" y2="19" />
        </svg>
      );
    case "reconDash":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case "dailyReport":
    case "dailyUpdate":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case "projects":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "taskAllocation":
    case "assignments":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
    case "employee":
    case "users":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "myWork":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    default:
      return null;
  }
};

// ── Role-based navigation items (ordered per Figma spec) ──────────────────────
const ROLE_LINKS = {
  Admin: [
    { to: "/quantificationnew", label: "Utilization", icon: "utilization" },
    {
      label: "Reconciliation",
      icon: "reconciliation",
      children: [
        { to: "/reconciliation/upload", label: "Timesheet Upload", icon: "timesheetUpload" },
        { to: "/reconciliation/dashboard", label: "Recon Dashboard", icon: "reconDash" },
      ],
    },
    { to: "/dailyreport", label: "Daily Report", icon: "dailyReport" },
    { to: "/projects", label: "Projects", icon: "projects" },
    { to: "/assignments", label: "Task Allocation", icon: "taskAllocation" },
    { to: "/users", label: "Employee", icon: "employee" },
  ],
  Manager: [
    { to: "/quantificationnew", label: "Utilization", icon: "utilization" },
    {
      label: "Reconciliation",
      icon: "reconciliation",
      children: [
        { to: "/reconciliation/upload", label: "Timesheet Upload", icon: "timesheetUpload" },
        { to: "/reconciliation/dashboard", label: "Recon Dashboard", icon: "reconDash" },
      ],
    },
    { to: "/dailyreport", label: "Daily Report", icon: "dailyReport" },
    { to: "/projects", label: "Projects", icon: "projects" },
    { to: "/assignments", label: "Task Allocation", icon: "taskAllocation" },
  ],
  Employee: [
    { to: "/my-work", label: "My Work", icon: "myWork" },
    { to: "/dailyreport", label: "Daily Report", icon: "dailyReport" },
  ],
};

// ── Submenu Component for Collapsible Links ──────────────────────────────────
const SubMenu = ({ label, icon, children }) => {
  const location = useLocation();
  const isChildActive = children.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(true);

  return (
    <div className="w-full flex flex-col">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex flex-row items-center px-6 py-4 gap-4 w-full h-[56px] box-border font-roboto text-base leading-6 transition-colors cursor-pointer bg-transparent border-none outline-none ${
          isChildActive
            ? "text-[#434655] font-medium"
            : "text-[#434655] hover:bg-gray-50 hover:text-[#171C20] font-normal"
        }`}
      >
        <span className="text-[#434655] shrink-0">
          <Icon name={icon} size={18} />
        </span>
        <span className="flex-1 text-left whitespace-nowrap">{label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[#434655] transition-transform duration-200 shrink-0 ${
            open ? "rotate-90" : "rotate-0"
          }`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {open && (
        <div className="flex flex-col w-full">
          {children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              className={({ isActive }) =>
                `flex flex-row items-center pl-[52px] pr-6 py-4 gap-4 w-full h-[56px] box-border font-roboto text-sm leading-6 transition-colors ${
                  isActive
                    ? "bg-[#856BFF] text-white font-semibold"
                    : "bg-transparent text-[#434655] hover:bg-gray-50 hover:text-[#171C20] font-normal"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 ${isActive ? "text-white" : "text-[#434655]"}`}>
                    <Icon name={c.icon} size={18} />
                  </span>
                  <span className="whitespace-nowrap">{c.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Sidebar Component ───────────────────────────────────────────────────
const Sidebar = () => {
  const reduxUser = useSelector((state) => state.auth?.user);

  let user = reduxUser;
  if (!user) {
    try {
      user = JSON.parse(Cookies.get("user") || "null");
    } catch {
      user = null;
    }
  }

  const rawRole = user?.role || localStorage.getItem("role") || "Employee";
  let userRole = rawRole;
  if (rawRole === "ADMIN") userRole = "Admin";
  if (rawRole === "MANAGER") userRole = "Manager";
  if (rawRole === "EMPLOYEE") userRole = "Employee";

  const links = ROLE_LINKS[userRole] || ROLE_LINKS.Employee;

  return (
    <aside className="box-border flex flex-col items-start p-0 w-[260px] h-screen bg-white border-r border-[#c3c6d7] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] shrink-0 overflow-y-auto font-roboto z-20">
      {/* ── Top Logo Area (Figma HorizontalBorder) ── */}
      <div className="box-border flex flex-col justify-center items-center px-6 py-4 w-full h-[78px] border-b border-[#c3c6d7] shrink-0">
        <img
          src="/ahana.png"
          alt="Ahana"
          className="w-[150px] h-[50px] object-contain"
        />
      </div>

      {/* ── Nav Links ── */}
      <nav className="flex flex-col py-4 px-0 w-full flex-1">
        {links.map((item) =>
          item.children ? (
            <SubMenu
              key={item.label}
              label={item.label}
              icon={item.icon}
              children={item.children}
            />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-row items-center px-6 py-4 gap-4 w-full h-[56px] box-border font-roboto text-base leading-6 transition-colors ${
                  isActive
                    ? "bg-[#856BFF] text-white font-semibold"
                    : "bg-transparent text-[#434655] hover:bg-gray-50 hover:text-[#171C20] font-normal"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 ${isActive ? "text-white" : "text-[#434655]"}`}>
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;