const trackRepository = require('../repositories/track.repository');
const userRepository = require('../repositories/user.repository'); // Assumindo que este arquivo existe e tem unlockUserReward
const { getPool } = require('../config/db.config');
const statsService = require('./stats.service'); 

async function getTracks(userId) {
    try {
        const tracks = await trackRepository.getTracksForUser(userId);
        return tracks;
    } catch (error) {
        console.error('[TRACK SERVICE] Error getting tracks:', error.message);
        throw error;
    }
}

// Esta função é chamada quando o usuário "adiciona" ou "inicia" uma trilha e recebe a recompensa.
async function startTrackAndUnlockReward(userId, trackId, rewardAmount) {
    try {
        // Marca a trilha como 'in-progress' ou a atualiza se já existir
        await trackRepository.addUserTrack(userId, trackId);
        console.log(`[TRACK SERVICE] User ${userId} added/started track ${trackId}.`);
      await statsService.incrementUnlockedValue(rewardAmount);
        // Desbloqueia a recompensa se um valor for fornecido
        if (rewardAmount !== undefined && rewardAmount !== null) {
            // userRepository.unlockUserReward deve lidar com a lógica de somar a recompensa ao totalEconomy
            const unlockResult = await userRepository.unlockUserReward(userId, trackId, rewardAmount);
            console.log(`[TRACK SERVICE] Reward of R$${rewardAmount.toFixed(2)} recorded for user ${userId} for starting track ${trackId}.`);
            return { message: 'Track added and reward unlocked successfully!', unlockResult };
        } else {
            return { message: 'Track added successfully (no reward specified or applicable).' };
        }
    } catch (error) {
        console.error(`[TRACK SERVICE] Error starting track ${trackId} for user ${userId}:`, error.message);
        throw error;
    }
}

// Esta função é chamada quando o usuário CLICA em "concluir" uma trilha.
// A recompensa já deve ter sido dada em 'startTrackAndUnlockReward'.
async function completeTrackAndUnlockReward(userId, trackId) {
    try {
        const trackCompleted = await trackRepository.completeUserTrack(userId, trackId);
        if (!trackCompleted) {
            throw new Error('Track not found, not in progress, or already completed for this user.');
        }
        console.log(`[TRACK SERVICE] Track ${trackId} completed for user ${userId}.`);
        return { message: 'Track completed successfully!' };
    } catch (error) {
        console.error(`[TRACK SERVICE] Error completing track ${trackId} for user ${userId}:`, error.message);
        throw error;
    }
}

// Esta função é para remover o progresso de uma trilha do usuário.
async function removeTrack(userId, trackId) {
    let transaction; // Para garantir atomicidade
    try {
        const pool = getPool(); // <--- ATUALIZE AQUI: Use o getPool diretamente do db.config
        transaction = await pool.getConnection(); // Inicia uma transação
        await transaction.beginTransaction();

        // 1. Obter o valor da recompensa da trilha antes de remover
        // Note: É importante pegar a recompensa da tabela 'tracks' e não de 'user_tracks'
        // pois 'user_tracks' não armazena o valor da recompensa.
        const [trackInfo] = await transaction.execute(
            `SELECT reward_value FROM tracks WHERE id = ?;`,
            [trackId]
        );

        if (trackInfo.length === 0) {
            // Se a trilha principal (do catálogo) não for encontrada, algo está errado
            // ou a trilha foi excluída do catálogo mas o user_track ainda existe.
            // Decida como lidar com isso. Por enquanto, lançamos um erro.
            throw new Error('Track not found in master list (tracks table). Cannot determine reward value.');
        }

        const rewardToDeduct = parseFloat(trackInfo[0].reward_value);

        // 2. Remover o progresso da trilha do usuário
        const [deleteResult] = await transaction.execute(
            `DELETE FROM user_tracks WHERE user_id = ? AND track_id = ?;`,
            [userId, trackId]
        );

        if (deleteResult.affectedRows === 0) {
            // Se nenhum registro foi afetado, significa que o user_track não existia
            // ou já foi removido, ou não estava associado ao usuário.
            // Poderíamos apenas logar e continuar, mas o throw garante que a dedução
            // não aconteça se não havia nada para remover.
            throw new Error('Track progress not found or not associated with this user, no action needed for removal.');
        }

        // 3. Deduzir o valor da economia total do usuário
        await userRepository.deductUserEconomy(userId, rewardToDeduct, transaction); // Passa a transação

        await transaction.commit(); // Confirma a transação

        console.log(`[TRACK SERVICE] User ${userId} removed track ${trackId}'s progress. Deducted R$${rewardToDeduct.toFixed(2)} from total economy.`);
        return { message: 'Track progress removed and economy adjusted successfully!' };

    } catch (error) {
        if (transaction) {
            await transaction.rollback(); // Reverte a transação em caso de erro
        }
        console.error(`[TRACK SERVICE] Error removing track ${trackId} for user ${userId}:`, error.message);
        throw error;
    } finally {
        if (transaction) {
            transaction.release(); // Libera a conexão do pool
        }
    }
}


module.exports = {
    getTracks,
    startTrackAndUnlockReward,
    completeTrackAndUnlockReward,
    removeTrack,
};
// coo