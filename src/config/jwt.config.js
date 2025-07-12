
const JWT_SECRET = process.env.JWT_SECRET_APP;

if (!JWT_SECRET) {
    console.error('[JWT_CONFIG] Erro: JWT_SECRET_APP não está definido em process.env. O token JWT não poderá ser assinado/verificado corretamente.');
}

module.exports = {
    JWT_SECRET
};
// CORRETO