import { useEffect, useMemo, useState } from 'react';
import './DailyUpdatesReport.css';

// Point this at wherever your Express API is mounted.
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STATUS_STYLES = {
  'in-progress': { bg: '#fde4cf', fg: '#9a4a05' },
  practicing: { bg: '#f3d9e6', fg: '#9d174d' },
  completed: { bg: '#d8f3dc', fg: '#1b6b34' },
  blocked: { bg: '#fbd5d5', fg: '#b91c1c' },
  'not started': { bg: '#e5e7eb', fg: '#4b5563' },
};

const RISK_STYLES = {
  low: { bg: '#d8f3dc', fg: '#1b6b34' },
  medium: { bg: '#fde9c8', fg: '#92600a' },
  high: { bg: '#fbd5d5', fg: '#b91c1c' },
};

function StatusBadge({ value }) {
  if (!value) return <span className="dur-badge dur-badge--muted">—</span>;
  const style = STATUS_STYLES[value.toLowerCase()] || { bg: '#e5e7eb', fg: '#4b5563' };
  return (
    <span className="dur-badge" style={{ background: style.bg, color: style.fg }}>
      {value}
    </span>
  );
}

function RiskCell({ level, description }) {
  if (!level && !description) return <span className="dur-cell-muted">—</span>;
  const style = level ? RISK_STYLES[level.toLowerCase()] : null;
  return (
    <div className="dur-risk">
      {level && (
        <span
          className="dur-badge dur-badge--sm"
          style={style ? { background: style.bg, color: style.fg } : undefined}
        >
          {level}
        </span>
      )}
      {description && <p className="dur-risk-desc">{description}</p>}
    </div>
  );
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.toLocaleDateString(undefined, { day: 'numeric' });
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  const year = d.getFullYear();
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  return { date: `${day}-${month}-${year}`, weekday };
}

export default function DailyUpdatesReport() {
  const [meta, setMeta] = useState({ dates: [], employees: [], projects: [] });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [rows, setRows] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState('');

  // Load filter options once, default to the most recent date available.
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch(`${API_BASE}/api/daily-updates/meta`);
        if (!res.ok) throw new Error('Failed to load filters');
        const data = await res.json();
        // setMeta(data);
        // if (data.dates?.length) {
        //   setSelectedDate(data.dates[0].slice(0, 10));
        // }
        // const today = new Date().toISOString().split('T')[0];

        // setMeta({
        //   ...data,
        //   dates: data.dates.includes(today)
        //     ? data.dates
        //     : [today, ...data.dates],
        // });

        // setSelectedDate(today);

        const today = new Date();

        const dates = [];
        const startDate = new Date("2025-01-01"); // or your project start date

        for (
          let d = new Date(startDate);
          d <= today;
          d.setDate(d.getDate() + 1)
        ) {
          dates.push(d.toISOString().split("T")[0]);
        }

        dates.sort((a, b) => new Date(b) - new Date(a));

        setMeta({
          ...data,
          dates,
        });

        setSelectedDate(today.toISOString().split("T")[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  // Fetch rows whenever the date or filters change.
  useEffect(() => {
    if (!selectedDate) return;
    async function loadRows() {
      setLoadingRows(true);
      setError('');
      try {
        const params = new URLSearchParams({ date: selectedDate });
        if (selectedProject) params.set('project_id', selectedProject);
        if (selectedEmployee) params.set('user_id', selectedEmployee);
        const res = await fetch(`${API_BASE}/api/daily-updates/report?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load daily updates');
        const data = await res.json();
        setRows(data);
      } catch (err) {
        setError(err.message);
        setRows([]);
      } finally {
        setLoadingRows(false);
      }
    }
    loadRows();
  }, [selectedDate, selectedProject, selectedEmployee]);

  // const totalHours = useMemo(
  //   () => rows.reduce((sum, r) => sum + (Number(r.hours_spent) || 0), 0),
  //   [rows]
  // );

  const totalHours = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.total_time_needed) || 0), 0),
    [rows]
  );

  const dateLabel = formatDateLabel(selectedDate);

  return (
    <div className="dur-page">
      <div className="dur-toolbar">
        <div className="dur-toolbar-title">Daily Status Report</div>
        <div className="dur-filters">
          <label className="dur-filter">
            <span>Date</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={loadingMeta || !meta.dates.length}
            >
              {meta.dates.map((d) => {
                const v = d.slice(0, 10);
                return (
                  <option key={v} value={v}>
                    {v}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="dur-filter">
            <span>Project</span>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
              <option value="">All projects</option>
              {meta.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </label>

          <label className="dur-filter">
            <span>Employee</span>
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
              <option value="">All employees</option>
              {meta.employees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="dur-table-wrap">
        <table className="dur-table">
          <thead>
           
            <tr>
              <th className="dur-col-slno sticky-slno">SLNO</th>
              <th className="sticky-emp">Employee Name</th>
              <th className="sticky-project">Project</th>
              <th className="sticky-status">Working Status</th>
              <th>Done Yesterday</th>
              <th>Today's Plan</th>
              <th>Risks</th>
              <th>Dependencies</th>
              <th>Total Time Needed</th>
              <th>Availability</th>
              <th>Utilization (%)</th>
            </tr>
          </thead>
          <tbody>
            {loadingRows && (
              <tr>
                <td colSpan={11} className="dur-state-row">
                  Loading updates…
                </td>
              </tr>
            )}

            {!loadingRows && error && (
              <tr>
                <td colSpan={11} className="dur-state-row dur-state-row--error">
                  {error}
                </td>
              </tr>
            )}

            {!loadingRows && !error && rows.length === 0 && (
              <tr>
                <td colSpan={11} className="dur-state-row">
                  No updates logged for this date. Try a different date or filter.
                </td>
              </tr>
            )}

            {!loadingRows &&
              !error &&
              rows.map((row, idx) => {
                const totalTimeNeeded = Number(row.total_time_needed) || 0;
                const availability = 8 - totalTimeNeeded;
                const utilization = ((totalTimeNeeded / 8) * 100).toFixed(1);

                return (
                  <tr key={row.id}>
                    <td className="dur-col-slno sticky-slno">{idx + 1}</td>
                    <td className=" dur-text-cell dur-text-wrap sticky-emp">{row.employee_name || '—'}</td>
                    <td className="dur-text-cell dur-text-wrap sticky-project">{row.project_name || '—'}</td>

                    <td className="dur-text-cell sticky-status">
                      <StatusBadge value={row.working_status} />
                    </td>



                    <td className="dur-text-cell dur-text-wrap">
                      {row.done_yesterday || '—'}
                    </td>

                    <td className="dur-text-cell dur-text-wrap">
                      {row.todays_tasks || '—'}
                    </td>

                    <td className="dur-text-cell dur-text-wrap">
                      {row.risks || '—'}
                    </td>

                    <td className="dur-text-cell dur-text-wrap">
                      {row.dependencies || '—'}
                    </td>
                    <td className="dur-col-hours">
                      {totalTimeNeeded} hrs
                    </td>

                    <td className="dur-col-hours">
                      {availability > 0
                        ? `${availability} hrs`
                        : availability === 0
                          ? '0 hrs'
                          : `${availability} hrs`}
                    </td>

                    <td className="dur-col-hours">
                      {utilization}%
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}