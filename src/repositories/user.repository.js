const { getPool } = require('../config/db.config');
const statsService = require('../services/stats.service'); 

async function upsertUser(githubUser) {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during upsertUser.');
        throw new Error('Database connection not established.');
        // A lógica de negócio não deve estar aqui
    }

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
            console.log(`[USER REPOSITORY] New user inserted with ID: ${userId}`);
            
            // ---> CORREÇÃO E INTEGRAÇÃO AQUI <---
            // Chame o serviço de stats apenas quando um novo usuário for inserido.
            await statsService.incrementUserCount();

        } else {
            const [rows] = await pool.execute(
                `SELECT id FROM usuarios WHERE github_id = ?;`,
                [id]
            );
            if (rows.length > 0) {
                userId = rows[0].id;
                console.log(`[USER REPOSITORY] Existing user updated. DB User ID: ${userId}`);
            } else {
                console.error('[USER REPOSITORY] Could not find or insert user after upsert operation for github_id:', id);
                throw new Error('Failed to retrieve user ID after upsert.');
            }
        }

        const [userRows] = await pool.execute(
            `SELECT * FROM usuarios WHERE id = ?;`,
            [userId]
        );
        return userRows[0];

    } catch (error) {
        console.error(`[USER REPOSITORY] Error upserting user ${login}:`, error.message);
        throw error;
    }
}

async function getTotalUsersCount() {
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM usuarios;');
        return rows[0].count;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching total users count:', error.message);
        throw error;
    }
}

async function getGithubUsersCount() {
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM usuarios WHERE github_status = 'ativo';");
        return rows[0].count;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching GitHub users count:', error.message);
        throw error;
    }
}

async function getStudentsWithActiveBenefitsCount() {
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM usuarios WHERE benefits_activated > 0;");
        return rows[0].count;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching active benefits count:', error.message);
        throw error;
    }
}

async function getPendingStudentsCount() {
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM usuarios WHERE onboarding_complete IS NULL OR onboarding_complete = FALSE;");
        return rows[0].count;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching pending students count:', error.message);
        throw error;
    }
}

async function getAllStudents() {
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute('SELECT id, github_login, name, email, github_status, benefits_activated, course, currentSemester, totalSemesters, areasOfInterest, totalEconomy, redeemedBenefits, onboarding_complete FROM usuarios;');
        
        // Mapear e garantir que áreas e benefícios são arrays, sem JSON.parse
        const students = rows.map(student => {
            return {
                ...student,
                areasOfInterest: student.areasOfInterest || [], // Garante que é um array, mesmo se vier null
                redeemedBenefits: student.redeemedBenefits || [], // Garante que é um array, mesmo se vier null
            };
        });
        return students;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching all students:', error.message);
        throw error;
    }
}

async function saveOnboardingData(userId, data) {
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    const { course, currentSemester, totalSemesters, areasOfInterest } = data;
    try {
        // Mantenha o JSON.stringify AQUI para salvar no DB como string JSON
        await pool.execute(
            `UPDATE usuarios SET
             course = ?,
             currentSemester = ?,
             totalSemesters = ?,
             areasOfInterest = ?,
             onboarding_complete = TRUE,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?;`,
            [course, currentSemester, totalSemesters, JSON.stringify(areasOfInterest), userId] 
        );
        console.log(`[USER REPOSITORY] Dados de onboarding salvos para o usuário ${userId}.`);
    } catch (error) {
        console.error(`[USER REPOSITORY] Erro ao salvar dados de onboarding para o usuário ${userId}:`, error);
        throw error;
    }
}

async function getStudentById(userId) {
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute('SELECT id, github_login, name, email, github_status, benefits_activated, course, currentSemester, totalSemesters, areasOfInterest, totalEconomy, redeemedBenefits, onboarding_complete FROM usuarios WHERE id = ?;', [userId]);
        if (rows.length > 0) {
            const student = rows[0];
            
            // REMOVA JSON.parse(). Apenas garanta que seja um array.
            student.areasOfInterest = student.areasOfInterest || []; 
            student.redeemedBenefits = student.redeemedBenefits || [];

            return student;
        }
        return null;
    } catch (error) {
        console.error(`[USER REPOSITORY] Error fetching student by ID ${userId}:`, error.message);
        throw error;
    }
}

async function updateStudentBenefitStatus(userId, productId, isRedeemed, monthlyValueUSD, monthsRemaining) {
    const pool = getPool();
    if (!pool) {
        throw new Error('Database connection not established.');
    }
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute('SELECT redeemedBenefits, totalEconomy FROM usuarios WHERE id = ?;', [userId]);
        if (rows.length === 0) {
            throw new Error('User not found.');
        }

        let redeemedBenefits = rows[0].redeemedBenefits ? JSON.parse(rows[0].redeemedBenefits) : [];
        let totalEconomy = parseFloat(rows[0].totalEconomy || 0);

        const existingBenefitIndex = redeemedBenefits.findIndex(b => b.productId === productId);

        if (isRedeemed) {
            if (existingBenefitIndex === -1) {
                redeemedBenefits.push({ productId, isRedeemed, monthlyValueUSD, monthsRemaining });
                totalEconomy += (monthlyValueUSD * monthsRemaining);
            } else {
                const oldBenefit = redeemedBenefits[existingBenefitIndex];
                totalEconomy -= (oldBenefit.monthlyValueUSD * oldBenefit.monthsRemaining);
                redeemedBenefits[existingBenefitIndex] = { productId, isRedeemed, monthlyValueUSD, monthsRemaining };
                totalEconomy += (monthlyValueUSD * monthsRemaining);
            }
        } else {
            if (existingBenefitIndex !== -1) {
                const oldBenefit = redeemedBenefits[existingBenefitIndex];
                totalEconomy -= (oldBenefit.monthlyValueUSD * oldBenefit.monthsRemaining);
                redeemedBenefits.splice(existingBenefitIndex, 1);
            }
        }

        await connection.execute(
            `UPDATE usuarios SET
             redeemedBenefits = ?,
             totalEconomy = ?,
             benefits_activated = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?;`,
            [JSON.stringify(redeemedBenefits), totalEconomy, redeemedBenefits.length, userId]
        );

        await connection.commit();
        console.log(`[USER REPOSITORY] Benefit status updated for user ${userId}, product ${productId}. New totalEconomy: ${totalEconomy}`);
        return { newTotalEconomy: totalEconomy };
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(`[USER REPOSITORY] Error updating benefit status for user ${userId}, product ${productId}:`, error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function unlockUserReward(userId, trackId, amount, connection = null) { // <--- ADICIONE connection = null
    const conn = connection || await getPool().getConnection(); // <--- ATUALIZE AQUI
    try {
        // Find the user's current total economy
        const [rows] = await conn.execute( // <--- ATUALIZE AQUI: usar 'conn'
            `SELECT totalEconomy, benefits_activated FROM usuarios WHERE id = ?;`, // Colunas camelCase do seu DB
            [userId]
        );

        if (rows.length === 0) {
            throw new Error('User not found.');
        }

        let currentTotalEconomy = parseFloat(rows[0].totalEconomy || 0);
        let currentBenefitsActivated = parseInt(rows[0].benefits_activated || 0);

        const newTotalEconomy = currentTotalEconomy + amount;
        // Não incrementamos benefits_activated aqui pois a trilha não é um "benefício ativado"
        // no mesmo sentido que os produtos de benefits_activated.
        // Se cada trilha completa CONTA como 1 "benefício ativado", então a linha abaixo está correta.
        // Caso contrário, remova ou ajuste a linha abaixo.
        const newBenefitsActivated = currentBenefitsActivated + 1; // Ajuste se esta lógica não se aplica a 'tracks'

        await conn.execute( // <--- ATUALIZE AQUI: usar 'conn'
            `UPDATE usuarios SET
             totalEconomy = ?,
             benefits_activated = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?;`,
            [newTotalEconomy, newBenefitsActivated, userId]
        );

        // NÂO FAÇA connection.commit() ou connection.rollback() AQUI se connection foi passado!
        // Quem chamou (track.service) é responsável pela transação.

        console.log(`[USER REPOSITORY] User ${userId} unlocked reward of R$${amount.toFixed(2)} for track ${trackId}. New totalEconomy: R$${newTotalEconomy.toFixed(2)}`);
        return { newTotalEconomy };
    } catch (error) {
        console.error(`[USER REPOSITORY] Error unlocking reward for user ${userId} on track ${trackId}:`, error.message);
        // NÂO FAÇA connection.rollback() AQUI se connection foi passado!
        throw error;
    } finally {
        if (!connection && conn) { // <--- ATUALIZE AQUI: Só libera se a conexão foi obtida NESTA função
            conn.release();
        }
    }
}

// <--- ADICIONE ESTA NOVA FUNÇÃO ABAIXO
async function deductUserEconomy(userId, amountToDeduct, connection = null) {
    const conn = connection || await getPool().getConnection();
    try {
        const [userRows] = await conn.execute(
            `SELECT totalEconomy FROM usuarios WHERE id = ?;`, // Coluna camelCase do seu DB
            [userId]
        );

        if (userRows.length === 0) {
            throw new Error('User not found.');
        }

        const currentEconomy = parseFloat(userRows[0].totalEconomy || 0);
        const newEconomy = currentEconomy - parseFloat(amountToDeduct);

        // Garante que a economia não fique abaixo de zero, se for uma regra de negócio.
        // Remova ou ajuste esta linha se a economia pode ser negativa.
        const finalEconomy = Math.max(0, newEconomy);

        // O benefits_activated não é diretamente impactado pela remoção de uma trilha aqui,
        // a menos que você tenha uma regra específica para isso (ex: trilhas contam como "ativadas"
        // e são decrementedadas ao remover). Se não, não o atualize aqui.
        // No entanto, para ser simétrico com `unlockUserReward` se ele incrementa,
        // você pode querer decrementar. Para este exemplo, vou manter o `benefits_activated`
        // sem alteração aqui, assumindo que ele só se refere a 'redeemedBenefits'.
        // Se a trilha também ativava um "benefício", você precisaria carregar `benefits_activated`
        // e decrementá-lo de forma similar a `totalEconomy`.

        await conn.execute(
            `UPDATE usuarios SET totalEconomy = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, // Coluna camelCase do seu DB
            [finalEconomy, userId]
        );
        return true;
    } catch (error) {
        console.error(`[USER REPOSITORY] Error deducting economy for user ${userId}:`, error.message);
        throw error;
    } finally {
        if (!connection && conn) { // Só libera se a conexão foi obtida NESTA função
            conn.release();
        }
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
};
// corr