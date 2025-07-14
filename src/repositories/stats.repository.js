// src/repositories/stats.repository.js

const { getPool } = require('../config/db.config');

/**
 * Obtém as estatísticas globais atuais.
 */
async function getGlobalStats() {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT total_users, total_unlocked_value FROM global_stats WHERE id = 1;');
    return rows[0];
}

/**
 * Incrementa os contadores de estatísticas de forma atômica.
 * @param {object} params
 * @param {number} params.users_to_add - O número de usuários a adicionar (geralmente 1 ou 0).
 * @param {number} params.value_to_add - O valor a adicionar à economia total (pode ser 0).
 */
async function incrementStats({ users_to_add = 0, value_to_add = 0 }) {
    if (users_to_add === 0 && value_to_add === 0) {
        return; // Não faz nada se não houver o que incrementar
    }
    const pool = getPool();
    await pool.execute(
        `UPDATE global_stats 
         SET 
            total_users = total_users + ?,
            total_unlocked_value = total_unlocked_value + ?
         WHERE id = 1;`,
        [users_to_add, value_to_add]
    );
}

module.exports = {
    getGlobalStats,
    incrementStats,
};