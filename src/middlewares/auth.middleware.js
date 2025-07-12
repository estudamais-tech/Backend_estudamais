// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config'); // Certifique-se de que este caminho está correto

function authenticateToken(req, res, next) {
    // Tenta obter o token do cookie 'app_auth_token'
    const token = req.cookies.app_auth_token;

    if (!token) {
        console.log('[AUTH MIDDLEWARE] Token não encontrado no cookie. Acesso negado.');
        return res.status(401).json({ message: 'Acesso negado: Token de autenticação ausente.' });
    }

    try {
        // Verifica o token JWT usando o segredo
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Adiciona os dados decodificados do usuário ao objeto req
        console.log('[AUTH MIDDLEWARE] Token JWT verificado. req.user populado com ID:', req.user.id);
        next(); // Continua para a próxima função middleware ou rota
    } catch (error) {
        // Captura erros de verificação do token (ex: token inválido, expirado)
        console.error('[AUTH MIDDLEWARE] Erro ao verificar token JWT:', error.message);
        return res.status(403).json({ message: 'Token de autenticação inválido ou expirado.' });
    }
}

// AJUSTE: Exporta diretamente a função authenticateToken.
// Isso significa que nos seus arquivos de rota (ex: user.routes.js, track.routes.js),
// você deve importar esta função assim:
// const authenticateToken = require('../middleware/auth.middleware');
// E usá-la diretamente:
// router.get('/sua-rota', authenticateToken, seuController.suaFuncao);
module.exports = authenticateToken;
