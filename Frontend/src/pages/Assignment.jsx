import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = "http://172.16.20.61:7001";
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

// ── Role colour map ───────────────────────────────────────────────────────────
const ROLE_COLORS = {
  "BA":             { bg: "#f0e6ff", border: "#8e44ad", text: "#6c3483" },
  "UI":             { bg: "#e8f4fd", border: "#2980b9", text: "#1a5276" },
  "TL":             { bg: "#e8f8f0", border: "#27ae60", text: "#1e8449" },
  "FE Dev":         { bg: "#fff3e0", border: "#f39c12", text: "#9a6000" },
  "BE Dev":         { bg: "#fdecea", border: "#e74c3c", text: "#a93226" },
  "Mobile/IOS Dev": { bg: "#e0f7fa", border: "#00acc1", text: "#006064" },
  "Tester":         { bg: "#f3e5f5", border: "#8e24aa", text: "#6a1b9a" },
};
const roleStyle = (role) => ROLE_COLORS[role] || { bg: "#f5f5f5", border: "#999", text: "#333" };
const pct       = (a, b)  => (b > 0 ? Math.round((a / b) * 100) : 0);

// ── Small helpers ─────────────────────────────────────────────────────────────
const badge = (bg) => ({
  padding: "2px 8px", borderRadius: "10px", fontSize: "11px",
  fontWeight: "700", background: bg, color: "white", whiteSpace: "nowrap",
});

const StatusBadge = ({ assigned, planned }) => {
  const p = pct(assigned, planned);
  if (planned === 0)  return <span style={badge("#aaa")}>No Load</span>;
  if (p === 0)        return <span style={badge("#e74c3c")}>Unassigned</span>;
  if (p < 100)        return <span style={badge("#f39c12")}>{p}% Assigned</span>;
  return               <span style={badge("#27ae60")}>Fully Assigned</span>;
};

const KPI = ({ label, value, color }) => (
  <div style={{
    textAlign: "center", background: "white", borderRadius: 8,
    padding: "10px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    borderTop: `3px solid ${color}`, minWidth: 90,
  }}>
    <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 11, color: "#999" }}>{label}</div>
  </div>
);

// ── Assign Modal ──────────────────────────────────────────────────────────────
const AssignModal = ({ modal, users, assignments, onAssign, onDelete, onClose }) => {
  const [selUser,  setSelUser]  = useState("");
  const [units,    setUnits]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  // Assignments already on this role+task
  const existing = assignments.filter(
    a => a.role === modal.role && a.task_name === modal.task_name
  );

  const totalAssigned = existing.reduce((s, a) => s + Number(a.units_assigned), 0);
  const remaining     = Math.max((modal.planned || 0) - totalAssigned, 0);

  const handleSubmit = async () => {
    if (!selUser)        return setError("Please select an employee.");
    if (!units || Number(units) <= 0) return setError("Enter units > 0.");
    setSaving(true);
    setError("");
    try {
      await onAssign({ user_id: selUser, role: modal.role, task_name: modal.task_name, units_assigned: Number(units) });
      setSelUser("");
      setUnits("");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to assign.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={M.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={M.modal}>

        {/* ── Header ── */}
        <div style={M.header}>
          <div>
            <div style={M.title}>Assign Employee</div>
            <div style={M.sub}>
              <span style={{ ...badge(roleStyle(modal.role).border), marginRight: 6 }}>{modal.role}</span>
              {modal.task_name}
              {modal.unit_type && <span style={{ color: "#aaa", marginLeft: 6, fontSize: 11 }}>· {modal.unit_type}</span>}
            </div>
          </div>
          <button onClick={onClose} style={M.closeBtn}>✕</button>
        </div>

        {/* ── Load summary strip ── */}
        <div style={M.strip}>
          <div style={M.chip}>
            <span style={M.chipLabel}>Planned</span>
            <span style={{ ...M.chipVal, color: "#9b59b6" }}>{modal.planned ?? "—"}</span>
          </div>
          <div style={M.chip}>
            <span style={M.chipLabel}>Assigned</span>
            <span style={{ ...M.chipVal, color: "#3498db" }}>{totalAssigned}</span>
          </div>
          <div style={M.chip}>
            <span style={M.chipLabel}>Remaining</span>
            <span style={{ ...M.chipVal, color: remaining === 0 ? "#27ae60" : "#e74c3c" }}>{remaining}</span>
          </div>
        </div>

        {/* ── New assignment form ── */}
        <div style={M.formRow}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label style={M.label}>Employee</label>
            <select value={selUser} onChange={e => { setSelUser(e.target.value); setError(""); }} style={M.select}>
              <option value="">Select employee…</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label style={M.label}>Units</label>
            <input
              type="number" min="1" max={remaining || undefined}
              placeholder={remaining > 0 ? `Max ${remaining}` : "0"}
              value={units}
              onChange={e => { setUnits(e.target.value); setError(""); }}
              style={M.input}
            />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button onClick={handleSubmit} style={M.assignBtn} disabled={saving}>
              {saving ? "Saving…" : "Assign"}
            </button>
          </div>
        </div>

        {error && <p style={M.error}>{error}</p>}

        {/* ── Already assigned ── */}
        <div style={{ marginTop: 18 }}>
          <div style={M.existingTitle}>
            {existing.length === 0 ? "No employees assigned yet" : `Current Assignments (${existing.length})`}
          </div>
          {existing.length > 0 && (
            <table style={M.table}>
              <thead>
                <tr>
                  <th style={{ ...M.th, textAlign: "left" }}>Employee</th>
                  <th style={M.th}>Units Assigned</th>
                  <th style={M.th}>Units Completed</th>
                  <th style={M.th}>Units Pending</th>
                  <th style={M.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {existing.map((a, i) => {
                  const completed = Number(a.units_completed || 0);
                  const pending   = Math.max(Number(a.units_assigned) - completed, 0);
                  return (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={M.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={M.avatar}>{a.user_name?.[0]?.toUpperCase() || "?"}</div>
                        <strong>{a.user_name}</strong>
                      </div>
                    </td>
                    <td style={{ ...M.td, textAlign: "center", fontWeight: 700, color: "#3498db" }}>
                      {a.units_assigned}
                    </td>
                    <td style={{ ...M.td, textAlign: "center", fontWeight: 700, color: "#27ae60" }}>
                      {completed}
                    </td>
                    <td style={{ ...M.td, textAlign: "center", fontWeight: 700, color: pending === 0 ? "#27ae60" : "#e74c3c" }}>
                      {pending}
                    </td>
                    <td style={M.td}>
                      <button onClick={() => onDelete(a.id)} style={M.removeBtn}>Remove</button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: 20, textAlign: "right" }}>
          <button onClick={onClose} style={M.closeFooterBtn}>Done</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const AssignmentScreen = () => {
  const [projects,     setProjects]     = useState([]);
  const [users,        setUsers]        = useState([]);
  const [catalog,      setCatalog]      = useState({});
  const [selProject,   setSelProject]   = useState("");
  const [loadDraft,    setLoadDraft]    = useState({});
  const [totalLoad,    setTotalLoad]    = useState(0);
  const [savingLoad,   setSavingLoad]   = useState(false);
  const [loadSaved,    setLoadSaved]    = useState(false);
  const [assignments,  setAssignments]  = useState([]);
  const [summary,      setSummary]      = useState({ rows: [], totals: {} });

  // ── Inline assign modal state ──────────────────────────────────────────────
  // { role, task_name, unit_type, planned }
  const [assignModal, setAssignModal] = useState(null);

  // ── Initial fetch: projects, users, catalog ────────────────────────────────
  useEffect(() => {
    const fetchBase = async () => {
      try {
        const [pRes, uRes, cRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/projects`,            { headers: getHeaders() }),
          axios.get(`${BASE_URL}/api/users`,               { headers: getHeaders() }),
          axios.get(`${BASE_URL}/api/assignments/catalog`, { headers: getHeaders() }),
        ]);
        setProjects(pRes.data || []);
        setUsers(uRes.data || []);
        setCatalog(cRes.data.grouped || {});
      } catch (err) { console.error(err); }
    };
    fetchBase();
  }, []);

  // ── Per-project fetch: loads, assignments, summary ─────────────────────────
  const fetchProjectData = useCallback(async (pid) => {
    if (!pid) return;
    try {
      const [lRes, aRes, sRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/assignments/task-loads/${pid}`, { headers: getHeaders() }),
        axios.get(`${BASE_URL}/api/assignments?projectId=${pid}`,  { headers: getHeaders() }),
        axios.get(`${BASE_URL}/api/assignments/summary/${pid}`,    { headers: getHeaders() }),
      ]);
      const loads = lRes.data.loads || [];
      setTotalLoad(lRes.data.total_load || 0);
      const draft = {};
      loads.forEach(l => { draft[`${l.role}||${l.task_name}`] = l.planned_units; });
      setLoadDraft(draft);
      setAssignments(aRes.data || []);
      setSummary(sRes.data || { rows: [], totals: {} });
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (selProject) fetchProjectData(selProject);
  }, [selProject, fetchProjectData]);

  // ── Load draft input ───────────────────────────────────────────────────────
  const handleLoadInput = (role, taskName, val) => {
    setLoadDraft(prev => ({ ...prev, [`${role}||${taskName}`]: val === "" ? "" : Number(val) }));
  };

  // ── Save all loads ─────────────────────────────────────────────────────────
  const handleSaveLoads = async () => {
    if (!selProject) return;
    setSavingLoad(true);
    try {
      const loads = [];
      Object.entries(catalog).forEach(([role, tasks]) => {
        tasks.forEach(t => {
          const val = loadDraft[`${role}||${t.task_name}`];
          if (val !== undefined && val !== "" && Number(val) > 0)
            loads.push({ role, task_name: t.task_name, planned_units: Number(val) });
        });
      });
      const res = await axios.post(
        `${BASE_URL}/api/assignments/task-loads/bulk`,
        { project_id: selProject, loads },
        { headers: getHeaders() }
      );
      setTotalLoad(res.data.total_load || 0);
      setLoadSaved(true);
      setTimeout(() => setLoadSaved(false), 2500);
      fetchProjectData(selProject);
    } catch (err) { alert("Failed to save loads."); }
    finally { setSavingLoad(false); }
  };

  // ── Open the assign modal for a specific row ───────────────────────────────
  const openAssignModal = (role, task) => {
    const key     = `${role}||${task.task_name}`;
    const planned = Number(loadDraft[key]) || 0;
    setAssignModal({ role, task_name: task.task_name, unit_type: task.unit_type, planned });
  };

  // ── Add assignment (called from modal) ────────────────────────────────────
  const handleAddAssignment = async ({ user_id, role, task_name, units_assigned }) => {
    await axios.post(
      `${BASE_URL}/api/assignments`,
      { project_id: selProject, user_id, role, task_name, units_assigned },
      { headers: getHeaders() }
    );
    await fetchProjectData(selProject);
    // Keep modal open — admin may want to assign multiple people
  };

  // ── Delete assignment (called from modal) ─────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    await axios.delete(`${BASE_URL}/api/assignments/${id}`, { headers: getHeaders() });
    await fetchProjectData(selProject);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const summaryByKey = {};
  (summary.rows || []).forEach(r => { summaryByKey[`${r.role}||${r.task_name}`] = r; });
  const { total_planned = 0, total_assigned = 0, total_completed = 0 } = summary.totals || {};

  return (
    <div style={S.page}>
      <h2 style={S.pageTitle}>Task Allocation</h2>

      {/* ── Project selector + KPI strip ── */}
      <section style={S.card}>
        <div style={S.row}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={S.label}>Project's</label>
            <select value={selProject} onChange={e => setSelProject(e.target.value)} style={S.select}>
              <option value="">Choose a project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
              ))}
            </select>
          </div>
          {selProject && (
            <div style={S.kpiStrip}>
              <KPI label="Total Effort" value={total_planned}  color="#9b59b6" />
              <KPI label="Assigned"     value={total_assigned}  color="#3498db" />
              <KPI label="Completed"    value={total_completed} color="#27ae60" />
              <KPI label="Pending"      value={Math.max(total_assigned - total_completed, 0)} color="#e74c3c" />
            </div>
          )}
        </div>
      </section>

      {/* ── Load definition table (with inline Assign button) ── */}
      {selProject && (
        <section style={S.card}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.sectionTitle}>Define Project Effort & Assign</div>
              <div style={S.sectionSub}>
                Set planned units per role &amp; task, then click <strong>Assign</strong> on any row to assign employees.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {loadSaved && <span style={{ color: "#27ae60", fontSize: 13, fontWeight: 700 }}>✓ Saved!</span>}
              <div style={S.totalBadge}>Total: <strong style={{ marginLeft: 4 }}>{totalLoad} units</strong></div>
              <button onClick={handleSaveLoads} style={S.primaryBtn} disabled={savingLoad}>
                {savingLoad ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {Object.entries(catalog).map(([role, tasks]) => {
            const rs          = roleStyle(role);
            const rolePlanned = tasks.reduce((s, t) => s + (Number(loadDraft[`${role}||${t.task_name}`]) || 0), 0);
            const roleAssigned= tasks.reduce((s, t) => s + Number(summaryByKey[`${role}||${t.task_name}`]?.total_assigned || 0), 0);

            return (
              <div key={role} style={{ marginBottom: 16 }}>
                {/* Role bar */}
                <div style={{ ...S.roleBar, background: rs.bg, borderLeft: `4px solid ${rs.border}` }}>
                  <span style={{ color: rs.text, fontWeight: 700, fontSize: 13 }}>{role}</span>
                  <span style={{ fontSize: 12, color: rs.text, opacity: 0.75 }}>
                    {rolePlanned} planned · {roleAssigned} assigned
                  </span>
                </div>

                {/* Task rows */}
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Task</th>
                      <th style={{ ...S.th, width: 130 }}>Planned Units</th>
                      <th style={S.th}>Unit Type</th>
                      <th style={{ ...S.th, width: 90 }}>Assigned</th>
                      <th style={{ ...S.th, width: 90 }}>Completed</th>
                      <th style={{ ...S.th, width: 130 }}>Status</th>
                      <th style={{ ...S.th, width: 100 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t, i) => {
                      const key       = `${role}||${t.task_name}`;
                      const planned   = Number(loadDraft[key]) || 0;
                      const sumRow    = summaryByKey[key];
                      const assigned  = sumRow ? Number(sumRow.total_assigned)  : 0;
                      const completed = sumRow ? Number(sumRow.total_completed) : 0;

                      // How many people are already assigned to this row
                      const assigneeCount = assignments.filter(
                        a => a.role === role && a.task_name === t.task_name
                      ).length;

                      return (
                        <tr key={t.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={S.td}>{t.task_name}</td>
                          
                          <td style={S.td}>
                            <input
                              type="number" min="0"
                              value={loadDraft[key] ?? ""} placeholder="0"
                              onChange={e => handleLoadInput(role, t.task_name, e.target.value)}
                              style={S.unitInput}
                            />
                          </td>
                          <td style={{ ...S.td, color: "#999", fontSize: 12 }}>{t.unit_type}</td>
                          <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: "#3498db" }}>
                            {assigned}
                          </td>
                          <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: "#27ae60" }}>
                            {completed}
                          </td>
                          <td style={S.td}>
                            <StatusBadge assigned={assigned} planned={planned} />
                          </td>
                          <td style={S.td}>
                            <button
                              onClick={() => openAssignModal(role, t)}
                              style={S.assignRowBtn}
                              title={`Assign employees to ${t.task_name}`}
                            >
                              👤 Assign
                              {assigneeCount > 0 && (
                                <span style={S.assigneeCountBadge}>{assigneeCount}</span>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Empty state ── */}
      {!selProject && (
        <div style={{ ...S.card, textAlign: "center", padding: "50px 20px", color: "#bbb" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <p style={{ fontSize: 15 }}>Select a project to define loads and assign employees</p>
        </div>
      )}

      {/* ── Inline Assign Modal ── */}
      {assignModal && (
        <AssignModal
          modal={assignModal}
          users={users}
          assignments={assignments}
          onAssign={handleAddAssignment}
          onDelete={handleDelete}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  page:          { padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" },
  pageTitle:     { fontSize: "22px", fontWeight: "800", color: "#1e272e", marginBottom: "20px",textAlign: "left" },
  card:          { background: "#fff", borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", padding: "20px", marginBottom: 20 },
  sectionHead:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  sectionTitle:  { fontSize: 15, fontWeight: 700, color: "#1e272e", marginBottom: 4 },
  sectionSub:    { fontSize: 12, color: "#999" },
  row:           { display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" },
  label:         { display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5 },
  select:        { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 5, fontSize: 14, background: "white", boxSizing: "border-box", cursor: "pointer" },
  unitInput:     { width: "100%", padding: "5px 8px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13, boxSizing: "border-box", textAlign: "center" },
  primaryBtn:    { padding: "8px 20px", background: "#27ae60", color: "white", border: "none", borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  roleBar:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderRadius: "6px 6px 0 0" },
  table:         { width: "100%", borderCollapse: "collapse", fontSize: 13, border: "1px solid #eee" },
  th:            { padding: "8px 12px", background: "#f8f9fa", fontWeight: 600, color: "#555", textAlign: "center", borderBottom: "1px solid #dee2e6", fontSize: 12 },
  td:            { padding: "8px 12px", borderBottom: "1px solid #f5f5f5", color: "#333" },
  kpiStrip:      { display: "flex", gap: 10, flexWrap: "wrap" },
  totalBadge:    { background: "#f0f0f0", borderRadius: 6, padding: "6px 14px", fontSize: 13, color: "#555" },

  // Inline assign button in row
  assignRowBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 12px", background: "#3498db", color: "white",
    border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap",
  },
  assigneeCountBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 16, height: 16, borderRadius: "50%",
    background: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 800,
  },
};

// Modal styles
const M = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 20,
  },
  modal: {
    background: "#fff", borderRadius: 12,
    boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
    width: "100%", maxWidth: 560,
    maxHeight: "90vh", overflowY: "auto",
    padding: "24px 28px",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  title:  { fontSize: 18, fontWeight: 800, color: "#1e272e", marginBottom: 4 },
  sub:    { fontSize: 13, color: "#555", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 },
  closeBtn: {
    background: "none", border: "none", fontSize: 18,
    cursor: "pointer", color: "#999", padding: "0 4px",
    lineHeight: 1,
  },
  // Summary strip
  strip: {
    display: "flex", gap: 12, marginBottom: 20,
    background: "#f8f9fa", borderRadius: 8, padding: "12px 16px",
  },
  chip:      { flex: 1, textAlign: "center" },
  chipLabel: { display: "block", fontSize: 11, color: "#aaa", marginBottom: 2 },
  chipVal:   { fontSize: 20, fontWeight: 800 },
  // Form
  formRow: {
    display: "flex", gap: 10, alignItems: "flex-end",
    flexWrap: "wrap", marginBottom: 8,
  },
  label:  { display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 },
  select: {
    width: "100%", padding: "8px 10px", border: "1px solid #ddd",
    borderRadius: 5, fontSize: 14, background: "white",
    boxSizing: "border-box", cursor: "pointer",
  },
  input: {
    width: "100%", padding: "8px 10px", border: "1px solid #ddd",
    borderRadius: 5, fontSize: 14, boxSizing: "border-box",
  },
  assignBtn: {
    padding: "9px 18px", background: "#27ae60", color: "white",
    border: "none", borderRadius: 5, fontSize: 13, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap",
  },
  error: { color: "#e74c3c", fontSize: 12, margin: "4px 0 0" },
  // Existing table
  existingTitle: { fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 8 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:    { padding: "7px 10px", background: "#f8f9fa", fontWeight: 600, color: "#666", textAlign: "left", borderBottom: "1px solid #eee", fontSize: 12 },
  td:    { padding: "8px 10px", borderBottom: "1px solid #f5f5f5" },
  avatar: {
    width: 28, height: 28, borderRadius: "50%",
    background: "#3498db", color: "white",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  removeBtn: {
    padding: "3px 10px", background: "#e74c3c", color: "white",
    border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer",
  },
  // Close footer
  closeFooterBtn: {
    padding: "8px 24px", background: "#1e272e", color: "white",
    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700,
    cursor: "pointer",
  },
};

export default AssignmentScreen;
