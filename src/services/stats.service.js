// src/services/stats.service.js
const statsRepository = require('../repositories/stats.repository'); // <-- CORRIGIDO: Importa stats.repository

async function getStats() {
    return await statsRepository.getStats(); // Chama getStats do statsRepository
}

async function incrementUserCount() { // <-- FUNÇÃO REINTRODUZIDA
    try {
        console.log('[STATS SERVICE] Incrementando contador global de usuários.');
        await statsRepository.incrementUserCount(); // <-- Chama o método no statsRepository
    } catch (error) {
        console.error('[STATS SERVICE] Erro ao incrementar contador de usuários:', error.message);
        // Não re-lançar para não travar o fluxo de upsert do usuário
    }
}

async function incrementUnlockedValue(amount) {
    if (amount > 0) {
        console.log(`[STATS SERVICE] Incrementando valor global desbloqueado em: ${amount}`);
        await statsRepository.incrementStats({ value_to_add: amount });
    }
}

module.exports = {
    getStats,
    incrementUserCount, // <-- EXPORTADO NOVAMENTE
    incrementUnlockedValue,
};