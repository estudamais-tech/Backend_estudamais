// src/services/user.service.js
const userRepository = require('../repositories/user.repository');


async function processGitHubUser(githubUser) {
    const result = await userRepository.upsertUser(githubUser);
    return result;
}

async function getUsersCount() {
    const count = await userRepository.getTotalUsersCount();
    return count;
}

// Serviço para contagem de usuários com GitHub
async function getGithubUsersCount() {
    const count = await userRepository.getGithubUsersCount();
    return count;
}

// Serviço para contagem de estudantes com benefícios ativos
async function getStudentsWithActiveBenefitsCount() {
    const count = await userRepository.getStudentsWithActiveBenefitsCount();
    return count;
}

// Serviço para contagem de estudantes com status pendente no GitHub
async function getPendingStudentsCount() {
    const count = await userRepository.getPendingStudentsCount();
    return count;
}

// Serviço para obter a lista completa de estudantes
async function getAllStudents() {
    const students = await userRepository.getAllStudents();
    return students;
}

// NOVO: Serviço para salvar os dados de onboarding do estudante
async function saveOnboardingData(userId, data) {
    // AJUSTE CRÍTICO AQUI: Chamar saveOnboardingData do repositório
    await userRepository.saveOnboardingData(userId, data);
}

// NOVO: Serviço para obter os dados da dashboard do estudante
async function getStudentDashboardData(userId) {
    const student = await userRepository.getStudentById(userId);
    return student;
}

// NOVO: Serviço para atualizar o status de um benefício e a economia total
async function updateBenefitStatus(userId, productId, isRedeemed, monthlyValueUSD, monthsRemaining) {
    await userRepository.updateStudentBenefitStatus(userId, productId, isRedeemed, monthlyValueUSD, monthsRemaining);
}

// NOVO: Serviço para desbloquear uma recompensa
async function unlockReward(userId, trackId, amount) {
    try {
        const result = await userRepository.unlockUserReward(userId, trackId, amount);
        return result;
    } catch (error) {
        console.error(`[USER SERVICE] Error unlocking reward for user ${userId} on track ${trackId}:`, error.message);
        throw error;
    }
}


module.exports = {
    processGitHubUser,
    getUsersCount,
    getGithubUsersCount,
    getStudentsWithActiveBenefitsCount,
    getPendingStudentsCount,
    getAllStudents,
    saveOnboardingData, // EXPORTANDO O SERVIÇO COM O NOME CORRETO
    getStudentDashboardData,
    updateBenefitStatus,
    unlockReward, 
};