const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const trackRoutes = require('./track.routes'); 

const router = express.Router();

// Aplica o prefixo '/api' para *todos* os grupos de rotas importados
router.use('/api', authRoutes);
router.use('/api', userRoutes);
router.use('/api', trackRoutes); 

module.exports = router;
