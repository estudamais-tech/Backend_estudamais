const fetchUtils = require('../utils/fetchUtils');
const userRepository = require('../repositories/user.repository');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config');

async function authenticateWithGitHub(code) {
    console.log('[AUTH SERVICE] Chamando fetchUtils.fetchGitHubAccessToken...');
    const githubTokenData = await fetchUtils.fetchGitHubAccessToken(code);
    const githubAccessToken = githubTokenData.access_token;

    if (!githubAccessToken) {
        console.error('[AUTH SERVICE] Falha ao obter access_token do GitHub (vazio).');
        throw { statusCode: 500, message: 'Falha ao obter access_token do GitHub.' };
    }

    console.log('[AUTH SERVICE] Chamando fetchUtils.fetchGitHubUserData...');
    const githubUserData = await fetchUtils.fetchGitHubUserData(githubAccessToken);
    console.log(`[AUTH SERVICE] Dados do usuário GitHub obtidos para: ${githubUserData.login}`);

    console.log('[AUTH SERVICE] Chamando userRepository.upsertUser...');
    const dbUser = await userRepository.upsertUser(githubUserData);
    console.log('[AUTH SERVICE] Usuário processado no DB. ID do usuário do DB:', dbUser.id); 

    console.log('[AUTH SERVICE] Gerando JWT...');
    // CRÍTICO: Inclua o ID do usuário do banco de dados (dbUser.id) no payload do JWT
    const token = jwt.sign(
        {
            id: dbUser.id, 
            login: dbUser.github_login, 
            name: dbUser.name,
            avatar_url: dbUser.avatar_url,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    console.log('[AUTH SERVICE] JWT gerado com sucesso.');

    // Retorne o objeto de usuário do banco de dados, não os dados brutos do GitHub
    return { user: dbUser, token };
}

module.exports = {
    authenticateWithGitHub,
};
// correto