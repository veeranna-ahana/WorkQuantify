import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ahana from "../../public/ahana.png";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
};

// ── Bell Icon ─────────────────────────────────────────────────────────────────
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// ── Chevron Down ──────────────────────────────────────────────────────────────
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// ── Power / Logout ────────────────────────────────────────────────────────────
const PowerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
const Header = () => {
  const navigate = useNavigate();
  const reduxUser = useSelector(state => state.auth?.user);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Resolve user ──────────────────────────────────────────────────────────
  let user = reduxUser;
  if (!user) {
    try { user = JSON.parse(Cookies.get("user") || "null"); } catch { user = null; }
  }
  const uName = user?.emp_name || localStorage.getItem("userName") || "User";
  const uEmpId = user?.emp_id || localStorage.getItem("emp_id") || "";
  const uRole = user?.role || localStorage.getItem("role") || "Employee";

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Cookies.remove("user");
    ["token", "email", "emp_id", "role", "userName"].forEach(k => localStorage.removeItem(k));
    window.close();
  };

  // ── Notification polling ──────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/notifications/unread-count`, { headers: getHeaders() });
      setUnreadCount(res.data.count || 0);
    } catch (_) { }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setBellOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch notifications ───────────────────────────────────────────────────
  const handleBellOpen = async () => {
    setBellOpen(o => !o);
    setUserOpen(false);
    if (!bellOpen) {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/notifications`, { headers: getHeaders() });
        setNotifications(res.data || []);
      } catch (_) { }
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await axios.put(`${BASE_URL}/api/notifications/${id}/read`, {}, { headers: getHeaders() });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (_) { }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${BASE_URL}/api/notifications/mark-all-read`, {}, { headers: getHeaders() });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (_) { }
  };

  // Initials from name
  const initials = uName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="box-border flex flex-row justify-end items-center px-6 h-[54px] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-[4px] sticky top-0 z-30 shrink-0 font-roboto">
      {/* ── Container ── */}
      <div className="flex flex-row items-center gap-8 h-7">
        {/* VerticalBorder */}
        <div className="box-border flex flex-row items-center pl-5 gap-3 h-7 border-l border-[#e2e8f0] relative" ref={dropdownRef}>
          {/* Frame 49: User Info Button */}
          <button
            onClick={() => setUserOpen(o => !o)}
            className="flex flex-row justify-center items-center p-0 gap-4 h-7 bg-transparent border-none outline-none cursor-pointer"
          >
            {/* Frame 47: Avatar (24x24, bg #856bff, rounded-full) */}
            <div className="w-6 h-6 rounded-full bg-[#856bff] flex items-center justify-center shrink-0">
              {/* material-symbols:person-outline */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            {/* Frame 48: User details (Name & ID) */}
            <div className="flex flex-col items-start gap-[2px] text-left">
              {/* User Name — Roboto 500 12px #856bff */}
              <span className="font-roboto font-medium text-xs leading-[14px] text-[#856bff] whitespace-nowrap">
                {uName}
              </span>
              {/* User ID — Roboto 400 10px #58606b */}
              <span className="font-roboto font-normal text-[10px] leading-3 text-[#58606b] whitespace-nowrap">
                {uEmpId || uRole}
              </span>
            </div>

            {/* weui:arrow-outlined (dropdown arrow) */}
            <svg
              width="8"
              height="16"
              viewBox="0 0 8 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform duration-200 shrink-0 ${userOpen ? "rotate-180" : ""}`}
            >
              <path d="M1 6L4 9L7 6" stroke="rgba(0, 0, 0, 0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* User dropdown menu */}
          {userOpen && (
            <div className="absolute right-0 top-9 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1">
              <div className="px-4 py-3 border-b border-gray-50">
                <div className="text-[13px] font-bold text-gray-800">{uName}</div>
                <div className="text-[11px] text-gray-400">{uEmpId}</div>
                <div className="text-[10px] text-[#856bff] font-semibold mt-0.5 uppercase tracking-wide">{uRole}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors font-medium border-none bg-transparent cursor-pointer"
              >
                <PowerIcon />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
