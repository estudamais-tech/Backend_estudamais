const fetchUtils = require('../utils/fetchUtils');
const userRepository = require('../repositories/user.repository');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config');

async function authenticateWithGitHub(code) {
    const githubTokenData = await fetchUtils.fetchGitHubAccessToken(code);
    const githubAccessToken = githubTokenData.access_token;

    if (!githubAccessToken) {
        throw { 
            statusCode: 401, 
            message: 'Failed to obtain GitHub access token' 
        };
    }

    const githubUserData = await fetchUtils.fetchGitHubUserData(githubAccessToken);
    const dbUser = await userRepository.upsertUser(githubUserData);

    const token = jwt.sign(
        {
            id: dbUser.id,
            login: dbUser.github_login,
            name: dbUser.name,
            avatar_url: dbUser.avatar_url,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    return { 
        user: dbUser, 
        token 
    };
}

module.exports = {
    authenticateWithGitHub,
};