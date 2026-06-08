const express = require('express');
const router  = express.Router();

const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const {
  getMyAssignments,
  logProgress,
  getPendingApprovals,
  approveProgress,
  rejectProgress,
  getOverallUtilization,
  getProjectUtilization,
  getProjectHealth,
} = require('../controller/utilization.controller');

// ── Employee routes ────────────────────────────────────────────────────────
router.get ('/my-assignments',         authMiddleware,            getMyAssignments);
router.post('/log-progress',           authMiddleware,            logProgress);

// ── Admin approval routes ──────────────────────────────────────────────────
router.get ('/pending-approvals',      authMiddleware, adminOnly, getPendingApprovals);
router.put ('/approve/:progressId',    authMiddleware, adminOnly, approveProgress);
router.put ('/reject/:progressId',     authMiddleware, adminOnly, rejectProgress);

// ── Admin analytics routes ─────────────────────────────────────────────────
router.get ('/overall',                authMiddleware, adminOnly, getOverallUtilization);
router.get ('/by-project',             authMiddleware, adminOnly, getProjectUtilization);
router.get ('/project-health',         authMiddleware, adminOnly, getProjectHealth);

module.exports = router;
