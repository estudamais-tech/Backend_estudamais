const { getPool } = require('../config/db.config');

async function getStats() { // Nome da função consistente com o service
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    try {
        // Busca o total_unlocked_value da tabela global_stats
        const [globalStatsRows] = await pool.execute('SELECT total_unlocked_value FROM global_stats WHERE id = 1;');
        let total_unlocked_value = '0.00';
        if (globalStatsRows.length > 0) {
            total_unlocked_value = globalStatsRows[0].total_unlocked_value;
        } else {
            // Se a linha global_stats não existir, insere ela com valores padrão
            await pool.execute('INSERT IGNORE INTO global_stats (id, total_usuarios, total_unlocked_value) VALUES (1, 0, 0.00);');
        }

        // BUSCA A CONTAGEM REAL DE USUÁRIOS DA TABELA 'usuarios' (fonte de verdade)
        const [userCountRows] = await pool.execute('SELECT COUNT(*) AS count FROM usuarios;');
        const total_usuarios = userCountRows[0].count;

        return { total_usuarios, total_unlocked_value };
    } catch (error) {
        console.error('[STATS REPOSITORY] Erro ao buscar estatísticas globais:', error.message);
        throw error;
    }
}

async function incrementUserCount() { // Esta função ainda pode ser usada para outros propósitos ou removida se a contagem for sempre dinâmica
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    try {
        // Incrementa 'total_usuarios' na tabela 'global_stats'
        await pool.execute(
            `INSERT INTO global_stats (id, total_usuarios) VALUES (1, 1)
             ON DUPLICATE KEY UPDATE total_usuarios = total_usuarios + 1, updated_at = CURRENT_TIMESTAMP;`
        );
    } catch (error) {
        console.error('[STATS REPOSITORY] Erro ao incrementar contador de usuários:', error.message);
        throw error;
    }
}

async function incrementStats({ users_to_add = 0, value_to_add = 0 }) {
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    try {
        // Esta função é mais genérica para incrementar ambos, usuários e valor
        await pool.execute(
            `INSERT INTO global_stats (id, total_usuarios, total_unlocked_value) VALUES (1, ?, ?)
             ON DUPLICATE KEY UPDATE
             total_usuarios = total_usuarios + ?,
             total_unlocked_value = total_unlocked_value + ?,
             updated_at = CURRENT_TIMESTAMP;`,
            [users_to_add, value_to_add, users_to_add, value_to_add]
        );
    } catch (error) {
        console.error('[STATS REPOSITORY] Erro ao incrementar estatísticas:', error.message);
        throw error;
    }
}

module.exports = {
    getStats,
    incrementUserCount,
    incrementStats,
};
