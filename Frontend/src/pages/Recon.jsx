import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// Color palettes for premium feel
const THEME_COLORS = {
  primary: "#4f46e5", // Indigo
  primaryLight: "#818cf8",
  success: "#10b981", // Emerald
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Rose
  neutralDark: "#1f2937",
  neutralLight: "#f9fafb",
  gray: "#9ca3af",
  cardBg: "#ffffff",
  background: "#f3f4f6",
};

const STATUS_PILLS = {
  "On Track": { bg: "#d1fae5", text: "#065f46" },
  "Over Utilized": { bg: "#fee2e2", text: "#991b1b" },
  "Under Utilized": { bg: "#fef3c7", text: "#92400e" },
};

const CHART_PALETTE = ["#4f46e5", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899"];

const ReconPage = () => {
  // Tabs: "project", "employee", "charts"
  const [activeTab, setActiveTab] = useState("project");

  // Filter States
  const [filters, setFilters] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    clientName: "",
    projectCode: "",
    projectName: "",
    employeeName: "",
    department: "",
    reportingManager: "",
  });

  // Filter options from API
  const [filterOpts, setFilterOpts] = useState({
    clients: [],
    projects: [],
    employees: [],
    departments: [],
    managers: [],
  });

  // Data States
  const [dashboardData, setDashboardData] = useState({
    total_projects: 0,
    total_estimated_hours: 0,
    total_actual_hours: 0,
    total_variance_hours: 0,
    overutilized_count: 0,
    underutilized_count: 0,
  });

  const [projectReconList, setProjectReconList] = useState([]);
  const [employeeReconList, setEmployeeReconList] = useState([]);
  
  // Charts States
  const [projectCharts, setProjectCharts] = useState({
    allProjects: [],
    topOverutilized: [],
    topUnderutilized: [],
  });
  const [employeeCharts, setEmployeeCharts] = useState([]);

  // Detail View State
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // General States
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef(null);

  // Fetch Dropdown Filter Options
  const fetchFilterOpts = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/recon/filters`, { headers: getHeaders() });
      setFilterOpts(res.data);
    } catch (err) {
      console.error("Error fetching filter options:", err);
    }
  }, []);

  // Fetch Dashboard & List Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, val]) => val !== "")
        )
      ).toString();

      // Fetch dashboard summary
      const dashRes = await axios.get(`${BASE_URL}/api/recon/dashboard?${queryParams}`, {
        headers: getHeaders(),
      });
      setDashboardData(dashRes.data);

      // Fetch project level reconciliation
      const projRes = await axios.get(`${BASE_URL}/api/recon/project-level?${queryParams}`, {
        headers: getHeaders(),
      });
      setProjectReconList(projRes.data);

      // Fetch employee level reconciliation
      const empRes = await axios.get(`${BASE_URL}/api/recon/employee-level?${queryParams}`, {
        headers: getHeaders(),
      });
      setEmployeeReconList(empRes.data);

      // Fetch Charts data
      const projChartRes = await axios.get(`${BASE_URL}/api/recon/charts/project?${queryParams}`, {
        headers: getHeaders(),
      });
      setProjectCharts(projChartRes.data);

      const empChartRes = await axios.get(`${BASE_URL}/api/recon/charts/employee?${queryParams}`, {
        headers: getHeaders(),
      });
      setEmployeeCharts(empChartRes.data);

    } catch (err) {
      console.error("Error fetching reconciliation data:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilterOpts();
  }, [fetchFilterOpts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch Project Details
  const handleViewProjectDetails = async (projectId) => {
    setSelectedProjectId(projectId);
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const queryParams = new URLSearchParams({
        month: filters.month,
        year: filters.year,
      }).toString();
      const res = await axios.get(`${BASE_URL}/api/recon/project-detail/${projectId}?${queryParams}`, {
        headers: getHeaders(),
      });
      setProjectDetail(res.data);
    } catch (err) {
      console.error("Error fetching project details:", err);
      alert("Failed to load project details.");
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Upload Timesheet logic
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus("Parsing CSV...");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          throw new Error("CSV file is empty or missing data rows.");
        }

        // Header mapping
        const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
        const entries = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
          if (cols.length < headers.length) continue;

          const entry = {};
          headers.forEach((h, idx) => {
            entry[h] = cols[idx];
          });
          entries.push(entry);
        }

        setUploadStatus(`Uploading ${entries.length} entries to server...`);
        const res = await axios.post(
          `${BASE_URL}/api/recon/upload-timesheet`,
          { entries },
          { headers: getHeaders() }
        );

        setUploadStatus(`Success! ${res.data.inserted} rows imported.`);
        setTimeout(() => {
          setUploadStatus("");
          fetchData();
        }, 3000);
      } catch (err) {
        console.error("Upload error:", err);
        setUploadStatus(`Error: ${err.message || "Failed to parse CSV file."}`);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
  };

  const resetFilters = () => {
    setFilters({
      month: "",
      year: new Date().getFullYear().toString(),
      clientName: "",
      projectCode: "",
      projectName: "",
      employeeName: "",
      department: "",
      reportingManager: "",
    });
  };

  // Month values helper
  const monthsList = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div style={S.container}>
      {/* Header section with Timesheet Upload */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}>Effort Reconciliation Dashboard</h1>
          <p style={S.subtitle}>Compare Project Estimates against Actual Hours logged in Timesheets</p>
        </div>
        <div style={S.headerActions}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".csv"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            style={S.uploadBtn}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "📁 Import Timesheet CSV"}
          </button>
          <button onClick={fetchData} style={S.refreshBtn} title="Refresh Data">
            ↻
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div style={{ ...S.uploadNotification, backgroundColor: uploadStatus.includes("Error") ? "#fee2e2" : "#e0f2fe", color: uploadStatus.includes("Error") ? "#991b1b" : "#0369a1" }}>
          {uploadStatus}
        </div>
      )}

      {/* KPI Cards section */}
      <div style={S.kpiGrid}>
        <KPICard label="Total Projects" value={dashboardData.total_projects} icon="📁" color="#6366f1" />
        <KPICard label="Total Estimated Hours" value={`${Number(dashboardData.total_estimated_hours).toLocaleString()} hrs`} icon="⏱️" color="#3b82f6" />
        <KPICard label="Total Actual Hours" value={`${Number(dashboardData.total_actual_hours).toLocaleString()} hrs`} icon="✅" color="#10b981" />
        <KPICard
          label="Total Variance Hours"
          value={`${Number(dashboardData.total_variance_hours) > 0 ? "+" : ""}${Number(dashboardData.total_variance_hours).toLocaleString()} hrs`}
          icon="📊"
          color={Number(dashboardData.total_variance_hours) > 0 ? "#ef4444" : "#10b981"}
        />
        <KPICard label="Overutilized Projects" value={dashboardData.overutilized_count} icon="📈" color="#ef4444" />
        <KPICard label="Underutilized Projects" value={dashboardData.underutilized_count} icon="📉" color="#f59e0b" />
      </div>

      {/* Filter panel */}
      <div style={S.filterCard}>
        <div style={S.filterTitleRow}>
          <h3 style={S.sectionTitle}>🔍 Search & Filters</h3>
          <button onClick={resetFilters} style={S.resetBtn}>Reset Filters</button>
        </div>
        <div style={S.filterGrid}>
          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Month</label>
            <select
              value={filters.month}
              onChange={e => handleFilterChange("month", e.target.value)}
              style={S.select}
            >
              <option value="">All Months</option>
              {monthsList.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Year</label>
            <select
              value={filters.year}
              onChange={e => handleFilterChange("year", e.target.value)}
              style={S.select}
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Customer Name</label>
            <select
              value={filters.clientName}
              onChange={e => handleFilterChange("clientName", e.target.value)}
              style={S.select}
            >
              <option value="">All Customers</option>
              {filterOpts.clients.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Project Code</label>
            <input
              type="text"
              placeholder="e.g. PRJ-001"
              value={filters.projectCode}
              onChange={e => handleFilterChange("projectCode", e.target.value)}
              style={S.input}
            />
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Project Name</label>
            <input
              type="text"
              placeholder="e.g. ERP Phase 2"
              value={filters.projectName}
              onChange={e => handleFilterChange("projectName", e.target.value)}
              style={S.input}
            />
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Employee Name</label>
            <input
              type="text"
              placeholder="Search Employee..."
              value={filters.employeeName}
              onChange={e => handleFilterChange("employeeName", e.target.value)}
              style={S.input}
            />
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Department</label>
            <select
              value={filters.department}
              onChange={e => handleFilterChange("department", e.target.value)}
              style={S.select}
            >
              <option value="">All Departments</option>
              {filterOpts.departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Reporting Manager</label>
            <select
              value={filters.reportingManager}
              onChange={e => handleFilterChange("reportingManager", e.target.value)}
              style={S.select}
            >
              <option value="">All Managers</option>
              {filterOpts.managers.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={S.tabsContainer}>
        <button
          onClick={() => setActiveTab("project")}
          style={{ ...S.tabBtn, ...(activeTab === "project" ? S.tabBtnActive : {}) }}
        >
          📂 Project Level Reconciliation
        </button>
        <button
          onClick={() => setActiveTab("employee")}
          style={{ ...S.tabBtn, ...(activeTab === "employee" ? S.tabBtnActive : {}) }}
        >
          👥 Employee Level Reconciliation
        </button>
        <button
          onClick={() => setActiveTab("charts")}
          style={{ ...S.tabBtn, ...(activeTab === "charts" ? S.tabBtnActive : {}) }}
        >
          📈 Reconciliation Analytics & Charts
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={S.loadingContainer}>
          <div style={S.spinner}></div>
          <span style={{ marginTop: 12, color: "#6b7280" }}>Refreshing Reconciliation Data...</span>
        </div>
      ) : (
        <>
          {activeTab === "project" && (
            <div style={S.tableCard}>
              <div style={S.tableHeader}>
                <h3 style={S.sectionTitle}>Project Level Reconciliation</h3>
                <span style={S.rowCount}>{projectReconList.length} projects found</span>
              </div>
              <div style={S.tableResponsive}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Project Code</th>
                      <th style={S.th}>Project Name</th>
                      <th style={S.th}>Client Name</th>
                      <th style={{ ...S.th, textAlign: "right" }}>Estimated Hours</th>
                      <th style={{ ...S.th, textAlign: "right" }}>Actual Hours</th>
                      <th style={{ ...S.th, textAlign: "right" }}>Variance Hours</th>
                      <th style={{ ...S.th, textAlign: "right" }}>Variance %</th>
                      <th style={S.th}>Status</th>
                      <th style={{ ...S.th, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectReconList.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={S.emptyCell}>No reconciliation records match current filters.</td>
                      </tr>
                    ) : (
                      projectReconList.map(item => (
                        <tr key={item.project_id} style={S.tr}>
                          <td style={S.td}><strong>{item.project_code || "—"}</strong></td>
                          <td style={S.td}>{item.project_name}</td>
                          <td style={S.td}>{item.client_name}</td>
                          <td style={{ ...S.td, textAlign: "right", fontWeight: "600" }}>{Number(item.estimated_hours).toLocaleString()}</td>
                          <td style={{ ...S.td, textAlign: "right", fontWeight: "600", color: "#4f46e5" }}>{Number(item.actual_hours).toLocaleString()}</td>
                          <td style={{ ...S.td, textAlign: "right", fontWeight: "600", color: Number(item.variance_hours) > 0 ? "#ef4444" : "#10b981" }}>
                            {Number(item.variance_hours) > 0 ? "+" : ""}{Number(item.variance_hours).toLocaleString()}
                          </td>
                          <td style={{ ...S.td, textAlign: "right", fontWeight: "600", color: Number(item.variance_pct) > 0 ? "#ef4444" : "#10b981" }}>
                            {Number(item.variance_pct) > 0 ? "+" : ""}{item.variance_pct}%
                          </td>
                          <td style={S.td}>
                            <span style={{ ...S.statusPill, ...STATUS_PILLS[item.status] }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ ...S.td, textAlign: "center" }}>
                            <button
                              onClick={() => handleViewProjectDetails(item.project_id)}
                              style={S.actionBtn}
                            >
                              👁️ View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "employee" && (
            <div style={S.tableCard}>
              <div style={S.tableHeader}>
                <h3 style={S.sectionTitle}>Employee Level Reconciliation</h3>
                <span style={S.rowCount}>{employeeReconList.length} assignments found</span>
              </div>
              <div style={S.tableResponsive}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Employee Code</th>
                      <th style={S.th}>Employee Name</th>
                      <th style={S.th}>Reporting Manager</th>
                      <th style={S.th}>Project Code</th>
                      <th style={S.th}>Project Name</th>
                      <th style={{ ...S.th, textAlign: "right" }}>Estimated Assigned Hours</th>
                      <th style={{ ...S.th, textAlign: "right" }}>Actual Hours Worked</th>
                      <th style={{ ...S.th, textAlign: "right" }}>Variance Hours</th>
                      <th style={{ ...S.th, textAlign: "right" }}>Variance %</th>
                      <th style={S.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeReconList.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={S.emptyCell}>No employee assignments found matching current filters.</td>
                      </tr>
                    ) : (
                      employeeReconList.map((item, idx) => (
                        <tr key={idx} style={S.tr}>
                          <td style={S.td}><strong>{item.employee_code || "—"}</strong></td>
                          <td style={S.td}>{item.employee_name}</td>
                          <td style={S.td}>{item.reporting_manager || "—"}</td>
                          <td style={S.td}>{item.project_code || "—"}</td>
                          <td style={S.td}>{item.project_name}</td>
                          <td style={{ ...S.td, textAlign: "right", fontWeight: "600" }}>{Number(item.assigned_hours).toLocaleString()}</td>
                          <td style={{ ...S.td, textAlign: "right", fontWeight: "600", color: "#4f46e5" }}>{Number(item.actual_hours).toLocaleString()}</td>
                          <td style={{ ...S.td, textAlign: "right", fontWeight: "600", color: Number(item.variance_hours) > 0 ? "#ef4444" : "#10b981" }}>
                            {Number(item.variance_hours) > 0 ? "+" : ""}{Number(item.variance_hours).toLocaleString()}
                          </td>
                          <td style={{ ...S.td, textAlign: "right", fontWeight: "600", color: Number(item.variance_pct) > 0 ? "#ef4444" : "#10b981" }}>
                            {Number(item.variance_pct) > 0 ? "+" : ""}{item.variance_pct}%
                          </td>
                          <td style={S.td}>
                            <span style={{ ...S.statusPill, ...STATUS_PILLS[item.status] }}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "charts" && (
            <div style={S.chartsWrapper}>
              <div style={S.chartRow}>
                {/* Chart 1: Project Estimated vs Actual */}
                <div style={S.chartCard}>
                  <h4 style={S.chartTitle}>Estimated vs Actual Hours (Project Level)</h4>
                  <div style={{ width: "100%", height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={projectCharts.allProjects.slice(0, 10)}>
                        <XAxis dataKey="project_name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="estimated_hours" name="Estimated Hours" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual_hours" name="Actual Hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Top Overutilized Projects */}
                <div style={S.chartCard}>
                  <h4 style={S.chartTitle}>Top Overutilized Projects (Variance Hours)</h4>
                  <div style={{ width: "100%", height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={projectCharts.topOverutilized}>
                        <XAxis dataKey="project_name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="variance_hours" name="Extra Hours Worked" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div style={S.chartRow}>
                {/* Chart 3: Top Underutilized Projects */}
                <div style={S.chartCard}>
                  <h4 style={S.chartTitle}>Top Underutilized Projects (Negative Variance)</h4>
                  <div style={{ width: "100%", height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={projectCharts.topUnderutilized}>
                        <XAxis dataKey="project_name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="variance_hours" name="Remaining Planned Hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Employee Planned vs Actual */}
                <div style={S.chartCard}>
                  <h4 style={S.chartTitle}>Planned vs Actual Hours (Top Employees)</h4>
                  <div style={{ width: "100%", height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={employeeCharts.slice(0, 10)}>
                        <XAxis dataKey="employee_name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={70} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="planned_hours" name="Planned Hours" fill="#34d399" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual_hours" name="Actual Hours" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Project Details Modal */}
      {showDetailModal && (
        <div style={S.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowDetailModal(false); }}>
          <div style={S.modalContent}>
            <div style={S.modalHeader}>
              <div>
                <h2 style={S.modalTitle}>Detailed Reconciliation</h2>
                <span style={S.modalSubtitle}>Detailed audit for chosen project & timesheets</span>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={S.modalClose}>✕</button>
            </div>

            {loadingDetail || !projectDetail ? (
              <div style={S.modalLoading}>
                <div style={S.spinner}></div>
                <span style={{ marginTop: 12 }}>Loading detail reports...</span>
              </div>
            ) : (
              <div style={S.modalBody}>
                {/* Project Level Summary Info */}
                <div style={S.detailSection}>
                  <h4 style={S.detailSecTitle}>📋 Project Summary Details</h4>
                  <div style={S.detailSummaryGrid}>
                    <div style={S.detailField}>
                      <span style={S.detailLabel}>Project Code</span>
                      <span style={S.detailValue}>{projectDetail.project.project_code || "—"}</span>
                    </div>
                    <div style={S.detailField}>
                      <span style={S.detailLabel}>Project Name</span>
                      <span style={S.detailValue}>{projectDetail.project.project_name}</span>
                    </div>
                    <div style={S.detailField}>
                      <span style={S.detailLabel}>Client Name</span>
                      <span style={S.detailValue}>{projectDetail.project.client_name}</span>
                    </div>
                    <div style={S.detailField}>
                      <span style={S.detailLabel}>Estimated Hours</span>
                      <span style={S.detailValue}>{Number(projectDetail.project.estimated_hours).toLocaleString()} hrs</span>
                    </div>
                    <div style={S.detailField}>
                      <span style={S.detailLabel}>Actual Hours Logged</span>
                      <span style={{ ...S.detailValue, color: "#4f46e5" }}>{Number(projectDetail.project.actual_hours).toLocaleString()} hrs</span>
                    </div>
                    <div style={S.detailField}>
                      <span style={S.detailLabel}>Remaining Hours</span>
                      <span style={{ ...S.detailValue, color: "#10b981" }}>{Number(projectDetail.project.remaining_hours).toLocaleString()} hrs</span>
                    </div>
                    <div style={S.detailField}>
                      <span style={S.detailLabel}>Variance Hours</span>
                      <span style={{ ...S.detailValue, color: Number(projectDetail.project.variance_hours) > 0 ? "#ef4444" : "#10b981" }}>
                        {Number(projectDetail.project.variance_hours) > 0 ? "+" : ""}{Number(projectDetail.project.variance_hours).toLocaleString()} hrs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role-wise Breakdown */}
                <div style={S.detailSection}>
                  <h4 style={S.detailSecTitle}>💼 Role-wise Reconciliation Breakdown</h4>
                  <div style={S.tableResponsive}>
                    <table style={S.subTable}>
                      <thead>
                        <tr>
                          <th style={S.subTh}>Role / Designation</th>
                          <th style={{ ...S.subTh, textAlign: "right" }}>Estimated Hours</th>
                          <th style={{ ...S.subTh, textAlign: "right" }}>Actual Hours Logged</th>
                          <th style={{ ...S.subTh, textAlign: "right" }}>Variance Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectDetail.roleSummary.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={S.emptyCell}>No role estimates defined for this project.</td>
                          </tr>
                        ) : (
                          projectDetail.roleSummary.map((r, idx) => (
                            <tr key={idx} style={S.subTr}>
                              <td style={S.subTd}><strong>{r.role}</strong></td>
                              <td style={{ ...S.subTd, textAlign: "right" }}>{Number(r.estimated_hours).toLocaleString()}</td>
                              <td style={{ ...S.subTd, textAlign: "right", color: "#4f46e5" }}>{Number(r.actual_hours).toLocaleString()}</td>
                              <td style={{ ...S.subTd, textAlign: "right", fontWeight: "600", color: Number(r.variance_hours) > 0 ? "#ef4444" : "#10b981" }}>
                                {Number(r.variance_hours) > 0 ? "+" : ""}{Number(r.variance_hours).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Employee-wise Breakdown */}
                <div style={S.detailSection}>
                  <h4 style={S.detailSecTitle}>👥 Employee Allocation & Timesheet Breakdown</h4>
                  <div style={S.tableResponsive}>
                    <table style={S.subTable}>
                      <thead>
                        <tr>
                          <th style={S.subTh}>Employee Code</th>
                          <th style={S.subTh}>Employee Name</th>
                          <th style={{ ...S.subTh, textAlign: "right" }}>Assigned Planned Hours</th>
                          <th style={{ ...S.subTh, textAlign: "right" }}>Actual Hours Worked</th>
                          <th style={{ ...S.subTh, textAlign: "right" }}>Variance Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectDetail.employeeSummary.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={S.emptyCell}>No employee allocations or timesheets registered.</td>
                          </tr>
                        ) : (
                          projectDetail.employeeSummary.map((e, idx) => (
                            <tr key={idx} style={S.subTr}>
                              <td style={S.subTd}>{e.employee_code || "—"}</td>
                              <td style={S.subTd}><strong>{e.employee_name}</strong></td>
                              <td style={{ ...S.subTd, textAlign: "right" }}>{Number(e.planned_hours).toLocaleString()}</td>
                              <td style={{ ...S.subTd, textAlign: "right", color: "#4f46e5" }}>{Number(e.actual_hours).toLocaleString()}</td>
                              <td style={{ ...S.subTd, textAlign: "right", fontWeight: "600", color: Number(e.variance_hours) > 0 ? "#ef4444" : "#10b981" }}>
                                {Number(e.variance_hours) > 0 ? "+" : ""}{Number(e.variance_hours).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            <div style={S.modalFooter}>
              <button onClick={() => setShowDetailModal(false)} style={S.closeModalBtn}>Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG KPI Helper Component
const KPICard = ({ label, value, icon, color }) => (
  <div style={{ ...S.kpiCard, borderLeft: `5px solid ${color}` }}>
    <div style={S.kpiIconWrapper}>
      <span style={{ fontSize: 24 }}>{icon}</span>
    </div>
    <div style={S.kpiContent}>
      <span style={S.kpiLabel}>{label}</span>
      <span style={{ ...S.kpiValue, color: "#1f2937" }}>{value}</span>
    </div>
  </div>
);

// Styles
const S = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#111827",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  uploadBtn: {
    padding: "10px 18px",
    background: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)",
    transition: "transform 0.15s, background-color 0.15s",
  },
  refreshBtn: {
    padding: "10px 14px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    color: "#4b5563",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  uploadNotification: {
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "13.5px",
    fontWeight: "600",
    marginBottom: "24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },
  kpiCard: {
    backgroundColor: "#ffffff",
    padding: "16px 20px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.04)",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  kpiIconWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiContent: {
    display: "flex",
    flexDirection: "column",
  },
  kpiLabel: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  kpiValue: {
    fontSize: "20px",
    fontWeight: "800",
    marginTop: "2px",
  },
  filterCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.04)",
    marginBottom: "28px",
  },
  filterTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: "12px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#1f2937",
  },
  resetBtn: {
    background: "none",
    border: "none",
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  filterLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#4b5563",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "13.5px",
    backgroundColor: "#ffffff",
    color: "#1f2937",
    outline: "none",
    cursor: "pointer",
  },
  input: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "13.5px",
    color: "#1f2937",
    outline: "none",
  },
  tabsContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "2px",
  },
  tabBtn: {
    padding: "10px 18px",
    background: "none",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    color: "#6b7280",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    transition: "all 0.15s",
  },
  tabBtnActive: {
    color: "#4f46e5",
    borderBottom: "2px solid #4f46e5",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 0",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "4px solid #f3f4f6",
    borderTop: "4px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  tableCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.04)",
    overflow: "hidden",
    marginBottom: "36px",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f3f4f6",
  },
  rowCount: {
    fontSize: "12.5px",
    color: "#6b7280",
    fontWeight: "500",
  },
  tableResponsive: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13.5px",
  },
  th: {
    padding: "12px 20px",
    background: "#f9fafb",
    color: "#374151",
    fontWeight: "600",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
    transition: "background-color 0.15s",
    "&:hover": {
      backgroundColor: "#f9fafb",
    },
  },
  td: {
    padding: "14px 20px",
    color: "#4b5563",
  },
  emptyCell: {
    textAlign: "center",
    padding: "40px",
    color: "#9ca3af",
  },
  statusPill: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11.5px",
    fontWeight: "700",
    display: "inline-block",
    textTransform: "uppercase",
    letterSpacing: "0.2px",
  },
  actionBtn: {
    padding: "6px 12px",
    background: "#e0e7ff",
    color: "#4338ca",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  chartsWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginBottom: "36px",
  },
  chartRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "24px",
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.04)",
  },
  chartTitle: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "850px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: "1px solid #f3f4f6",
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: "12.5px",
    color: "#6b7280",
    marginTop: "2px",
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#9ca3af",
    cursor: "pointer",
  },
  modalLoading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 0",
    color: "#6b7280",
  },
  modalBody: {
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  detailSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  detailSecTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#1f2937",
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: "8px",
  },
  detailSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px",
    backgroundColor: "#f9fafb",
    padding: "16px",
    borderRadius: "8px",
  },
  detailField: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  detailLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1f2937",
  },
  subTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  subTh: {
    padding: "10px 14px",
    background: "#f9fafb",
    color: "#4b5563",
    fontWeight: "600",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
  },
  subTr: {
    borderBottom: "1px solid #f3f4f6",
  },
  subTd: {
    padding: "10px 14px",
    color: "#374151",
  },
  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #f3f4f6",
    display: "flex",
    justifyContent: "flex-end",
  },
  closeModalBtn: {
    padding: "8px 18px",
    background: "#1f2937",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default ReconPage;
