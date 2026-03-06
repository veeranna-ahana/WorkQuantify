import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:7001";
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

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
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

const StatusBadge = ({ assigned, planned }) => {
  const p = pct(assigned, planned);
  if (planned === 0) return <span style={badge("#aaa")}>No Load</span>;
  if (p === 0)       return <span style={badge("#e74c3c")}>Unassigned</span>;
  if (p < 100)       return <span style={badge("#f39c12")}>{p}% Assigned</span>;
  return              <span style={badge("#27ae60")}>Fully Assigned</span>;
};
const badge = (bg) => ({ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", background: bg, color: "white", whiteSpace: "nowrap" });
const KPI = ({ label, value, color }) => (
  <div style={{ textAlign: "center", background: "white", borderRadius: 8, padding: "10px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${color}`, minWidth: 90 }}>
    <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 11, color: "#999" }}>{label}</div>
  </div>
);

const AssignmentScreen = () => {
  const [projects,    setProjects]    = useState([]);
  const [users,       setUsers]       = useState([]);
  const [catalog,     setCatalog]     = useState({});
  const [selProject,  setSelProject]  = useState("");
  const [loadDraft,   setLoadDraft]   = useState({});
  const [totalLoad,   setTotalLoad]   = useState(0);
  const [savingLoad,  setSavingLoad]  = useState(false);
  const [loadSaved,   setLoadSaved]   = useState(false);
  const [asgUser,     setAsgUser]     = useState("");
  const [asgRole,     setAsgRole]     = useState("");
  const [asgTask,     setAsgTask]     = useState("");
  const [asgUnits,    setAsgUnits]    = useState("");
  const [taskOptions, setTaskOptions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [summary,     setSummary]     = useState({ rows: [], totals: {} });

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

  useEffect(() => { if (selProject) fetchProjectData(selProject); }, [selProject, fetchProjectData]);
  useEffect(() => { setTaskOptions((catalog[asgRole] || []).map(t => t.task_name)); setAsgTask(""); }, [asgRole, catalog]);

  const handleLoadInput = (role, taskName, val) => {
    setLoadDraft(prev => ({ ...prev, [`${role}||${taskName}`]: val === "" ? "" : Number(val) }));
  };

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
      const res = await axios.post(`${BASE_URL}/api/assignments/task-loads/bulk`, { project_id: selProject, loads }, { headers: getHeaders() });
      setTotalLoad(res.data.total_load || 0);
      setLoadSaved(true);
      setTimeout(() => setLoadSaved(false), 2500);
      fetchProjectData(selProject);
    } catch (err) { alert("Failed to save"); }
    finally { setSavingLoad(false); }
  };

  const handleAddAssignment = async () => {
    if (!selProject || !asgUser || !asgRole || !asgTask) return alert("All fields required");
    try {
      await axios.post(`${BASE_URL}/api/assignments`,
        { project_id: selProject, user_id: asgUser, role: asgRole, task_name: asgTask, units_assigned: asgUnits || 0 },
        { headers: getHeaders() });
      setAsgUser(""); setAsgRole(""); setAsgTask(""); setAsgUnits("");
      fetchProjectData(selProject);
    } catch (err) { alert("Failed to assign"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    await axios.delete(`${BASE_URL}/api/assignments/${id}`, { headers: getHeaders() });
    fetchProjectData(selProject);
  };

  const assignmentsByRole = assignments.reduce((acc, a) => { if (!acc[a.role]) acc[a.role] = []; acc[a.role].push(a); return acc; }, {});
  const summaryByKey = {};
  (summary.rows || []).forEach(r => { summaryByKey[`${r.role}||${r.task_name}`] = r; });
  const { total_planned = 0, total_assigned = 0, total_completed = 0 } = summary.totals || {};

  return (
    <div style={S.page}>
      <h2 style={S.pageTitle}>Assignment Screen</h2>

      <section style={S.card}>
        <div style={S.row}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={S.label}>Select Project</label>
            <select value={selProject} onChange={e => setSelProject(e.target.value)} style={S.select}>
              <option value="">Choose a project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_name || p.name}</option>)}
            </select>
          </div>
          {selProject && (
            <div style={S.kpiStrip}>
              <KPI label="Total Effort"  value={total_planned}  color="#9b59b6" />
              <KPI label="Assigned"    value={total_assigned}  color="#3498db" />
              <KPI label="Completed"   value={total_completed} color="#27ae60" />
              <KPI label="Pending"     value={Math.max(total_assigned - total_completed, 0)} color="#e74c3c" />
            </div>
          )}
        </div>
      </section>

      {selProject && <>
        {/* ── Load Definition ── */}
        <section style={S.card}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.sectionTitle}>1. Define Project Load</div>
              <div style={S.sectionSub}>Set planned units per role & task. Total = project load. Leave 0 to exclude.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {loadSaved && <span style={{ color: "#27ae60", fontSize: 13, fontWeight: 700 }}>✓ Saved!</span>}
              <div style={S.totalBadge}>Total: <strong style={{ marginLeft: 4 }}>{totalLoad} units</strong></div>
              <button onClick={handleSaveLoads} style={S.primaryBtn} disabled={savingLoad}>
                {savingLoad ? "Saving…" : "Save All Loads"}
              </button>
            </div>
          </div>

          {Object.entries(catalog).map(([role, tasks]) => {
            const rs = roleStyle(role);
            const rolePlanned  = tasks.reduce((s, t) => s + (Number(loadDraft[`${role}||${t.task_name}`]) || 0), 0);
            const roleAssigned = tasks.reduce((s, t) => s + Number(summaryByKey[`${role}||${t.task_name}`]?.total_assigned || 0), 0);
            return (
              <div key={role} style={{ marginBottom: 14 }}>
                <div style={{ ...S.roleBar, background: rs.bg, borderLeft: `4px solid ${rs.border}` }}>
                  <span style={{ color: rs.text, fontWeight: 700, fontSize: 13 }}>{role}</span>
                  <span style={{ fontSize: 12, color: rs.text, opacity: 0.75 }}>{rolePlanned} planned · {roleAssigned} assigned</span>
                </div>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Task</th>
                      <th style={S.th}>Unit Type</th>
                      <th style={{ ...S.th, width: 130 }}>Planned Units</th>
                      <th style={{ ...S.th, width: 100 }}>Assigned</th>
                      <th style={{ ...S.th, width: 100 }}>Completed</th>
                      <th style={{ ...S.th, width: 130 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t, i) => {
                      const key       = `${role}||${t.task_name}`;
                      const planned   = Number(loadDraft[key]) || 0;
                      const sumRow    = summaryByKey[key];
                      const assigned  = sumRow ? Number(sumRow.total_assigned)  : 0;
                      const completed = sumRow ? Number(sumRow.total_completed) : 0;
                      return (
                        <tr key={t.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={S.td}>{t.task_name}</td>
                          <td style={{ ...S.td, color: "#999", fontSize: 12 }}>{t.unit_type}</td>
                          <td style={S.td}>
                            <input type="number" min="0" value={loadDraft[key] ?? ""} placeholder="0"
                              onChange={e => handleLoadInput(role, t.task_name, e.target.value)}
                              style={S.unitInput} />
                          </td>
                          <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: "#3498db" }}>{assigned}</td>
                          <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: "#27ae60" }}>{completed}</td>
                          <td style={S.td}><StatusBadge assigned={assigned} planned={planned} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>

        {/* ── Assign Employee ── */}
        <section style={S.card}>
          <div style={S.sectionTitle}>2. Assign Employee to Task</div>
          <div style={{ ...S.row, marginTop: 12 }}>
            <div style={S.field}>
              <label style={S.label}>Employee</label>
              <select value={asgUser} onChange={e => setAsgUser(e.target.value)} style={S.select}>
                <option value="">Select…</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Role</label>
              <select value={asgRole} onChange={e => setAsgRole(e.target.value)} style={S.select}>
                <option value="">Select…</option>
                {Object.keys(catalog).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Task</label>
              <select value={asgTask} onChange={e => setAsgTask(e.target.value)} style={S.select} disabled={!asgRole}>
                <option value="">Select…</option>
                {taskOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ ...S.field, maxWidth: 110 }}>
              <label style={S.label}>Units</label>
              <input type="number" min="0" value={asgUnits} onChange={e => setAsgUnits(e.target.value)} style={S.input} placeholder="0" />
            </div>
            <div style={{ alignSelf: "flex-end" }}>
              <button onClick={handleAddAssignment} style={S.primaryBtn}>+ Assign</button>
            </div>
          </div>
        </section>

        {/* ── Assigned Employees ── */}
        {assignments.length > 0 && (
          <section style={S.card}>
            <div style={S.sectionTitle}>3. Current Assignments</div>
            {Object.entries(assignmentsByRole).map(([role, rows]) => {
              const rs = roleStyle(role);
              return (
                <div key={role} style={{ marginBottom: 14 }}>
                  <div style={{ ...S.roleBar, background: rs.bg, borderLeft: `4px solid ${rs.border}` }}>
                    <span style={{ color: rs.text, fontWeight: 700, fontSize: 13 }}>{role}</span>
                    <span style={{ fontSize: 12, color: rs.text, opacity: 0.7 }}>{rows.reduce((s, r) => s + Number(r.units_assigned), 0)} units total</span>
                  </div>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Employee</th>
                        <th style={S.th}>Task</th>
                        <th style={{ ...S.th, width: 100 }}>Units</th>
                        <th style={{ ...S.th, width: 90 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((a, i) => (
                        <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={S.td}><strong>{a.user_name}</strong></td>
                          <td style={S.td}>{a.task_name}</td>
                          <td style={{ ...S.td, textAlign: "center", fontWeight: 700 }}>{a.units_assigned}</td>
                          <td style={S.td}><button onClick={() => handleDelete(a.id)} style={S.deleteBtn}>Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>
        )}
      </>}

      {!selProject && (
        <div style={{ ...S.card, textAlign: "center", padding: "50px 20px", color: "#bbb" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <p style={{ fontSize: 15 }}>Select a project to define loads and assign employees</p>
        </div>
      )}
    </div>
  );
};

const S = {
  page:        { padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" },
  pageTitle:   { fontSize: "22px", fontWeight: "800", color: "#1e272e", marginBottom: "20px" },
  card:        { background: "#fff", borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", padding: "20px", marginBottom: 20 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  sectionTitle:{ fontSize: 15, fontWeight: 700, color: "#1e272e", marginBottom: 4 },
  sectionSub:  { fontSize: 12, color: "#999" },
  row:         { display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" },
  field:       { flex: 1, minWidth: 160 },
  label:       { display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5 },
  input:       { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 5, fontSize: 14, boxSizing: "border-box" },
  select:      { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 5, fontSize: 14, background: "white", boxSizing: "border-box", cursor: "pointer" },
  unitInput:   { width: "100%", padding: "5px 8px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13, boxSizing: "border-box", textAlign: "center" },
  primaryBtn:  { padding: "8px 20px", background: "#e74c3c", color: "white", border: "none", borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  deleteBtn:   { padding: "4px 10px", background: "#e74c3c", color: "white", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" },
  roleBar:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderRadius: "6px 6px 0 0" },
  table:       { width: "100%", borderCollapse: "collapse", fontSize: 13, border: "1px solid #eee" },
  th:          { padding: "8px 12px", background: "#f8f9fa", fontWeight: 600, color: "#555", textAlign: "center", borderBottom: "1px solid #dee2e6", fontSize: 12 },
  td:          { padding: "8px 12px", borderBottom: "1px solid #f5f5f5", color: "#333" },
  kpiStrip:    { display: "flex", gap: 10, flexWrap: "wrap" },
  totalBadge:  { background: "#f0f0f0", borderRadius: 6, padding: "6px 14px", fontSize: 13, color: "#555" },
};

export default AssignmentScreen;
