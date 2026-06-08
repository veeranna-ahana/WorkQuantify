import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:7001";
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

  return (
    <header style={S.header}>
      {/* Left: page context */}
      <div style={S.left}>
        {/* <span style={S.appName}>WorkQuantify</span> */}
        <span style={S.roleTag}>{role}</span>
      </div>

      {/* Right: user + bell */}
      <div style={S.right}>
        <span style={S.userName}>{userName}</span>

        {/* Bell */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button onClick={handleOpen} style={S.bellBtn} title="Notifications">
            <BellIcon />
            {unreadCount > 0 && (
              <span style={S.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div style={S.dropdown}>
              <div style={S.dropHeader}>
                <span style={S.dropTitle}>
                  Notifications {unreadCount > 0 && <span style={S.unreadLabel}>{unreadCount} new</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={S.markAllBtn}>Mark all read</button>
                )}
              </div>

              <div style={S.dropList}>
                {loading && (
                  <div style={S.emptyMsg}>Loading…</div>
                )}
                {!loading && notifications.length === 0 && (
                  <div style={S.emptyMsg}>You're all caught up 🎉</div>
                )}
                {!loading && notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    style={{ ...S.notifItem, ...(n.is_read ? S.notifRead : S.notifUnread) }}
                  >
                    <div style={{
                      ...S.typeDot,
                      background: typeColor[n.type] || typeColor.info
                    }} />
                    <div style={S.notifBody}>
                      <div style={S.notifTitle}>{n.title}</div>
                      <div style={S.notifMsg}>{n.message}</div>
                      <div style={S.notifTime}>{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && <div style={S.unreadDot} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
};

export default Header;
