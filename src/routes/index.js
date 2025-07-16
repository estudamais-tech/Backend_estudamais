// src/routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const trackRoutes = require('./track.routes');
const statsRoutes = require('./stats.routes');

const router = express.Router();

router.use('/api', authRoutes);
router.use('/api', userRoutes);
router.use('/api', trackRoutes);
router.use('/api', statsRoutes);

module.exports = router;