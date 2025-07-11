
# 💻 Backend EstudaMais — Autenticação com GitHub

Este é o backend **inicial** do projeto **EstudaMais**, criado para gerenciar a autenticação de usuários via GitHub utilizando OAuth, JWT e cookies HttpOnly.  

⚡ Este backend será expandido no futuro com novas APIs e funcionalidades para apoiar todo o ecossistema do EstudaMais.

✅ Feito com **Express**, **JWT**, **node-fetch**, **cookie-parser** e **dotenv**.

---

## 🚀 Tecnologias utilizadas

- Node.js
- Express
- jsonwebtoken
- node-fetch
- dotenv
- cookie-parser
- cors

---

## 📥 Clonar o repositório

git clone https://github.com/estudamais-tech/Backend_estudamais.git
cd Backend_estudamais

---

## 📦 Instalar dependências

Certifique-se de ter o Node.js (v16 ou superior) instalado.

npm install

---

## ⚙️ Configurar variáveis de ambiente

Crie um arquivo .env na raiz do projeto com o seguinte conteúdo:

PORT=3001  
GITHUB_CLIENT_ID=  
GITHUB_CLIENT_SECRET=  
GITHUB_REDIRECT_URI=http://localhost:8080/dashboard  
JWT_SECRET=  

---

## 🌐 Configuração do OAuth no GitHub

1️⃣ Acesse: GitHub Developer Settings → OAuth Apps.

2️⃣ Clique em New OAuth App.

3️⃣ Preencha:

Application name: EstudaMais
Homepage URL: http://localhost:8080  
Authorization callback URL: http://localhost:8080/dashboard

4️⃣ Após criar, copie:

Client ID → GITHUB_CLIENT_ID=  
Client Secret → GITHUB_CLIENT_SECRET=

5️⃣ Atualize seu .env com essas informações.

---
💡 Importante:

- GITHUB_CLIENT_ID= são obtidos no GitHub Developer Settings → OAuth Apps.
- GITHUB_CLIENT_SECRET= são obtidos no GitHub Developer Settings → OAuth Apps.
- GITHUB_REDIRECT_URI= deve ser o mesmo configurado no GitHub (ex.: http://localhost:8080/dashboard).
- JWT_SECRET= deve ser uma chave secreta forte e única. Nunca exponha sua chave secreta em produção.

---

## ▶️ Iniciar o servidor

node server.js

O backend será iniciado em: http://localhost:3001

---

## 🗺️ Rotas disponíveis

POST /api/github-auth/exchange-code
- Recebe um code do frontend (após login no GitHub).
- Troca pelo access_token.
- Busca dados do usuário no GitHub.
- Gera um JWT.
- Define cookie HttpOnly.

GET /api/check-auth
- Verifica se o usuário está autenticado usando o cookie app_auth_token.
- Retorna dados do usuário se válido.

GET /api/protected-route
- Exemplo de rota protegida.
- Exige token JWT válido no cookie.

POST /api/logout
- Limpa o cookie app_auth_token.
- Finaliza a sessão.



## 💬 Observações importantes

- Use HTTPS em produção para habilitar secure: true nos cookies.
- Nunca compartilhe sua JWT_SECRET ou segredos do GitHub publicamente.
- Cookies estão configurados como HttpOnly para maior segurança.
- O valor sameSite: Lax ajuda a proteger contra ataques CSRF.

---

## 🛠️ Expansão futura

Este backend é inicial e focado na autenticação via GitHub.  
No futuro, novas APIs serão adicionadas, incluindo gerenciamento de usuários, integrações com banco de dados, funcionalidades exclusivas do EstudaMais e muito mais! 🚀

---

## 🤝 Contribuições

Pull requests são bem-vindos! 💜

---

## 🛡️ Licença

Licença ISC — Em breve será adicionada ao repositório.

---

## 📣 Contato

Se tiver dúvidas ou sugestões, abra uma Issue no repositório ou envie um Pull Request.

---

### 🌟 Projeto oficial do EstudaMais Tech (https://github.com/estudamais-tech)
