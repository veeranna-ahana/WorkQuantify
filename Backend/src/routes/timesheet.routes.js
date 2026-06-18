const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth.middleware');
const { 
    uploadTimesheet, 
    getBatches, 
    getBatchDetails, 
    getProjectReconciliation,
    getEmployeeReconciliation,
    getBatchReconciliation
} = require('../controller/timesheet.controller');

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Upload API - Stores ALL data
router.post('/upload', authMiddleware, upload.single('file'), uploadTimesheet);

// Batch Management APIs 
router.get('/batches', authMiddleware, getBatches);
router.get('/batches/:id', authMiddleware, getBatchDetails);


// Reconciliation APIs
router.get('/reconciliation/project/:projectId', authMiddleware, getProjectReconciliation);
router.get('/reconciliation/employee/:userId', authMiddleware, getEmployeeReconciliation);
router.get('/reconciliation/batch/:batchId', authMiddleware, getBatchReconciliation);

module.exports = router;