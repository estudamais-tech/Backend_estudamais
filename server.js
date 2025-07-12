const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

// Importa as novas funções de criação de tabela e o serviço de trilhas
const { connectToDatabase, createUsersTable, createTracksTable, createUserTracksTable, getPool } = require('./src/config/db.config');
// Removi a importação de trackService pois não será usado para seed aqui.
// Se você usa trackService em outras partes do server.js (fora do seed), mantenha a importação.
// const trackService = require('./src/services/track.service'); 

const JWT_SECRET_APP = process.env.JWT_SECRET;
if (process.env.NODE_ENV !== 'production' && !JWT_SECRET_APP) {
    console.warn('AVISO: JWT_SECRET não definido no .env do backend. Usando chave padrão para desenvolvimento. NÃO FAÇA ISSO EM PRODUÇÃO!');
    process.env.JWT_SECRET_APP = 'sua_super_secreta_chave_jwt_padrao_dev';
} else if (JWT_SECRET_APP) {
    process.env.JWT_SECRET_APP = JWT_SECRET_APP;
} else {
    console.error('ERRO CRÍTICO: JWT_SECRET não pode ser definido.');
    process.exit(1);
}

const apiRoutes = require('./src/routes'); // Este é o seu index.js

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/', apiRoutes);

async function startServer() {
    const dbPool = await connectToDatabase();
    await createUsersTable();
    await createTracksTable(); // Garante que a tabela 'tracks' seja criada (vazia)
    await createUserTracksTable(); // Garante que a tabela 'user_tracks' seja criada
    // Removida a chamada para trackService.seedTracks();
    // Agora o backend não vai mais popular a tabela 'tracks' automaticamente.

    app.listen(PORT, () => {
        console.log(`[BACKEND] Servidor rodando em http://localhost:${PORT}`);
        console.log(`[BACKEND] Certifique-se de que seu frontend está configurado para usar esta URL: http://localhost:${PORT}/api`);
    });
}

startServer();