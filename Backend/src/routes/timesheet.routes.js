const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth.middleware');
const { 
    uploadTimesheet, 
    getBatches, 
    getBatchDetails,
    getReconciliationReport 
} = require('../controller/timesheet.controller');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
router.post('/upload', authMiddleware, upload.single('file'), uploadTimesheet);
router.get('/batches', authMiddleware, getBatches);
router.get('/batches/:id', authMiddleware, getBatchDetails);
router.get('/reconciliation/:id', authMiddleware, getReconciliationReport);

module.exports = router;