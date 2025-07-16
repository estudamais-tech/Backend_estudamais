// src/routes/track.routes.js
const express = require('express');
const trackController = require('../controllers/track.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const router = express.Router();

router.use(authenticateToken);

router.get('/user/tracks', trackController.getTracks);
router.post('/user/tracks', trackController.startTrackAndUnlockReward);
router.delete('/user/tracks/:trackId', trackController.removeTrack);
router.post('/user/tracks/complete', trackController.completeTrackAndUnlockReward);

module.exports = router;