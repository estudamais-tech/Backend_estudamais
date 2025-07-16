// src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config');
const userRepository = require('../repositories/user.repository');

async function exchangeGitHubCode(req, res) {
    const { code } = req.body;

    try {
        const { user, token } = await authService.authenticateWithGitHub(code);

        res.cookie('app_auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 3600000
        });

        return res.json({
            message: 'Authentication successful',
            user: {
                id: user.id,
                name: user.name || user.github_login,
                avatar_url: user.avatar_url,
                github_login: user.github_login,
                onboarding_complete: user.onboarding_complete,
                course: user.course,
                currentSemester: user.currentSemester,
                totalSemesters: user.totalSemesters,
                areasOfInterest: user.areasOfInterest,
                points: user.points,
                level: user.level
            }
        });

    } catch (error) {
        console.error('Auth controller error:', error.message);
        return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
}

function logout(req, res) {
    res.clearCookie('app_auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    });
    return res.status(200).json({ message: 'Logout successful' });
}

async function checkAuth(req, res) {
    const token = req.cookies.app_auth_token;

    if (!token) {
        return res.status(401).json({ isAuthenticated: false, message: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userFromDb = await userRepository.getStudentById(decoded.id);

        if (userFromDb) {
            return res.json({
                isAuthenticated: true,
                user: {
                    id: userFromDb.id,
                    login: userFromDb.github_login,
                    name: userFromDb.name || userFromDb.github_login,
                    avatar_url: userFromDb.avatar_url,
                    github_login: userFromDb.github_login,
                    onboarding_complete: userFromDb.onboarding_complete,
                    course: userFromDb.course,
                    currentSemester: userFromDb.currentSemester,
                    totalSemesters: userFromDb.totalSemesters,
                    areasOfInterest: userFromDb.areasOfInterest,
                    points: userFromDb.points,
                    level: userFromDb.level
                }
            });
        }

        return res.json({
            isAuthenticated: true,
            user: {
                id: decoded.id,
                login: decoded.login,
                name: decoded.name || decoded.login,
                avatar_url: decoded.avatar_url,
                github_login: decoded.login,
                onboarding_complete: false
            }
        });

    } catch (error) {
        return res.status(401).json({ isAuthenticated: false, message: 'Invalid token' });
    }
}

module.exports = {
    exchangeGitHubCode,
    logout,
    checkAuth,
};