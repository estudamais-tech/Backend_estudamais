const trackRepository = require('../repositories/track.repository');
const userRepository = require('../repositories/user.repository');
const statsService = require('./stats.service');
const { getPool } = require('../config/db.config');

async function getTracks(userId) {
    const tracks = await trackRepository.getTracksForUser(userId);
    const userDetails = await userRepository.getStudentById(userId);

    return {
        user: {
            name: userDetails ? userDetails.name : null,
            avatar_url: userDetails ? userDetails.avatar_url : null,
            github_login: userDetails ? userDetails.github_login : null,
        },
        tracks: tracks,
    };
}

async function startTrackAndUnlockReward(userId, trackId) {
    const connection = await getPool().getConnection();
    try {
        await connection.beginTransaction();

        const [trackRows] = await connection.execute(
            'SELECT reward_value FROM tracks WHERE id = ?',
            [trackId]
        );

        if (!trackRows.length) {
            throw new Error('Track not found');
        }

        const rewardValue = parseFloat(trackRows[0].reward_value);

        await trackRepository.startUserTrack(userId, trackId, connection);
        await userRepository.unlockUserReward(userId, trackId, rewardValue, connection);

        await connection.commit();
        return { success: true, message: 'Track started successfully' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function completeTrackAndUnlockReward(userId, trackId) {
    const connection = await getPool().getConnection();
    try {
        await connection.beginTransaction();

        const [trackRows] = await connection.execute(
            'SELECT reward_value FROM tracks WHERE id = ?',
            [trackId]
        );

        if (!trackRows.length) {
            throw new Error('Track not found');
        }
        const rewardValue = parseFloat(trackRows[0].reward_value);

        const completed = await trackRepository.completeUserTrack(userId, trackId, connection);
        if (!completed) {
            throw new Error('Failed to complete track for user or track already completed');
        }

        await statsService.incrementUnlockedValue(rewardValue);
        await statsService.incrementCompletedTracksCount();

        await connection.commit();
        return { success: true, message: 'Track completed successfully and global stats updated' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function removeTrack(userId, trackId) {
    const connection = await getPool().getConnection();
    try {
        await connection.beginTransaction();

        const [trackRows] = await connection.execute(
            'SELECT reward_value FROM tracks WHERE id = ?',
            [trackId]
        );

        if (!trackRows.length) {
            throw new Error('Track not found');
        }

        const rewardValue = parseFloat(trackRows[0].reward_value);
        const removed = await trackRepository.removeUserTrack(userId, trackId, connection);

        if (!removed) {
            throw new Error('Track not found for user');
        }

        await userRepository.deductUserEconomy(userId, rewardValue, connection);

        await connection.commit();
        return { success: true, message: 'Track removed successfully' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// FUNÇÃO CORRIGIDA: Obter atividades recentes globais
async function getGlobalRecentActivities() {
    try {
        const activities = await trackRepository.getGlobalRecentActivitiesFromDb();
        return activities.map(activity => ({
            id: activity.activity_id,
            // Prioriza o nome, depois o github_login, senão 'Um estudante'
            user: activity.user_name || activity.user_github_login || 'Um estudante',
            avatar_url: activity.user_avatar_url,
            action: activity.activity_status === 'completed' ? `completou a trilha "${activity.track_title}"` : `iniciou a trilha "${activity.track_title}"`,
            value: parseFloat(activity.reward_value),
            timestamp: new Date(activity.updated_at || activity.started_at).getTime(), // Usa updated_at ou started_at
            type: activity.activity_status === 'completed' ? 'track_complete' : 'track_start',
            trackTitle: activity.track_title,
        }));
    } catch (error) {
        console.error('Error in getGlobalRecentActivities service:', error.message);
        throw error;
    }
}


module.exports = {
    getTracks,
    startTrackAndUnlockReward,
    completeTrackAndUnlockReward,
    removeTrack,
    getGlobalRecentActivities, // Exportar a nova função
};
