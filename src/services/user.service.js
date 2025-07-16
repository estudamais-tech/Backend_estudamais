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
};
