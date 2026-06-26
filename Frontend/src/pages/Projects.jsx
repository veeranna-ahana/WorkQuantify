
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ── Effort estimate role config ───────────────────────────────────────────────
const EFFORT_ROLES = [
  { role: 'BA', unitLabel: '' },
  { role: 'Solution Architect', unitLabel: '' },
  { role: 'UI/UX', unitLabel: '' },
  { role: 'FE Dev', unitLabel: 'No of UI Screens' },
  { role: 'BE Dev', unitLabel: 'No of APIs' },
  { role: 'Tester', unitLabel: 'No of Cases' },
  { role: 'Deployment', unitLabel: '' },
  { role: 'Warranty & Support', unitLabel: '' },
  { role: 'Project Manager', unitLabel: '' },
];

const HOURS_PER_DAY = 8;

// ── Create Project Modal ──────────────────────────────────────────────────────
const CreateProjectModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    projectName: '',
    description: '',
    nbdId: '',
    o2dId: '',
    projectCode: '',
    subCategory: '',
    customer: '',
    startDate: '',
    endDate: '',
    projectType: 'one time project - otp',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.projectName.trim()) return setError('Project Name is required.');
    if (!form.customer.trim()) return setError('Customer is required.');
    setSaving(true);
    try {
      await axios.post(
        `${BASE_URL}/api/projects`,
        {
          name: form.projectName.trim(),
          clientName: form.customer.trim(),
          description: form.description.trim(),
          nbdId: form.nbdId.trim(),
          o2dId: form.o2dId.trim(),
          projectCode: form.projectCode.trim(),
          subCategory: form.subCategory.trim(),
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: 'new',
          projectType: form.projectType,
        },
        { headers: getHeaders() }
      );
      onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'projectName', label: 'Project Name', required: true, placeholder: 'e.g. ERP Phase 2' },
    { key: 'description', label: 'Description', required: false, placeholder: 'Brief overview…', multiline: true },
    { key: 'nbdId', label: 'NBD ID', required: false, placeholder: 'e.g. NBD-2024-001' },
    { key: 'o2dId', label: 'O2D ID', required: false, placeholder: 'e.g. O2D-2024-042' },
    { key: 'projectCode', label: 'Project Code', required: false, placeholder: 'e.g. PRJ-001' },
    { key: 'subCategory', label: 'Sub Category', required: false, placeholder: 'e.g. Web App / Mobile' },
    { key: 'customer', label: 'Customer', required: true, placeholder: 'Client or company name' },
  ];

  return (
    <div style={O.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={O.modal}>

        {/* Header */}
        <div style={O.header}>
          <div>
            <div style={O.title}>Create New Project</div>
            <div style={O.sub}>Fill in the details below to register a new project.</div>
          </div>
          <button onClick={onClose} style={O.closeBtn}>✕</button>
        </div>

        {/* Form */}
        <div style={O.formGrid}>
          {fields.map(f => (
            <div key={f.key} style={f.multiline ? { gridColumn: '1 / -1' } : {}}>
              <label style={O.label}>
                {f.label}
                {f.required && <span style={{ color: '#e74c3c', marginLeft: 3 }}>*</span>}
              </label>
              {f.multiline ? (
                <textarea
                  rows={3}
                  value={form[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={{ ...O.input, resize: 'vertical', minHeight: 72 }}
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={O.input}
                />
              )}
            </div>
          ))}

          {/* Start Date */}
          <div>
            <label style={O.label}>Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => handleChange('startDate', e.target.value)}
              style={O.input}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={O.label}>End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => handleChange('endDate', e.target.value)}
              style={O.input}
            />
          </div>

          {/* Project Type */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={O.label}>Project Type <span style={{ color: '#e74c3c', marginLeft: 3 }}>*</span></label>
            <select
              value={form.projectType}
              onChange={e => handleChange('projectType', e.target.value)}
              style={O.input}
            >
              <option value="one time project - otp">one time project - otp</option>
              <option value="managed service">managed service</option>
              <option value="Staff Augmentation">Staff Augmentation</option>
            </select>
          </div>
        </div>

        {error && <p style={O.error}>{error}</p>}

        {/* Footer */}
        <div style={O.footer}>
          <button onClick={onClose} style={O.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} style={O.submitBtn} disabled={saving}>
            {saving ? 'Creating…' : '+ Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Project Modal ──────────────────────────────────────────────────────
const EditProjectModal = ({ project, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    projectName: project.project_name || project.name || '',
    description: project.description || '',
    nbdId: project.nbd_id || '',
    o2dId: project.o2d_id || '',
    projectCode: project.project_code || '',
    subCategory: project.sub_category || '',
    customer: project.client_name || '',
    startDate: project.start_date ? project.start_date.split('T')[0] : '',
    endDate: project.end_date ? project.end_date.split('T')[0] : '',
    projectType: project.project_type || 'one time project - otp',
    status: project.status || 'new',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.projectName.trim()) return setError('Project Name is required.');
    if (!form.customer.trim()) return setError('Customer is required.');
    setSaving(true);
    try {
      await axios.put(
        `${BASE_URL}/api/projects/${project.id}`,
        {
          name: form.projectName.trim(),
          clientName: form.customer.trim(),
          description: form.description.trim(),
          nbdId: form.nbdId.trim(),
          o2dId: form.o2dId.trim(),
          projectCode: form.projectCode.trim(),
          subCategory: form.subCategory.trim(),
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: form.status,
          projectType: form.projectType,
        },
        { headers: getHeaders() }
      );
      onUpdated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update project.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'projectName', label: 'Project Name', required: true, placeholder: 'e.g. ERP Phase 2' },
    { key: 'description', label: 'Description', required: false, placeholder: 'Brief overview…', multiline: true },
    { key: 'nbdId', label: 'NBD ID', required: false, placeholder: 'e.g. NBD-2024-001' },
    { key: 'o2dId', label: 'O2D ID', required: false, placeholder: 'e.g. O2D-2024-042' },
    { key: 'projectCode', label: 'Project Code', required: false, placeholder: 'e.g. PRJ-001' },
    { key: 'subCategory', label: 'Sub Category', required: false, placeholder: 'e.g. Web App / Mobile' },
    { key: 'customer', label: 'Customer', required: true, placeholder: 'Client or company name' },
  ];

  return (
    <div style={O.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={O.modal}>

        {/* Header */}
        <div style={O.header}>
          <div>
            <div style={O.title}>Edit Project</div>
            <div style={O.sub}>Update the details or status of the project.</div>
          </div>
          <button onClick={onClose} style={O.closeBtn}>✕</button>
        </div>

        {/* Form */}
        <div style={O.formGrid}>
          {fields.map(f => (
            <div key={f.key} style={f.multiline ? { gridColumn: '1 / -1' } : {}}>
              <label style={O.label}>
                {f.label}
                {f.required && <span style={{ color: '#e74c3c', marginLeft: 3 }}>*</span>}
              </label>
              {f.multiline ? (
                <textarea
                  rows={3}
                  value={form[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={{ ...O.input, resize: 'vertical', minHeight: 72 }}
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={O.input}
                />
              )}
            </div>
          ))}

          {/* Start Date */}
          <div>
            <label style={O.label}>Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => handleChange('startDate', e.target.value)}
              style={O.input}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={O.label}>End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => handleChange('endDate', e.target.value)}
              style={O.input}
            />
          </div>

          {/* Project Type */}
          <div>
            <label style={O.label}>Project Type <span style={{ color: '#e74c3c', marginLeft: 3 }}>*</span></label>
            <select
              value={form.projectType}
              onChange={e => handleChange('projectType', e.target.value)}
              style={O.input}
            >
              <option value="one time project - otp">one time project - otp</option>
              <option value="managed service">managed service</option>
              <option value="Staff Augmentation">Staff Augmentation</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={O.label}>Status <span style={{ color: '#e74c3c', marginLeft: 3 }}>*</span></label>
            <select
              value={form.status}
              onChange={e => handleChange('status', e.target.value)}
              style={O.input}
            >
              <option value="new">new</option>
              <option value="inprproess">inprproess</option>
              <option value="onhold">onhold</option>
              <option value="completed">completed</option>
            </select>
          </div>
        </div>

        {error && <p style={O.error}>{error}</p>}

        {/* Footer */}
        <div style={O.footer}>
          <button onClick={onClose} style={O.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} style={O.submitBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Effort Estimate Modal ─────────────────────────────────────────────────────
// const EffortEstimateModal = ({ onClose }) => {
const EffortEstimateModal = ({ projects, onClose, onSaved }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [saving, setSaving] = useState(false);
  // rows: { role, days, hrs, bufferDays, bufferHrs, totalHrs, units, unitLabel }
  const [rows, setRows] = useState(
    EFFORT_ROLES.map(r => ({
      role: r.role,
      unitLabel: r.unitLabel,
      days: '',
      hrs: '',
      bufferDays: '',
      bufferHrs: '',
      totalHrs: '',
      units: '',
    }))
  );

  const handleChange = (idx, field, val) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };

      // Auto-calculate hrs from days
      if (field === 'days') {
        const d = parseFloat(val);
        next[idx].hrs = isNaN(d) ? '' : String(d * HOURS_PER_DAY);
      }
      // Auto-calculate bufferHrs from bufferDays
      if (field === 'bufferDays') {
        const bd = parseFloat(val);
        next[idx].bufferHrs = isNaN(bd) ? '' : String(bd * HOURS_PER_DAY);
      }
      // Auto-calculate totalHrs
      const h = parseFloat(next[idx].hrs) || 0;
      const bh = parseFloat(next[idx].bufferHrs) || 0;
      next[idx].totalHrs = (h + bh) > 0 ? String(h + bh) : '';

      return next;
    });
  };

  // Totals row
  const totals = rows.reduce(
    (acc, r) => ({
      days: acc.days + (parseFloat(r.days) || 0),
      hrs: acc.hrs + (parseFloat(r.hrs) || 0),
      bufferDays: acc.bufferDays + (parseFloat(r.bufferDays) || 0),
      bufferHrs: acc.bufferHrs + (parseFloat(r.bufferHrs) || 0),
      totalHrs: acc.totalHrs + (parseFloat(r.totalHrs) || 0),
    }),
    { days: 0, hrs: 0, bufferDays: 0, bufferHrs: 0, totalHrs: 0 }
  );
  const handleSubmit = async () => {

    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    try {

      setSaving(true);

      // await axios.post(
      //   `${BASE_URL}/api/effort-estimates`,
      //   {
      //     projectId: selectedProject,
      //     estimates: rows,
      //   },
      //   {
      //     headers: getHeaders(),
      //   }
      // );
      await axios.post(
        `${BASE_URL}/api/projects/${selectedProject}/effort/bulk`,
        {
          rows: rows.map(r => ({
            role: r.role,
            effort_days: r.days,
            buffer_days: r.bufferDays,
            units: r.units,
            unit_label: r.unitLabel,
          })),
        },
        {
          headers: getHeaders(),
        }
      );
      alert("Effort estimate saved successfully");

      onSaved?.();

      onClose();

    } catch (err) {

      console.error(err);

      alert(
        err?.response?.data?.message ||
        "Failed to save estimate"
      );

    } finally {

      setSaving(false);

    }
  };
  const handleCopy = () => {
    const header = ['Role', 'Days', 'Hrs', 'Buffer Days', 'Buffer Hrs', 'Total Hrs', 'Units'].join('\t');
    const body = rows.map(r =>
      [r.role, r.days, r.hrs, r.bufferDays, r.bufferHrs, r.totalHrs, r.units].join('\t')
    ).join('\n');
    navigator.clipboard.writeText(`${header}\n${body}`).catch(() => { });
  };

  return (
    <div style={O.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...O.modal, maxWidth: 860 }}>

        {/* Header */}
        <div style={O.header}>
          <div>
            <div style={O.title}>Effort Estimate</div>
            <div style={O.sub}>Enter days per role — hours are calculated automatically (1 day = 8 hrs).</div>
          </div>
          <button onClick={onClose} style={O.closeBtn}>✕</button>
        </div>
        {/* Project Selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={O.label}>
            Select Project
            <span style={{ color: '#e74c3c' }}> *</span>
          </label>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={O.input}
          >
            <option value="">Select Project</option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.project_name || project.name}
              </option>
            ))}
          </select>
        </div>
        {/* Table */}
        <div style={{ overflowX: 'auto', marginTop: 4 }}>
          <table style={E.table}>
            <thead>
              <tr>
                <th style={{ ...E.th, textAlign: 'left', minWidth: 155 }}>Role</th>
                <th style={E.th}>Effort (Days)</th>
                <th style={E.thCalc}>In Hrs</th>
                <th style={E.th}>Buffer (Days)</th>
                <th style={E.thCalc}>Buffer Hrs</th>
                <th style={{ ...E.thCalc, color: '#27ae60' }}>Total Hrs</th>
                <th style={E.th}>Units</th>
                <th style={{ ...E.th, minWidth: 130, textAlign: 'left' }}>Unit Label</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.role} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={E.tdRole}>{r.role}</td>

                  <td style={E.td}>
                    <input
                      type="number" min="0" step="0.5"
                      value={r.days} placeholder="0"
                      onChange={e => handleChange(i, 'days', e.target.value)}
                      style={E.numInput}
                    />
                  </td>

                  <td style={E.tdCalc}>{r.hrs || '—'}</td>

                  <td style={E.td}>
                    <input
                      type="number" min="0" step="0.5"
                      value={r.bufferDays} placeholder="0"
                      onChange={e => handleChange(i, 'bufferDays', e.target.value)}
                      style={E.numInput}
                    />
                  </td>

                  <td style={E.tdCalc}>{r.bufferHrs || '—'}</td>

                  <td style={{ ...E.tdCalc, color: '#27ae60', fontWeight: 700 }}>
                    {r.totalHrs || '—'}
                  </td>

                  <td style={E.td}>
                    <input
                      type="number" min="0"
                      value={r.units} placeholder="0"
                      onChange={e => handleChange(i, 'units', e.target.value)}
                      style={E.numInput}
                    />
                  </td>

                  <td style={{ ...E.tdCalc, textAlign: 'left', color: '#999', fontSize: 11 }}>
                    {r.unitLabel || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#1e272e' }}>
                <td style={{ ...E.tdRole, color: '#fff', fontWeight: 800 }}>TOTAL</td>
                <td style={{ ...E.tdCalc, color: '#fff' }}>{totals.days || '—'}</td>
                <td style={{ ...E.tdCalc, color: '#f39c12' }}>{totals.hrs || '—'}</td>
                <td style={{ ...E.tdCalc, color: '#fff' }}>{totals.bufferDays || '—'}</td>
                <td style={{ ...E.tdCalc, color: '#f39c12' }}>{totals.bufferHrs || '—'}</td>
                <td style={{ ...E.tdCalc, color: '#2ecc71', fontWeight: 800 }}>{totals.totalHrs || '—'}</td>
                <td style={E.tdCalc}></td>
                <td style={E.tdCalc}></td>
              </tr>
            </tfoot>
          </table>
        </div>


        <div style={O.footer}>

          <button
            onClick={onClose}
            style={O.cancelBtn}
          >
            Close
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={O.submitBtn}
          >
            {saving ? "Saving..." : "Save Estimate"}
          </button>

        </div>
      </div>
    </div>
  );
};

// ── Main Projects Component ───────────────────────────────────────────────────
const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEffortModal, setShowEffortModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/projects`, { headers: getHeaders() });
      setProjects(res.data || []);
    } catch (err) {
      console.error(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const statusColor = (s = '') => {
    const m = {
      new: '#2ecc71',
      inprproess: '#3498db',
      onhold: '#f39c12',
      completed: '#95a5a6',
      ACTIVE: '#2ecc71',
      active: '#2ecc71',
      COMPLETED: '#95a5a6',
      'ON-HOLD': '#f39c12'
    };
    return m[s] || '#95a5a6';
  };

  const formatStatus = (s = '') => {
    const labels = {
      new: 'New',
      inprproess: 'In Progress',
      onhold: 'On Hold',
      completed: 'Completed',
      ACTIVE: 'Active',
      active: 'Active',
    };
    return labels[s] || s;
  };

  return (
    <div style={P.page}>

      {/* ── Page heading + action buttons ── */}
      <div style={P.topBar}>
        <div>
          <h2 style={P.heading}>Projects</h2>
          <div style={P.underline} />
        </div>
        <div style={P.btnGroup}>
          <button onClick={() => setShowEffortModal(true)} style={P.effortBtn}>
            📊 Effort Estimate
          </button>
          <button onClick={() => setShowCreateModal(true)} style={P.createBtn}>
            + Create Project
          </button>
        </div>
      </div>

      {/* ── Projects table ── */}
      {loading ? (
        <div style={P.msg}>Loading projects…</div>
      ) : !projects.length ? (
        <div style={P.msg}>No projects found. Create one to get started.</div>
      ) : (
        <div style={P.tableWrap}>
          <div style={{ maxHeight: 420, overflowY: 'auto', overflowX: 'auto' }}>
            <table style={P.table}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  {[
                    '#',
                    'Project Code',
                    'NBD ID',
                    'O2D ID',
                    'Project Name',
                    'Type',
                    'Start Date',
                    'End Date',
                    'Status',
                    'Effort (Days)',
                    'Effort (Hours)',
                    'Action'
                  ].map(h => (
                    <th key={h} style={P.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => (
                  <tr key={p.id} style={P.tr}>
                    <td style={{ ...P.td, color: '#aaa', width: 40, textAlign: 'center' }}>{i + 1}</td>
                    <td style={P.td}>{p.project_code || '—'}</td>
                    <td style={P.td}>{p.nbd_id || '—'}</td>
                    <td style={P.td}>{p.o2d_id || '—'}</td>
                    <td style={{ ...P.td, fontWeight: 600, color: '#1e272e' }}>
                      {p.project_name || p.name}
                    </td>
                    <td style={P.td}>{p.project_type || '—'}</td>
                    <td style={P.td}>{p.start_date ? fmtDate(p.start_date) : '—'}</td>
                    <td style={P.td}>{p.end_date ? fmtDate(p.end_date) : '—'}</td>
                    <td style={P.td}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12, fontSize: 11,
                        fontWeight: 700, color: '#fff',
                        background: statusColor(p.status),
                      }}>
                        {formatStatus(p.status)}
                      </span>
                    </td>
                    <td style={P.td}>
                      {`${p.total_effort_days ?? 0} Days`}
                    </td>

                    <td style={P.td}>
                      {`${p.total_effort_hours ?? 0} Hrs`}
                    </td>
                    <td style={P.td}>
                      <button
                        onClick={() => setEditingProject(p)}
                        style={P.editBtn}
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchProjects}
        />
      )}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onUpdated={fetchProjects}
        />
      )}
      {showEffortModal && (
        <EffortEstimateModal
          projects={projects}
          onClose={() => setShowEffortModal(false)}
          onSaved={fetchProjects}
        />
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
};

// ── Styles ────────────────────────────────────────────────────────────────────
// Page
const P = {
  page: { padding: '24px', width: '100%', boxSizing: 'border-box', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  heading: { margin: 0, color: '#1e272e', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 },
  underline: { width: 52, height: 4, background: '#e74c3c', borderRadius: 2 },
  btnGroup: { display: 'flex', gap: 10, alignItems: 'center' },
  createBtn: {
    padding: '9px 20px', background: '#e74c3c', color: '#fff',
    border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(231,76,60,0.3)',
  },
  effortBtn: {
    padding: '9px 20px', background: '#1e272e', color: '#fff',
    border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  uploadBtn: {
    padding: '9px 20px', background: '#3498db', color: '#fff',
    border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(52,152,219,0.3)',
  },
  editBtn: {
    padding: '5px 12px', background: '#f39c12', color: '#fff',
    border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 1px 4px rgba(243,156,18,0.2)',
  },
  tableWrap: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #f0f0f0' },
  table: { width: '100%', minWidth: '1200px', borderCollapse: 'collapse' },
  th: { background: '#1e272e', color: '#fff', padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '13px 16px', fontSize: 13, color: '#444', whiteSpace: 'nowrap' },
  msg: { padding: 48, textAlign: 'center', color: '#bbb', fontSize: 15, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
};

// Overlay / Modal shared
const O = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)',
    backdropFilter: 'blur(3px)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  },
  modal: {
    background: '#fff', borderRadius: 14,
    boxShadow: '0 10px 50px rgba(0,0,0,0.22)',
    width: '100%', maxWidth: 580,
    maxHeight: '90vh', overflowY: 'auto',
    padding: '26px 30px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
    paddingBottom: 16, borderBottom: '1px solid #f0f0f0',
  },
  title: { fontSize: 18, fontWeight: 800, color: '#1e272e', marginBottom: 3 },
  sub: { fontSize: 12, color: '#999' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 17,
    cursor: 'pointer', color: '#bbb', padding: '0 4px', lineHeight: 1,
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '14px 18px', marginBottom: 16,
  },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 },
  input: {
    width: '100%', padding: '9px 11px',
    border: '1px solid #ddd', borderRadius: 6,
    fontSize: 13, boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.15s',
  },
  error: { color: '#e74c3c', fontSize: 12, margin: '0 0 10px', fontWeight: 600 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 14, borderTop: '1px solid #f0f0f0' },
  cancelBtn: {
    padding: '8px 20px', background: '#f0f0f0', color: '#555',
    border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  submitBtn: {
    padding: '8px 22px', background: '#e74c3c', color: '#fff',
    border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  copyBtn: {
    padding: '8px 18px', background: '#1e272e', color: '#fff',
    border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
};

// Effort table
const E = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '9px 10px', background: '#1e272e', color: '#fff', fontWeight: 600, fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap' },
  thCalc: { padding: '9px 10px', background: '#2c3e50', color: '#ccc', fontWeight: 600, fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap' },
  tdRole: { padding: '8px 12px', color: '#1e272e', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' },
  td: { padding: '6px 8px', textAlign: 'center' },
  tdCalc: { padding: '8px 10px', textAlign: 'center', color: '#666', background: '#fafafa', fontSize: 12 },
  numInput: {
    width: 70, padding: '5px 7px', border: '1px solid #ddd',
    borderRadius: 5, fontSize: 12, textAlign: 'center',
    boxSizing: 'border-box', outline: 'none',
  },
};

export default Projects;