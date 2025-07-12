const express = require('express');
const trackController = require('../controllers/track.controller');
const authenticateToken = require('../middlewares/auth.middleware'); 
const router = express.Router();

// Middleware para proteger as rotas (garante que req.user.id esteja disponível)
// AJUSTE: Usa a função authenticateToken diretamente como middleware
router.use(authenticateToken); 

// Rota para obter todas as trilhas para o usuário logado

router.get('/user/tracks', trackController.getTracks);


router.post('/user/track/start', trackController.startTrackAndUnlockReward);


router.post('/user/track/complete', trackController.completeTrack);

module.exports = router;