// src/controllers/stats.controller.js
const statsService = require('../services/stats.service');

async function getGlobalStatsController(req, res) {
    try {
        const stats = await statsService.getStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error getting global stats:', error.message);
        res.status(500).json({ message: 'Error getting stats' });
    }
}

module.exports = {
    getGlobalStatsController,
};