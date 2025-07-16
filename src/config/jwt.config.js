// src/config/jwt.config.js
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('JWT_SECRET not defined in environment variables');
    process.exit(1);
}

module.exports = {
    JWT_SECRET
};