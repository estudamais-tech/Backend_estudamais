// src/controllers/track.controller.js
const trackService = require('../services/track.service');

async function getTracks(req, res) {
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

async function startTrackAndUnlockReward(req, res) {
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

async function completeTrackAndUnlockReward(req, res) {
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

async function removeTrack(req, res) {
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

module.exports = {
    getTracks,
    startTrackAndUnlockReward,
    completeTrackAndUnlockReward,
    removeTrack,
};