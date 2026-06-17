
const express = require('express');
const router = express.Router();

const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const {
  addDailyUpdate,
  getDailyUpdatesByUserId,
  getAllDailyUpdates,
  updateDailyUpdate,
  deleteDailyUpdate
} = require('../controller/dailyUpdate.controller');

// POST / — add daily update (any authenticated user)
router.post('/', authMiddleware, addDailyUpdate);

// GET /?userId= — employee: get own updates
router.get('/', authMiddleware, (req, res, next) => {
  req.params.userId = req.query.userId;
  return getDailyUpdatesByUserId(req, res, next);
});

// GET /all — admin: all updates with filters (projectId, riskLevel, dateFrom, dateTo)
router.get('/all', authMiddleware, adminOnly, getAllDailyUpdates);

// PUT /:id — update a daily update
router.put('/:id', authMiddleware, updateDailyUpdate);

// DELETE /:id — delete a daily update
router.delete('/:id', authMiddleware, deleteDailyUpdate);

module.exports = router;