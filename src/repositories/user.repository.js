const { getPool } = require('../config/db.config');

async function upsertUser(githubUser) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    const { id, login, name, email, avatar_url } = githubUser;
    try {
        const [result] = await pool.execute(
            `INSERT INTO usuarios (github_id, github_login, name, email, avatar_url)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             github_login = VALUES(github_login),
             name = VALUES(name),
             email = VALUES(email),
             avatar_url = VALUES(avatar_url),
             updated_at = CURRENT_TIMESTAMP;`,
            [id, login, name || null, email || null, avatar_url]
        );

        let userId;
        if (result.insertId) {
            userId = result.insertId;
        } else {
            const [rows] = await pool.execute(
                `SELECT id FROM usuarios WHERE github_id = ?;`, 
                [id]
            );
            if (rows.length > 0) userId = rows[0].id;
            else throw new Error('Failed to get user ID');
        }

        const [userRows] = await pool.execute(
            `SELECT * FROM usuarios WHERE id = ?;`,
            [userId]
        );
        return userRows[0];
    } catch (error) {
        console.error('Error upserting user:', error.message);
        throw error;
    }
}

async function getTotalUsersCount() {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM usuarios;');
        return rows[0].count;
    } catch (error) {
        console.error('Error getting user count:', error.message);
        throw error;
    }
}

async function getGithubUsersCount() {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM usuarios WHERE github_status = 'ativo';");
        return rows[0].count;
    } catch (error) {
        console.error('Error getting GitHub users:', error.message);
        throw error;
    }
}

async function getStudentsWithActiveBenefitsCount() {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM usuarios WHERE benefits_activated > 0;");
        return rows[0].count;
    } catch (error) {
        console.error('Error getting active benefits:', error.message);
        throw error;
    }
}

async function getPendingStudentsCount() {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM usuarios WHERE onboarding_complete IS NULL OR onboarding_complete = FALSE;");
        return rows[0].count;
    } catch (error) {
        console.error('Error getting pending students:', error.message);
        throw error;
    }
}

async function getAllStudents() {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [rows] = await pool.execute('SELECT id, github_login, name, email, avatar_url, github_status, benefits_activated, course, currentSemester, totalSemesters, areasOfInterest, totalEconomy, redeemedBenefits, onboarding_complete, has_seen_confetti, points, level FROM usuarios;');
        
        return rows.map(student => {
            let parsedAreasOfInterest = [];
            if (student.areasOfInterest) {
                try {
                    parsedAreasOfInterest = JSON.parse(student.areasOfInterest);
                } catch (e) {
                    parsedAreasOfInterest = Array.isArray(student.areasOfInterest) ? student.areasOfInterest : (typeof student.areasOfInterest === 'string' ? [student.areasOfInterest] : []);
                }
            }

            let parsedRedeemedBenefits = [];
            if (student.redeemedBenefits) {
                try {
                    parsedRedeemedBenefits = JSON.parse(student.redeemedBenefits);
                } catch (e) {
                    parsedRedeemedBenefits = [];
                }
            }

            return {
                ...student,
                areasOfInterest: parsedAreasOfInterest,
                redeemedBenefits: parsedRedeemedBenefits,
            };
        });
    } catch (error) {
        console.error('Error getting students:', error.message);
        throw error;
    }
}

async function saveOnboardingData(userId, data) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    const { course, currentSemester, totalSemesters, areasOfInterest } = data;
    try {
        const areasOfInterestJson = JSON.stringify(areasOfInterest || []);
        
        await pool.execute(
            `UPDATE usuarios SET
             course = ?,
             currentSemester = ?,
             totalSemesters = ?,
             areasOfInterest = ?,
             onboarding_complete = TRUE,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?;`,
            [course, currentSemester, totalSemesters, areasOfInterestJson, userId]
        );
    } catch (error) {
        console.error('Error saving onboarding:', error);
        throw error;
    }
}

async function getStudentById(userId) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');

    try {
        const [rows] = await pool.execute('SELECT id, github_login, name, email, avatar_url, github_status, benefits_activated, course, currentSemester, totalSemesters, areasOfInterest, totalEconomy, redeemedBenefits, onboarding_complete, has_seen_confetti, points, level FROM usuarios WHERE id = ?;', [userId]);
        if (rows.length > 0) {
            const student = rows[0];
            
            let parsedAreasOfInterest = [];
            if (student.areasOfInterest) {
                try {
                    parsedAreasOfInterest = JSON.parse(student.areasOfInterest);
                } catch (e) {
                    parsedAreasOfInterest = Array.isArray(student.areasOfInterest) ? student.areasOfInterest : (typeof student.areasOfInterest === 'string' ? [student.areasOfInterest] : []);
                }
            }
            student.areasOfInterest = parsedAreasOfInterest;

            let parsedRedeemedBenefits = [];
            if (student.redeemedBenefits) {
                try {
                    parsedRedeemedBenefits = JSON.parse(student.redeemedBenefits);
                } catch (e) {
                    parsedRedeemedBenefits = [];
                }
            }
            student.redeemedBenefits = parsedRedeemedBenefits;

            return student;
        }
        return null;
    } catch (error) {
        console.error('Error getting student:', error.message);
        throw error;
    }
}

async function updateStudentBenefitStatus(userId, productId, isRedeemed, monthlyValueUSD, monthsRemaining) {
    let connection;
    try {
        connection = await getPool().getConnection();
        await connection.beginTransaction();

        const [user] = await connection.execute(
            'SELECT redeemedBenefits, totalEconomy FROM usuarios WHERE id = ?',
            [userId]
        );

        if (user.length === 0) throw new Error('User not found');

        let redeemedBenefits = user[0].redeemedBenefits ? JSON.parse(user[0].redeemedBenefits) : [];
        let totalEconomy = parseFloat(user[0].totalEconomy || 0);
        const existingIndex = redeemedBenefits.findIndex(b => b.productId === productId);

        if (isRedeemed) {
            if (existingIndex === -1) {
                redeemedBenefits.push({ productId, monthlyValueUSD, monthsRemaining });
                totalEconomy += (monthlyValueUSD * monthsRemaining);
            } else {
                const existing = redeemedBenefits[existingIndex];
                totalEconomy -= (existing.monthlyValueUSD * existing.monthsRemaining);
                totalEconomy += (monthlyValueUSD * monthsRemaining);
                redeemedBenefits[existingIndex] = { productId, monthlyValueUSD, monthsRemaining };
            }
        } else if (existingIndex !== -1) {
            const removed = redeemedBenefits.splice(existingIndex, 1);
            totalEconomy -= (removed[0].monthlyValueUSD * removed[0].monthsRemaining);
        }

        await connection.execute(
            `UPDATE usuarios SET
             redeemedBenefits = ?,
             totalEconomy = ?,
             benefits_activated = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [JSON.stringify(redeemedBenefits), totalEconomy, redeemedBenefits.length, userId]
        );

        const [totalEconomyResult] = await connection.execute('SELECT SUM(totalEconomy) AS total FROM usuarios');
        await connection.execute('UPDATE global_stats SET total_economia_geral = ? WHERE id = 1', [totalEconomyResult[0].total || 0]);

        await connection.commit();
        return { newTotalEconomy: totalEconomy };
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error updating benefit:', error.message);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

async function unlockUserReward(userId, trackId, amount, connection = null) {
    const conn = connection || await getPool().getConnection();
    try {
        const [rows] = await conn.execute(
            `SELECT totalEconomy, benefits_activated FROM usuarios WHERE id = ?;`,
            [userId]
        );

        if (rows.length === 0) throw new Error('User not found');

        let currentTotalEconomy = parseFloat(rows[0].totalEconomy || 0);
        let currentBenefitsActivated = parseInt(rows[0].benefits_activated || 0);

        const newTotalEconomy = currentTotalEconomy + amount;
        const newBenefitsActivated = currentBenefitsActivated + 1;

        await conn.execute(
            `UPDATE usuarios SET
             totalEconomy = ?,
             benefits_activated = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?;`,
            [newTotalEconomy, newBenefitsActivated, userId]
        );

        return { newTotalEconomy };
    } catch (error) {
        console.error('Error unlocking reward:', error.message);
        throw error;
    } finally {
        if (!connection && conn) conn.release();
    }
}

async function deductUserEconomy(userId, amountToDeduct, connection = null) {
    const conn = connection || await getPool().getConnection();
    try {
        const [userRows] = await conn.execute(
            `SELECT totalEconomy FROM usuarios WHERE id = ?;`,
            [userId]
        );

        if (userRows.length === 0) throw new Error('User not found');

        const currentEconomy = parseFloat(userRows[0].totalEconomy || 0);
        const newEconomy = currentEconomy - parseFloat(amountToDeduct);
        const finalEconomy = Math.max(0, newEconomy);

        await conn.execute(
            `UPDATE usuarios SET totalEconomy = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
            [finalEconomy, userId]
        );
        return true;
    } catch (error) {
        console.error('Error deducting economy:', error.message);
        throw error;
    } finally {
        if (!connection && conn) conn.release();
    }
}

async function updateHasSeenConfettiStatus(userId, status) {
    const pool = getPool();
    if (!pool) throw new Error('Database connection not established');
    try {
        await pool.execute(
            `UPDATE usuarios SET has_seen_confetti = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
            [status, userId]
        );
    } catch (error) {
        console.error('Error updating confetti status:', error.message);
        throw error;
    }
}

module.exports = {
    upsertUser,
    getTotalUsersCount,
    getGithubUsersCount,
    getStudentsWithActiveBenefitsCount,
    getPendingStudentsCount,
    getAllStudents,
    saveOnboardingData,
    getStudentById,
    updateStudentBenefitStatus,
    unlockUserReward,
    deductUserEconomy,
    updateHasSeenConfettiStatus,
};
