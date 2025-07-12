const trackService = require('../services/track.service');

// Controlador para obter todas as trilhas para o usuário logado
async function getTracks(req, res) {
    // Assumindo que o userId está disponível no req.user após a autenticação
    const userId = req.user.id; 

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found.' });
    }

    try {
        const tracks = await trackService.getTracks(userId);
        res.status(200).json(tracks);
    } catch (error) {
        console.error('[TRACK CONTROLLER] Error getting tracks:', error.message);
        res.status(500).json({ message: 'Failed to retrieve tracks.', error: error.message });
    }
}

// Controlador para iniciar uma trilha e desbloquear a recompensa
async function startTrackAndUnlockReward(req, res) {
    const userId = req.user.id; 
    const { trackId, rewardAmount } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found.' });
    }
    if (!trackId || rewardAmount === undefined) {
        return res.status(400).json({ message: 'Bad Request: trackId and rewardAmount are required.' });
    }

    try {
        // A lógica de desbloqueio de recompensa está encapsulada no trackService
        const result = await trackService.startTrackAndUnlockReward(userId, trackId, rewardAmount);
        res.status(200).json({ message: 'Track started and reward unlocked successfully!', newTotalEconomy: result.newTotalEconomy });
    } catch (error) {
        console.error(`[TRACK CONTROLLER] Error starting track ${trackId} and unlocking reward for user ${userId}:`, error.message);
        res.status(500).json({ message: 'Failed to start track or unlock reward.', error: error.message });
    }
}

// Controlador para completar uma trilha (opcional, dependendo do fluxo)
async function completeTrack(req, res) {
    const userId = req.user.id;
    const { trackId } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found.' });
    }
    if (!trackId) {
        return res.status(400).json({ message: 'Bad Request: trackId is required.' });
    }

    try {
        const success = await trackService.completeTrack(userId, trackId);
        if (success) {
            res.status(200).json({ message: 'Track completed successfully!' });
        } else {
            res.status(404).json({ message: 'Track not found or not in progress for this user.' });
        }
    } catch (error) {
        console.error(`[TRACK CONTROLLER] Error completing track ${trackId} for user ${userId}:`, error.message);
        res.status(500).json({ message: 'Failed to complete track.', error: error.message });
    }
}

module.exports = {
    getTracks,
    startTrackAndUnlockReward,
    completeTrack,
};