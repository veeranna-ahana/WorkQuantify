const { query } = require("../config/db");

// POST /api/daily-updates
const addDailyUpdate = async (req, res, next) => {
  try {
    const {
      project_id, role, task_name, user_id, date,
      units_completed, hours_spent, remarks,
      todays_task, tomorrows_plan, risk_level, risk_description
    } = req.body;

    if (!project_id || !role || !task_name || !user_id || !date) {
      return res.status(400).json({
        message: "Project, Role, Task, User and Date are required"
      });
    }

    // Validate risk_level if provided
    const validRiskLevels = ['Low', 'Medium', 'High'];
    if (risk_level && !validRiskLevels.includes(risk_level)) {
      return res.status(400).json({ message: "risk_level must be Low, Medium or High" });
    }

    const insertSql = `
      INSERT INTO daily_updates
      (project_id, role, task_name, user_id, date,
       units_completed, hours_spent, remarks,
       todays_task, tomorrows_plan, risk_level, risk_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      project_id, role, task_name, user_id, date,
      units_completed || 0,
      hours_spent || 0,
      remarks || null,
      todays_task || null,
      tomorrows_plan || null,
      risk_level || null,
      risk_description || null
    ];

    const result = await query(insertSql, insertParams);
    const insertedId = result.insertId;

    const selectSql = `
      SELECT 
        du.id, du.project_id, p.project_name,
        du.role, du.task_name, du.user_id,
        du.date, du.units_completed, du.hours_spent, du.remarks,
        du.todays_task, du.tomorrows_plan,
        du.risk_level, du.risk_description
      FROM daily_updates du
      LEFT JOIN projects p ON du.project_id = p.id
      WHERE du.id = ?
    `;

    const rows = await query(selectSql, [insertedId]);
    return res.status(201).json(rows[0]);

  } catch (err) {
    return next(err);
  }
};

// GET /api/daily-updates?userId=
const getDailyUpdatesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const sql = `
      SELECT 
        du.id, du.project_id, p.project_name,
        du.role, du.task_name, du.user_id,
        du.date, du.units_completed, du.hours_spent, du.remarks,
        du.todays_task, du.tomorrows_plan,
        du.risk_level, du.risk_description
      FROM daily_updates du
      LEFT JOIN projects p ON du.project_id = p.id
      WHERE du.user_id = ?
      ORDER BY du.date DESC, du.id DESC
    `;

    const updates = await query(sql, [userId]);
    return res.status(200).json(updates);

  } catch (err) {
    return next(err);
  }
};

// GET /api/daily-updates/all — Admin: all updates across all employees (for dashboard)
const getAllDailyUpdates = async (req, res, next) => {
  try {
    const { projectId, riskLevel, dateFrom, dateTo } = req.query;

    let sql = `
      SELECT 
        du.id, du.project_id, p.project_name,
        du.role, du.task_name,
        du.user_id, u.name AS user_name,
        du.date, du.units_completed, du.hours_spent, du.remarks,
        du.todays_task, du.tomorrows_plan,
        du.risk_level, du.risk_description
      FROM daily_updates du
      LEFT JOIN projects p ON du.project_id = p.id
      LEFT JOIN users u ON du.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (projectId) {
      sql += ` AND du.project_id = ?`;
      params.push(projectId);
    }
    if (riskLevel) {
      sql += ` AND du.risk_level = ?`;
      params.push(riskLevel);
    }
    if (dateFrom) {
      sql += ` AND du.date >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      sql += ` AND du.date <= ?`;
      params.push(dateTo);
    }

    sql += ` ORDER BY du.date DESC, du.id DESC`;

    const updates = await query(sql, params);
    return res.status(200).json(updates);

  } catch (err) {
    return next(err);
  }
};

// PUT /api/daily-updates/:id
const updateDailyUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      project_id, role, task_name, date,
      units_completed, hours_spent, remarks,
      todays_task, tomorrows_plan, risk_level, risk_description
    } = req.body;

    // Validate risk_level if provided
    const validRiskLevels = ['Low', 'Medium', 'High'];
    if (risk_level && !validRiskLevels.includes(risk_level)) {
      return res.status(400).json({ message: "risk_level must be Low, Medium or High" });
    }

    const sql = `
      UPDATE daily_updates
      SET project_id = ?, role = ?, task_name = ?,
          date = ?, units_completed = ?, hours_spent = ?, remarks = ?,
          todays_task = ?, tomorrows_plan = ?,
          risk_level = ?, risk_description = ?
      WHERE id = ?
    `;

    await query(sql, [
      project_id, role, task_name, date,
      units_completed, hours_spent, remarks,
      todays_task || null,
      tomorrows_plan || null,
      risk_level || null,
      risk_description || null,
      id
    ]);

    res.json({ message: "Updated successfully" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/daily-updates/:id
const deleteDailyUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM daily_updates WHERE id = ?", [id]);
    res.json({ message: "Daily update deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addDailyUpdate,
  getDailyUpdatesByUserId,
  getAllDailyUpdates,
  updateDailyUpdate,
  deleteDailyUpdate,
};