// backend-mock/src/utils/fetchUtils.js

const axios = require('axios'); // Import Axios

async function fetchGitHubAccessToken(code) {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
    const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

    console.log('[BACKEND] fetchGitHubAccessToken: Tentando trocar código GitHub por token...');
    console.log('   - GITHUB_CLIENT_ID (fetchUtils):', GITHUB_CLIENT_ID);
    // console.log('   - GITHUB_CLIENT_SECRET (fetchUtils):', GITHUB_CLIENT_SECRET); // Descomente APENAS para depuração local, NUNCA em produção!
    console.log('   - GITHUB_REDIRECT_URI (fetchUtils):', GITHUB_REDIRECT_URI);
    console.log('   - Code recebido (fetchUtils):', code ? 'Presente' : 'Ausente', 'Comprimento:', code ? code.length : 'N/A');

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URI) {
        console.error('[BACKEND] Erro em fetchGitHubAccessToken: Variáveis de ambiente do GitHub ausentes.');
        throw { statusCode: 500, message: 'Erro de configuração interna para autenticação GitHub.' };
    }

    try {
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: code,
            redirect_uri: GITHUB_REDIRECT_URI
        }, {
            headers: {
                'Accept': 'application/json' // GitHub expects this for JSON response
            }
        });

        // Axios puts the response data in .data
        const data = response.data;
        console.log('[BACKEND] Sucesso ao obter access_token do GitHub.');
        return data;

    } catch (error) {
        console.error('[BACKEND] Erro ao chamar API do GitHub para access_token (catch fetchUtils):', error.response ? error.response.data : error.message);
        throw {
            statusCode: error.response ? error.response.status : 500,
            message: error.response?.data?.error_description || error.response?.data?.error || 'Falha na comunicação com o GitHub para troca de token.'
        };
    }
}

async function fetchGitHubUserData(accessToken) {
    console.log('[BACKEND] fetchGitHubUserData: Buscando dados do usuário...');
    try {
        const response = await axios.get('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        // Axios puts the response data in .data
        const data = response.data;
        console.log('[BACKEND] Sucesso ao obter dados do usuário GitHub.');
        return data;

    } catch (error) {
        console.error('[BACKEND] Erro ao chamar API do GitHub para user data (catch fetchUtils):', error.response ? error.response.data : error.message);
        throw {
            statusCode: error.response ? error.response.status : 500,
            message: error.response?.data?.message || 'Falha ao buscar dados do usuário no GitHub.'
        };
    }
}

module.exports = {
    fetchGitHubAccessToken,
    fetchGitHubUserData
};