const authService = require('../services/auth.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config');
const userRepository = require('../repositories/user.repository');

async function exchangeGitHubCode(req, res) {
    const { code } = req.body;

    try {
        const { user, token } = await authService.authenticateWithGitHub(code);

        console.log('[BACKEND] PASSO 4: Enviando JWT como cookie HttpOnly...');
        res.cookie('app_auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 3600000 // 1 hora
        });
        console.log(`[BACKEND] Cookie HttpOnly definido com SameSite: Lax e Secure: ${process.env.NODE_ENV === 'production'}.`);

        // ADICIONADO: Determinar se o onboarding está completo
        // O campo 'course' é um bom indicador de que o onboarding foi preenchido.
        const onboardingComplete = user.course !== null && user.course !== '';

        return res.json({
            message: 'Autenticação bem-sucedida',
            user: {
                id: user.id, // CRÍTICO: Garante que o ID do usuário é retornado
                name: user.name || user.github_login, // Use github_login se name for null
                avatar_url: user.avatar_url,
                github_login: user.github_login,
                onboarding_complete: onboardingComplete // ADICIONADO: Flag de onboarding
            }
        });

    } catch (error) {
        console.error('[BACKEND] Erro no controller de autenticação GitHub:', error.message);
        return res.status(error.statusCode || 500).json({ message: error.message || 'Erro interno do servidor durante a autenticação.' });
    }
}

function logout(req, res) {
    console.log('[BACKEND] Recebida requisição de logout. Limpando cookie app_auth_token.');
    res.clearCookie('app_auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    });
    return res.status(200).json({ message: 'Logout bem-sucedido.' });
}

async function checkAuth(req, res) { // Tornar a função assíncrona
    const token = req.cookies.app_auth_token;

    if (!token) {
        console.log('[BACKEND] /api/check-auth: Token não encontrado no cookie.');
        return res.status(401).json({ isAuthenticated: false, message: 'Não autenticado: Token não encontrado.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[BACKEND] /api/check-auth: Token JWT válido. Usuário:', decoded.login, 'ID:', decoded.id); // Log do ID
        
        // ADICIONADO: Buscar o usuário do banco de dados para obter o status de onboarding mais recente
        const userFromDb = await userRepository.getStudentById(decoded.id);

        let onboardingComplete = false;
        if (userFromDb) {
            // Verifica se o campo 'course' existe e não é nulo/vazio
            onboardingComplete = userFromDb.course !== null && userFromDb.course !== '';
        }

        res.json({
            isAuthenticated: true,
            user: {
                id: decoded.id, 
                login: decoded.login,
                name: decoded.name,
                avatar_url: decoded.avatar_url,
                github_login: decoded.login,
                onboarding_complete: onboardingComplete 
            }
        });
    } catch (error) {
        console.error('[BACKEND] /api/check-auth: Erro ao verificar token JWT:', error.message);
        return res.status(401).json({ isAuthenticated: false, message: 'Não autenticado: Token inválido ou expirado.' });
    }
}

module.exports = {
    exchangeGitHubCode,
    logout,
    checkAuth,
};
// correto