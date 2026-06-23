import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// ── Bell SVG ─────────────────────────────────────────────────────────────────
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// ── Time formatter ────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `${d}d ago`;
  if (h > 0)  return `${h}h ago`;
  if (m > 0)  return `${m}m ago`;
  return "just now";
};

// ── Type icon color ───────────────────────────────────────────────────────────
const typeColor = { assignment_created: "#3498db", progress_logged: "#2ecc71", info: "#f39c12" };

// ─────────────────────────────────────────────────────────────────────────────
const Header = () => {

  const navigate = useNavigate();
const reduxUser = useSelector((state) => state.auth?.user);

// Get user from Redux or Cookie
let user = reduxUser;

if (!user) {
  try {
    const cookieUser = Cookies.get("user");
    user = cookieUser ? JSON.parse(cookieUser) : null;
  } catch (err) {
    user = null;
  }
}

const uName =
  user?.emp_name || localStorage.getItem("userName") || "User";

const uRole =
  user?.role || localStorage.getItem("role") || "Employee";

const handleLogout = () => {
  Cookies.remove("user");
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  localStorage.removeItem("emp_id");

  window.close();
};

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const dropdownRef = useRef(null);

  const userName = localStorage.getItem("userName") || "User";
  const role     = localStorage.getItem("role") || "";

  // ── Poll unread count every 30 seconds ──────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/notifications/unread-count`, { headers: getHeaders() });
      setUnreadCount(res.data.count || 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Open dropdown: fetch full list ───────────────────────────────────────
  const handleOpen = async () => {
    setOpen((prev) => !prev);
    if (!open) {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/notifications`, { headers: getHeaders() });
        setNotifications(res.data || []);
      } catch (_) {}
      setLoading(false);
    }
  };

  // ── Mark one as read ─────────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await axios.put(`${BASE_URL}/api/notifications/${id}/read`, {}, { headers: getHeaders() });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await axios.put(`${BASE_URL}/api/notifications/mark-all-read`, {}, { headers: getHeaders() });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const Icon = ({ d, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const Icons = {
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
};
  
  return (
    <header style={S.header}>
      {/* Left: page context */}
      <div style={S.left}>
        {/* <span style={S.appName}>WorkQuantify</span> */}
        {/* <span style={S.roleTag}>{role}</span> */}
      </div>

      {/* Right: user + bell */}
     <div style={S.right}>
  <div style={S.userChip}>
    <div style={S.avatar}>
      {uName.charAt(0).toUpperCase()}
    </div>

    <div style={S.userInfo}>
      <div style={S.userName}>{uName}</div>
      <div style={S.userRole}>{uRole}</div>
    </div>
  </div>

  <button
    onClick={handleLogout}
    style={S.logoutBtn}
    title="Sign Out"
  >
        ⏻
  </button>

 
</div>
    </header>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  header: {
    height: "56px",
    background: "#ffffff",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    flexShrink: 0,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  appName: {
    fontWeight: "800",
    fontSize: "15px",
    color: "#1e272e",
    letterSpacing: "-0.3px",
  },
  roleTag: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#e74c3c",
    background: "#fdecea",
    padding: "2px 8px",
    borderRadius: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#555",
  },
  bellBtn: {
    position: "relative",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#555",
    padding: "6px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    transition: "background 0.15s",
  },
  badge: {
    position: "absolute",
    top: "0px",
    right: "0px",
    background: "#e74c3c",
    color: "white",
    fontSize: "9px",
    fontWeight: "800",
    minWidth: "16px",
    height: "16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 3px",
    lineHeight: 1,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: "360px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    border: "1px solid #eee",
    overflow: "hidden",
    zIndex: 200,
  },
  dropHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px 10px",
    borderBottom: "1px solid #f0f0f0",
  },
  dropTitle: {
    fontWeight: "700",
    fontSize: "14px",
    color: "#1e272e",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  unreadLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "white",
    background: "#e74c3c",
    padding: "1px 7px",
    borderRadius: "10px",
  },
  markAllBtn: {
    background: "none",
    border: "none",
    fontSize: "12px",
    color: "#3498db",
    cursor: "pointer",
    fontWeight: "600",
  },
  dropList: {
    maxHeight: "380px",
    overflowY: "auto",
  },
  emptyMsg: {
    padding: "32px",
    textAlign: "center",
    color: "#bbb",
    fontSize: "13px",
  },
  notifItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 16px",
    borderBottom: "1px solid #f8f8f8",
    cursor: "pointer",
    transition: "background 0.1s",
  },
  notifUnread: {
    background: "#fafcff",
  },
  notifRead: {
    background: "white",
    opacity: 0.7,
  },
  typeDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: "5px",
  },
  notifBody: {
    flex: 1,
    minWidth: 0,
  },
  notifTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1e272e",
    marginBottom: "2px",
  },
  notifMsg: {
    fontSize: "12px",
    color: "#777",
    lineHeight: "1.4",
    marginBottom: "4px",
  },
  notifTime: {
    fontSize: "11px",
    color: "#bbb",
  },
  unreadDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#3498db",
    flexShrink: 0,
    marginTop: "5px",
  },
    footer: {
    padding: "10px 8px 14px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    display: "flex", flexDirection: "column", gap: "6px",
  },
  right: {
  display: "flex",
  alignItems: "center",
  gap: "12px",
},

userChip: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
},

avatar: {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "#e74c3c", // same as sidebar
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: "800",
  color: "#fff",
  flexShrink: 0,
},

userInfo: {
  display: "flex",
  flexDirection: "column",
  lineHeight: "1.2",
},

userName: {
  fontSize: "13px",
  fontWeight: "600",
  color: "#333",
},

userRole: {
  fontSize: "10px",
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
},

logoutBtn: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "34px",
  height: "34px",
  borderRadius: "8px",
  border: "none",
  background: "transparent",
  color: "#555",
  cursor: "pointer",
  transition: "all 0.2s ease",
},
};



export default Header;
