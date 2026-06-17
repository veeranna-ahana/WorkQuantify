const { query } = require("../config/db");
const { createNotification } = require("./notification.controller");

// ─────────────────────────────────────────────────────────────────────────────
// EMP: Get my assignments with completed + pending
// Only APPROVED progress rows count toward completed
// GET /api/utilization/my-assignments?userId=
// ─────────────────────────────────────────────────────────────────────────────
const getMyAssignments = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const sql = `
      SELECT
        a.id                                                          AS assignment_id,
        a.project_id,
        p.project_name,
        a.role,
        a.task_name,
        a.units_assigned,
        COALESCE(SUM(CASE WHEN ap.status = 'APPROVED' THEN ap.units_completed ELSE 0 END), 0)
                                                                      AS units_completed,
        GREATEST(
          a.units_assigned
          - COALESCE(SUM(CASE WHEN ap.status = 'APPROVED' THEN ap.units_completed ELSE 0 END), 0),
          0
        )                                                             AS units_pending,
        -- pending-approval units (logged but not yet reviewed)
        COALESCE(SUM(CASE WHEN ap.status = 'PENDING' THEN ap.units_completed ELSE 0 END), 0)
                                                                      AS units_awaiting
      FROM assignments a
      LEFT JOIN projects p              ON a.project_id = p.id
      LEFT JOIN assignment_progress ap  ON a.id         = ap.assignment_id
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
// Inserts with status = 'PENDING', notifies all admins
// POST /api/utilization/log-progress
// Body: { assignment_id, user_id, date, units_completed, remarks }
// ─────────────────────────────────────────────────────────────────────────────
const logProgress = async (req, res, next) => {
  try {
    const { 
      assignment_id, user_id, date, units_completed, 
      todays_tasks, total_time_needed, yesterdays_tasks, risks,
      project_id, role
    } = req.body;

    if (!assignment_id || !user_id || !date) {
      return res.status(400).json({ message: "assignment_id, user_id and date are required" });
    }

    // Guard: don't allow logging more than what's pending (APPROVED only)
    const pendingRows = await query(
      `SELECT
         a.units_assigned,
         COALESCE(SUM(CASE WHEN ap.status = 'APPROVED' THEN ap.units_completed ELSE 0 END), 0) AS already_done,
         COALESCE(SUM(CASE WHEN ap.status = 'PENDING'  THEN ap.units_completed ELSE 0 END), 0) AS awaiting
       FROM assignments a
       LEFT JOIN assignment_progress ap ON a.id = ap.assignment_id
       WHERE a.id = ?
       GROUP BY a.units_assigned`,
      [assignment_id]
    );

    if (pendingRows.length === 0) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const { units_assigned, already_done, awaiting } = pendingRows[0];
    const effective_pending = units_assigned - already_done - awaiting;

    if (effective_pending <= 0) {
      return res.status(400).json({
        message: `No pending units available. You have ${awaiting} unit(s) awaiting approval.`
      });
    }

    if (units_completed > effective_pending) {
      return res.status(400).json({
        message: `Cannot log ${units_completed} units. Only ${effective_pending} units available to log.`
      });
    }

    // Insert with PENDING status
    const result = await query(
      `INSERT INTO assignment_progress (
         assignment_id, user_id, date, units_completed, 
         todays_tasks, total_time_needed, yesterdays_tasks, risks, 
         project_id, role, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        assignment_id, user_id, date, units_completed || 0, 
        todays_tasks || null, total_time_needed || null, yesterdays_tasks || null, risks || null,
        project_id || null, role || null
      ]
    );

    // Fetch assignment context for notifications
    const ctxRows = await query(
      `SELECT a.role, a.task_name, p.project_name, u.name AS emp_name
       FROM assignments a
       LEFT JOIN projects p ON a.project_id = p.id
       LEFT JOIN users u    ON a.user_id    = u.id
       WHERE a.id = ?`,
      [assignment_id]
    );
    const ctx = ctxRows[0];

    // Notify ALL admins
    const admins = await query(`SELECT id FROM users WHERE role = 'ADMIN'`);
    for (const admin of admins) {
      await createNotification({
        user_id: admin.id,
        type:    'progress_pending',
        title:   `Progress update awaiting approval`,
        message: `${ctx.emp_name} logged ${units_completed} unit(s) of "${ctx.task_name}" (${ctx.role}) on "${ctx.project_name}". Awaiting your approval.`,
      });
    }

    return res.status(201).json({
      id:      result.insertId,
      status:  'PENDING',
      message: "Progress logged and sent for approval",
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Get all pending approval items
// GET /api/utilization/pending-approvals
// ─────────────────────────────────────────────────────────────────────────────
const getPendingApprovals = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT
         ap.id                 AS progress_id,
         ap.assignment_id,
         ap.date,
         ap.units_completed,
         ap.remarks,
         ap.status,
         ap.rejection_reason,
         u.id                  AS user_id,
         u.name                AS user_name,
         a.role,
         a.task_name,
         a.units_assigned,
         p.id                  AS project_id,
         p.project_name
       FROM assignment_progress ap
       LEFT JOIN assignments a ON ap.assignment_id = a.id
       LEFT JOIN users u       ON ap.user_id       = u.id
       LEFT JOIN projects p    ON a.project_id     = p.id
       WHERE ap.status = 'PENDING'
       ORDER BY ap.date ASC`
    );
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Approve a progress log
// PUT /api/utilization/approve/:progressId
// ─────────────────────────────────────────────────────────────────────────────
const approveProgress = async (req, res, next) => {
  try {
    const { progressId } = req.params;

    // Fetch context before updating (for notification)
    const rows = await query(
      `SELECT ap.*, u.name AS emp_name, a.task_name, a.role, p.project_name
       FROM assignment_progress ap
       LEFT JOIN assignments a ON ap.assignment_id = a.id
       LEFT JOIN users u       ON ap.user_id       = u.id
       LEFT JOIN projects p    ON a.project_id     = p.id
       WHERE ap.id = ?`,
      [progressId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Progress log not found" });
    const ap = rows[0];

    if (ap.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot approve — current status is ${ap.status}` });
    }

    await query(
      `UPDATE assignment_progress SET status = 'APPROVED', rejection_reason = NULL WHERE id = ?`,
      [progressId]
    );

    // Notify the employee
    await createNotification({
      user_id: ap.user_id,
      type:    'progress_approved',
      title:   `Progress approved ✓`,
      message: `Your log of ${ap.units_completed} unit(s) for "${ap.task_name}" (${ap.role}) on "${ap.project_name}" has been approved.`,
    });

    return res.status(200).json({ message: "Approved" });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Reject a progress log
// PUT /api/utilization/reject/:progressId
// Body: { reason }
// ─────────────────────────────────────────────────────────────────────────────
const rejectProgress = async (req, res, next) => {
  try {
    const { progressId } = req.params;
    const { reason }     = req.body;

    const rows = await query(
      `SELECT ap.*, u.name AS emp_name, a.task_name, a.role, p.project_name
       FROM assignment_progress ap
       LEFT JOIN assignments a ON ap.assignment_id = a.id
       LEFT JOIN users u       ON ap.user_id       = u.id
       LEFT JOIN projects p    ON a.project_id     = p.id
       WHERE ap.id = ?`,
      [progressId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Progress log not found" });
    const ap = rows[0];

    if (ap.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot reject — current status is ${ap.status}` });
    }

    await query(
      `UPDATE assignment_progress SET status = 'REJECTED', rejection_reason = ? WHERE id = ?`,
      [reason || null, progressId]
    );

    // Notify the employee
    await createNotification({
      user_id: ap.user_id,
      type:    'progress_rejected',
      title:   `Progress update rejected`,
      message: `Your log of ${ap.units_completed} unit(s) for "${ap.task_name}" on "${ap.project_name}" was rejected.${reason ? ` Reason: ${reason}` : ""}`,
    });

    return res.status(200).json({ message: "Rejected" });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Overall user utilization (APPROVED only)
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
        WHERE status = 'APPROVED'
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
// ADMIN: Project-wise utilization (APPROVED only)
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
        WHERE status = 'APPROVED'
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
// ADMIN: Project health cards (APPROVED only)
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
        COALESCE(ptl_totals.total_load, 0)                      AS total_load,
        COALESCE(a_totals.total_assigned, 0)                    AS total_assigned,
        COALESCE(a_totals.total_completed, 0)                   AS total_completed,
        GREATEST(
          COALESCE(a_totals.total_assigned,  0)
          - COALESCE(a_totals.total_completed, 0), 0
        )                                                       AS total_pending,
        GREATEST(
          COALESCE(ptl_totals.total_load,    0)
          - COALESCE(a_totals.total_assigned, 0), 0
        )                                                       AS total_unassigned,
        CASE
          WHEN COALESCE(a_totals.total_assigned, 0) = 0 THEN 0
          ELSE ROUND(
            COALESCE(a_totals.total_completed, 0) /
            COALESCE(a_totals.total_assigned,  0) * 100, 1
          )
        END                                                     AS completion_pct
      FROM projects p
      LEFT JOIN (
        SELECT project_id, SUM(planned_units) AS total_load
        FROM project_task_loads
        GROUP BY project_id
      ) ptl_totals ON ptl_totals.project_id = p.id
      LEFT JOIN (
        SELECT
          a.project_id,
          SUM(a.units_assigned)                      AS total_assigned,
          COALESCE(SUM(ap_sub.units_completed), 0)   AS total_completed
        FROM assignments a
        LEFT JOIN (
          SELECT assignment_id, SUM(units_completed) AS units_completed
          FROM assignment_progress
          WHERE status = 'APPROVED'
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
  getPendingApprovals,
  approveProgress,
  rejectProgress,
  getOverallUtilization,
  getProjectUtilization,
  getProjectHealth,
};
