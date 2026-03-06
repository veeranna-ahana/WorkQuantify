const { query } = require("../config/db");

// Add daily update
// Expect body: { task_id, user_id, date, units_completed, hours_spent }
// const addDailyUpdate = async (req, res, next) => {
//     try {
//       const { project_id, role, task_name, user_id, date,
//         units_completed, hours_spent, remarks } = req.body;
//       const sql = `
//         INSERT INTO daily_updates 
//         (task_id, user_id, date, units_completed, hours_spent)
//         VALUES (?, ?, ?, ?, ?)
//       `;
  
//       const params = [task_id, user_id, date, units_completed, hours_spent];
  
//       const result = await query(sql, params);
  
//       return res.status(201).json({
//         id: result.insertId,
//         task_id,
//         user_id,
//         date,
//         units_completed,
//         hours_spent
//       });
//     } catch (err) {
//       return next(err);
//     }
//   };
// const addDailyUpdate = async (req, res, next) => {
//   try {
//     const {
//       project_id,
//       role,
//       task_name,
//       user_id,
//       date,
//       units_completed,
//       hours_spent,
//       remarks
//     } = req.body;

//     // Basic validation
//     if (!project_id || !role || !task_name || !user_id || !date) {
//       return res.status(400).json({
//         message: "Project, Role, Task, User and Date are required"
//       });
//     }

//     const sql = `
//       INSERT INTO daily_updates
//       (project_id, role, task_name, user_id, date, units_completed, hours_spent, remarks)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const params = [
//       project_id,
//       role,
//       task_name,
//       user_id,
//       date,
//       units_completed || 0,
//       hours_spent || 0,
//       remarks || null
//     ];

//     const result = await query(sql, params);

//     return res.status(201).json({
//       id: result.insertId,
//       project_id,
//       role,
//       task_name,
//       user_id,
//       date,
//       units_completed: units_completed || 0,
//       hours_spent: hours_spent || 0,
//       remarks
//     });

//   } catch (err) {
//     return next(err);
//   }
// };
const addDailyUpdate = async (req, res, next) => {
  try {
    const {
      project_id,
      role,
      task_name,
      user_id,
      date,
      units_completed,
      hours_spent,
      remarks
    } = req.body;

    if (!project_id || !role || !task_name || !user_id || !date) {
      return res.status(400).json({
        message: "Project, Role, Task, User and Date are required"
      });
    }

    // 🔹 1. Insert record
    const insertSql = `
      INSERT INTO daily_updates
      (project_id, role, task_name, user_id, date, units_completed, hours_spent, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      project_id,
      role,
      task_name,
      user_id,
      date,
      units_completed || 0,
      hours_spent || 0,
      remarks || null
    ];

    const result = await query(insertSql, insertParams);

    const insertedId = result.insertId;

    // 🔹 2. Fetch inserted row with JOIN
    const selectSql = `
      SELECT 
        du.id,
        du.project_id,
        p.project_name,
        du.role,
        du.task_name,
        du.user_id,
        du.date,
        du.units_completed,
        du.hours_spent,
        du.remarks
      FROM daily_updates du
      LEFT JOIN projects p ON du.project_id = p.id
      WHERE du.id = ?
    `;

    const rows = await query(selectSql, [insertedId]);

    // 🔹 3. Return joined result
    return res.status(201).json(rows[0]);

  } catch (err) {
    return next(err);
  }
};



// Get daily updates by user_id
// Route: GET /api/daily-updates?userId=
// const getDailyUpdatesByUserId = async (req, res, next) => {
//     try {
//       const { userId } = req.query;
  
//       const sql = `
//         SELECT *
//         FROM daily_updates
//         WHERE user_id = ?
//         ORDER BY date DESC, id DESC
//       `;
  
//       const updates = await query(sql, [userId]);
  
//       return res.status(200).json(updates);
//     } catch (err) {
//       return next(err);
//     }
//   };
const getDailyUpdatesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const sql = `
      SELECT 
        du.id,
        du.project_id,
        p.project_name,
        du.role,
        du.task_name,
        du.user_id,
        du.date,
        du.units_completed,
        du.hours_spent,
        du.remarks
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


const updateDailyUpdate = async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        project_id,
        role,
        task_name,
        date,
        units_completed,
        hours_spent,
        remarks
      } = req.body;
  
      const sql = `
        UPDATE daily_updates
        SET project_id = ?, role = ?, task_name = ?, 
            date = ?, units_completed = ?, hours_spent = ?, remarks = ?
        WHERE id = ?
      `;
  
      await query(sql, [
        project_id,
        role,
        task_name,
        date,
        units_completed,
        hours_spent,
        remarks,
        id
      ]);
  
      res.json({ message: "Updated successfully" });
    } catch (err) {
      next(err);
    }
  };
  const deleteDailyUpdate = async (req, res, next) => {
    try {
      const { id } = req.params;
  
      await query(
        "DELETE FROM daily_updates WHERE id = ?",
        [id]
      );
  
      res.json({ message: "Daily update deleted successfully" });
  
    } catch (err) {
      next(err);
    }
  };
  
  

module.exports = {
  addDailyUpdate,
  getDailyUpdatesByUserId,
  updateDailyUpdate,
  deleteDailyUpdate,
};
