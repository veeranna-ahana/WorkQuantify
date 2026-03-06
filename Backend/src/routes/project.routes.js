const express = require('express');
const router = express.Router();

const projectController = require('../controller/project.controller');

// POST / - create project
router.post('/', projectController.createProject);

// GET / - get all projects
router.get('/', projectController.getAllProjects);

module.exports = router;
