const express = require('express');
const router = express.Router();

const {authMiddleware} = require('../middleware/auth.middleware');
const { addDailyUpdate, getDailyUpdatesByUserId, updateDailyUpdate, deleteDailyUpdate } = require('../controller/dailyUpdate.controller');

// POST / - add daily update (protected)
router.post('/', authMiddleware, addDailyUpdate);

// GET /?userId= - get daily updates by userId (protected)
router.get('/', authMiddleware, (req, res, next) => {
  // Map query param to what the controller expects
  req.params.userId = req.query.userId;
  return getDailyUpdatesByUserId(req, res, next);
});

// ✅ PUT - Update daily update
router.put('/:id', authMiddleware, updateDailyUpdate);


// ✅ DELETE - Delete daily update
router.delete('/:id', authMiddleware, deleteDailyUpdate);


module.exports = router;