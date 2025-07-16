// src/routes/auth.routes.js
const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

router.post('/github-auth/exchange-code', authController.exchangeGitHubCode);
router.post('/logout', authController.logout);
router.get('/check-auth', authController.checkAuth);

module.exports = router;