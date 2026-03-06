const express = require('express');
const router  = express.Router();

const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const {
  getMyAssignments,
  logProgress,
  getOverallUtilization,
  getProjectUtilization,
  getProjectHealth,
} = require('../controller/utilization.controller');

// EMP routes — any authenticated user
router.get ('/my-assignments', authMiddleware,            getMyAssignments);
router.post('/log-progress',   authMiddleware,            logProgress);

// ADMIN only routes
router.get ('/overall',        authMiddleware, adminOnly, getOverallUtilization);
router.get ('/by-project',     authMiddleware, adminOnly, getProjectUtilization);
router.get ('/project-health', authMiddleware, adminOnly, getProjectHealth);

module.exports = router;
