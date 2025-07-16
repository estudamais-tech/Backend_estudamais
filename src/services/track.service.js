const trackRepository = require('../repositories/track.repository');
const userRepository = require('../repositories/user.repository');
const statsService = require('./stats.service');
const { getPool } = require('../config/db.config');

async function getTracks(userId) {
    return await trackRepository.getTracksForUser(userId);
}

async function startTrackAndUnlockReward(userId, trackId) {
    const connection = await getPool().getConnection();
    try {
        await connection.beginTransaction();

        const [track] = await connection.execute(
            'SELECT reward_value FROM tracks WHERE id = ?',
            [trackId]
        );

        if (!track.length) {
            throw new Error('Track not found');
        }

        const rewardValue = parseFloat(track[0].reward_value);

        await trackRepository.startUserTrack(userId, trackId);
        await userRepository.unlockUserReward(userId, trackId, rewardValue, connection);
        await statsService.incrementUnlockedValue(rewardValue);

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
    const completed = await trackRepository.completeUserTrack(userId, trackId);
    if (!completed) {
        throw new Error('Failed to complete track');
    }
    return { success: true, message: 'Track completed successfully' };
}

async function removeTrack(userId, trackId) {
    const connection = await getPool().getConnection();
    try {
        await connection.beginTransaction();

        const [track] = await connection.execute(
            'SELECT reward_value FROM tracks WHERE id = ?',
            [trackId]
        );

        if (!track.length) {
            throw new Error('Track not found');
        }

        const rewardValue = parseFloat(track[0].reward_value);
        const removed = await trackRepository.removeUserTrack(userId, trackId);

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

module.exports = {
    getTracks,
    startTrackAndUnlockReward,
    completeTrackAndUnlockReward,
    removeTrack,
};