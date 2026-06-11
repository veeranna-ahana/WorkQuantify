// const express = require('express');
// const router = express.Router();

// const projectController = require('../controller/project.controller');

// // POST / - create project
// router.post('/', projectController.createProject);

// // GET / - get all projects
// router.get('/', projectController.getAllProjects);

// module.exports = router;

const express = require('express');
const router  = express.Router();

const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const {
  createProject,
  getAllProjects,
  getEffortEstimate,
  upsertEffortEstimate,
  deleteEffortEstimate,
} = require('../controller/project.controller');

// ── Project CRUD ──────────────────────────────────────────────
// POST /api/projects          — create project  (admin only)
router.post('/', authMiddleware, adminOnly, createProject);

// GET  /api/projects          — list all projects (any auth user)
router.get('/',  authMiddleware, getAllProjects);

// ── Effort Estimate ───────────────────────────────────────────
// GET    /api/projects/:projectId/effort       — fetch estimate for project
router.get   ('/:projectId/effort', authMiddleware, adminOnly, getEffortEstimate);

// POST   /api/projects/:projectId/effort/bulk  — upsert all rows at once
router.post  ('/:projectId/effort/bulk', authMiddleware, adminOnly, upsertEffortEstimate);

// DELETE /api/projects/:projectId/effort       — reset / clear estimate
router.delete('/:projectId/effort', authMiddleware, adminOnly, deleteEffortEstimate);

module.exports = router;
