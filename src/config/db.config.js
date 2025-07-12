const mysql = require('mysql2/promise');

let pool;

async function connectToDatabase() {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        const connection = await pool.getConnection();
        console.log('[BACKEND] Conectado ao banco de dados MySQL com sucesso!');
        connection.release();
        return pool;
    } catch (error) {
        console.error('[BACKEND] Erro ao conectar ao MySQL:', error.message);
        console.error('[BACKEND] Verifique se o MySQL está rodando e as credenciais no .env estão corretas.');
        console.error('[BACKEND] Certifique-se de que o banco de dados especificado em DB_NAME no seu .env existe.');
        process.exit(1);
    }
}

async function createUsersTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            github_id VARCHAR(255) UNIQUE NOT NULL,
            github_login VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            email VARCHAR(255),
            avatar_url VARCHAR(255),
            registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            github_status VARCHAR(50) DEFAULT 'ativo',
            benefits_activated INT DEFAULT 0,
            course VARCHAR(100),
            currentSemester INT,
            totalSemesters INT,
            areasOfInterest JSON,
            totalEconomy DECIMAL(10, 2) DEFAULT 0.00,
            redeemedBenefits JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.execute(createTableQuery);
        console.log('[BACKEND] Tabela "usuarios" verificada/criada com sucesso (com colunas atualizadas).');
    } catch (error) {
        console.error('[BACKEND] Erro ao criar tabela "usuarios":', error.message);
        process.exit(1);
    }
}

// NOVO: Função para criar a tabela de trilhas
async function createTracksTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tracks (
            id VARCHAR(255) PRIMARY KEY, -- Usar um ID de string para facilitar a correspondência com o frontend
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            icon_name VARCHAR(100), -- Nome do ícone para o frontend (ex: 'github', 'arrow-right')
            path VARCHAR(255) NOT NULL, -- Caminho da rota no frontend
            reward_value DECIMAL(10, 2) NOT NULL, -- Valor monetário da recompensa
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.execute(createTableQuery);
        console.log('[BACKEND] Tabela "tracks" verificada/criada com sucesso.');
    } catch (error) {
        console.error('[BACKEND] Erro ao criar tabela "tracks":', error.message);
        process.exit(1);
    }
}

// NOVO: Função para criar a tabela de progresso do usuário nas trilhas
async function createUserTracksTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS user_tracks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            track_id VARCHAR(255) NOT NULL,
            status ENUM('available', 'in-progress', 'completed') DEFAULT 'available',
            started_at TIMESTAMP NULL,
            completed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
            UNIQUE (user_id, track_id) -- Garante que um usuário só tenha uma entrada por trilha
        );
    `;
    try {
        await pool.execute(createTableQuery);
        console.log('[BACKEND] Tabela "user_tracks" verificada/criada com sucesso.');
    } catch (error) {
        console.error('[BACKEND] Erro ao criar tabela "user_tracks":', error.message);
        process.exit(1);
    }
}

module.exports = {
    connectToDatabase,
    createUsersTable,
    createTracksTable, 
    createUserTracksTable, 
    getPool: () => pool
};
