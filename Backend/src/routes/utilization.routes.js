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
router.get ('/my-assignments',         authMiddleware, getMyAssignments);
router.post('/log-progress',           authMiddleware, logProgress);

// ── Admin approval routes ──────────────────────────────────────────────────
router.get ('/pending-approvals',      authMiddleware, getPendingApprovals);
router.put ('/approve/:progressId',    authMiddleware, approveProgress);
router.put ('/reject/:progressId',     authMiddleware, rejectProgress);

// ── Admin analytics routes ─────────────────────────────────────────────────
router.get ('/overall',                authMiddleware, getOverallUtilization);
router.get ('/by-project',             authMiddleware, getProjectUtilization);
router.get ('/project-health',         authMiddleware, getProjectHealth);

module.exports = router;
