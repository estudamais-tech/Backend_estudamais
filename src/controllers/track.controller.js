const trackService = require('../services/track.service');

async function getTracks(req, res) {
    const userId = req.user.id; // Assumindo que o userId está no req.user após a autenticação

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

// Controlador para iniciar uma trilha e desbloquear a recompensa (POST /api/user/tracks)
async function startTrackAndUnlockReward(req, res) {
    const userId = req.user.id;
    const { trackId, rewardAmount } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found.' });
    }
    if (!trackId || rewardAmount === undefined) { // rewardAmount é crucial aqui
        return res.status(400).json({ message: 'Bad Request: trackId and rewardAmount are required.' });
    }

    try {
        const result = await trackService.startTrackAndUnlockReward(userId, trackId, rewardAmount);
        res.status(200).json(result); // O serviço já retorna a mensagem e o unlockResult
    } catch (error) {
        console.error(`[TRACK CONTROLLER] Error starting track ${trackId} and unlocking reward for user ${userId}:`, error.message);
        res.status(500).json({ message: 'Failed to start track or unlock reward.', error: error.message });
    }
}

// Controlador para completar uma trilha (POST /api/user/tracks/complete)
async function completeTrackAndUnlockReward(req, res) {
    const userId = req.user.id;
    const { trackId } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found.' });
    }
    if (!trackId) {
        return res.status(400).json({ message: 'Bad Request: trackId is required.' });
    }

    try {
        const result = await trackService.completeTrackAndUnlockReward(userId, trackId);
        res.status(200).json(result); // O serviço já retorna a mensagem
    } catch (error) {
        console.error(`[TRACK CONTROLLER] Error completing track ${trackId} for user ${userId}:`, error.message);
        // Erro 404 se a trilha não foi encontrada/em progresso, 500 para outros erros internos
        if (error.message.includes('not found') || error.message.includes('not in progress')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to complete track.', error: error.message });
    }
}

// Controlador para remover uma trilha (DELETE /api/user/tracks/:trackId)
async function removeTrack(req, res) {
    const userId = req.user.id;
    const { trackId } = req.params; // trackId vem dos parâmetros da URL

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found.' });
    }
    if (!trackId) {
        return res.status(400).json({ message: 'Bad Request: trackId is required.' });
    }

    try {
        const result = await trackService.removeTrack(userId, trackId);
        res.status(200).json(result);
    } catch (error) {
        console.error(`[TRACK CONTROLLER] Error removing track ${trackId} for user ${userId}:`, error.message);
        if (error.message.includes('not found') || error.message.includes('not associated')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to remove track.', error: error.message });
    }
}


module.exports = {
    getTracks,
    startTrackAndUnlockReward,
    completeTrackAndUnlockReward,
    removeTrack,
};