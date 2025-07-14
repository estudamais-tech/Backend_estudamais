require('dotenv').config(); // Carrega as variáveis de ambiente do .env

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Importado e essencial para ler cookies
const { connectToDatabase, createUsersTable, createTracksTable, createUserTracksTable, createGlobalStatsTable } = require('./src/config/db.config');
const routes = require('./src/routes'); // Importa o arquivo de rotas consolidado

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080', // Permite requisições do seu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Essencial para enviar e receber cookies
}));
app.use(express.json()); // Permite que o Express parseie o corpo das requisições como JSON
app.use(cookieParser()); // Habilita o parsing de cookies - CRÍTICO AQUI!

// Rotas da API
app.use('/', routes); // Usa o roteador principal que já inclui o prefixo /api

// Rota de teste simples
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Inicialização do servidor
async function startServer() {
    try {
        await connectToDatabase();
        await createUsersTable(); // Garante que a tabela de usuários existe
        await createTracksTable(); // Garante que a tabela de trilhas existe
        await createUserTracksTable(); // Garante que a tabela de user_tracks existe
         await createGlobalStatsTable(); 
        app.listen(PORT, () => {
            console.log(`[BACKEND] Servidor rodando na porta ${PORT}`);
            console.log(`[BACKEND] Acesso via navegador: http://localhost:${PORT}`);
            console.log(`[BACKEND] Rotas da API disponíveis em http://localhost:${PORT}/api/...`);
        });
    } catch (error) {
        console.error('[BACKEND] Falha ao iniciar o servidor:', error);
        process.exit(1);
    }
}

startServer();
// correto 