const trackRepository = require('../repositories/track.repository');
const userRepository = require('../repositories/user.repository'); 

// Função para obter todas as trilhas para um usuário específico
async function getTracks(userId) {
    try {
        const tracks = await trackRepository.getTracksForUser(userId);
        return tracks;
    } catch (error) {
        console.error('[TRACK SERVICE] Error getting tracks:', error.message);
        throw error;
    }
}

// Função para iniciar uma trilha e desbloquear a recompensa
async function startTrackAndUnlockReward(userId, trackId, rewardAmount) {
    try {
        // 1. Iniciar a trilha (atualizar status em user_tracks)
        await trackRepository.startUserTrack(userId, trackId);
        console.log(`[TRACK SERVICE] Track ${trackId} started for user ${userId}.`);

        // 2. Desbloquear a recompensa (atualizar totalEconomy do usuário)
        const unlockResult = await userRepository.unlockUserReward(userId, trackId, rewardAmount);
        console.log(`[TRACK SERVICE] Reward of R$${rewardAmount.toFixed(2)} unlocked for user ${userId} for track ${trackId}.`);

        return unlockResult;
    } catch (error) {
        console.error(`[TRACK SERVICE] Error starting track ${trackId} and unlocking reward for user ${userId}:`, error.message);
        throw error;
    }
}

// Função para completar uma trilha (se necessário)
async function completeTrack(userId, trackId) {
    try {
        const result = await trackRepository.completeUserTrack(userId, trackId);
        return result; 
    } catch (error) {
        console.error(`[TRACK SERVICE] Error completing track ${trackId} for user ${userId}:`, error.message);
        throw error;
    }
}



module.exports = {
    getTracks,
    startTrackAndUnlockReward,
    completeTrack,
   
};