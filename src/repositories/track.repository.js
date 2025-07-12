const { getPool } = require('../config/db.config');
async function getTracksForUser(userId) {
    const pool = getPool();
    if (!pool) {
        console.error('[TRACK REPOSITORY] Database pool is not available during getTracksForUser.');
        throw new Error('Database connection not established.');
    }

    try {
        // Seleciona todas as trilhas e faz um LEFT JOIN com user_tracks para obter o status do usuário
        const [rows] = await pool.execute(`
            SELECT
                t.id,
                t.title,
                t.description,
                t.icon_name AS icon,
                t.path,
                t.reward_value AS rewardValue,
                COALESCE(ut.status, 'available') AS status, -- Se não houver entrada em user_tracks, é 'available'
                ut.started_at AS startedAt,
                ut.completed_at AS completedAt
            FROM
                tracks t
            LEFT JOIN
                user_tracks ut ON t.id = ut.track_id AND ut.user_id = ?
            ORDER BY t.created_at;
        `, [userId]);

        console.log(`[TRACK REPOSITORY] Fetched ${rows.length} tracks for user ${userId}.`);
        return rows;
    } catch (error) {
        console.error(`[TRACK REPOSITORY] Error fetching tracks for user ${userId}:`, error.message);
        throw error;
    }
}

// Função para iniciar uma trilha para um usuário
async function startUserTrack(userId, trackId) {
    const pool = getPool();
    if (!pool) {
        console.error('[TRACK REPOSITORY] Database pool is not available during startUserTrack.');
        throw new Error('Database connection not established.');
    }

    try {
        // Tenta inserir ou atualizar o status da trilha para 'in-progress'
        const [result] = await pool.execute(
            `INSERT INTO user_tracks (user_id, track_id, status, started_at)
             VALUES (?, ?, 'in-progress', CURRENT_TIMESTAMP)
             ON DUPLICATE KEY UPDATE
             status = 'in-progress', started_at = IFNULL(started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP;`,
            [userId, trackId]
        );
        console.log(`[TRACK REPOSITORY] User ${userId} started track ${trackId}. Result:`, result);
        return result;
    } catch (error) {
        console.error(`[TRACK REPOSITORY] Error starting track ${trackId} for user ${userId}:`, error.message);
        throw error;
    }
}

// Função para marcar uma trilha como concluída para um usuário
async function completeUserTrack(userId, trackId) {
    const pool = getPool();
    if (!pool) {
        console.error('[TRACK REPOSITORY] Database pool is not available during completeUserTrack.');
        throw new Error('Database connection not established.');
    }

    try {
        const [result] = await pool.execute(
            `UPDATE user_tracks
             SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ? AND track_id = ?;`,
            [userId, trackId]
        );
        console.log(`[TRACK REPOSITORY] User ${userId} completed track ${trackId}. Result:`, result);
        return result.affectedRows > 0; // Retorna true se a linha foi atualizada (trilha marcada como completa)
    } catch (error) {
        console.error(`[TRACK REPOSITORY] Error completing track ${trackId} for user ${userId}:`, error.message);
        throw error;
    }
}

// Função para inserir uma nova trilha (para uso administrativo/seed)
async function insertTrack(track) {
    const pool = getPool();
    if (!pool) {
        console.error('[TRACK REPOSITORY] Database pool is not available during insertTrack.');
        throw new Error('Database connection not established.');
    }
    const { id, title, description, icon_name, path, reward_value } = track;
    try {
        const [result] = await pool.execute(
            `INSERT INTO tracks (id, title, description, icon_name, path, reward_value)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [id, title, description, icon_name, path, reward_value]
        );
        console.log(`[TRACK REPOSITORY] Inserted new track: ${title}. Result:`, result);
        return result;
    } catch (error) {
        console.error(`[TRACK REPOSITORY] Error inserting track ${title}:`, error.message);
        throw error;
    }
}


module.exports = {
    getTracksForUser,
    startUserTrack,
    completeUserTrack,
    insertTrack, 
};