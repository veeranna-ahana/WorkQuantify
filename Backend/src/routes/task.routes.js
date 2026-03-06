const express = require('express');
const router = express.Router();

const {authMiddleware} = require('../middleware/auth.middleware');
// const { createTask, getTasksByProjectId } = require('../controller/task.controller');
const taskController = require('../controller/task.controller');

// POST / - create task (protected)
router.post('/', authMiddleware, taskController.createTask);

// GET /?projectId= - get tasks by projectId (protected)
router.get('/', authMiddleware, (req, res, next) => {
  // Adapt query parameter to what the controller expects
  req.params.projectId = req.query.projectId;
  return taskController.getTasksByProjectId(req, res, next);
});



module.exports = router;