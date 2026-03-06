import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell, PieChart, Pie
} from "recharts";

const BASE_URL = "http://localhost:7001";
const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const PCT_COLOR = (pct) =>
  pct >= 80 ? "#2ecc71" : pct >= 40 ? "#f39c12" : "#e74c3c";

const CHART_COLORS = [
  "#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6",
  "#1abc9c","#e67e22","#e91e63","#00bcd4","#8bc34a"
];

const UtilizationDashboard = () => {
  const [overall, setOverall]       = useState([]);
  const [projectData, setProject]   = useState([]);
  const [health, setHealth]         = useState([]);
  const [projects, setProjects]     = useState([]);
  const [selProject, setSelProject] = useState("");
  const [tableData, setTableData]   = useState([]);
  const [loading, setLoading]       = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, hRes, pRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/utilization/overall`,        { headers: getHeaders() }),
        axios.get(`${BASE_URL}/api/utilization/project-health`, { headers: getHeaders() }),
        axios.get(`${BASE_URL}/api/projects`,                   { headers: getHeaders() }),
      ]);
      setOverall(oRes.data || []);
      setHealth(hRes.data || []);
      setProjects(pRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const url = selProject
          ? `${BASE_URL}/api/utilization/by-project?projectId=${selProject}`
          : `${BASE_URL}/api/utilization/by-project`;
        const res = await axios.get(url, { headers: getHeaders() });
        setTableData(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTable();
  }, [selProject]);

  // ── CHANGED: strip titles so names are short, used for horizontal chart
  const overallChartData = overall.map((u) => ({
    name:      u.user_name.replace(/^(Mr\.|Ms\.|Mrs\.)\s*/i, ""),
    Assigned:  Number(u.total_assigned),
    Completed: Number(u.total_completed),
    Pending:   Number(u.total_pending),
    pct:       Number(u.utilization_pct),
  }));

  const projectChartData = health.map((p) => ({
    name:      p.project_name,
    Assigned:  Number(p.total_assigned),
    Completed: Number(p.total_completed),
    Pending:   Number(p.total_pending),
    pct:       Number(p.completion_pct),
  }));

  const totalLoad      = health.reduce((s, p) => s + Number(p.total_load), 0);
  const totalAssigned  = health.reduce((s, p) => s + Number(p.total_assigned), 0);
  const totalCompleted = health.reduce((s, p) => s + Number(p.total_completed), 0);
  const pieData = [
    { name: "Completed",   value: totalCompleted },
    { name: "In Progress", value: totalAssigned - totalCompleted },
    { name: "Unassigned",  value: Math.max(totalLoad - totalAssigned, 0) },
  ];

  if (loading) return <div style={{ padding: "40px", color: "#999" }}>Loading dashboard…</div>;

  return (
    <div style={S.page}>

      {/* ── Title row + refresh icon top-right ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ ...S.pageTitle, marginBottom: 0 }}>Utilization Dashboard</h2>
        <button onClick={fetchAll} style={S.refreshBtn} title="Refresh">
          <span style={{ fontSize: 16 }}>↻</span> Refresh
        </button>
      </div>

      {/* ── KPI Strip — UNCHANGED ─────────────────────────────────────── */}
      <div style={S.kpiRow}>
        <KPI label="Total Employees"    value={overall.length}    color="#3498db" />
        <KPI label="Total effort"         value={totalLoad}         color="#9b59b6" />
        <KPI label="Total Assigned"     value={totalAssigned}     color="#f39c12" />
        <KPI label="Total Completed"    value={totalCompleted}    color="#2ecc71" />
        <KPI
          label="Overall Completion"
          value={`${totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0}%`}
          color="#e74c3c"
        />
      </div>

      {/* ── Row 1: CHANGED — horizontal scrollable bar + pie UNCHANGED ── */}
      <div style={S.chartRow}>

        {/* CHANGED: vertical layout (horizontal bars), scrollable */}
        <div style={{ ...S.chartCard, padding: 0, overflow: "hidden" }}>
          <h3 style={{ ...S.chartTitle, padding: "16px 18px 8px", marginBottom: 0 }}>Overall User Utilization</h3>
          <div style={{ overflowY: "auto", overflowX: "hidden", maxHeight: 340 }}>
            <ResponsiveContainer width="100%" height={Math.max(260, overallChartData.length * 36)}>
              <BarChart
                layout="vertical"
                data={overallChartData}
                margin={{ top: 4, right: 20, bottom: 4, left: 30 }}
                barSize={8}
                barCategoryGap="35%"
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={105}
                  tick={{ fontSize: 11, fill: "#444" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.length > 15 ? v.slice(0, 14) + "…" : v}
                />
                <Tooltip
                  contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
                  formatter={(val, name) => [`${val} units`, name]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingLeft: "110px" }} />
                <Bar dataKey="Assigned"  fill="#3498db" radius={[0,3,3,0]} />
                <Bar dataKey="Completed" fill="#2ecc71" radius={[0,3,3,0]} />
                <Bar dataKey="Pending"   fill="#e74c3c" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie — UNCHANGED */}
        <div style={{ ...S.chartCard, maxWidth: "320px" }}>
          <h3 style={S.chartTitle}>Work Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={85}
                dataKey="value" label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                style={{ fontSize: "11px" }}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={["#2ecc71","#f39c12","#e74c3c"][i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v, "units"]} contentStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

   

      {/* ── Row 3: Project Health Cards — UNCHANGED ───────────────────── */}
      <h3 style={S.sectionTitle}>Project Health</h3>
      <div style={S.healthGrid}>
        {health.map((p) => (
          <HealthCard key={p.project_id} p={p} />
        ))}
      </div>

      {/* ── Row 4: Detailed Table — UNCHANGED ────────────────────────── */}
      <h3 style={S.sectionTitle}>Detailed Assignment View</h3>
      <div style={S.tableCard}>
        <div style={S.tableToolbar}>
          <select
            value={selProject}
            onChange={(e) => setSelProject(e.target.value)}
            style={S.select}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
            ))}
          </select>
          <span style={{ fontSize: "13px", color: "#999" }}>{tableData.length} rows</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["User","Project","Role","Task","Assigned","Completed","Pending","Progress"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#bbb", padding: "30px" }}>
                  No data available
                </td></tr>
              ) : (
                tableData.map((r, i) => {
                  const pct = r.units_assigned > 0
                    ? Math.round((r.units_completed / r.units_assigned) * 100) : 0;
                  return (
                    <tr key={i} style={i % 2 === 0 ? {} : { background: "#fafafa" }}>
                      <td style={S.td}><strong>{r.user_name}</strong></td>
                      <td style={S.td}>{r.project_name}</td>
                      <td style={S.td}><RolePill role={r.role} /></td>
                      <td style={{ ...S.td, maxWidth: "180px", fontSize: "12px" }}>{r.task_name}</td>
                      <td style={{ ...S.td, textAlign: "center", fontWeight: "700" }}>{r.units_assigned}</td>
                      <td style={{ ...S.td, textAlign: "center", color: "#2ecc71", fontWeight: "700" }}>{r.units_completed}</td>
                      <td style={{ ...S.td, textAlign: "center", color: Number(r.units_pending) > 0 ? "#e74c3c" : "#2ecc71", fontWeight: "700" }}>
                        {r.units_pending}
                      </td>
                      <td style={{ ...S.td, minWidth: "120px" }}>
                        <MiniBar pct={pct} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Health Card — UNCHANGED ───────────────────────────────────────────────────
const HealthCard = ({ p }) => {
  console.log("project data", p);
  const pct  = Number(p.completion_pct);
  const col  = PCT_COLOR(pct);
  const load = Number(p.total_load);
  const Unassigned = Number(load - p.total_assigned);

  return (
    <div style={S.healthCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={S.healthName}>{p.project_name}</div>
          <StatusPill status={p.status} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "26px", fontWeight: "800", color: col }}>{pct}%</div>
          <div style={{ fontSize: "11px", color: "#999" }}>complete</div>
        </div>
      </div>
      <div style={S.healthBarBg}>
        <div style={{ ...S.healthBarFill, width: `${Math.min(pct, 100)}%`, background: col }} />
      </div>
      <div style={S.healthStats}>
        <Metric label="Effort"       value={load}              color="#9b59b6" />
        <Metric label="Assigned"   value={p.total_assigned}  color="#3498db" />
        <Metric label="Done"       value={p.total_completed} color="#2ecc71" />
        <Metric label="Pending"    value={p.total_pending}   color="#e74c3c" />
        <Metric label="Unassigned" value={Unassigned}        color="#e74c3c" />
      </div>
      <div style={S.healthDates}>
        {p.start_date && <span>{fmt(p.start_date)}</span>}
        <span style={{ color: "#ccc" }}>→</span>
        {p.end_date   && <span>{fmt(p.end_date)}</span>}
      </div>
    </div>
  );
};

// ── All helpers — UNCHANGED ───────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}-${String(dt.getMonth()+1).padStart(2,"0")}-${dt.getFullYear()}`;
};

const KPI = ({ label, value, color }) => (
  <div style={{ ...S.kpi, borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: "24px", fontWeight: "800", color }}>{value}</div>
    <div style={{ fontSize: "12px", color: "#999" }}>{label}</div>
  </div>
);

const Metric = ({ label, value, color }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "16px", fontWeight: "700", color }}>{value}</div>
    <div style={{ fontSize: "10px", color: "#aaa" }}>{label}</div>
  </div>
);

const statusMap = { active: "#2ecc71", completed: "#3498db", "on-hold": "#f39c12", default: "#95a5a6" };
const StatusPill = ({ status }) => (
  <span style={{
    padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700",
    background: statusMap[status?.toLowerCase()] || statusMap.default, color: "white",
    textTransform: "uppercase"
  }}>{status || "—"}</span>
);

const roleColors = {
  BA: "#8e44ad", UI: "#2980b9", TL: "#16a085",
  "FE Dev": "#d35400", "BE Dev": "#c0392b",
  "Mobile/IOS Dev": "#1abc9c", Tester: "#f39c12",
};
const RolePill = ({ role }) => (
  <span style={{
    padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700",
    background: roleColors[role] || "#555", color: "white", whiteSpace: "nowrap"
  }}>{role}</span>
);

const MiniBar = ({ pct }) => {
  const color = pct >= 100 ? "#2ecc71" : pct > 50 ? "#f39c12" : "#e74c3c";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ flex: 1, background: "#f0f0f0", borderRadius: "4px", height: "7px", overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: color, borderRadius: "4px" }} />
      </div>
      <span style={{ fontSize: "11px", color, fontWeight: "700", minWidth: "32px" }}>{pct}%</span>
    </div>
  );
};

// ── Styles — UNCHANGED + 3 new keys ──────────────────────────────────────────
const S = {
  page:        { padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" },
  pageTitle:   { fontSize: "22px", fontWeight: "800", color: "#1e272e", marginBottom: "20px" },
  sectionTitle:{ fontSize: "16px", fontWeight: "700", color: "#1e272e", margin: "24px 0 12px" },
  kpiRow:      { display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "24px" },
  kpi:         { flex: "1", minWidth: "130px", background: "white", borderRadius: "8px", padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", textAlign: "center" },
  chartRow:    { display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" },
  chartCard:   { flex: "1", minWidth: "280px", background: "white", borderRadius: "10px", padding: "18px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: "16px" },
  chartTitle:  { fontSize: "14px", fontWeight: "700", color: "#333", marginBottom: "12px" },
  healthGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", marginBottom: "8px" },
  healthCard:  { background: "white", borderRadius: "10px", padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" },
  healthName:  { fontWeight: "700", fontSize: "14px", color: "#1e272e", marginBottom: "6px" },
  healthBarBg: { height: "6px", background: "#f0f0f0", borderRadius: "4px", margin: "12px 0" },
  healthBarFill:{ height: "100%", borderRadius: "4px", transition: "width 0.6s ease" },
  healthStats: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  healthDates: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#aaa", marginTop: "8px", borderTop: "1px solid #f5f5f5", paddingTop: "8px" },
  tableCard:   { background: "white", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: "30px" },
  tableToolbar:{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #f0f0f0" },
  select:      { padding: "7px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", background: "white", cursor: "pointer" },
  table:       { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th:          { padding: "10px 14px", background: "#1e272e", color: "white", textAlign: "center", fontWeight: "600", fontSize: "12px", whiteSpace: "nowrap" },
  td:          { padding: "9px 14px", borderBottom: "1px solid #f5f5f5", color: "#333" },
  // ── 3 new keys only ──
  refreshBtn:  { display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", background: "white", border: "1px solid #ddd", borderRadius: "8px", fontSize: "13px", fontWeight: "700", color: "#555", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  projectGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px", marginBottom: "8px" },
  projCard:    { background: "white", borderRadius: "10px", padding: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
};

export default UtilizationDashboard;
