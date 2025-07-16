const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config');

function authenticateToken(req, res, next) {
    const token = req.cookies.app_auth_token;

    if (!token) {
        return res.status(401).json({ 
            isAuthenticated: false, 
            message: 'Authentication token missing' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('JWT verification error:', error.message);
        return res.status(403).json({ 
            isAuthenticated: false, 
            message: 'Invalid or expired token' 
        });
    }
}

module.exports = authenticateToken;