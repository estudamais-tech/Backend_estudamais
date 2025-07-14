// src/routes/index.js

const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const trackRoutes = require('./track.routes');
const statsRoutes = require('./stats.routes'); // <-- IMPORTE A NOVA ROTA

const router = express.Router();

// Aplica o prefixo '/api' para *todos* os grupos de rotas importados
router.use('/api', authRoutes);
router.use('/api', userRoutes);
router.use('/api', trackRoutes);
router.use('/api', statsRoutes); // <-- USE A NOVA ROTA

module.exports = router;
// correto