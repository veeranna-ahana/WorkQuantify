const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
    getReconFilters,
    getReconDashboard,
    getProjectLevelRecon,
    getEmployeeLevelRecon,
    getProjectDetail
} = require('../controller/recon.controller');

// ─── Routes ──────────────────────────────────────────────────────

// Filter options
router.get('/filters', authMiddleware, getReconFilters);

// Dashboard & Lists
router.get('/dashboard', authMiddleware, getReconDashboard);
router.get('/project-level', authMiddleware, getProjectLevelRecon);
router.get('/employee-level', authMiddleware, getEmployeeLevelRecon);

// Project Detail
router.get('/project-detail/:projectId', authMiddleware, getProjectDetail);

module.exports = router;