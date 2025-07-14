// src/routes/stats.routes.js

const express = require('express');
const statsController = require('../controllers/stats.controller');
const router = express.Router();

// Rota pública para obter as estatísticas globais
// GET /api/stats/global
router.get('/stats/global', statsController.getGlobalStatsController);

module.exports = router;