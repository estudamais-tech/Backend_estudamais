// src/controllers/track.controller.js
const trackService = require('../services/track.service');

async function getTracksController(req, res) {
    const userId = req.user.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const tracks = await trackService.getTracks(userId);
        res.status(200).json(tracks);
    } catch (error) {
        console.error('Error getting tracks:', error.message);
        res.status(500).json({ message: 'Failed to get tracks' });
    }
}

async function startTrackAndUnlockRewardController(req, res) {
    const userId = req.user.id;
    const { trackId } = req.body;
    
    try {
        const result = await trackService.startTrackAndUnlockReward(userId, trackId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error starting track:', error.message);
        res.status(500).json({ message: error.message });
    }
}

async function completeTrackAndUnlockRewardController(req, res) {
    const userId = req.user.id;
    const { trackId } = req.body;

    try {
        const result = await trackService.completeTrackAndUnlockReward(userId, trackId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error completing track:', error.message);
        res.status(500).json({ message: error.message });
    }
}

async function removeTrackController(req, res) {
    const userId = req.user.id;
    const { trackId } = req.params;

    try {
        const result = await trackService.removeTrack(userId, trackId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error removing track:', error.message);
        res.status(500).json({ message: error.message });
    }
}

// FUNÇÃO CORRIGIDA: Obter atividades recentes globais
async function getGlobalRecentActivitiesController(req, res) {
    try {
        // Certifique-se de que trackService.getGlobalRecentActivities está sendo chamado corretamente.
        // Se o erro persistir, verifique a exportação em track.service.js novamente.
        const activities = await trackService.getGlobalRecentActivities();
        res.status(200).json(activities);
    } catch (error) {
        console.error('Error getting global recent activities:', error.message);
        res.status(500).json({ message: 'Failed to get global recent activities' });
    }
}

module.exports = {
    getTracksController,
    startTrackAndUnlockRewardController,
    completeTrackAndUnlockRewardController,
    removeTrackController,
    getGlobalRecentActivitiesController,
};
