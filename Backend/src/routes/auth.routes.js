const express = require('express');
const router  = express.Router();

const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { login }           = require('../controller/auth.controller');

// Public
router.post('/login',    login);

// Admin only — only admins can create new user accounts
// router.post('/register', authMiddleware, adminOnly, register);

module.exports = router;
