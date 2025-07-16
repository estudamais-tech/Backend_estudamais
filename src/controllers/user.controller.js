const userService = require('../services/user.service');

async function getUsersCountController(req, res) {
    try {
        const totalUsers = await userService.getUsersCount();
        res.json({ total_users: totalUsers });
    } catch (error) {
        console.error('Error getting user count:', error.message);
        res.status(500).json({ message: 'Error getting user count' });
    }
}

async function getGithubUsersCountController(req, res) {
    try {
        const githubUsers = await userService.getGithubUsersCount();
        res.json({ github_users_count: githubUsers });
    } catch (error) {
        console.error('Error getting GitHub users:', error.message);
        res.status(500).json({ message: 'Error getting GitHub users' });
    }
}

async function getStudentsWithActiveBenefitsCountController(req, res) {
    try {
        const activeBenefitsCount = await userService.getStudentsWithActiveBenefitsCount();
        res.json({ active_benefits_count: activeBenefitsCount });
    } catch (error) {
        console.error('Error getting active benefits:', error.message);
        res.status(500).json({ message: 'Error getting active benefits' });
    }
}

async function getPendingStudentsCountController(req, res) {
    try {
        const pendingStudentsCount = await userService.getPendingStudentsCount();
        res.json({ pending_students_count: pendingStudentsCount });
    } catch (error) {
        console.error('Error getting pending students:', error.message);
        res.status(500).json({ message: 'Error getting pending students' });
    }
}

async function getAllStudentsController(req, res) {
    try {
        const students = await userService.getAllStudents();
        res.json({ students });
    } catch (error) {
        console.error('Error getting students:', error.message);
        res.status(500).json({ message: 'Error getting students' });
    }
}

async function saveOnboardingDataController(req, res) {
    try {
        const userId = req.user.id; 
        const { course, currentSemester, totalSemesters, areasOfInterest } = req.body;

        if (!userId || !course || !currentSemester || !totalSemesters || !areasOfInterest) {
            return res.status(400).json({ message: 'Incomplete data' });
        }

        await userService.saveOnboardingData(userId, {
            course,
            currentSemester,
            totalSemesters,
            areasOfInterest,
        });

        res.status(200).json({ message: 'Onboarding data saved' });
    } catch (error) {
        console.error('Error saving onboarding:', error.message);
        res.status(500).json({ message: 'Error saving onboarding' });
    }
}

async function getStudentDashboardDataController(req, res) {
    try {
        const userId = req.user.id; 
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const studentData = await userService.getStudentDashboardData(userId);
        
        if (!studentData) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json(studentData);
    } catch (error) {
        console.error('Error getting dashboard data:', error.message);
        res.status(500).json({ message: 'Error getting dashboard' });
    }
}

async function updateBenefitStatusController(req, res) {
    try {
        const userId = req.user.id; 
        const { productId } = req.params; 
        const { isRedeemed, monthlyValueUSD, monthsRemaining } = req.body; 

        await userService.updateBenefitStatus(userId, productId, isRedeemed, monthlyValueUSD, monthsRemaining);

        res.status(200).json({ message: 'Benefit updated' });
    } catch (error) {
        console.error('Error updating benefit:', error.message);
        res.status(500).json({ message: 'Error updating benefit' });
    }
}

async function markConfettiAsSeenController(req, res) {
    try {
        const userId = req.user.id;
        const { has_seen_confetti } = req.body;

        if (typeof has_seen_confetti !== 'boolean') {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        await userService.updateUserConfettiStatus(userId, has_seen_confetti);
        res.status(200).json({ message: 'Confetti status updated successfully' });
    } catch (error) {
        console.error('Error marking confetti as seen:', error.message);
        res.status(500).json({ message: 'Error marking confetti as seen' });
    }
}

module.exports = {
    getUsersCountController,
    getGithubUsersCountController,
    getStudentsWithActiveBenefitsCountController,
    getPendingStudentsCountController,
    getAllStudentsController,
    saveOnboardingDataController,
    getStudentDashboardDataController,
    updateBenefitStatusController,
    markConfettiAsSeenController,
};
