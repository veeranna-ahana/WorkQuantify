const { query } = require("../config/db");

// ─────────────────────────────────────────────────────────────────────────────
// EMP: Get my assignments with completed + pending
// GET /api/utilization/my-assignments?userId=
// ─────────────────────────────────────────────────────────────────────────────
const getMyAssignments = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const sql = `
      SELECT
        a.id                                        AS assignment_id,
        a.project_id,
        p.project_name,
        a.role,
        a.task_name,
        a.units_assigned,
        COALESCE(SUM(ap.units_completed), 0)        AS units_completed,
        GREATEST(a.units_assigned - COALESCE(SUM(ap.units_completed), 0), 0) AS units_pending
      FROM assignments a
      LEFT JOIN projects p           ON a.project_id   = p.id
      LEFT JOIN assignment_progress ap ON a.id          = ap.assignment_id
      WHERE a.user_id = ?
      GROUP BY a.id, a.project_id, p.project_name, a.role, a.task_name, a.units_assigned
      ORDER BY p.project_name, a.role
    `;

    const rows = await query(sql, [userId]);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMP: Log progress on an assignment
// POST /api/utilization/log-progress
// Body: { assignment_id, user_id, date, units_completed, remarks }
// ─────────────────────────────────────────────────────────────────────────────
const logProgress = async (req, res, next) => {
  try {
    const { assignment_id, user_id, date, units_completed, remarks } = req.body;

    if (!assignment_id || !user_id || !date) {
      return res.status(400).json({ message: "assignment_id, user_id and date are required" });
    }

    // Guard: don't allow logging more than what's pending
    const pendingRows = await query(
      `SELECT
         a.units_assigned,
         COALESCE(SUM(ap.units_completed), 0) AS already_done
       FROM assignments a
       LEFT JOIN assignment_progress ap ON a.id = ap.assignment_id
       WHERE a.id = ?
       GROUP BY a.units_assigned`,
      [assignment_id]
    );

    if (pendingRows.length === 0) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const { units_assigned, already_done } = pendingRows[0];
    const pending = units_assigned - already_done;

    if (units_completed > pending) {
      return res.status(400).json({
        message: `Cannot log ${units_completed} units. Only ${pending} units pending.`
      });
    }

    const result = await query(
      `INSERT INTO assignment_progress (assignment_id, user_id, date, units_completed, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      [assignment_id, user_id, date, units_completed || 0, remarks || null]
    );

    return res.status(201).json({ id: result.insertId, message: "Progress logged" });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Overall user utilization
// GET /api/utilization/overall
// Returns per-user: total assigned, completed, pending, utilization %
// ─────────────────────────────────────────────────────────────────────────────
const getOverallUtilization = async (req, res, next) => {
  try {
    const sql = `
      SELECT
        u.id                                              AS user_id,
        u.name                                            AS user_name,
        u.role                                            AS user_role,
        u.daily_capacity,
        COALESCE(SUM(a.units_assigned), 0)                AS total_assigned,
        COALESCE(SUM(ap_totals.units_completed), 0)       AS total_completed,
        COALESCE(SUM(a.units_assigned), 0)
          - COALESCE(SUM(ap_totals.units_completed), 0)   AS total_pending,
        CASE
          WHEN COALESCE(SUM(a.units_assigned), 0) = 0 THEN 0
          ELSE ROUND(
            (COALESCE(SUM(ap_totals.units_completed), 0) /
             COALESCE(SUM(a.units_assigned), 0)) * 100, 1
          )
        END                                               AS utilization_pct
      FROM users u
      LEFT JOIN assignments a ON u.id = a.user_id
      LEFT JOIN (
        SELECT assignment_id, SUM(units_completed) AS units_completed
        FROM assignment_progress
        GROUP BY assignment_id
      ) ap_totals ON a.id = ap_totals.assignment_id
      WHERE u.role != 'ADMIN'
      GROUP BY u.id, u.name, u.role, u.daily_capacity
      ORDER BY utilization_pct DESC
    `;

    const rows = await query(sql);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Project-wise user utilization
// GET /api/utilization/by-project?projectId=   (optional filter)
// ─────────────────────────────────────────────────────────────────────────────
const getProjectUtilization = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    let sql = `
      SELECT
        p.id                                              AS project_id,
        p.project_name,
        u.id                                              AS user_id,
        u.name                                            AS user_name,
        a.role,
        a.task_name,
        a.units_assigned,
        COALESCE(ap_totals.units_completed, 0)            AS units_completed,
        GREATEST(a.units_assigned - COALESCE(ap_totals.units_completed, 0), 0) AS units_pending,
        CASE
          WHEN a.units_assigned = 0 THEN 0
          ELSE ROUND(
            (COALESCE(ap_totals.units_completed, 0) / a.units_assigned) * 100, 1
          )
        END                                               AS completion_pct
      FROM assignments a
      LEFT JOIN projects p ON a.project_id = p.id
      LEFT JOIN users u    ON a.user_id    = u.id
      LEFT JOIN (
        SELECT assignment_id, SUM(units_completed) AS units_completed
        FROM assignment_progress
        GROUP BY assignment_id
      ) ap_totals ON a.id = ap_totals.assignment_id
    `;

    const params = [];
    if (projectId) {
      sql += ` WHERE a.project_id = ?`;
      params.push(projectId);
    }

    sql += ` ORDER BY p.project_name, u.name, a.role`;

    const rows = await query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Project health cards
// GET /api/utilization/project-health
// Returns per-project: total_assigned, completed, pending, growth %, load
// ─────────────────────────────────────────────────────────────────────────────
const getProjectHealth = async (req, res, next) => {
  try {
    const sql = `
      SELECT
        p.id                                                    AS project_id,
        p.project_name,
        p.status,
        p.start_date,
        p.end_date,
        -- total_load = SUM of all planned_units in project_task_loads
        COALESCE(ptl_totals.total_load, 0)                      AS total_load,
        -- total_assigned = SUM of units_assigned across all assignments
        COALESCE(a_totals.total_assigned, 0)                    AS total_assigned,
        -- total_completed = SUM of all logged progress
        COALESCE(a_totals.total_completed, 0)                   AS total_completed,
        -- total_pending = assigned - completed (never negative)
        GREATEST(
          COALESCE(a_totals.total_assigned,  0)
          - COALESCE(a_totals.total_completed, 0), 0
        )                                                       AS total_pending,
        -- unassigned = load not yet given to anyone
        GREATEST(
          COALESCE(ptl_totals.total_load,    0)
          - COALESCE(a_totals.total_assigned, 0), 0
        )                                                       AS total_unassigned,
        -- completion_pct based on assigned work done
        CASE
          WHEN COALESCE(a_totals.total_assigned, 0) = 0 THEN 0
          ELSE ROUND(
            COALESCE(a_totals.total_completed, 0) /
            COALESCE(a_totals.total_assigned,  0) * 100, 1
          )
        END                                                     AS completion_pct
      FROM projects p

      -- Subquery 1: total planned load from project_task_loads
      LEFT JOIN (
        SELECT project_id, SUM(planned_units) AS total_load
        FROM project_task_loads
        GROUP BY project_id
      ) ptl_totals ON ptl_totals.project_id = p.id

      -- Subquery 2: total assigned + completed per project
      LEFT JOIN (
        SELECT
          a.project_id,
          SUM(a.units_assigned)                      AS total_assigned,
          COALESCE(SUM(ap_sub.units_completed), 0)   AS total_completed
        FROM assignments a
        LEFT JOIN (
          SELECT assignment_id, SUM(units_completed) AS units_completed
          FROM assignment_progress
          GROUP BY assignment_id
        ) ap_sub ON ap_sub.assignment_id = a.id
        GROUP BY a.project_id
      ) a_totals ON a_totals.project_id = p.id

      ORDER BY p.project_name
    `;

    const rows = await query(sql);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getMyAssignments,
  logProgress,
  getOverallUtilization,
  getProjectUtilization,
  getProjectHealth,
};
