const userService = require('../services/user.service'); // Assumindo que este é o serviço de backend

async function getUsersCountController(req, res) {
    try {
        const totalUsers = await userService.getUsersCount();
        res.json({ total_users: totalUsers });
    } catch (error) {
        console.error('[BACKEND] Erro no controller ao buscar contagem total de usuários:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar contagem total de usuários.' });
    }
}

// Controller para contagem de usuários com GitHub
async function getGithubUsersCountController(req, res) {
    try {
        const githubUsers = await userService.getGithubUsersCount();
        res.json({ github_users_count: githubUsers });
    } catch (error) {
        console.error('[BACKEND] Erro no controller ao buscar contagem de usuários com GitHub:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar contagem de usuários com GitHub.' });
    }
}

// Controller para contagem de estudantes com benefícios ativos
async function getStudentsWithActiveBenefitsCountController(req, res) {
    try {
        const activeBenefitsCount = await userService.getStudentsWithActiveBenefitsCount();
        res.json({ active_benefits_count: activeBenefitsCount });
    } catch (error) {
        console.error('[BACKEND] Erro no controller ao buscar contagem de benefícios ativos:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar contagem de benefícios ativos.' });
    }
}

// Controller para contagem de estudantes com status pendente no GitHub
async function getPendingStudentsCountController(req, res) {
    try {
        const pendingStudentsCount = await userService.getPendingStudentsCount();
        res.json({ pending_students_count: pendingStudentsCount });
    } catch (error) {
        console.error('[BACKEND] Erro no controller ao buscar contagem de pendentes:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar contagem de pendentes.' });
    }
}

// Controller para obter a lista completa de estudantes
async function getAllStudentsController(req, res) {
    try {
        const students = await userService.getAllStudents();
        res.json({ students });
    } catch (error) {
        console.error('[BACKEND] Erro no controller ao buscar lista de estudantes:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar lista de estudantes.' });
    }
}

// NOVO: Controller para salvar os dados de onboarding do estudante
async function saveOnboardingDataController(req, res) {
    try {
        const userId = req.user.id; 
        const { course, currentSemester, totalSemesters, areasOfInterest } = req.body;

        if (!userId || !course || !currentSemester || !totalSemesters || !areasOfInterest) {
            return res.status(400).json({ message: 'Dados de onboarding incompletos.' });
        }

        // AQUI: Chama o serviço com o nome saveOnboardingData
        await userService.saveOnboardingData(userId, {
            course,
            currentSemester,
            totalSemesters,
            areasOfInterest,
        });

        res.status(200).json({ message: 'Dados de onboarding salvos com sucesso.' });
    } catch (error) {
        console.error('[BACKEND] Erro no controller ao salvar dados de onboarding:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor ao salvar dados de onboarding.' });
    }
}

// NOVO: Controller para obter os dados da dashboard do estudante
async function getStudentDashboardDataController(req, res) {
    try {
        const userId = req.user.id; 
        console.log(`[USER CONTROLLER] getStudentDashboardDataController: User ID from req.user.id: ${userId}`); // NOVO LOG
        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        // Assumindo que userService.getStudentDashboardData é uma função do SERVIÇO DE BACKEND
        const studentData = await userService.getStudentDashboardData(userId); 
        
        if (!studentData) {
            console.log(`[USER CONTROLLER] getStudentDashboardDataController: No student data found for ID: ${userId}. Returning 404.`); // NOVO LOG
            return res.status(404).json({ message: 'Dados do estudante não encontrados.' });
        }

        res.status(200).json(studentData);
    } catch (error) {
        console.error('[BACKEND] Erro no controller ao buscar dados da dashboard do estudante:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar dados da dashboard do estudante.' });
    }
}

// NOVO: Controller para atualizar o status de um benefício
async function updateBenefitStatusController(req, res) {
    try {
        const userId = req.user.id; 
        const { productId } = req.params; 
        const { isRedeemed, monthlyValueUSD, monthsRemaining } = req.body; 

        if (!userId || !productId || typeof isRedeemed === 'undefined' || !monthlyValueUSD || !monthsRemaining) {
            return res.status(400).json({ message: 'Dados para atualização do benefício incompletos.' });
        }

        await userService.updateBenefitStatus(userId, productId, isRedeemed, monthlyValueUSD, monthsRemaining);

        res.status(200).json({ message: 'Status do benefício atualizado com sucesso.' });
    } catch (error) {
        console.error('[BACKEND] Erro no controller ao atualizar status do benefício:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar status do benefício.' });
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
};
