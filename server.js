require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectToDatabase, createUsersTable, createTracksTable, createUserTracksTable, createGlobalStatsTable } = require('./src/config/db.config');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', routes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Initialize server
async function startServer() {
    try {
        await connectToDatabase();
        await createUsersTable();
        await createTracksTable();
        await createUserTracksTable();
        await createGlobalStatsTable();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
}

startServer();