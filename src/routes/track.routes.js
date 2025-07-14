const express = require('express');
const trackController = require('../controllers/track.controller');
const authenticateToken = require('../middlewares/auth.middleware'); // Assumindo que este middleware existe
const router = express.Router();

router.use(authenticateToken); // Aplica o middleware de autenticação a todas as rotas abaixo

// Rota para obter todas as trilhas para o usuário logado (GET /api/user/tracks)
router.get('/user/tracks', trackController.getTracks);

// Rota para iniciar uma trilha e desbloquear a recompensa (POST /api/user/tracks)
// Note que esta rota agora lida com o "adicionar" e o "iniciar" e desbloqueio da recompensa
router.post('/user/tracks', trackController.startTrackAndUnlockReward);

// Rota para remover o progresso de uma trilha de um usuário (DELETE /api/user/tracks/:trackId)
router.delete('/user/tracks/:trackId', trackController.removeTrack);

// Rota para completar uma trilha (POST /api/user/tracks/complete)
// URL CORRIGIDA: AGORA É /user/tracks/complete (plural)
router.post('/user/tracks/complete', trackController.completeTrackAndUnlockReward);

module.exports = router;