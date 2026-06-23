
const express = require('express');
const router  = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const {
  getCatalog,
  getEffortEstimates,
  getTaskLoads,
  upsertTaskLoad,
  bulkUpsertTaskLoads,
  getProjectSummary,
  getAssignmentsByProject,
  addAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controller/assignment.controller');

// Catalog — both roles need it
router.get ('/catalog',                   authMiddleware,            getCatalog);

// Effort estimates — fetch from effort_estimates table
router.get ('/effort-estimates/:projectId', authMiddleware, getEffortEstimates);

// Task loads — admin only
router.get ('/task-loads/:projectId',     authMiddleware, getTaskLoads);
router.post('/task-loads/bulk',           authMiddleware, bulkUpsertTaskLoads);
router.post('/task-loads',               authMiddleware, upsertTaskLoad);

// Summary
router.get ('/summary/:projectId',        authMiddleware, getProjectSummary);

// Assignments CRUD
router.get   ('/',    authMiddleware, getAssignmentsByProject);
router.post  ('/',    authMiddleware, addAssignment);
router.put   ('/:id', authMiddleware, updateAssignment);
router.delete('/:id', authMiddleware, deleteAssignment);

module.exports = router;
