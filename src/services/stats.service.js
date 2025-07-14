// src/services/stats.service.js

const statsRepository = require('../repositories/stats.repository');

async function getStats() {
    return await statsRepository.getGlobalStats();
}

async function incrementUserCount() {
    console.log('[STATS SERVICE] Incrementando contador global de usuários.');
    await statsRepository.incrementStats({ users_to_add: 1 });
}

async function incrementUnlockedValue(amount) {
    if (amount > 0) {
        console.log(`[STATS SERVICE] Incrementando valor global desbloqueado em: ${amount}`);
        await statsRepository.incrementStats({ value_to_add: amount });
    }
}

module.exports = {
    getStats,
    incrementUserCount,
    incrementUnlockedValue,
};