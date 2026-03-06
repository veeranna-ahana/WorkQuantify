const { query } = require('../config/db');

// Create a project
// POST /projects
// Expect body: { name, description }
const createProject = async (req, res, next) => {
    try {
      const {
        name,
        clientName,
        startDate,
        endDate,
        status
      } = req.body;
  
      // HARD validation (prevents SQL crash)
      if (!name || !clientName) {
        return res.status(400).json({
          message: 'Project name and client name are required'
        });
      }
  
      const sql = `
        INSERT INTO projects
        (project_name, client_name, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?)
      `;
  
      const params = [
        name,
        clientName,
        startDate || null,
        endDate || null,
        status || 'ACTIVE'
      ];
  
      const result = await query(sql, params);
  
      res.status(201).json({
        id: result.insertId,
        name,
        clientName,
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || 'ACTIVE'
      });
  
    } catch (err) {
      next(err);
    }
  };
  
  const getAllProjects = async (req, res, next) => {
    try {
      const sql = `
        SELECT id, project_name, client_name, start_date, end_date, status
        FROM projects
        ORDER BY id ASC
      `;
  
      const projects = await query(sql);
  
      res.status(200).json(projects);
    } catch (err) {
      next(err);
    }
  };
  
  module.exports = {
    createProject,
    getAllProjects,
  };