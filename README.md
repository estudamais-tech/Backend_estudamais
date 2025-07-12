### 💻 Backend EstudaMais — Autenticação com GitHub

Este é o backend inicial do projeto **EstudaMais**, criado para gerenciar a autenticação de usuários via GitHub utilizando OAuth, JWT e cookies HttpOnly.

Este backend será expandido no futuro com novas APIs e funcionalidades para apoiar todo o ecossistema do EstudaMais.

✅ **Feito com**: Express, JWT, node-fetch, cookie-parser, dotenv e MySQL2.

---

## 🚀 Tecnologias utilizadas

* Node.js
* Express
* jsonwebtoken
* node-fetch
* dotenv
* cookie-parser
* cors
* MySQL2 (para conexão com MySQL)

---

## 📥 Clonar o repositório

```bash
git clone https://github.com/estudamais-tech/Backend_estudamais.git
cd Backend_estudamais
```

---

## 📦 Instalar dependências

Certifique-se de ter o Node.js (v16 ou superior) instalado.

```bash
npm install
```

---

## ⚙️ Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo, substituindo os valores:

```env
PORT=3001

# Configurações do GitHub OAuth
GITHUB_CLIENT_ID=<SEU_GITHUB_CLIENT_ID>
GITHUB_CLIENT_SECRET=<SEU_GITHUB_CLIENT_SECRET>
GITHUB_REDIRECT_URI=http://localhost:8080/dashboard

# Chave Secreta JWT
JWT_SECRET=<SUA_CHAVE_SECRETA_JWT>

# Configuração do MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<SUA_SENHA>
DB_NAME=estudamais_db
```

---

## 🌐 Configuração do OAuth no GitHub

1. Acesse [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers).
2. Clique em **New OAuth App**.
3. Preencha:

   * **Application name**: EstudaMais
   * **Homepage URL**: [http://localhost:8080](http://localhost:8080)
   * **Authorization callback URL**: [http://localhost:8080/dashboard](http://localhost:8080/dashboard)
4. Após criar, copie **Client ID** e **Client Secret** e preencha no `.env`.

---

## ▶️ Iniciar o servidor

```bash
node server.js
```

Servidor iniciado em: [http://localhost:3001](http://localhost:3001)

---

## 🗄️ Configuração do banco de dados

Ao iniciar o servidor, as tabelas `usuarios`, `tracks` e `user_tracks` são criadas automaticamente.

### Inserção de dados das trilhas

#### Opção 1: Comandos SQL

```sql
INSERT INTO tracks (id, title, description, icon_name, path, reward_value) VALUES
('github-pro-track', 'Ative seu GitHub Pro!', 'Um guia completo para estudantes ativarem o GitHub Pro e acessarem o Student Developer Pack, desbloqueando ferramentas premium e benefícios exclusivos.', 'github', '/dashboard/github-pro-track', 100.00),
('linkedin-optimization', 'Otimize seu LinkedIn para Carreira', 'Aprenda a criar um perfil de LinkedIn que impressiona recrutadores, otimize sua rede de contatos e descubra oportunidades de estágio e emprego.', 'linkedin', '/dashboard/linkedin-optimization-track', 50.00),
('portfolio-building', 'Construa um Portfólio de Projetos Vencedor', 'Guia passo a passo para construir um portfólio que destaca suas habilidades técnicas e experiência para futuros empregadores.', 'arrow-right', '/dashboard/portfolio-building-track', 75.00);
```

#### Opção 2: Endpoint de API

* URL: `http://localhost:3001/api/user/admin/tracks`
* Método: `POST`
* Body:

```json
{
  "id": "nova-trilha",
  "title": "Título da Nova Trilha",
  "description": "Descrição detalhada da nova trilha.",
  "icon_name": "icone",
  "path": "/dashboard/nova-trilha",
  "reward_value": 99.99
}
```

---

## 🗺️ Rotas disponíveis

### Rotas de Autenticação (/api/auth)

* **POST** `/api/auth/github-auth/exchange-code`: Troca o `code` do GitHub por token e retorna JWT.
* **GET** `/api/auth/github-auth/callback`: Callback do OAuth GitHub.
* **POST** `/api/auth/logout`: Remove cookie de autenticação.
* **GET** `/api/auth/check-auth`: Verifica autenticação atual.

### Rotas de Usuários (/api/users)

* **GET** `/api/users/count`: Contagem total de usuários.
* **GET** `/api/users/github-count`: Contagem de usuários com GitHub.
* **GET** `/api/users/active-benefits-count`: Contagem de usuários com benefícios ativos.
* **GET** `/api/users/pending-github-count`: Contagem de usuários com GitHub pendente.
* **GET** `/api/users`: Lista todos os estudantes.
* **POST** `/api/users/onboard`: Salva dados de onboarding. (Requer autenticação)
* **GET** `/api/users/student/dashboard`: Dados para dashboard do estudante. (Requer autenticação)
* **PUT** `/api/users/student/benefits/:productId`: Atualiza benefício. (Requer autenticação)

### Rotas de Trilhas (/api/user)

* **GET** `/api/user/tracks`: Lista trilhas disponíveis para o usuário. (Requer autenticação)
* **POST** `/api/user/track/start`: Inicia trilha. (Requer autenticação)
* **POST** `/api/user/track/complete`: Conclui trilha. (Requer autenticação)
* **POST** `/api/user/admin/tracks`: Adiciona nova trilha. (Requer autenticação)

---

## 💬 Observações importantes

* Use HTTPS em produção para cookies seguros.
* Nunca exponha `JWT_SECRET` ou segredos do GitHub.
* Cookies são HttpOnly para maior segurança.
* `sameSite: Lax` ajuda a prevenir CSRF.
* Recompensas são validadas no backend.

---

## 🛠️ Expansão futura

* Novas APIs para gerenciamento de usuários e funcionalidades exclusivas EstudaMais.

---

## 🤝 Contribuições

Crie uma branch no formato `feat/seu-nome` (ex: `feat/joao-dev`). Pull requests são bem-vindos! 💜

---

## 🛡️ Licença

Licença ISC — Em breve no repositório.

---

## 📣 Contato

Abra uma issue ou envie PR.

🌟 Projeto oficial do [EstudaMais Tech](https://github.com/estudamais-tech)
