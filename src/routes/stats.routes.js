const express = require('express');
const statsController = require('../controllers/stats.controller');
const router = express.Router();

router.get('/stats/global', statsController.getGlobalStatsController);

module.exports = router;
