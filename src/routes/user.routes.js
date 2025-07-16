const express = require('express');
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const router = express.Router();

// Public routes
router.get('/users/count', userController.getUsersCountController);
router.get('/users/github-count', userController.getGithubUsersCountController);
router.get('/users/active-benefits-count', userController.getStudentsWithActiveBenefitsCountController);
router.get('/users/pending-github-count', userController.getPendingStudentsCountController);
router.get('/users', userController.getAllStudentsController);

// Protected routes
router.post('/users/onboard', authenticateToken, userController.saveOnboardingDataController);
router.get('/student/dashboard', authenticateToken, userController.getStudentDashboardDataController);
router.put('/student/benefits/:productId', authenticateToken, userController.updateBenefitStatusController);
router.put('/users/:userId/confetti-seen', /* authenticateToken, */ userController.markConfettiAsSeenController);

module.exports = router;