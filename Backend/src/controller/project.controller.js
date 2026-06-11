const { query } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects
// Body: { name, clientName, description, nbdId, o2dId, projectCode,
//         subCategory, startDate, endDate, status }
// ─────────────────────────────────────────────────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const {
      name,
      clientName,
      description,
      nbdId,
      o2dId,
      projectCode,
      subCategory,
      startDate,
      endDate,
      status,
    } = req.body;

    if (!name || !clientName) {
      return res.status(400).json({
        message: 'Project name and client name are required',
      });
    }

    const sql = `
      INSERT INTO projects
        (project_name, client_name, description, nbd_id, o2d_id,
         project_code, sub_category, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      name,
      clientName,
      description   || null,
      nbdId         || null,
      o2dId         || null,
      projectCode   || null,
      subCategory   || null,
      startDate     || null,
      endDate       || null,
      status        || 'ACTIVE',
    ];

    const result = await query(sql, params);

    // Return the full newly-created row
    const rows = await query(
      `SELECT id, project_name, client_name, description, nbd_id, o2d_id,
              project_code, sub_category, start_date, end_date, status
       FROM projects WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects
// Returns all projects ordered by id ASC
// ─────────────────────────────────────────────────────────────────────────────
const getAllProjects = async (req, res, next) => {
  try {
    // const sql = `
    //   SELECT id, project_name, client_name, description,
    //          nbd_id, o2d_id, project_code, sub_category,
    //          start_date, end_date, status
    //   FROM projects
    //   ORDER BY id ASC
    // `;
    const sql = `
  SELECT
    p.id,
    p.project_name,
    p.client_name,
    p.description,
    p.nbd_id,
    p.o2d_id,
    p.project_code,
    p.sub_category,
    p.start_date,
    p.end_date,
    p.status,
    COALESCE(SUM(e.total_hrs), 0) AS total_effort_hours,
    COALESCE(SUM(e.effort_days + e.buffer_days), 0) AS total_effort_days

  FROM projects p

  LEFT JOIN effort_estimates e
    ON e.project_id = p.id

  GROUP BY
    p.id,
    p.project_name,
    p.client_name,
    p.description,
    p.nbd_id,
    p.o2d_id,
    p.project_code,
    p.sub_category,
    p.start_date,
    p.end_date,
    p.status

  ORDER BY p.id ASC
`;
    const projects = await query(sql);
    return res.status(200).json(projects);
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/:projectId/effort
// Returns all effort-estimate rows for a project (empty array if none yet)
// ─────────────────────────────────────────────────────────────────────────────
const getEffortEstimate = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const rows = await query(
      `SELECT id, project_id, role, effort_days, effort_hrs,
              buffer_days, buffer_hrs, total_hrs, units, unit_label
       FROM effort_estimates
       WHERE project_id = ?
       ORDER BY id ASC`,
      [projectId]
    );

    // Also return totals for convenience
    const totals = rows.reduce(
      (acc, r) => ({
        effort_days: acc.effort_days + Number(r.effort_days),
        effort_hrs:  acc.effort_hrs  + Number(r.effort_hrs),
        buffer_days: acc.buffer_days + Number(r.buffer_days),
        buffer_hrs:  acc.buffer_hrs  + Number(r.buffer_hrs),
        total_hrs:   acc.total_hrs   + Number(r.total_hrs),
      }),
      { effort_days: 0, effort_hrs: 0, buffer_days: 0, buffer_hrs: 0, total_hrs: 0 }
    );

    return res.status(200).json({ rows, totals });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/:projectId/effort/bulk
// Body: { rows: [ { role, effort_days, buffer_days, units, unit_label }, … ] }
// Upserts all rows in one call (INSERT … ON DUPLICATE KEY UPDATE).
// The backend recalculates hrs and total_hrs from days so the frontend
// doesn't need to send derived values.
// ─────────────────────────────────────────────────────────────────────────────
const upsertEffortEstimate = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { rows }      = req.body;

    if (!projectId || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'projectId and rows[] are required' });
    }

    const HOURS_PER_DAY = 8;

    for (const r of rows) {
      const effortDays = parseFloat(r.effort_days) || 0;
      const bufferDays = parseFloat(r.buffer_days) || 0;
      const effortHrs  = effortDays * HOURS_PER_DAY;
      const bufferHrs  = bufferDays * HOURS_PER_DAY;
      const totalHrs   = effortHrs + bufferHrs;

      await query(
        `INSERT INTO effort_estimates
           (project_id, role, effort_days, effort_hrs,
            buffer_days, buffer_hrs, total_hrs, units, unit_label)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           effort_days = VALUES(effort_days),
           effort_hrs  = VALUES(effort_hrs),
           buffer_days = VALUES(buffer_days),
           buffer_hrs  = VALUES(buffer_hrs),
           total_hrs   = VALUES(total_hrs),
           units       = VALUES(units),
           unit_label  = VALUES(unit_label),
           updated_at  = CURRENT_TIMESTAMP`,
        [
          projectId,
          r.role,
          effortDays,
          effortHrs,
          bufferDays,
          bufferHrs,
          totalHrs,
          r.units     || null,
          r.unit_label || null,
        ]
      );
    }

    // Return the freshly-saved data
    const saved = await query(
      `SELECT id, project_id, role, effort_days, effort_hrs,
              buffer_days, buffer_hrs, total_hrs, units, unit_label
       FROM effort_estimates WHERE project_id = ? ORDER BY id ASC`,
      [projectId]
    );

    const totals = saved.reduce(
      (acc, r) => ({
        effort_days: acc.effort_days + Number(r.effort_days),
        effort_hrs:  acc.effort_hrs  + Number(r.effort_hrs),
        buffer_days: acc.buffer_days + Number(r.buffer_days),
        buffer_hrs:  acc.buffer_hrs  + Number(r.buffer_hrs),
        total_hrs:   acc.total_hrs   + Number(r.total_hrs),
      }),
      { effort_days: 0, effort_hrs: 0, buffer_days: 0, buffer_hrs: 0, total_hrs: 0 }
    );

    return res.status(200).json({ message: 'Saved', rows: saved, totals });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/:projectId/effort
// Wipes all effort rows for a project (useful for a "Reset" button)
// ─────────────────────────────────────────────────────────────────────────────
const deleteEffortEstimate = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await query('DELETE FROM effort_estimates WHERE project_id = ?', [projectId]);
    return res.status(200).json({ message: 'Effort estimate cleared' });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getEffortEstimate,
  upsertEffortEstimate,
  deleteEffortEstimate,
};