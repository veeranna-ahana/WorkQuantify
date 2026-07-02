import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getReconFilters,
  getReconDashboard,
  getProjectLevelRecon,
  getEmployeeLevelRecon,
  getProjectDetail,
} from "../api/recon.api";

// ─── Color Palettes ─────────────────────────────────────────────
const STATUS_PILLS = {
  "On Track": { bg: "#d1fae5", text: "#065f46" },
  "Over Utilized": { bg: "#fee2e2", text: "#991b1b" },
  "Under Utilized": { bg: "#fef3c7", text: "#92400e" },
  "Project Not Found": { bg: "#fee2e2", text: "#991b1b" },
  "No Estimate": { bg: "#fef3c7", text: "#92400e" },
  "Not Assigned": { bg: "#fef3c7", text: "#92400e" },
  "No Activity": { bg: "#f3f4f6", text: "#6b7280" },
};

const ReconPage = () => {
  // ─── State ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("project");

  const [filters, setFilters] = useState({
    month: "",
    year: "",
    clientName: "",
    projectCode: "",
    projectName: "",
    employeeName: "",
    department: "",
    reportingManager: "",
  });

  // ─── Search States ─────────────────────────────────────────────
  const [projectSearch, setProjectSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");

  // ─── Pagination States ─────────────────────────────────────────
  const [projectPage, setProjectPage] = useState(1);
  const [projectPageSize, setProjectPageSize] = useState(10);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePageSize, setEmployeePageSize] = useState(10);

  const [filterOpts, setFilterOpts] = useState({
    clients: [],
    projects: [],
    employees: [],
    departments: [],
    managers: [],
  });

  const [dashboardData, setDashboardData] = useState({
    total_projects: 0,
    projects_with_estimates: 0,
    projects_without_estimates: 0,
    projects_with_timesheets: 0,
    projects_without_timesheets: 0,
    total_employees: 0,
    total_estimated_hours: 0,
    total_actual_hours: 0,
    total_variance_hours: 0,
    overutilized_count: 0,
    underutilized_count: 0,
  });

  const [projectReconList, setProjectReconList] = useState([]);
  const [employeeReconList, setEmployeeReconList] = useState([]);

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  // const [projectDetail, setProjectDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [loading, setLoading] = useState(false);
  const [projectDetail, setProjectDetail] = useState({
  employeePage: 1,
  employeePageSize: 5,
  employeeSummary: [],
  project: null,
});

  // ─── Filtered Data with Search ─────────────────────────────────
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projectReconList;
    const search = projectSearch.toLowerCase().trim();
    return projectReconList.filter(
      (item) =>
        (item.project_code && item.project_code.toLowerCase().includes(search)) ||
        (item.project_name && item.project_name.toLowerCase().includes(search))
    );
  }, [projectReconList, projectSearch]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeeReconList;
    const search = employeeSearch.toLowerCase().trim();
    return employeeReconList.filter(
      (item) =>
        (item.employee_code && item.employee_code.toLowerCase().includes(search)) ||
        (item.employee_name && item.employee_name.toLowerCase().includes(search)) ||
        (item.project_code && item.project_code.toLowerCase().includes(search)) ||
        (item.project_name && item.project_name.toLowerCase().includes(search))
    );
  }, [employeeReconList, employeeSearch]);

  // ─── Paginated Data ────────────────────────────────────────────
  const paginatedProjects = useMemo(() => {
    const start = (projectPage - 1) * projectPageSize;
    return filteredProjects.slice(start, start + projectPageSize);
  }, [filteredProjects, projectPage, projectPageSize]);

  const paginatedEmployees = useMemo(() => {
    const start = (employeePage - 1) * employeePageSize;
    return filteredEmployees.slice(start, start + employeePageSize);
  }, [filteredEmployees, employeePage, employeePageSize]);

  // ─── Reset page when search changes ────────────────────────────
  useEffect(() => {
    setProjectPage(1);
  }, [projectSearch]);

  useEffect(() => {
    setEmployeePage(1);
  }, [employeeSearch]);

  // ─── Data Fetching ──────────────────────────────────────────────
  const fetchFilterOpts = useCallback(async () => {
    try {
      const data = await getReconFilters();
      setFilterOpts(data);
    } catch (err) {
      console.error("Error fetching filter options:", err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dashboard = await getReconDashboard(filters);
      const projectLevel = await getProjectLevelRecon(filters);
      const employeeLevel = await getEmployeeLevelRecon(filters);

      console.log("Dashboard Response:", dashboard);
      console.log("Project Level Response:", projectLevel);
      console.log("Employee Level Response:", employeeLevel);

      setDashboardData({
        total_projects: dashboard?.total_projects || 0,
        projects_with_estimates: dashboard?.projects_with_estimates || 0,
        projects_without_estimates: dashboard?.projects_without_estimates || 0,
        projects_with_timesheets: dashboard?.projects_with_timesheets || 0,
        projects_without_timesheets: dashboard?.projects_without_timesheets || 0,
        total_employees: dashboard?.total_employees || 0,
        total_estimated_hours: dashboard?.total_estimated_hours || 0,
        total_actual_hours: dashboard?.total_actual_hours || 0,
        total_variance_hours: dashboard?.total_variance_hours || 0,
        overutilized_count: dashboard?.overutilized_count || 0,
        underutilized_count: dashboard?.underutilized_count || 0,
      });

      setProjectReconList(projectLevel || []);
      setEmployeeReconList(employeeLevel || []);

      // Reset pages when data loads
      setProjectPage(1);
      setEmployeePage(1);

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

  // ─── Handlers ───────────────────────────────────────────────────
  const handleFilterChange = (field, val) => {
    setFilters((prev) => ({ ...prev, [field]: val }));
  };

  const resetFilters = () => {
    setFilters({
      month: "",
      year: "",
      clientName: "",
      projectCode: "",
      projectName: "",
      employeeName: "",
      department: "",
      reportingManager: "",
    });
    setProjectSearch("");
    setEmployeeSearch("");
    setProjectPage(1);
    setEmployeePage(1);
  };

  const handleViewProjectDetails = async (project) => {
    const id = project.project_id || project.project_code;

    if (!id) {
      alert("Invalid project identifier");
      return;
    }

    setSelectedProjectId(id);
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const data = await getProjectDetail(id, filters);
      setProjectDetail(data);
    } catch (err) {
      console.error("Error fetching project details:", err);
      alert("Failed to load project details.");
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ─── Pagination Handlers ───────────────────────────────────────
  const handleProjectPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(filteredProjects.length / projectPageSize)) {
      setProjectPage(newPage);
    }
  };

  const handleEmployeePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(filteredEmployees.length / employeePageSize)) {
      setEmployeePage(newPage);
    }
  };

  const handleProjectPageSizeChange = (e) => {
    setProjectPageSize(parseInt(e.target.value));
    setProjectPage(1);
  };

  const handleEmployeePageSizeChange = (e) => {
    setEmployeePageSize(parseInt(e.target.value));
    setEmployeePage(1);
  };

  // ─── Helpers ────────────────────────────────────────────────────
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

  const yearsList = ["2024", "2025", "2026"];

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Effort Reconciliation Dashboard</h1>
          <p style={styles.subtitle}>
            Compare Project Estimates against Actual Hours logged in Timesheets
          </p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={fetchData} style={styles.refreshBtn} title="Refresh Data">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ─── KPI Cards - 11 Cards ─── */}
      <div style={styles.kpiGrid}>
        <KPICard
          label="Total Projects"
          value={dashboardData.total_projects}
          icon="📁"
          color="#6366f1"
        />
        <KPICard
          label="Projects with Estimates"
          value={dashboardData.projects_with_estimates}
          icon="✅"
          color="#10b981"
        />
        <KPICard
          label="Projects without Estimates"
          value={dashboardData.projects_without_estimates}
          icon="⚠️"
          color="#f59e0b"
        />
        <KPICard
          label="Projects with Timesheets"
          value={dashboardData.projects_with_timesheets}
          icon="📊"
          color="#3b82f6"
        />
        <KPICard
          label="Projects without Timesheets"
          value={dashboardData.projects_without_timesheets}
          icon="❌"
          color="#ef4444"
        />
        {/* <KPICard
          label="Total Employees"
          value={dashboardData.total_employees}
          icon="👥"
          color="#8b5cf6"
        /> */}
       <KPICard
  label="Total Estimated Person Hours"
  value={`${Number(dashboardData.total_estimated_hours).toLocaleString()} 
  
  
  `}
  icon="⏱️"
  color="#3b82f6"
/>
        <KPICard
  label="Total Actual Person Hours"
  value={`${Number(dashboardData.total_actual_hours).toLocaleString()}`}
  icon="✅"
  color="#10b981"
/>
        <KPICard
  label="Total Variance Person Hours"
  value={`${Number(dashboardData.total_variance_hours) > 0 ? "+" : ""}${Number(
    dashboardData.total_variance_hours
  ).toLocaleString()} `}
  icon="📊"
  color={Number(dashboardData.total_variance_hours) > 0 ? "#ef4444" : "#10b981"}
/>
        <KPICard
          label="Overutilized Projects"
          value={dashboardData.overutilized_count}
          icon="📈"
          color="#ef4444"
        />
        <KPICard
          label="Underutilized Projects"
          value={dashboardData.underutilized_count}
          icon="📉"
          color="#f59e0b"
        />
      </div>

      {/* Filters */}
      <div style={styles.filterCard}>
        <div style={styles.filterTitleRow}>
          <h3 style={styles.sectionTitle}>🔍 Search & Filters</h3>
          <button onClick={resetFilters} style={styles.resetBtn}>
            Reset Filters
          </button>
        </div>
        <div style={styles.filterGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Month</label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
              style={styles.select}
            >
              <option value="">All Months</option>
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Year</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              style={styles.select}
            >
              <option value="">All Years</option>
              {yearsList.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Customer Name</label>
            <select
              value={filters.clientName}
              onChange={(e) => handleFilterChange("clientName", e.target.value)}
              style={styles.select}
            >
              <option value="">All Customers</option>
              {filterOpts.clients?.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Project Code</label>
            <input
              type="text"
              placeholder="e.g. PRJ-001"
              value={filters.projectCode}
              onChange={(e) => handleFilterChange("projectCode", e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Project Name</label>
            <input
              type="text"
              placeholder="e.g. ERP Phase 2"
              value={filters.projectName}
              onChange={(e) => handleFilterChange("projectName", e.target.value)}
              style={styles.input}
            />
          </div>

          {/* <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Employee Name</label>
            <input
              type="text"
              placeholder="Search Employee..."
              value={filters.employeeName}
              onChange={(e) => handleFilterChange("employeeName", e.target.value)}
              style={styles.input}
            />
          </div> */}

          {/* <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Department</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              style={styles.select}
            >
              <option value="">All Departments</option>
              {filterOpts.departments?.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div> */}

          {/* <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Reporting Manager</label>
            <select
              value={filters.reportingManager}
              onChange={(e) => handleFilterChange("reportingManager", e.target.value)}
              style={styles.select}
            >
              <option value="">All Managers</option>
              {filterOpts.managers?.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div> */}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab("project")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "project" ? styles.tabBtnActive : {}),
          }}
        >
          📂 Project Level Reconciliation
        </button>
        <button
          onClick={() => setActiveTab("employee")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "employee" ? styles.tabBtnActive : {}),
          }}
        >
          👥 Employee Level Reconciliation
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <span style={{ marginTop: 12, color: "#6b7280" }}>
            Refreshing Reconciliation Data...
          </span>
        </div>
      ) : (
        <>
          {/* ─── Project Tab ─── */}
{activeTab === "project" && (
  <div style={styles.tableCard}>
    <div style={styles.tableHeader}>
      <h3 style={styles.sectionTitle}>Project Level Reconciliation</h3>
      <div style={styles.tableControls}>
        <input
          type="text"
          placeholder="🔍 Search Project..."
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
          style={styles.searchInput}
        />
        <span style={styles.rowCount}>
          {filteredProjects.length} projects found
        </span>
      </div>
    </div>
    <div style={styles.tableResponsive}>
      <table style={styles.table}>
        <thead>
  <tr>
    <th style={styles.th}>Project Code</th>
    <th style={styles.th}>Project Name</th>
    <th style={{ ...styles.th, textAlign: "right" }}>
      <div>Estimated</div>
      <div style={styles.subHeader}>(Person-Hrs)</div>
    </th>
    <th style={{ ...styles.th, textAlign: "right" }}>Estimated Days</th>
    <th style={{ ...styles.th, textAlign: "right" }}>
      <div>Actual</div>
      <div style={styles.subHeader}>(Person-Hrs)</div>
    </th>
    <th style={{ ...styles.th, textAlign: "right" }}>Actual Days</th>
    <th style={{ ...styles.th, textAlign: "right" }}>Utilized %</th>
    <th style={{ ...styles.th, textAlign: "right" }}>
      <div>Variance</div>
      <div style={styles.subHeader}>(Person-Hrs)</div>
    </th>
    <th style={{ ...styles.th, textAlign: "right" }}>Variance %</th>
    <th style={styles.th}>Status</th>
    <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
  </tr>
</thead>
        <tbody>
          {paginatedProjects.length === 0 ? (
            <tr>
              <td colSpan={11} style={styles.emptyCell}>
                No reconciliation records match current filters.
              </td>
            </tr>
          ) : (
            paginatedProjects.map((item) => {
              // Calculate actual hours used percentage
              const estimatedHours = parseFloat(item.estimated_hours) || 0;
              const actualHours = parseFloat(item.actual_hours) || 0;
              let usagePercentage = 0;
              
              if (estimatedHours > 0) {
                usagePercentage = (actualHours / estimatedHours) * 100;
              }
              
              // Determine row background and text color based on percentage
              let rowBgColor = "transparent";
              let textColor = "#1f2937"; // Default dark color
              
              if (usagePercentage > 100) {
                rowBgColor = "#fee2e2"; // Light red background
                textColor = "#dc2626"; // Red text
              } else if (usagePercentage >= 80 && usagePercentage < 100) {
                rowBgColor = "#fef3c7"; // Light yellow background
                textColor = "#d97706"; // Amber/Yellow text
              } else if (usagePercentage === 100) {
                rowBgColor = "transparent"; // No background
                textColor = "#1f2937"; // No change - default color
              }
              // Below 80%: no change (transparent background, default color)
              
              return (
                <tr 
                  key={item.project_id || item.project_code} 
                  style={{
                    ...styles.tr,
                    backgroundColor: rowBgColor,
                    transition: "background-color 0.2s",
                  }}
                >
                  <td style={styles.td}>
                    <strong>{item.project_code || "—"}</strong>
                  </td>
                  <td style={styles.td}>{item.project_name}</td>
                  <td style={{ ...styles.td, textAlign: "right", fontWeight: "600" }}>
                    {Number(item.estimated_hours).toLocaleString()}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right", fontWeight: "600" }}>
                    {Number(item.estimated_days).toLocaleString()}
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#4f46e5",
                    }}
                  >
                    {Number(item.actual_hours).toLocaleString()}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right", fontWeight: "600", color: "#4f46e5" }}>
                    {Number(item.actual_days).toLocaleString()}
                  </td>
                  {/* Utilized % with conditional text color */}
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "right",
                      fontWeight: "700",
                      color: textColor,
                    }}
                  >
                    {estimatedHours > 0 ? `${usagePercentage.toFixed(1)}%` : "N/A"}
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "right",
                      fontWeight: "600",
                      color: Number(item.variance_hours) > 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {Number(item.variance_hours) > 0 ? "+" : ""}
                    {Number(item.variance_hours).toLocaleString()}
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "right",
                      fontWeight: "600",
                      color: Number(item.variance_pct) > 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {Number(item.variance_pct) > 0 ? "+" : ""}
                    {item.variance_pct}%
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusPill,
                        ...(STATUS_PILLS[item.status] || STATUS_PILLS["On Track"]),
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <button
                      onClick={() => handleViewProjectDetails(item)}
                      style={styles.actionBtn}
                    >
                      👁️ View Details
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
    {/* ─── Project Pagination ─── */}
    {filteredProjects.length > 0 && (
      <div style={styles.paginationContainer}>
        <div style={styles.paginationInfo}>
          Showing {(projectPage - 1) * projectPageSize + 1} to{" "}
          {Math.min(projectPage * projectPageSize, filteredProjects.length)} of{" "}
          {filteredProjects.length} entries
        </div>
        <div style={styles.paginationControls}>
          <select
            value={projectPageSize}
            onChange={handleProjectPageSizeChange}
            style={styles.pageSizeSelect}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <button
            onClick={() => handleProjectPageChange(projectPage - 1)}
            disabled={projectPage === 1}
            style={{
              ...styles.pageBtn,
              opacity: projectPage === 1 ? 0.5 : 1,
              cursor: projectPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            ◀ Prev
          </button>
          <span style={styles.pageInfo}>
            Page {projectPage} of{" "}
            {Math.ceil(filteredProjects.length / projectPageSize) || 1}
          </span>
          <button
            onClick={() => handleProjectPageChange(projectPage + 1)}
            disabled={projectPage >= Math.ceil(filteredProjects.length / projectPageSize)}
            style={{
              ...styles.pageBtn,
              opacity:
                projectPage >= Math.ceil(filteredProjects.length / projectPageSize)
                  ? 0.5
                  : 1,
              cursor:
                projectPage >= Math.ceil(filteredProjects.length / projectPageSize)
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Next ▶
          </button>
        </div>
      </div>
    )}
  </div>
)}

          {/* ─── Employee Tab ─── */}
          {activeTab === "employee" && (
            <div style={styles.tableCard}>
              <div style={styles.tableHeader}>
                <h3 style={styles.sectionTitle}>Employee Level Reconciliation</h3>
                <div style={styles.tableControls}>
                  <input
                    type="text"
                    placeholder="🔍 Search Employee or Project..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    style={styles.searchInput}
                  />
                  <span style={styles.rowCount}>
                    {filteredEmployees.length} assignments found
                  </span>
                </div>
              </div>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
  <tr>
    <th style={styles.th}>Employee Code</th>
    <th style={styles.th}>Employee Name</th>
    <th style={styles.th}>Reporting Manager</th>
    <th style={styles.th}>Project Code</th>
    <th style={styles.th}>Project Name</th>
    <th style={{ ...styles.th, textAlign: "right" }}>
      <div>Assigned</div>
      <div style={styles.subHeader}>(Person-Hrs)</div>
    </th>
    <th style={{ ...styles.th, textAlign: "right" }}>
      <div>Actual</div>
      <div style={styles.subHeader}>(Person-Hrs)</div>
    </th>
    <th style={{ ...styles.th, textAlign: "right" }}>Utilization %</th>
    <th style={{ ...styles.th, textAlign: "right" }}>
      <div>Variance</div>
      <div style={styles.subHeader}>(Person-Hrs)</div>
    </th>
    <th style={{ ...styles.th, textAlign: "right" }}>Variance %</th>
    <th style={styles.th}>Status</th>
  </tr>
</thead>
                 <tbody>
  {paginatedEmployees.length === 0 ? (
    <tr>
      <td colSpan={11} style={styles.emptyCell}>
        No employee assignments found matching current filters.
      </td>
    </tr>
  ) : (
    paginatedEmployees.map((item, idx) => {
      // Calculate utilization %
      const assigned = parseFloat(item.assigned_hours) || 0;
      const actual = parseFloat(item.actual_hours) || 0;
      let utilizationPct = 0;
      let utilizationDisplay = "0%";
      
      if (assigned > 0) {
        utilizationPct = (actual / assigned) * 100;
        utilizationDisplay = utilizationPct.toFixed(1) + "%";
      } else if (actual > 0 && assigned === 0) {
        utilizationDisplay = "N/A";
      }
      
      // Determine row background and text color based on utilization percentage
      let rowBgColor = "transparent";
      let textColor = "#1f2937"; // Default dark color
      
      if (utilizationPct > 100) {
        rowBgColor = "#fee2e2"; // Light red background
        textColor = "#dc2626"; // Red text
      } else if (utilizationPct >= 80 && utilizationPct < 100) {
        rowBgColor = "#fef3c7"; // Light yellow background
        textColor = "#d97706"; // Amber/Yellow text
      } else if (utilizationPct === 100) {
        rowBgColor = "transparent"; // No background
        textColor = "#1f2937"; // No change - default color
      } else if (utilizationPct < 80 && utilizationPct > 0) {
        rowBgColor = "#d1fae5"; // Light green (optional - for below 80%)
        textColor = "#059669"; // Green text
      }
      // Below 80%: green background and text (optional)
      
      return (
        <tr 
          key={idx} 
          style={{
            ...styles.tr,
            backgroundColor: rowBgColor,
            transition: "background-color 0.2s",
          }}
        >
          <td style={styles.td}>
            <strong>{item.employee_code || "—"}</strong>
          </td>
          <td style={styles.td}>{item.employee_name}</td>
          <td style={styles.td}>{item.reporting_manager || "—"}</td>
          <td style={styles.td}>{item.project_code || "—"}</td>
          <td style={styles.td}>{item.project_name}</td>
          <td style={{ ...styles.td, textAlign: "right", fontWeight: "600" }}>
            {Number(item.assigned_hours).toLocaleString()}
          </td>
          <td
            style={{
              ...styles.td,
              textAlign: "right",
              fontWeight: "600",
              color: "#4f46e5",
            }}
          >
            {Number(item.actual_hours).toLocaleString()}
          </td>
          <td
            style={{
              ...styles.td,
              textAlign: "right",
              fontWeight: "700",
              color: textColor,
            }}
          >
            {utilizationDisplay}
          </td>
          <td
            style={{
              ...styles.td,
              textAlign: "right",
              fontWeight: "600",
              color: Number(item.variance_hours) > 0 ? "#10b981" : " #ef4444",
            }}
          >
            {Number(item.variance_hours) > 0 ? "+" : ""}
            {Number(item.variance_hours).toLocaleString()}
          </td>
          <td
            style={{
              ...styles.td,
              textAlign: "right",
              fontWeight: "600",
              color: Number(item.variance_pct) > 0 ? "#10b981" : "#ef4444",
            }}
          >
            {Number(item.variance_pct) > 0 ? "+" : ""}
            {item.variance_pct}%
          </td>
          <td style={styles.td}>
            <span
              style={{
                ...styles.statusPill,
                ...(STATUS_PILLS[item.status] || STATUS_PILLS["On Track"]),
              }}
            >
              {item.status}
            </span>
          </td>
        </tr>
      );
    })
  )}
</tbody>
                </table>
              </div>
              {/* ─── Employee Pagination ─── */}
              {filteredEmployees.length > 0 && (
                <div style={styles.paginationContainer}>
                  <div style={styles.paginationInfo}>
                    Showing {(employeePage - 1) * employeePageSize + 1} to{" "}
                    {Math.min(employeePage * employeePageSize, filteredEmployees.length)} of{" "}
                    {filteredEmployees.length} entries
                  </div>
                  <div style={styles.paginationControls}>
                    <select
                      value={employeePageSize}
                      onChange={handleEmployeePageSizeChange}
                      style={styles.pageSizeSelect}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <button
                      onClick={() => handleEmployeePageChange(employeePage - 1)}
                      disabled={employeePage === 1}
                      style={{
                        ...styles.pageBtn,
                        opacity: employeePage === 1 ? 0.5 : 1,
                        cursor: employeePage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      ◀ Prev
                    </button>
                    <span style={styles.pageInfo}>
                      Page {employeePage} of{" "}
                      {Math.ceil(filteredEmployees.length / employeePageSize) || 1}
                    </span>
                    <button
                      onClick={() => handleEmployeePageChange(employeePage + 1)}
                      disabled={employeePage >= Math.ceil(filteredEmployees.length / employeePageSize)}
                      style={{
                        ...styles.pageBtn,
                        opacity:
                          employeePage >= Math.ceil(filteredEmployees.length / employeePageSize)
                            ? 0.5
                            : 1,
                        cursor:
                          employeePage >= Math.ceil(filteredEmployees.length / employeePageSize)
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── Project Details Modal ─── */}
      {showDetailModal && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetailModal(false);
          }}
        >
          <div style={styles.modalContent}>
  <div style={styles.modalHeader}>
    <div>
      <h2 style={styles.modalTitle}>Detailed Reconciliation</h2>
      <span style={styles.modalSubtitle}>
        Detailed audit for chosen project & timesheets
      </span>
    </div>
    <button onClick={() => setShowDetailModal(false)} style={styles.modalClose}>
      ✕
    </button>
  </div>

  {loadingDetail || !projectDetail ? (
    <div style={styles.modalLoading}>
      <div style={styles.spinner}></div>
      <span style={{ marginTop: 12 }}>Loading detail reports...</span>
    </div>
  ) : (
    <div style={styles.modalBody}>
      {/* Project Summary */}
      <div style={styles.detailSection}>
        <h4 style={styles.detailSecTitle}>📋 Project Summary Details</h4>
        <div style={styles.detailSummaryGrid}>
          <div style={styles.detailField}>
            <span style={styles.detailLabel}>Project Code</span>
            <span style={styles.detailValue}>
              {projectDetail.project?.project_code || "—"}
            </span>
          </div>
          <div style={styles.detailField}>
            <span style={styles.detailLabel}>Project Name</span>
            <span style={styles.detailValue}>
              {projectDetail.project?.project_name || "—"}
            </span>
          </div>
         <div style={styles.detailField}>
  <span style={styles.detailLabel}>Estimated Hours</span>
  <span style={styles.detailValue}>
    {Number(projectDetail.project?.estimated_hours).toLocaleString()} Person-Hrs
  </span>
</div>
<div style={styles.detailField}>
  <span style={styles.detailLabel}>Actual Hours Logged</span>
  <span style={{ ...styles.detailValue, color: "#4f46e5" }}>
    {Number(projectDetail.project?.actual_hours).toLocaleString()} Person-Hrs
  </span>
</div>
<div style={styles.detailField}>
  <span style={styles.detailLabel}>Remaining Hours</span>
  <span style={{ ...styles.detailValue, color: "#10b981" }}>
    {Number(projectDetail.project?.remaining_hours).toLocaleString()} Person-Hrs
  </span>
</div>
        </div>
      </div>

     {/* Employee-wise Breakdown */}
<div style={styles.detailSection}>
  <h4 style={styles.detailSecTitle}>👥 Employee Allocation & Timesheet</h4>
  
  <div style={styles.tableResponsive}>
    <table style={styles.subTable}>
      <thead style={styles.stickyHeader}>
  <tr>
    <th style={styles.subTh}>Employee Code</th>
    <th style={styles.subTh}>Employee Name</th>
    <th style={styles.subTh}>Role</th>
    <th style={{ ...styles.subTh, textAlign: "right" }}>
      <div>Assigned</div>
      <div style={styles.subHeader}>(Person-Hrs)</div>
    </th>
    <th style={{ ...styles.subTh, textAlign: "right" }}>Assigned Days</th>
    <th style={{ ...styles.subTh, textAlign: "right" }}>
      <div>Actual</div>
      <div style={styles.subHeader}>(Person-Hrs)</div>
    </th>
    <th style={{ ...styles.subTh, textAlign: "right" }}>Actual Days</th>
    <th style={{ ...styles.subTh, textAlign: "right" }}>Utilization %</th>
    <th style={{ ...styles.subTh, textAlign: "right" }}>
      <div>Variance</div>
      <div style={styles.subHeader}>(Person-Hrs)</div>
    </th>
    <th style={styles.subTh}>Assignment Status</th>
    <th style={styles.subTh}>Timesheet Status</th>
  </tr>
</thead>
      <tbody>
        {projectDetail.employeeSummary?.length === 0 ? (
          <tr>
            <td colSpan={11} style={styles.emptyCell}>
              No employee allocations or timesheets registered.
            </td>
          </tr>
        ) : (
          projectDetail.employeeSummary
            ?.slice(
              ((projectDetail.employeePage || 1) - 1) * (projectDetail.employeePageSize || 5),
              (projectDetail.employeePage || 1) * (projectDetail.employeePageSize || 5)
            )
            ?.map((e, idx) => {
              const assigned = parseFloat(e.assigned_hours) || 0;
              const actual = parseFloat(e.actual_hours) || 0;
              let utilizationDisplay = "0%";
              
              if (assigned > 0) {
                const utilPct = (actual / assigned) * 100;
                // Show actual percentage even if above 100%
                utilizationDisplay = utilPct.toFixed(1) + "%";
              } else if (actual > 0 && assigned === 0) {
                utilizationDisplay = "N/A";
              }
              
              return (
                <tr 
                  key={idx} 
                  style={{
                    ...styles.subTr,
                    backgroundColor: (() => {
                      const assigned = parseFloat(e.assigned_hours) || 0;
                      const actual = parseFloat(e.actual_hours) || 0;
                      let utilPct = 0;
                      if (assigned > 0) {
                        utilPct = (actual / assigned) * 100;
                      }
                      
                      // Row background color based on utilization
                      if (utilPct > 100) {
                        return "#fee2e2"; // Light red
                      } else if (utilPct >= 80 && utilPct < 100) {
                        return "#fef3c7"; // Light yellow
                      } else if (utilPct < 80 && utilPct > 0) {
                        return "#d1fae5"; // Light green (optional - for below 80%)
                      }
                      return "transparent";
                    })(),
                    transition: "background-color 0.2s",
                  }}
                >
                  <td style={styles.subTd}>{e.employee_code || "—"}</td>
                  <td style={styles.subTd}>
                    <strong>{e.employee_name}</strong>
                  </td>
                  <td style={styles.subTd}>
                    <span
                      style={{
                        color: e.role === "Not Assigned" ? "#f59e0b" : "#1f2937",
                        fontWeight: e.role === "Not Assigned" ? "500" : "normal",
                      }}
                    >
                      {e.role || "Not Assigned"}
                    </span>
                  </td>
                  <td style={{ ...styles.subTd, textAlign: "right" }}>
                    {Number(e.assigned_hours).toLocaleString()}
                  </td>
                  <td style={{ ...styles.subTd, textAlign: "right" }}>
                    {Number(e.assigned_days).toFixed(1)}
                  </td>
                  <td
                    style={{
                      ...styles.subTd,
                      textAlign: "right",
                      color: "#4f46e5",
                    }}
                  >
                    {Number(e.actual_hours).toLocaleString()}
                  </td>
                  <td
                    style={{
                      ...styles.subTd,
                      textAlign: "right",
                      color: "#4f46e5",
                    }}
                  >
                    {Number(e.actual_days).toFixed(1)}
                  </td>
                  <td
                    style={{
                      ...styles.subTd,
                      textAlign: "right",
                      fontWeight: "600",
                    }}
                  >
                    <span
                      style={{
                        color: (() => {
                          const assigned = parseFloat(e.assigned_hours) || 0;
                          const actual = parseFloat(e.actual_hours) || 0;
                          let utilPct = 0;
                          if (assigned > 0) {
                            utilPct = (actual / assigned) * 100;
                          }
                          
                          // Text color based on utilization
                          if (utilPct > 100) {
                            return "#dc2626"; // Red text
                          } else if (utilPct >= 80 && utilPct < 100) {
                            return "#d97706"; // Amber/Yellow text
                          } else if (utilPct < 80 && utilPct > 0) {
                            return "#059669"; // Green text
                          }
                          return "#6b7280";
                        })(),
                      }}
                    >
                      {(() => {
                        const assigned = parseFloat(e.assigned_hours) || 0;
                        const actual = parseFloat(e.actual_hours) || 0;
                        let utilizationDisplay = "0%";
                        
                        if (assigned > 0) {
                          const utilPct = (actual / assigned) * 100;
                          // Show actual percentage even if above 100%
                          utilizationDisplay = utilPct.toFixed(1) + "%";
                        } else if (actual > 0 && assigned === 0) {
                          utilizationDisplay = "N/A";
                        }
                        return utilizationDisplay;
                      })()}
                    </span>
                  </td>
                  <td
                    style={{
                      ...styles.subTd,
                      textAlign: "right",
                      fontWeight: "600",
                      color: Number(e.variance_hours) > 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {Number(e.variance_hours) > 0 ? "+" : ""}
                    {Number(e.variance_hours).toLocaleString()}
                  </td>
                  <td style={styles.subTd}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        backgroundColor:
                          e.assignment_status === "Assigned"
                            ? "#d1fae5"
                            : "#fef3c7",
                        color:
                          e.assignment_status === "Assigned" ? "#065f46" : "#92400e",
                      }}
                    >
                      {e.assignment_status || "Not Assigned"}
                    </span>
                  </td>
                  <td style={styles.subTd}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        backgroundColor:
                          e.timesheet_status === "Present" ? "#dbeafe" : "#fee2e2",
                        color:
                          e.timesheet_status === "Present" ? "#1e40af" : "#991b1b",
                      }}
                    >
                      {e.timesheet_status || "Not Present"}
                    </span>
                  </td>
                </tr>
              );
            })
        )}
      </tbody>
    </table>
  </div>
  
  {/* Pagination Controls - Moved to bottom */}
  {projectDetail.employeeSummary?.length > 0 && (
    <div style={styles.modalPaginationContainer}>
      <div style={styles.modalPaginationInfo}>
        Showing {((projectDetail.employeePage || 1) - 1) * (projectDetail.employeePageSize || 5) + 1} to{" "}
        {Math.min((projectDetail.employeePage || 1) * (projectDetail.employeePageSize || 5), projectDetail.employeeSummary.length)} of{" "}
        {projectDetail.employeeSummary.length} entries
      </div>
      <div style={styles.modalPaginationControls}>
        <select
          value={projectDetail.employeePageSize || 5}
          onChange={(e) => {
            const newSize = parseInt(e.target.value);
            setProjectDetail(prev => ({
              ...prev,
              employeePageSize: newSize,
              employeePage: 1
            }));
          }}
          style={styles.modalPageSizeSelect}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <button
          onClick={() => {
            setProjectDetail(prev => ({
              ...prev,
              employeePage: Math.max(1, (prev.employeePage || 1) - 1)
            }));
          }}
          disabled={(projectDetail.employeePage || 1) === 1}
          style={{
            ...styles.modalPageBtn,
            opacity: (projectDetail.employeePage || 1) === 1 ? 0.5 : 1,
            cursor: (projectDetail.employeePage || 1) === 1 ? "not-allowed" : "pointer",
          }}
        >
          ◀ Prev
        </button>
        <span style={styles.modalPageInfo}>
          Page {projectDetail.employeePage || 1} of{" "}
          {Math.ceil(projectDetail.employeeSummary.length / (projectDetail.employeePageSize || 5)) || 1}
        </span>
        <button
          onClick={() => {
            setProjectDetail(prev => ({
              ...prev,
              employeePage: Math.min(
                Math.ceil(prev.employeeSummary.length / (prev.employeePageSize || 5)),
                (prev.employeePage || 1) + 1
              )
            }));
          }}
          disabled={(projectDetail.employeePage || 1) >= Math.ceil(projectDetail.employeeSummary.length / (projectDetail.employeePageSize || 5))}
          style={{
            ...styles.modalPageBtn,
            opacity: (projectDetail.employeePage || 1) >= Math.ceil(projectDetail.employeeSummary.length / (projectDetail.employeePageSize || 5)) ? 0.5 : 1,
            cursor: (projectDetail.employeePage || 1) >= Math.ceil(projectDetail.employeeSummary.length / (projectDetail.employeePageSize || 5)) ? "not-allowed" : "pointer",
          }}
        >
          Next ▶
        </button>
      </div>
    </div>
  )}
</div>
    </div>
  )}
  <div style={styles.modalFooter}>
    <button onClick={() => setShowDetailModal(false)} style={styles.closeModalBtn}>
      Close Details
    </button>
  </div>
</div>
        </div>
      )}
    </div>
  );
};

// ─── KPICard Component ──────────────────────────────────────────
const KPICard = ({ label, value, icon, color }) => (
  <div style={{ ...styles.kpiCard, borderLeft: `5px solid ${color}` }}>
    <div style={styles.kpiIconWrapper}>
      <span style={{ fontSize: 24 }}>{icon}</span>
    </div>
    <div style={styles.kpiContent}>
      <span style={styles.kpiLabel}>{label}</span>
      <span style={{ ...styles.kpiValue, color: "#1f2937" }}>{value}</span>
    </div>
  </div>
);

// ─── Styles ──────────────────────────────────────────────────────
const styles = {
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
  refreshBtn: {
    padding: "10px 14px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    color: "#4b5563",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    transition: "background 0.15s",
    ":hover": { background: "#f9fafb" },
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },
  kpiCard: {
    backgroundColor: "#ffffff",
    padding: "14px 18px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.04)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  kpiIconWrapper: {
    width: "40px",
    height: "40px",
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
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  kpiValue: {
    fontSize: "18px",
    fontWeight: "800",
    marginTop: "1px",
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
    fontSize: "15px",
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
    padding: "4px 8px",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "14px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
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
    fontSize: "13px",
    backgroundColor: "#ffffff",
    color: "#1f2937",
    outline: "none",
    cursor: "pointer",
  },
  input: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1f2937",
    outline: "none",
  },
  tabsContainer: {
    display: "flex",
    gap: "4px",
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
    flexWrap: "wrap",
    gap: "10px",
  },
  tableControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  searchInput: {
    padding: "8px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1f2937",
    outline: "none",
    width: "250px",
    transition: "border-color 0.15s",
    ":focus": {
      borderColor: "#4f46e5",
      boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
    },
  },
  rowCount: {
    fontSize: "12px",
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
    fontSize: "13px",
  },
  th: {
    padding: "10px 16px",
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
    ":hover": { backgroundColor: "#f9fafb" },
  },
  td: {
    padding: "12px 16px",
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
    fontSize: "11px",
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
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s",
    ":hover": { background: "#c7d2fe" },
  },
  paginationContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderTop: "1px solid #f3f4f6",
    flexWrap: "wrap",
    gap: "10px",
  },
  paginationInfo: {
    fontSize: "13px",
    color: "#6b7280",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  pageSizeSelect: {
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#1f2937",
    outline: "none",
    cursor: "pointer",
    backgroundColor: "#ffffff",
  },
  pageBtn: {
    padding: "6px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#ffffff",
    fontSize: "13px",
    fontWeight: "500",
    color: "#1f2937",
    cursor: "pointer",
    transition: "all 0.15s",
    ":hover:not(:disabled)": {
      background: "#f9fafb",
      borderColor: "#4f46e5",
    },
  },
  pageInfo: {
    fontSize: "13px",
    color: "#6b7280",
  },
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
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
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
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#9ca3af",
    cursor: "pointer",
    padding: "4px 8px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    backgroundColor: "#f9fafb",
    padding: "14px",
    borderRadius: "8px",
  },
  detailField: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  detailLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
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
    padding: "8px 12px",
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
    padding: "8px 12px",
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
    transition: "background 0.15s",
    ":hover": { background: "#374151" },
  },
  // Add these styles to your existing styles object
stickyHeader: {
  position: "sticky",
  top: 0,
  zIndex: 10,
  backgroundColor: "#ffffff",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
},

modalPaginationContainer: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 0",
  flexWrap: "wrap",
  gap: "10px",
  borderTop: "1px solid #f3f4f6",
  borderBottom: "1px solid #f3f4f6",
  marginBottom: "12px",
},

modalPaginationInfo: {
  fontSize: "13px",
  color: "#6b7280",
},

modalPaginationControls: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
},

modalPageSizeSelect: {
  padding: "4px 8px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "12px",
  color: "#1f2937",
  outline: "none",
  cursor: "pointer",
  backgroundColor: "#ffffff",
},

modalPageBtn: {
  padding: "4px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#ffffff",
  fontSize: "12px",
  fontWeight: "500",
  color: "#1f2937",
  cursor: "pointer",
  transition: "all 0.15s",
  ":hover:not(:disabled)": {
    background: "#f9fafb",
    borderColor: "#4f46e5",
  },
},

modalPageInfo: {
  fontSize: "13px",
  color: "#6b7280",
},
subHeader: {
  fontSize: "9px",
  fontWeight: "400",
  color: "#6b7280",
  marginTop: "1px",
},
};

// ─── Global CSS for spinner animation ──────────────────────────
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default ReconPage;