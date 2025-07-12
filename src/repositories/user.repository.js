const { getPool } = require('../config/db.config');

async function upsertUser(githubUser) {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during upsertUser.');
        throw new Error('Database connection not established.');
    }

    const { id: github_id, login, name, avatar_url } = githubUser;

    try {
        // Primeiro, tente encontrar o usuário existente pelo github_id
        const [existingUsers] = await pool.execute(
            `SELECT id FROM usuarios WHERE github_id = ?;`,
            [github_id]
        );

        let userId;
        if (existingUsers.length > 0) {
            // Se o usuário existe, atualize-o
            userId = existingUsers[0].id;
            await pool.execute(
                `UPDATE usuarios
                 SET github_login = ?, name = ?, email = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE github_id = ?;`,
                [login, name || login, githubUser.email || null, avatar_url, github_id]
            );
            console.log(`[USER REPOSITORY] upsertUser for ${login}: Usuário existente atualizado. ID: ${userId}`);
        } else {
            // Se o usuário não existe, insira um novo
            const [result] = await pool.execute(
                `INSERT INTO usuarios (github_id, github_login, name, email, avatar_url, registration_date, github_status, benefits_activated, course, currentSemester, totalSemesters, areasOfInterest, totalEconomy, redeemedBenefits, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
                [
                    github_id,
                    login,
                    name || login,
                    githubUser.email || null,
                    avatar_url,
                    'ativo',
                    0,
                    null,
                    null,
                    null,
                    JSON.stringify([]), // areasOfInterest padrão (array JSON vazio)
                    0.00,
                    JSON.stringify([]) // redeemedBenefits padrão (array JSON vazio)
                ]
            );
            userId = result.insertId;
            console.log(`[USER REPOSITORY] upsertUser for ${login}: Novo usuário inserido. ID: ${userId}`);
        }

        // Após a inserção/atualização, busque o usuário completo para retornar
        const [updatedUserRows] = await pool.execute(
            `SELECT id, github_id, github_login, name, email, avatar_url, registration_date, github_status, benefits_activated, course, currentSemester, totalSemesters, areasOfInterest, totalEconomy, redeemedBenefits
             FROM usuarios WHERE id = ?;`,
            [userId]
        );

        // Parse JSON fields
        if (updatedUserRows[0]) {
            // ADICIONADO: Log do valor bruto de areasOfInterest antes do parse
            console.log(`[USER REPOSITORY] upsertUser: Raw areasOfInterest from DB for user ${userId}: '${updatedUserRows[0].areasOfInterest}' (Type: ${typeof updatedUserRows[0].areasOfInterest})`);

            // Lógica de parsing mais robusta para areasOfInterest
            if (updatedUserRows[0].areasOfInterest) {
                // Tenta verificar se já é um array (caso o driver mysql2 tenha feito o parse automático)
                if (Array.isArray(updatedUserRows[0].areasOfInterest)) {
                    updatedUserRows[0].areasOfInterest = updatedUserRows[0].areasOfInterest.filter(item => item !== null && String(item).trim() !== '');
                    console.log('[USER REPOSITORY] upsertUser: areasOfInterest já é um array. Usando diretamente.');
                } else if (typeof updatedUserRows[0].areasOfInterest === 'string' && updatedUserRows[0].areasOfInterest.trim().length > 0) {
                    // Se for uma string, tenta fazer o parse
                    try {
                        const parsedAreas = JSON.parse(updatedUserRows[0].areasOfInterest);
                        if (Array.isArray(parsedAreas)) {
                            updatedUserRows[0].areasOfInterest = parsedAreas.filter(item => item !== null && String(item).trim() !== '');
                            console.log('[USER REPOSITORY] upsertUser: areasOfInterest parseado de string para array.');
                        } else {
                            console.error('[USER REPOSITORY] upsertUser: Parsed areasOfInterest não é um array:', parsedAreas);
                            updatedUserRows[0].areasOfInterest = [];
                        }
                    } catch (e) {
                        console.error('[USER REPOSITORY] upsertUser: Erro ao parsear areasOfInterest (valor:', updatedUserRows[0].areasOfInterest, '):', e);
                        updatedUserRows[0].areasOfInterest = [];
                    }
                } else {
                    // Se não for array e nem string válida, ou for string vazia, define como array vazio
                    console.log('[USER REPOSITORY] upsertUser: areasOfInterest não é um formato válido. Definindo como array vazio.');
                    updatedUserRows[0].areasOfInterest = [];
                }
            } else {
                // Se areasOfInterest for null ou undefined, define como array vazio
                console.log('[USER REPOSITORY] upsertUser: areasOfInterest é null/undefined. Definindo como array vazio.');
                updatedUserRows[0].areasOfInterest = [];
            }

            // Lógica de parsing para redeemedBenefits (mantida como estava)
            if (updatedUserRows[0].redeemedBenefits) {
                const redeemedString = updatedUserRows[0].redeemedBenefits;
                if (typeof redeemedString === 'string' && redeemedString.trim().length > 0) {
                    try {
                        updatedUserRows[0].redeemedBenefits = JSON.parse(redeemedString);
                    } catch (e) {
                        console.error('[USER REPOSITORY] Erro ao parsear redeemedBenefits (valor:', redeemedString, '):', e);
                        updatedUserRows[0].redeemedBenefits = [];
                    }
                } else {
                    updatedUserRows[0].redeemedBenefits = [];
                }
            } else {
                updatedUserRows[0].redeemedBenefits = [];
            }
        }

        // ADICIONADO: Log do objeto completo após o parse
        console.log(`[USER REPOSITORY] upsertUser: Full user object after parsing for user ${userId}:`, JSON.stringify(updatedUserRows[0], null, 2));

        return updatedUserRows[0];
    } catch (error) {
        console.error('[USER REPOSITORY] Error during upsertUser:', error.message);
        throw error;
    }
}

async function getTotalUsersCount() {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during getTotalUsersCount.');
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute('SELECT COUNT(*) AS total_users FROM usuarios;');
        const totalUsers = rows[0].total_users;
        console.log(`[USER REPOSITORY] Total users count from DB: ${totalUsers}`);
        return totalUsers;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching total users count:', error.message);
        throw error;
    }
}

async function getGithubUsersCount() {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during getGithubUsersCount.');
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute("SELECT COUNT(*) AS github_users_count FROM usuarios WHERE github_login IS NOT NULL AND github_login != '';");
        const githubUsersCount = rows[0].github_users_count;
        console.log(`[USER REPOSITORY] GitHub users count from DB: ${githubUsersCount}`);
        return githubUsersCount;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching GitHub users count:', error.message);
        throw error;
    }
}

async function getStudentsWithActiveBenefitsCount() {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during getStudentsWithActiveBenefitsCount.');
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute('SELECT COUNT(*) AS active_benefits_count FROM usuarios WHERE benefits_activated > 0;');
        const activeBenefitsCount = rows[0].active_benefits_count;
        console.log(`[USER REPOSITORY] Active benefits count from DB: ${activeBenefitsCount}`);
        return activeBenefitsCount;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching active benefits count:', error.message);
        throw error;
    }
}

async function getPendingStudentsCount() {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during getPendingStudentsCount.');
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute("SELECT COUNT(*) AS pending_students_count FROM usuarios WHERE github_status = 'pendente';");
        const pendingStudentsCount = rows[0].pending_students_count;
        console.log(`[USER REPOSITORY] Pending students count from DB: ${pendingStudentsCount}`);
        return pendingStudentsCount;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching pending students count:', error.message);
        throw error;
    }
}

async function getAllStudents() {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during getAllStudents.');
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute(`
            SELECT
                id,
                name,
                email,
                github_login AS githubUsername,
                avatar_url,
                registration_date AS registrationDate,
                github_status AS githubStatus,
                benefits_activated AS benefitsActivated,
                course,
                currentSemester,
                totalSemesters,
                areasOfInterest,
                totalEconomy,
                redeemedBenefits
            FROM usuarios
            ORDER BY name;
        `);
        console.log(`[USER REPOSITORY] Fetched ${rows.length} students from DB.`);

        // Parse JSON fields for each student
        const students = rows.map(row => {
            // Lógica de parsing mais robusta para areasOfInterest
            if (row.areasOfInterest) {
                if (Array.isArray(row.areasOfInterest)) {
                    row.areasOfInterest = row.areasOfInterest.filter(item => item !== null && String(item).trim() !== '');
                } else if (typeof row.areasOfInterest === 'string' && row.areasOfInterest.trim().length > 0) {
                    try {
                        const parsedAreas = JSON.parse(row.areasOfInterest);
                        if (Array.isArray(parsedAreas)) {
                            row.areasOfInterest = parsedAreas.filter(item => item !== null && String(item).trim() !== '');
                        } else {
                            console.error('[USER REPOSITORY] Parsed areasOfInterest não é um array para getAllStudents:', parsedAreas);
                            row.areasOfInterest = [];
                        }
                    } catch (e) {
                        console.error('[USER REPOSITORY] Erro ao parsear areasOfInterest para estudante em getAllStudents (valor:', row.areasOfInterest, '):', row.id, e);
                        row.areasOfInterest = [];
                    }
                } else {
                    row.areasOfInterest = [];
                }
            } else {
                row.areasOfInterest = [];
            }

            // Lógica de parsing para redeemedBenefits (mantida como estava)
            if (row.redeemedBenefits) {
                const redeemedString = row.redeemedBenefits;
                if (typeof redeemedString === 'string' && redeemedString.trim().length > 0) {
                    try {
                        row.redeemedBenefits = JSON.parse(redeemedString);
                    } catch (e) {
                        console.error('[USER REPOSITORY] Erro ao parsear redeemedBenefits para estudante (valor:', redeemedString, '):', row.id, e);
                        row.redeemedBenefits = [];
                    }
                } else {
                    row.redeemedBenefits = [];
                }
            } else {
                row.redeemedBenefits = [];
            }
            return row;
        });

        return students;
    } catch (error) {
        console.error('[USER REPOSITORY] Error fetching all students:', error.message);
        throw error;
    }
}

// NOVO: Função para atualizar os dados de onboarding de um usuário
async function updateOnboardingData(userId, data) {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during updateOnboardingData.');
        throw new Error('Database connection not established.');
    }
    const { course, currentSemester, totalSemesters, areasOfInterest } = data;
    try {
        // ADICIONADO: Log dos dados de onboarding antes de salvar
        console.log(`[USER REPOSITORY] updateOnboardingData: Saving for user ID ${userId} - Course: '${course}', Current Semester: ${currentSemester}, Total Semesters: ${totalSemesters}, Areas: ${JSON.stringify(areasOfInterest)}`);

        await pool.execute(
            `UPDATE usuarios
             SET course = ?, currentSemester = ?, totalSemesters = ?, areasOfInterest = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?;`,
            [course, currentSemester, totalSemesters, JSON.stringify(areasOfInterest), userId]
        );
        console.log(`[USER REPOSITORY] Dados de onboarding atualizados para o usuário ID: ${userId}`);
    } catch (error) {
        console.error(`[USER REPOSITORY] Erro ao atualizar dados de onboarding para o usuário ID: ${userId}:`, error.message);
        throw error;
    }
}

// NOVO: Função para obter os dados completos de um estudante por ID
async function getStudentById(userId) {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during getStudentById.');
        throw new Error('Database connection not established.');
    }
    try {
        const [rows] = await pool.execute(
            `SELECT
                id,
                name,
                email,
                github_login AS githubLogin,
                avatar_url AS avatarUrl,
                course,
                currentSemester,
                totalSemesters,
                areasOfInterest,
                totalEconomy AS totalSaved,
                redeemedBenefits
             FROM usuarios
             WHERE id = ?;`,
            [userId]
        );

        if (rows.length === 0) {
            console.log(`[USER REPOSITORY] getStudentById: User ID ${userId} not found.`);
            return null;
        }

        const student = rows[0];
        // ADICIONADO: Log do valor do curso retornado
        console.log(`[USER REPOSITORY] getStudentById: User ID ${userId} fetched. Course: '${student.course}'`);
        // ADICIONADO: Log do valor bruto de areasOfInterest antes do parse em getStudentById
        console.log(`[USER REPOSITORY] getStudentById: Raw areasOfInterest from DB for user ${userId}: '${student.areasOfInterest}' (Type: ${typeof student.areasOfInterest})`);


        // Lógica de parsing mais robusta para areasOfInterest
        if (student.areasOfInterest) {
            if (Array.isArray(student.areasOfInterest)) {
                student.areasOfInterest = student.areasOfInterest.filter(item => item !== null && String(item).trim() !== '');
                console.log('[USER REPOSITORY] getStudentById: areasOfInterest já é um array. Usando diretamente.');
            } else if (typeof student.areasOfInterest === 'string' && student.areasOfInterest.trim().length > 0) {
                try {
                    const parsedAreas = JSON.parse(student.areasOfInterest);
                    if (Array.isArray(parsedAreas)) {
                        student.areasOfInterest = parsedAreas.filter(item => item !== null && String(item).trim() !== '');
                        console.log('[USER REPOSITORY] getStudentById: areasOfInterest parseado de string para array.');
                    } else {
                        console.error('[USER REPOSITORY] getStudentById: Parsed areasOfInterest não é um array:', parsedAreas);
                        student.areasOfInterest = [];
                    }
                } catch (e) {
                    console.error('[USER REPOSITORY] getStudentById: Erro ao parsear areasOfInterest (valor:', student.areasOfInterest, '):', e);
                    student.areasOfInterest = [];
                }
            } else {
                student.areasOfInterest = [];
            }
        } else {
            student.areasOfInterest = [];
        }

        // Lógica de parsing para redeemedBenefits (mantida como estava)
        if (student.redeemedBenefits) {
            const redeemedString = student.redeemedBenefits;
            if (typeof redeemedString === 'string' && redeemedString.trim().length > 0) {
                try {
                    student.redeemedBenefits = JSON.parse(redeemedString);
                } catch (e) {
                    console.error('[USER REPOSITORY] Erro ao parsear redeemedBenefits para estudante (valor:', redeemedString, '):', student.id, e);
                    student.redeemedBenefits = [];
                }
            } else {
                student.redeemedBenefits = [];
            }
        } else {
            student.redeemedBenefits = [];
        }

        // ADICIONADO: Log do objeto completo após o parse em getStudentById
        console.log(`[USER REPOSITORY] getStudentById: Full user object after parsing for user ${userId}:`, JSON.stringify(student, null, 2));

        return student;
    } catch (error) {
        console.error(`[USER REPOSITORY] Erro ao buscar estudante por ID: ${userId}:`, error.message);
        throw error;
    }
}

// NOVO: Função para atualizar o status de um benefício e a economia total
async function updateStudentBenefitStatus(userId, productId, isRedeemed, monthlyValueUSD, monthsRemaining) {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during updateStudentBenefitStatus.');
        throw new Error('Database connection not established.');
    }

    try {
        // 1. Obter os dados atuais do usuário, especialmente redeemedBenefits e totalEconomy
        const [rows] = await pool.execute(
            `SELECT redeemedBenefits, totalEconomy FROM usuarios WHERE id = ?;`,
            [userId]
        );

        if (rows.length === 0) {
            throw new Error('Usuário não encontrado.');
        }

        let currentRedeemedBenefits = [];
        if (rows[0].redeemedBenefits) {
            const redeemedString = rows[0].redeemedBenefits;
            if (typeof redeemedString === 'string' && redeemedString.trim().length > 0) {
                try {
                    currentRedeemedBenefits = JSON.parse(redeemedString);
                } catch (e) {
                    console.error('[USER REPOSITORY] Erro ao parsear redeemedBenefits existentes:', redeemedString, e);
                    currentRedeemedBenefits = [];
                }
            }
        }

        let currentTotalEconomy = parseFloat(rows[0].totalEconomy);

        // 2. Atualizar redeemedBenefits e totalEconomy
        if (isRedeemed && !currentRedeemedBenefits.includes(productId)) {
            currentRedeemedBenefits.push(productId);
            currentTotalEconomy += (monthlyValueUSD * monthsRemaining);
            console.log(`[USER REPOSITORY] Benefício ${productId} adicionado. Nova economia: ${currentTotalEconomy}`);
        } else if (!isRedeemed && currentRedeemedBenefits.includes(productId)) {
            // Lógica para "desresgatar" (se necessário), mas o frontend só envia true
            currentRedeemedBenefits = currentRedeemedBenefits.filter(id => id !== productId);
            currentTotalEconomy -= (monthlyValueUSD * monthsRemaining); // Subtrai se desresgatado
            console.log(`[USER REPOSITORY] Benefício ${productId} removido. Nova economia: ${currentTotalEconomy}`);
        } else {
            console.log(`[USER REPOSITORY] Benefício ${productId} já está no estado desejado ou não foi alterado.`);
        }

        // 3. Salvar as alterações no banco de dados
        await pool.execute(
            `UPDATE usuarios
             SET redeemedBenefits = ?, totalEconomy = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?;`,
            [JSON.stringify(currentRedeemedBenefits), currentTotalEconomy, userId]
        );
        console.log(`[USER REPOSITORY] Status do benefício e economia total atualizados para o usuário ID: ${userId}`);
    } catch (error) {
        console.error(`[USER REPOSITORY] Erro ao atualizar status do benefício para o usuário ID: ${userId}:`, error.message);
        throw error;
    }
}

// NOVO: Função para desbloquear uma recompensa (adiciona ao totalEconomy e registra)
async function unlockUserReward(userId, trackId, amount) {
    const pool = getPool();
    if (!pool) {
        console.error('[USER REPOSITORY] Database pool is not available during unlockUserReward.');
        throw new Error('Database connection not established.');
    }

    try {
        // 1. Obter a economia atual do usuário
        const [userRows] = await pool.execute(
            `SELECT totalEconomy FROM usuarios WHERE id = ?;`,
            [userId]
        );

        if (userRows.length === 0) {
            throw new Error('Usuário não encontrado.');
        }

        let currentTotalEconomy = parseFloat(userRows[0].totalEconomy);
        const newTotalEconomy = currentTotalEconomy + amount;

        // 2. Atualizar a economia total do usuário
        await pool.execute(
            `UPDATE usuarios
             SET totalEconomy = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?;`,
            [newTotalEconomy, userId]
        );
        console.log(`[USER REPOSITORY] Recompensa de R$${amount.toFixed(2)} desbloqueada para o usuário ${userId} na trilha ${trackId}. Nova economia total: R$${newTotalEconomy.toFixed(2)}`);

        // Opcional: Registrar a recompensa em uma tabela de histórico de recompensas se necessário
        // Por exemplo, uma tabela `user_rewards_history`
        // await pool.execute(
        //     `INSERT INTO user_rewards_history (user_id, track_id, amount, unlocked_at)
        //      VALUES (?, ?, ?, CURRENT_TIMESTAMP);`,
        //     [userId, trackId, amount]
        // );

        return { success: true, newTotalEconomy };
    } catch (error) {
        console.error(`[USER REPOSITORY] Erro ao desbloquear recompensa para o usuário ${userId} na trilha ${trackId}:`, error.message);
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
    updateOnboardingData,
    getStudentById,
    updateStudentBenefitStatus,
    unlockUserReward, // Exporta a nova função
};
