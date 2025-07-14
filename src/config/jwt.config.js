// src/config/jwt.config.js
require('dotenv').config(); // Garante que as variáveis de ambiente são carregadas para este arquivo também

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('[JWT_CONFIG] Erro: JWT_SECRET não está definido em process.env. O token JWT não poderá ser assinado/verificado corretamente.');
    // Considere adicionar um throw new Error() aqui para falhar o startup se o segredo for crítico
}

module.exports = {
    JWT_SECRET
};