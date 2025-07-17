const userRepository = require('../repositories/user.repository');

async function getUsersCount() {
    return await userRepository.getTotalUsersCount();
}

async function getGithubUsersCount() {
    return await userRepository.getGithubUsersCount();
}

async function getStudentsWithActiveBenefitsCount() {
    return await userRepository.getStudentsWithActiveBenefitsCount();
}

async function getPendingStudentsCount() {
    return await userRepository.getPendingStudentsCount();
}

async function getAllStudents() {
    return await userRepository.getAllStudents();
}

async function saveOnboardingData(userId, data) {
    await userRepository.saveOnboardingData(userId, data);
}

async function getStudentDashboardData(userId) {
    return await userRepository.getStudentById(userId);
}

async function updateBenefitStatus(userId, productId, isRedeemed, monthlyValueUSD, monthsRemaining) {
    await userRepository.updateStudentBenefitStatus(
        userId, 
        productId, 
        isRedeemed, 
        monthlyValueUSD, 
        monthsRemaining
    );
}

async function unlockReward(userId, trackId, amount) {
    return await userRepository.unlockUserReward(userId, trackId, amount);
}

async function updateUserConfettiStatus(userId, status) {
    await userRepository.updateHasSeenConfettiStatus(userId, status);
}

// NOVA FUNÇÃO: Obter ranking de usuários
async function getUsersRanking() {
    // Busca todos os estudantes
    const allStudents = await userRepository.getAllStudents();

    // Filtra e prepara os dados para o ranking
    const ranking = allStudents
        .map(student => ({
            id: student.id,
            name: student.name || student.github_login, // Usa o nome ou login do GitHub
            avatar_url: student.avatar_url,
            points: student.points || 0, // Garante que pontos seja um número
            level: student.level || 1,   // Garante que level seja um número
            totalEconomy: parseFloat(student.totalEconomy || 0), // Converte para número
        }))
        // Ordena pelo totalEconomy (maior para o menor) e depois por pontos (maior para o menor)
        .sort((a, b) => {
            if (b.totalEconomy !== a.totalEconomy) {
                return b.totalEconomy - a.totalEconomy;
            }
            return b.points - a.points;
        });

    return ranking;
}


module.exports = {
    getUsersCount,
    getGithubUsersCount,
    getStudentsWithActiveBenefitsCount,
    getPendingStudentsCount,
    getAllStudents,
    saveOnboardingData,
    getStudentDashboardData,
    updateBenefitStatus,
    unlockReward,
    updateUserConfettiStatus,
    getUsersRanking, // Exportar a nova função
};
