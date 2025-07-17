// src/routes/track.routes.js
const express = require('express');
const trackController = require('../controllers/track.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const router = express.Router();

// NOVA ROTA: Obter atividades recentes globais (pública)
// Esta rota é definida ANTES do middleware de autenticação para que seja acessível sem token.
router.get('/tracks/global-activities', trackController.getGlobalRecentActivitiesController);

// Aplica o middleware de autenticação para as rotas abaixo
router.use(authenticateToken);

// Rotas protegidas por autenticação
router.get('/user/tracks', trackController.getTracksController);
router.post('/user/tracks', trackController.startTrackAndUnlockRewardController);
router.post('/user/tracks/complete', trackController.completeTrackAndUnlockRewardController);
router.delete('/user/tracks/:trackId', trackController.removeTrackController);


module.exports = router;
