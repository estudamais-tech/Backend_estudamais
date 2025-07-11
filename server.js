// backend-mock/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Importação dinâmica de node-fetch para compatibilidade com ambientes diferentes
let nodeFetch;
try {
  nodeFetch = require('node-fetch');
  if (typeof nodeFetch !== 'function' && nodeFetch.default) {
    nodeFetch = nodeFetch.default;
  }
  if (typeof nodeFetch !== 'function') {
    throw new Error('node-fetch não exporta uma função fetch diretamente.');
  }
  console.log('[BACKEND] node-fetch importado com sucesso.');
} catch (error) {
  console.error('[BACKEND] Erro ao importar node-fetch:', error.message);
  nodeFetch = global.fetch; // Fallback para fetch global (ex: em ambientes de navegador ou Node.js 18+)
  if (typeof nodeFetch !== 'function') {
    console.error('[BACKEND] Erro crítico: Fetch não está disponível como função global ou via node-fetch.');
    process.exit(1); // Encerra o processo se fetch não estiver disponível
  }
}

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Define a chave secreta para JWT. Usa uma chave padrão para desenvolvimento se não definida.
const JWT_SECRET = process.env.JWT_SECRET || 'sua_super_secreta_chave_jwt_padrao_dev';
if (process.env.NODE_ENV !== 'production' && !process.env.JWT_SECRET) {
  console.warn('AVISO: JWT_SECRET não definido no .env do backend. Usando chave padrão para desenvolvimento. NÃO FAÇA ISSO EM PRODUÇÃO!');
}

// Configuração do CORS para permitir requisições do frontend
app.use(cors({
  origin: 'http://localhost:8080', // Permite requisições apenas deste frontend
  methods: ['GET', 'POST'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type'], // Cabeçalhos permitidos
  credentials: true // Essencial para permitir o envio e recebimento de cookies
}));

// Middleware para parsear JSON do corpo das requisições
app.use(express.json());
// Middleware para parsear cookies do cabeçalho da requisição
app.use(cookieParser());

/**
 * Rota para trocar o código de autorização do GitHub por um access_token e dados do usuário,
 * gerando um JWT e definindo-o como um cookie HttpOnly.
 */
app.post('/api/github-auth/exchange-code', async (req, res) => {
  const { code } = req.body;

  // Variáveis de ambiente do GitHub
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

  // Verifica se as variáveis de ambiente do GitHub estão configuradas
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URI) {
    console.error('[BACKEND] Erro: Variáveis de ambiente do GitHub (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) não definidas no .env do backend.');
    return res.status(500).json({ message: 'Erro de configuração do servidor de autenticação.' });
  }

  // Verifica se o código de autorização foi fornecido
  if (!code) {
    return res.status(400).json({ message: 'Código de autorização não fornecido.' });
  }

  console.log(`[BACKEND] Recebido código do frontend: ${code}`);

  try {
    console.log('[BACKEND] PASSO 1: Solicitando access_token do GitHub...');
    // Faz a requisição para o GitHub para trocar o código pelo access_token
    const githubResponse = await nodeFetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json' // Solicita resposta em JSON
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: GITHUB_REDIRECT_URI
      })
    });

    // Verifica se a resposta do GitHub foi bem-sucedida
    if (!githubResponse.ok) {
      const errorData = await githubResponse.json();
      console.error('[BACKEND] Erro ao trocar código com GitHub (PASSO 1):', errorData);
      return res.status(500).json({ message: errorData.error_description || 'Falha na comunicação com o GitHub para troca de token.' });
    }

    const githubTokenData = await githubResponse.json();
    const githubAccessToken = githubTokenData.access_token;

    // Verifica se o access_token foi retornado
    if (!githubAccessToken) {
      console.error('[BACKEND] GitHub não retornou um access_token (PASSO 1).');
      return res.status(500).json({ message: 'Falha ao obter access_token do GitHub.' });
    }

    console.log(`[BACKEND] access_token do GitHub obtido.`);

    console.log('[BACKEND] PASSO 2: Buscando informações do usuário no GitHub...');
    // Usa o access_token para buscar informações do usuário no GitHub
    const userResponse = await nodeFetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${githubAccessToken}`, // Autenticação com o token do GitHub
        'Accept': 'application/json'
      }
    });

    // Verifica se a resposta dos dados do usuário foi bem-sucedida
    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error('[BACKEND] Erro ao buscar dados do usuário no GitHub (PASSO 2):', errorData);
      return res.status(500).json({ message: errorData.message || 'Falha ao buscar dados do usuário no GitHub.' });
    }

    const userData = await userResponse.json();
    console.log(`[BACKEND] Dados do usuário GitHub obtidos: ${userData.login}`);

    console.log('[BACKEND] PASSO 3: Gerando JWT para o aplicativo...');
    // Cria o payload para o JWT com informações relevantes do usuário
    const payload = {
      id: userData.id,
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
    };

    // Gera o JWT com o payload, a chave secreta e expiração de 1 hora
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    console.log('[BACKEND] JWT gerado.');

    console.log('[BACKEND] PASSO 4: Enviando JWT como cookie HttpOnly...');
    // Define o cookie HttpOnly no navegador do cliente
    res.cookie('app_auth_token', token, {
      httpOnly: true, // Impede acesso ao cookie via JavaScript no navegador (segurança)
      // 'secure' deve ser true APENAS em produção (HTTPS). Em desenvolvimento (HTTP), deve ser false.
      secure: process.env.NODE_ENV === 'production',
      // 'sameSite' define quando o cookie deve ser enviado. 'Lax' é um bom balanço entre segurança e usabilidade.
      // Ele envia cookies em navegações de nível superior (links) e GET requests de terceiros,
      // mas não em POST requests de terceiros (como um form submit de outro site).
      sameSite: 'Lax',
      maxAge: 3600000 // Duração do cookie em milissegundos (1 hora)
    });
    console.log(`[BACKEND] Cookie HttpOnly definido com SameSite: Lax e Secure: ${process.env.NODE_ENV === 'production'}.`);

    // Retorna uma mensagem de sucesso e dados básicos do usuário (não o token)
    return res.json({
      message: 'Autenticação bem-sucedida',
      user: {
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        github_login: userData.login
      }
    });

  } catch (error) {
    console.error('[BACKEND] Erro durante o fluxo de autenticação GitHub (catch geral):', error);
    return res.status(500).json({ message: 'Erro interno do servidor durante a autenticação.' });
  }
});

/**
 * Rota para realizar o logout, limpando o cookie de autenticação.
 */
app.post('/api/logout', (req, res) => {
  console.log('[BACKEND] Recebida requisição de logout. Limpando cookie app_auth_token.');
  // Limpa o cookie de autenticação. As configurações devem ser as mesmas usadas para defini-lo.
  res.clearCookie('app_auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });
  return res.status(200).json({ message: 'Logout bem-sucedido.' });
});

/**
 * NOVA ROTA: Verifica o status de autenticação do usuário com base no cookie JWT.
 * O frontend chamará esta rota para saber se o usuário está logado.
 */
app.get('/api/check-auth', (req, res) => {
  const token = req.cookies.app_auth_token; // Tenta obter o token do cookie

  // Se o token não for encontrado no cookie, o usuário não está autenticado
  if (!token) {
    console.log('[BACKEND] /api/check-auth: Token não encontrado no cookie.');
    return res.status(401).json({ isAuthenticated: false, message: 'Não autenticado: Token não encontrado.' });
  }

  try {
    // Tenta verificar e decodificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[BACKEND] /api/check-auth: Token JWT válido. Usuário:', decoded.login);
    // Retorna o status de autenticação e os dados do usuário decodificados do token
    res.json({
      isAuthenticated: true,
      user: {
        id: decoded.id,
        login: decoded.login,
        name: decoded.name,
        avatar_url: decoded.avatar_url,
        github_login: decoded.login // Mantém consistência com o payload original
      }
    });
  } catch (error) {
    // Se o token for inválido (expirado, modificado, etc.), o usuário não está autenticado
    console.error('[BACKEND] /api/check-auth: Erro ao verificar token JWT:', error.message);
    return res.status(401).json({ isAuthenticated: false, message: 'Não autenticado: Token inválido ou expirado.' });
  }
});

/**
 * Rota protegida de exemplo, que exige um token JWT válido no cookie.
 */
app.get('/api/protected-route', (req, res) => {
  const token = req.cookies.app_auth_token; // Tenta obter o token do cookie

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado: Token não encontrado.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: 'Acesso concedido à rota protegida!', user: decoded });
  } catch (error) {
    console.error('[BACKEND] Erro ao verificar token JWT:', error);
    return res.status(401).json({ message: 'Não autorizado: Token inválido ou expirado.' });
  }
});

// Inicia o servidor na porta configurada
app.listen(PORT, () => {
  console.log(`[BACKEND] Servidor rodando em http://localhost:${PORT}`);
  console.log(`[BACKEND] Certifique-se de que seu frontend está configurado para usar esta URL: http://localhost:${PORT}/api`);
});
