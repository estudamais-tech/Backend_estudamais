// src/controllers/stats.controller.js

const statsService = require('../services/stats.service');

async function getGlobalStatsController(req, res) {
    try {
        const stats = await statsService.getStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('[STATS CONTROLLER] Erro ao buscar estatísticas globais:', error.message);
        res.status(500).json({ message: 'Erro ao buscar estatísticas globais.' });
    }
}

module.exports = {
    getGlobalStatsController,
};