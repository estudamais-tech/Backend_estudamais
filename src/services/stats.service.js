const statsRepository = require('../repositories/stats.repository');
const userRepository = require('../repositories/user.repository');

async function getStats() {
    const globalStats = await statsRepository.getGlobalStats();
    
    return {
        total_usuarios: globalStats.total_usuarios,
        total_beneficios_ativos: globalStats.total_beneficios_ativos,
        total_unlocked_value: globalStats.total_unlocked_value,
        total_economia_geral: globalStats.total_economia_geral,
        total_trilhas_iniciadas: globalStats.total_trilhas_iniciadas,
        total_trilhas_concluidas: globalStats.total_trilhas_concluidas,
        updated_at: globalStats.updated_at
    };
}

module.exports = {
    getStats,
    incrementUnlockedValue: statsRepository.incrementUnlockedValue,
    incrementCompletedTracksCount: statsRepository.incrementCompletedTracksCount // Expor a nova função
};
