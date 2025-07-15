// src/controllers/auth.controller.js
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

        // AQUI, 'user' já vem do DB via authService.authenticateWithGitHub
        // E o `userRepository.upsertUser` já retorna o usuário do DB.
        // Então, 'user.onboarding_complete' já deve vir direto do banco.
        const onboardingComplete = user.onboarding_complete; // Usar a flag direta do DB

        return res.json({
            message: 'Autenticação bem-sucedida',
            user: {
                id: user.id,
                name: user.name || user.github_login,
                avatar_url: user.avatar_url,
                github_login: user.github_login,
                onboarding_complete: onboardingComplete,
                // Incluir outros dados de onboarding que podem ser úteis no frontend após o login
                course: user.course,
                currentSemester: user.currentSemester,
                totalSemesters: user.totalSemesters,
                areasOfInterest: user.areasOfInterest // Já será um array/objeto devido ao parse no repositório
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

async function checkAuth(req, res) {
    const token = req.cookies.app_auth_token;

    if (!token) {
        console.log('[BACKEND] /api/check-auth: Token não encontrado no cookie.');
        return res.status(401).json({ isAuthenticated: false, message: 'Não autenticado: Token não encontrado.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[BACKEND] /api/check-auth: Token JWT válido. Usuário:', decoded.login, 'ID:', decoded.id);

        const userFromDb = await userRepository.getStudentById(decoded.id);

        let userDataToSend = {
            isAuthenticated: false, // Default para o caso de não encontrar o usuário no DB
            user: null
        };

        if (userFromDb) {
            // Se o usuário foi encontrado no banco de dados, use os dados completos dele
            userDataToSend = {
                isAuthenticated: true,
                user: {
                    id: userFromDb.id,
                    login: userFromDb.github_login,
                    name: userFromDb.name || userFromDb.github_login,
                    avatar_url: userFromDb.avatar_url,
                    github_login: userFromDb.github_login,
                    onboarding_complete: userFromDb.onboarding_complete, // Pegue direto do DB
                    course: userFromDb.course,
                    currentSemester: userFromDb.currentSemester,
                    totalSemesters: userFromDb.totalSemesters,
                    areasOfInterest: userFromDb.areasOfInterest // Já virá como array/objeto
                }
            };
        } else {
            // Se o usuário não for encontrado no DB (caso incomum, mas possível),
            // retorne o que for possível do token e indique que o onboarding não está completo.
            // Ou, talvez, considere isso um erro crítico de autenticação.
            // Por simplicidade, vamos retornar dados básicos e onboardingComplete como false.
             userDataToSend = {
                isAuthenticated: true, // Ainda está autenticado pelo token
                user: {
                    id: decoded.id,
                    login: decoded.login,
                    name: decoded.name || decoded.login,
                    avatar_url: decoded.avatar_url,
                    github_login: decoded.login,
                    onboarding_complete: false // Não há dados no DB, então o onboarding não está completo
                }
            };
        }

        res.json(userDataToSend);

    } catch (error) {
        console.error('[BACKEND] /api/check-auth: Erro ao verificar token JWT:', error.message);
        // Em caso de erro (token inválido/expirado ou erro de DB), retorne não autenticado
        return res.status(401).json({ isAuthenticated: false, message: 'Não autenticado: Token inválido ou expirado.' });
    }
}

module.exports = {
    exchangeGitHubCode,
    logout,
    checkAuth,
};