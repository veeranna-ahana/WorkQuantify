const { query } = require("../config/db");
const { createNotification } = require("./notification.controller");

// GET /api/assignments/catalog
const getCatalog = async (req, res, next) => {
  try {
    const rows = await query(`SELECT id, role, task_name, unit_type, notes FROM role_task_catalog ORDER BY role, id`);
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.role]) grouped[row.role] = [];
      grouped[row.role].push(row);
    }
    return res.status(200).json({ flat: rows, grouped });
  } catch (err) { return next(err); }
};

// GET /api/assignments/task-loads/:projectId
const getTaskLoads = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const rows = await query(
      `SELECT ptl.id, ptl.project_id, ptl.role, ptl.task_name, ptl.planned_units, rtc.unit_type, rtc.notes
       FROM project_task_loads ptl
       LEFT JOIN role_task_catalog rtc ON ptl.role = rtc.role AND ptl.task_name = rtc.task_name
       WHERE ptl.project_id = ? ORDER BY ptl.role, ptl.task_name`,
      [projectId]
    );
    const total = rows.reduce((s, r) => s + Number(r.planned_units), 0);
    return res.status(200).json({ loads: rows, total_load: total });
  } catch (err) { return next(err); }
};

// POST /api/assignments/task-loads (single upsert)
const upsertTaskLoad = async (req, res, next) => {
  try {
    const { project_id, role, task_name, planned_units } = req.body;
    if (!project_id || !role || !task_name) return res.status(400).json({ message: "project_id, role, task_name required" });
    await query(
      `INSERT INTO project_task_loads (project_id, role, task_name, planned_units) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE planned_units = VALUES(planned_units)`,
      [project_id, role, task_name, planned_units || 0]
    );
    return res.status(200).json({ message: "Saved" });
  } catch (err) { return next(err); }
};

// POST /api/assignments/task-loads/bulk
const bulkUpsertTaskLoads = async (req, res, next) => {
  try {
    const { project_id, loads } = req.body;
    if (!project_id || !Array.isArray(loads)) return res.status(400).json({ message: "project_id and loads[] required" });
    for (const load of loads) {
      await query(
        `INSERT INTO project_task_loads (project_id, role, task_name, planned_units) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE planned_units = VALUES(planned_units)`,
        [project_id, load.role, load.task_name, load.planned_units || 0]
      );
    }
    const rows = await query(
      `SELECT ptl.*, rtc.unit_type FROM project_task_loads ptl
       LEFT JOIN role_task_catalog rtc ON ptl.role = rtc.role AND ptl.task_name = rtc.task_name
       WHERE ptl.project_id = ?`, [project_id]
    );
    return res.status(200).json({ loads: rows, total_load: rows.reduce((s, r) => s + Number(r.planned_units), 0) });
  } catch (err) { return next(err); }
};

// GET /api/assignments/summary/:projectId
const getProjectSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const rows = await query(
      `SELECT ptl.role, ptl.task_name, ptl.planned_units, rtc.unit_type,
         COALESCE(SUM(a.units_assigned), 0) AS total_assigned,
         COALESCE(SUM(ap_t.units_completed), 0) AS total_completed,
         GREATEST(ptl.planned_units - COALESCE(SUM(a.units_assigned), 0), 0) AS unassigned,
         GREATEST(COALESCE(SUM(a.units_assigned), 0) - COALESCE(SUM(ap_t.units_completed), 0), 0) AS pending
       FROM project_task_loads ptl
       LEFT JOIN role_task_catalog rtc ON ptl.role = rtc.role AND ptl.task_name = rtc.task_name
       LEFT JOIN assignments a ON a.project_id = ptl.project_id AND a.role = ptl.role AND a.task_name = ptl.task_name
       LEFT JOIN (SELECT assignment_id, SUM(units_completed) AS units_completed FROM assignment_progress GROUP BY assignment_id) ap_t ON ap_t.assignment_id = a.id
       WHERE ptl.project_id = ?
       GROUP BY ptl.role, ptl.task_name, ptl.planned_units, rtc.unit_type
       ORDER BY ptl.role, ptl.task_name`,
      [projectId]
    );
    const totals = {
      total_planned:   rows.reduce((s, r) => s + Number(r.planned_units),  0),
      total_assigned:  rows.reduce((s, r) => s + Number(r.total_assigned),  0),
      total_completed: rows.reduce((s, r) => s + Number(r.total_completed), 0),
      total_pending:   rows.reduce((s, r) => s + Number(r.pending),         0),
    };
    return res.status(200).json({ rows, totals });
  } catch (err) { return next(err); }
};

// GET /api/assignments?projectId=
const getAssignmentsByProject = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: "projectId required" });
    const rows = await query(
      `SELECT a.id, a.project_id, p.project_name, a.user_id, u.name AS user_name,
              a.role, a.task_name, a.units_assigned
       FROM assignments a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN projects p ON a.project_id = p.id
       WHERE a.project_id = ? ORDER BY a.role, u.name`,
      [projectId]
    );
    return res.status(200).json(rows);
  } catch (err) { return next(err); }
};

// POST /api/assignments
const addAssignment = async (req, res, next) => {
  try {
    const { project_id, user_id, role, task_name, units_assigned } = req.body;
    if (!project_id || !user_id || !role || !task_name) return res.status(400).json({ message: "project_id, user_id, role, task_name required" });
    const result = await query(
      `INSERT INTO assignments (project_id, user_id, role, task_name, units_assigned) VALUES (?, ?, ?, ?, ?)`,
      [project_id, user_id, role, task_name, units_assigned || 0]
    );
    const rows = await query(
      `SELECT a.*, u.name AS user_name, p.project_name FROM assignments a
       LEFT JOIN users u ON a.user_id = u.id LEFT JOIN projects p ON a.project_id = p.id WHERE a.id = ?`,
      [result.insertId]
    );
    const assignment = rows[0];
    await createNotification({
      user_id, type: 'assignment_created',
      title: `New assignment on ${assignment.project_name}`,
      message: `You have been assigned ${units_assigned || 0} unit(s) of "${task_name}" (${role}) on "${assignment.project_name}".`,
    });
    return res.status(201).json(assignment);
  } catch (err) { return next(err); }
};

// PUT /api/assignments/:id
const updateAssignment = async (req, res, next) => {
  try {
    const { role, task_name, units_assigned } = req.body;
    await query(`UPDATE assignments SET role=?, task_name=?, units_assigned=? WHERE id=?`, [role, task_name, units_assigned, req.params.id]);
    res.json({ message: "Updated" });
  } catch (err) { next(err); }
};

// DELETE /api/assignments/:id
const deleteAssignment = async (req, res, next) => {
  try {
    await query(`DELETE FROM assignments WHERE id=?`, [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) { next(err); }
};

module.exports = {
  getCatalog, getTaskLoads, upsertTaskLoad, bulkUpsertTaskLoads,
  getProjectSummary, getAssignmentsByProject, addAssignment, updateAssignment, deleteAssignment,
};
