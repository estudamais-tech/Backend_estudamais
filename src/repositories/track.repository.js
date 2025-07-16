// src/repositories/track.repository.js
const { getPool } = require('../config/db.config');

async function getTracksForUser(userId) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [rows] = await pool.execute(`
            SELECT
                t.id,
                t.title,
                t.description,
                t.icon_name,
                t.path,
                t.reward_value,
                COALESCE(ut.status, 'available') AS status,
                ut.started_at AS startedAt,
                ut.completed_at AS completedAt
            FROM
                tracks t
            LEFT JOIN
                user_tracks ut ON t.id = ut.track_id AND ut.user_id = ?
            ORDER BY t.created_at;
        `, [userId]);

        return rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            icon_name: row.icon_name,
            path: row.path,
            reward_value: parseFloat(row.reward_value),
            status: row.status,
            started_at: row.startedAt,
            completed_at: row.completedAt
        }));
    } catch (error) {
        console.error('Error getting tracks:', error.message);
        throw error;
    }
}

async function startUserTrack(userId, trackId) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [result] = await pool.execute(
            `INSERT INTO user_tracks (user_id, track_id, status, started_at)
             VALUES (?, ?, 'in-progress', CURRENT_TIMESTAMP)
             ON DUPLICATE KEY UPDATE
             status = 'in-progress', started_at = IFNULL(started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP;`,
            [userId, trackId]
        );
        return result;
    } catch (error) {
        console.error('Error starting track:', error.message);
        throw error;
    }
}

async function completeUserTrack(userId, trackId) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [result] = await pool.execute(
            `UPDATE user_tracks
             SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ? AND track_id = ? AND status = 'in-progress';`,
            [userId, trackId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error completing track:', error.message);
        throw error;
    }
}

async function addUserTrack(userId, trackId) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [trackExists] = await pool.execute('SELECT id FROM tracks WHERE id = ?;', [trackId]);
        if (trackExists.length === 0) throw new Error('Track not found');

        const [result] = await pool.execute(
            `INSERT INTO user_tracks (user_id, track_id, status, started_at)
             VALUES (?, ?, 'in-progress', CURRENT_TIMESTAMP)
             ON DUPLICATE KEY UPDATE
             status = 'in-progress', started_at = IFNULL(started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP;`,
            [userId, trackId]
        );
        return result;
    } catch (error) {
        console.error('Error adding track:', error.message);
        throw error;
    }
}

async function removeUserTrack(userId, trackId) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [result] = await pool.execute(
            `DELETE FROM user_tracks WHERE user_id = ? AND track_id = ?;`,
            [userId, trackId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error removing track:', error.message);
        throw error;
    }
}

async function insertTrack(track) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    const { id, title, description, icon_name, path, reward_value } = track;
    try {
        const [result] = await pool.execute(
            `INSERT INTO tracks (id, title, description, icon_name, path, reward_value)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [id, title, description, icon_name, path, reward_value]
        );
        return result;
    } catch (error) {
        console.error('Error inserting track:', error.message);
        throw error;
    }
}

module.exports = {
    getTracksForUser,
    startUserTrack,
    completeUserTrack,
    addUserTrack,
    removeUserTrack,
    insertTrack,
};