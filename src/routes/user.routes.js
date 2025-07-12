// src/routes/user.routes.js
const express = require('express');
const userController = require('../controllers/user.controller');
// AJUSTE: Corrigido o caminho do import para 'middleware' (singular)
const authenticateToken = require('../middlewares/auth.middleware');
const router = express.Router();


// Rotas públicas (não exigem autenticação)
router.get('/users/count', userController.getUsersCountController);
router.get('/users/github-count', userController.getGithubUsersCountController);
router.get('/users/active-benefits-count', userController.getStudentsWithActiveBenefitsCountController);
router.get('/users/pending-github-count', userController.getPendingStudentsCountController);
router.get('/users', userController.getAllStudentsController);

// NOVAS ROTAS PROTEGIDAS (exigem autenticação)
// Aplica o middleware authenticateToken para as rotas abaixo
router.post('/users/onboard', authenticateToken, userController.saveOnboardingDataController);
router.get('/student/dashboard', authenticateToken, userController.getStudentDashboardDataController);
router.put('/student/benefits/:productId', authenticateToken, userController.updateBenefitStatusController);


module.exports = router;
