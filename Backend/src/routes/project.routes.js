const express = require('express');
const router  = express.Router();

const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const {
  createProject,
  getAllProjects,
  getEffortEstimate,
  upsertEffortEstimate,
  deleteEffortEstimate,
  updateProject,
} = require('../controller/project.controller');

// ── Project CRUD ──────────────────────────────────────────────
router.post('/', authMiddleware,  createProject);
router.get('/',  authMiddleware, getAllProjects);
router.put('/:id', authMiddleware, updateProject);

// ── Effort Estimate ───────────────────────────────────────────
// GET    /api/projects/:projectId/effort       — fetch estimate for project
router.get   ('/:projectId/effort', authMiddleware,  getEffortEstimate);

// POST   /api/projects/:projectId/effort/bulk  — upsert all rows at once
router.post  ('/:projectId/effort/bulk', authMiddleware,  upsertEffortEstimate);

// DELETE /api/projects/:projectId/effort       — reset / clear estimate
router.delete('/:projectId/effort', authMiddleware,  deleteEffortEstimate);

module.exports = router;
