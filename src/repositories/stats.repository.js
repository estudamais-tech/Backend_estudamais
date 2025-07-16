// src/repositories/stats.repository.js
const { getPool } = require('../config/db.config');

async function getGlobalStats() {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        await pool.execute('INSERT IGNORE INTO global_stats (id) VALUES (1)');

        const [stats] = await pool.execute(`
            SELECT 
                g.total_unlocked_value,
                g.updated_at,
                (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
                (SELECT COUNT(*) FROM usuarios WHERE benefits_activated > 0) AS total_beneficios_ativos,
                (SELECT IFNULL(SUM(totalEconomy), 0) FROM usuarios) AS total_economia_geral,
                (SELECT COUNT(*) FROM user_tracks WHERE status = 'in-progress') AS total_trilhas_iniciadas,
                (SELECT COUNT(*) FROM user_tracks WHERE status = 'completed') AS total_trilhas_concluidas
            FROM global_stats g
            WHERE g.id = 1
        `);

        return {
            total_usuarios: stats[0].total_usuarios,
            total_unlocked_value: stats[0].total_unlocked_value || '0.00',
            total_beneficios_ativos: stats[0].total_beneficios_ativos,
            total_economia_geral: stats[0].total_economia_geral || '0.00',
            total_trilhas_iniciadas: stats[0].total_trilhas_iniciadas,
            total_trilhas_concluidas: stats[0].total_trilhas_concluidas,
            updated_at: stats[0].updated_at
        };
    } catch (error) {
        console.error('Error getting stats:', error.message);
        throw error;
    }
}

async function incrementUnlockedValue(amount) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            await connection.execute(
                `INSERT INTO global_stats (id, total_unlocked_value) 
                 VALUES (1, ?) 
                 ON DUPLICATE KEY UPDATE 
                 total_unlocked_value = total_unlocked_value + ?,
                 updated_at = CURRENT_TIMESTAMP`,
                [amount, amount]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error incrementing value:', error.message);
        throw error;
    }
}

async function incrementUserCount() {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        await pool.execute(
            `UPDATE global_stats SET 
             total_usuarios = total_usuarios + 1,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = 1`
        );
    } catch (error) {
        console.error('Error incrementing user count:', error.message);
        throw error;
    }
}

module.exports = {
    getGlobalStats,
    incrementUnlockedValue,
    incrementUserCount
};