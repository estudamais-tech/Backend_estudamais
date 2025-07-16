const mysql = require('mysql2/promise');

let pool;
const DB_NAME = process.env.DB_DATABASE;

async function connectToDatabase() {
    try {
        const tempPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        let connection;
        try {
            connection = await tempPool.getConnection();
            await connection.execute(`CREATE DATABASE IF NOT EXISTS ${DB_NAME};`);
        } finally {
            if (connection) connection.release();
            await tempPool.end();
        }

        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const finalConnection = await pool.getConnection();
        finalConnection.release();
        return pool;
    } catch (error) {
        console.error('Error connecting to database:', error.message);
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
            onboarding_complete BOOLEAN DEFAULT FALSE,
            has_seen_confetti BOOLEAN DEFAULT FALSE, -- Nova coluna para o confete
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            points INT DEFAULT 0,
            level INT DEFAULT 1,
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.execute(createTableQuery);
    } catch (error) {
        console.error('Error creating users table:', error.message);
        process.exit(1);
    }
}

async function createTracksTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tracks (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            icon_name VARCHAR(100),
            path VARCHAR(255) NOT NULL,
            reward_value DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
            points_reward INT DEFAULT 100
        );
    `;
    try {
        await pool.execute(createTableQuery);
    } catch (error) {
        console.error('Error creating tracks table:', error.message);
        process.exit(1);
    }
}

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
            UNIQUE (user_id, track_id)
        );
    `;
    try {
        await pool.execute(createTableQuery);
    } catch (error) {
        console.error('Error creating user_tracks table:', error.message);
        process.exit(1);
    }
}

async function createGlobalStatsTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS global_stats (
            id INT PRIMARY KEY DEFAULT 1,
            total_usuarios BIGINT DEFAULT 0,
            total_unlocked_value DECIMAL(15, 2) DEFAULT 0.00,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT id_check CHECK (id = 1)
        );
    `;
    const insertInitialRowQuery = `INSERT IGNORE INTO global_stats (id) VALUES (1);`;
    
    try {
        await pool.execute(createTableQuery);
        await pool.execute(insertInitialRowQuery);
    } catch (error) {
        console.error('Error creating global_stats table:', error.message);
        process.exit(1);
    }
}

module.exports = {
    connectToDatabase,
    createUsersTable,
    createTracksTable,
    createUserTracksTable,
    createGlobalStatsTable,
    getPool: () => pool
};
