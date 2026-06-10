import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

//const BASE_URL  = process.env.REACT_APP_API_BASE_URL;
const BASE_URL  = import.meta.env.VITE_API_BASE_URL;
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

const roleColors = {
  BA: "#8e44ad", UI: "#2980b9", TL: "#16a085",
  "FE Dev": "#d35400", "BE Dev": "#c0392b",
  "Mobile/IOS Dev": "#1abc9c", Tester: "#f39c12",
};
const RoleBadge = ({ role }) => (
  <span style={{
    padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700",
    backgroundColor: roleColors[role] || "#555", color: "white", whiteSpace: "nowrap",
  }}>{role}</span>
);

const fmt = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}-${String(dt.getMonth()+1).padStart(2,"0")}-${dt.getFullYear()}`;
};

// ── Reject Modal ──────────────────────────────────────────────────────────────
const RejectModal = ({ item, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 420 }}>
        <h3 style={S.modalTitle}>Reject Progress Log</h3>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          Rejecting <strong>{item.units_completed}</strong> unit(s) logged by{" "}
          <strong>{item.user_name}</strong> for{" "}
          <strong>{item.task_name}</strong> on <strong>{item.project_name}</strong>.
        </p>
        <label style={S.label}>Reason for rejection (optional)</label>
        <textarea
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Units do not match deliverables, please re-submit…"
          style={{ ...S.input, resize: "vertical" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button onClick={onCancel}          style={S.cancelBtn}>Cancel</button>
          <button onClick={() => onConfirm(reason)} style={S.rejectBtn}>Confirm Reject</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const Approvals = () => {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [rejectModal, setRejectModal] = useState(null); // item being rejected
  const [actionBusy,  setActionBusy]  = useState({});   // { [progressId]: true }
  const [filterProject, setFilterProject] = useState("");
  const [toast,       setToast]       = useState(null); // { msg, type }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/utilization/pending-approvals`, { headers: getHeaders() });
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (item) => {
    setActionBusy(b => ({ ...b, [item.progress_id]: true }));
    try {
      await axios.put(`${BASE_URL}/api/utilization/approve/${item.progress_id}`, {}, { headers: getHeaders() });
      showToast(`✓ Approved ${item.units_completed} unit(s) for ${item.user_name}`);
      fetchPending();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve", "error");
    } finally {
      setActionBusy(b => ({ ...b, [item.progress_id]: false }));
    }
  };

  const handleRejectConfirm = async (reason) => {
    const item = rejectModal;
    setRejectModal(null);
    setActionBusy(b => ({ ...b, [item.progress_id]: true }));
    try {
      await axios.put(
        `${BASE_URL}/api/utilization/reject/${item.progress_id}`,
        { reason },
        { headers: getHeaders() }
      );
      showToast(`Rejected log for ${item.user_name}`, "warn");
      fetchPending();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject", "error");
    } finally {
      setActionBusy(b => ({ ...b, [item.progress_id]: false }));
    }
  };

  // Unique projects for filter
  const projects = [...new Map(items.map(i => [i.project_id, i.project_name])).values()];

  const filtered = filterProject
    ? items.filter(i => String(i.project_id) === String(filterProject))
    : items;

  // Group by project for display
  const byProject = filtered.reduce((acc, i) => {
    const k = i.project_name;
    if (!acc[k]) acc[k] = [];
    acc[k].push(i);
    return acc;
  }, {});

  return (
    <div style={S.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "error" ? "#e74c3c" : toast.type === "warn" ? "#f39c12" : "#27ae60" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={S.pageTitle}>Approvals</h2>
          <p style={{ fontSize: 13, color: "#999", marginTop: -14 }}>
            Review and approve employee progress logs before they count as completed.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {items.length > 0 && (
            <span style={S.pendingBadge}>{items.length} pending</span>
          )}
          <button onClick={fetchPending} style={S.refreshBtn}>↻ Refresh</button>
        </div>
      </div>

      {/* Filter bar */}
      {projects.length > 1 && (
        <div style={S.filterBar}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>Filter by project:</label>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={S.select}>
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p} value={items.find(i => i.project_name === p)?.project_id}>{p}</option>
            ))}
          </select>
        </div>
      )}

      {loading && <p style={{ color: "#999", padding: "30px" }}>Loading pending approvals…</p>}

      {!loading && filtered.length === 0 && (
        <div style={S.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 16, color: "#bbb", fontWeight: 700 }}>All caught up!</p>
          <p style={{ fontSize: 13, color: "#ccc" }}>No progress logs are waiting for approval.</p>
        </div>
      )}

      {/* Grouped by project */}
      {Object.entries(byProject).map(([projectName, rows]) => (
        <div key={projectName} style={S.projectBlock}>
          {/* Project header */}
          <div style={S.projectHeader}>
            <span style={S.projectName}>{projectName}</span>
            <span style={S.projectCount}>{rows.length} pending</span>
          </div>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Employee</th>
                <th style={S.th}>Role</th>
                <th style={S.th}>Task</th>
                <th style={S.th}>Log Date</th>
                <th style={S.th}>Units Logged</th>
                <th style={S.th}>Remarks</th>
                <th style={{ ...S.th, width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, i) => {
                const busy = actionBusy[item.progress_id];
                return (
                  <tr key={item.progress_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    {/* Employee */}
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={S.avatar}>{item.user_name?.[0]?.toUpperCase() || "?"}</div>
                        <strong>{item.user_name}</strong>
                      </div>
                    </td>
                    <td style={S.td}><RoleBadge role={item.role} /></td>
                    <td style={S.td}>{item.task_name}</td>
                    <td style={{ ...S.td, whiteSpace: "nowrap" }}>{fmt(item.date)}</td>
                    {/* Units */}
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <span style={S.unitsBadge}>{item.units_completed}</span>
                    </td>
                    <td style={{ ...S.td, fontSize: 12, color: "#777", maxWidth: 180 }}>
                      {item.remarks || <span style={{ color: "#ccc" }}>—</span>}
                    </td>
                    {/* Actions */}
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={busy}
                          style={S.approveBtn}
                          title="Approve this progress log"
                        >
                          {busy ? "…" : "✓ Approve"}
                        </button>
                        <button
                          onClick={() => setRejectModal(item)}
                          disabled={busy}
                          style={S.rejectBtnSm}
                          title="Reject this progress log"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {/* Reject reason modal */}
      {rejectModal && (
        <RejectModal
          item={rejectModal}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModal(null)}
        />
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:          { padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" },
  pageTitle:     { fontSize: "22px", fontWeight: "800", color: "#1e272e", marginBottom: "6px",textAlign: "left" },
  toast: {
    position: "fixed", top: 20, right: 20, zIndex: 9999,
    color: "white", padding: "12px 20px", borderRadius: 8,
    fontWeight: 700, fontSize: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  },
  pendingBadge:  { background: "#e74c3c", color: "white", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 },
  refreshBtn:    { padding: "7px 16px", background: "#f0f0f0", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 },
  filterBar:     { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  select:        { padding: "7px 10px", border: "1px solid #ddd", borderRadius: 5, fontSize: 13, background: "white", cursor: "pointer" },
  emptyState:    { textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  projectBlock:  { background: "white", borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: 20, overflow: "hidden" },
  projectHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", background: "#1e272e" },
  projectName:   { color: "white", fontWeight: 700, fontSize: 15 },
  projectCount:  { background: "#e74c3c", color: "white", borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 700 },
  table:         { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:            { padding: "9px 14px", background: "#f8f9fa", fontWeight: 600, color: "#555", textAlign: "center", borderBottom: "1px solid #eee", fontSize: 12 },
  td:            { padding: "10px 14px", borderBottom: "1px solid #f5f5f5", color: "#333" },
  avatar:        { width: 30, height: 30, borderRadius: "50%", background: "#3498db", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  unitsBadge:    { display: "inline-block", background: "#e8f4fd", color: "#2980b9", borderRadius: 10, padding: "2px 10px", fontWeight: 700, fontSize: 13 },
  approveBtn:    { padding: "5px 12px", background: "#27ae60", color: "white", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  rejectBtnSm:   { padding: "5px 12px", background: "#e74c3c", color: "white", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  // Reject modal
  overlay:       { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:         { background: "white", borderRadius: 12, padding: "28px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
  modalTitle:    { fontSize: 18, fontWeight: 800, color: "#1e272e", marginBottom: 8 },
  label:         { display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 6 },
  input:         { width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" },
  cancelBtn:     { padding: "8px 18px", background: "#f0f0f0", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 },
  rejectBtn:     { padding: "8px 20px", background: "#e74c3c", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 },
};

export default Approvals;
