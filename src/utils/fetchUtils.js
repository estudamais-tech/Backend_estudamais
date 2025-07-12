// backend-mock/src/utils/fetchUtils.js
let fetchImpl;
try {
  fetchImpl = require('node-fetch');
  if (typeof fetchImpl !== 'function' && fetchImpl.default) {
    fetchImpl = fetchImpl.default;
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('node-fetch não exporta uma função fetch diretamente.');
  }
  console.log('[BACKEND] node-fetch importado com sucesso em fetchUtils.');
} catch (error) {
  console.error('[BACKEND] Erro ao importar node-fetch em fetchUtils, usando fetch global:', error.message);
  fetchImpl = global.fetch;
  if (typeof fetchImpl !== 'function') {
    console.error('[BACKEND] Erro crítico: Fetch não está disponível como função global ou via node-fetch em fetchUtils.');
    process.exit(1);
  }
}

async function fetchGitHubAccessToken(code) {
  // ACESSANDO DIRETAMENTE DENTRO DA FUNÇÃO
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

  console.log('[BACKEND] fetchGitHubAccessToken: Tentando trocar código GitHub por token...');
  console.log('  - GITHUB_CLIENT_ID (fetchUtils):', GITHUB_CLIENT_ID);
  // console.log('  - GITHUB_CLIENT_SECRET (fetchUtils):', GITHUB_CLIENT_SECRET); // Descomente APENAS para depuração local, NUNCA em produção!
  console.log('  - GITHUB_REDIRECT_URI (fetchUtils):', GITHUB_REDIRECT_URI);
  console.log('  - Code recebido (fetchUtils):', code ? 'Presente' : 'Ausente', 'Comprimento:', code ? code.length : 'N/A');

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URI) {
      console.error('[BACKEND] Erro em fetchGitHubAccessToken: Variáveis de ambiente do GitHub ausentes.');
      throw { statusCode: 500, message: 'Erro de configuração interna para autenticação GitHub.' };
  }

  try {
    const response = await fetchImpl('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: GITHUB_REDIRECT_URI
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: 'Non-JSON response from GitHub', raw: errorText };
      }
      console.error('[BACKEND] Erro BRUTO na resposta do GitHub para access_token:', response.status, errorData);
      throw { statusCode: response.status, message: errorData.error_description || errorData.error || 'Falha na comunicação com o GitHub para troca de token.' };
    }
    const data = await response.json();
    console.log('[BACKEND] Sucesso ao obter access_token do GitHub.');
    return data;
  } catch (error) {
    console.error('[BACKEND] Erro ao chamar API do GitHub para access_token (catch fetchUtils):', error);
    throw error;
  }
}

async function fetchGitHubUserData(accessToken) {
  console.log('[BACKEND] fetchGitHubUserData: Buscando dados do usuário...');
  try {
    const response = await fetchImpl('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: 'Non-JSON response from GitHub (user data)', raw: errorText };
      }
      console.error('[BACKEND] Erro BRUTO na resposta do GitHub para user data:', response.status, errorData);
      throw { statusCode: response.status, message: errorData.message || 'Falha ao buscar dados do usuário no GitHub.' };
    }
    const data = await response.json();
    console.log('[BACKEND] Sucesso ao obter dados do usuário GitHub.');
    return data;
  } catch (error) {
    console.error('[BACKEND] Erro ao chamar API do GitHub para user data (catch fetchUtils):', error);
    throw error;
  }
}

module.exports = {
  fetchGitHubAccessToken,
  fetchGitHubUserData
};
// correto