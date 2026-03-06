const express = require('express');
const router  = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const {
  getCatalog, getTaskLoads, upsertTaskLoad, bulkUpsertTaskLoads,
  getProjectSummary, getAssignmentsByProject,
  addAssignment, updateAssignment, deleteAssignment,
} = require('../controller/assignment.controller');

// Catalog — both roles need it (task dropdowns in daily updates)
router.get ('/catalog',               authMiddleware,            getCatalog);

// Task loads — admin only
router.get ('/task-loads/:projectId', authMiddleware, adminOnly, getTaskLoads);
router.post('/task-loads/bulk',       authMiddleware, adminOnly, bulkUpsertTaskLoads);
router.post('/task-loads',            authMiddleware, adminOnly, upsertTaskLoad);

// Summary
router.get ('/summary/:projectId',    authMiddleware, adminOnly, getProjectSummary);

// Assignments CRUD
router.get   ('/',    authMiddleware, adminOnly, getAssignmentsByProject);
router.post  ('/',    authMiddleware, adminOnly, addAssignment);
router.put   ('/:id', authMiddleware, adminOnly, updateAssignment);
router.delete('/:id', authMiddleware, adminOnly, deleteAssignment);

module.exports = router;
