<p align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-blue?style=for-the-badge" alt="MERN Stack" />
  <img src="https://img.shields.io/badge/Code_Execution-Judge0-6366f1?style=for-the-badge" alt="Judge0" />
  <img src="https://img.shields.io/badge/Editor-Monaco-0078d4?style=for-the-badge" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

# ⚒️ MockForge — Technical Interview Simulator

> A full-stack MERN platform that simulates timed technical interviews with **real coding rounds** — write code in a Monaco editor, run it in a sandbox, and get it graded against hidden test cases — plus MCQ rounds, AI-generated coaching, and a global leaderboard.

<p align="center">
  <a href="https://mockforge-h8jw.onrender.com/"><b>🔗 Live Demo →  mockforge-h8jw.onrender.com</b></a>
</p>

![MockForge Landing Page](./screenshots/landing-hero.png)

## ✨ Features

| Feature | Description |
|---|---|
| 💻 **Real Coding Rounds** | Write code in a **Monaco editor** (the editor that powers VS Code), run it against sample input, and submit for grading — across **Python, JavaScript, C++, Java, and C** |
| 🧪 **Sandboxed Execution & Grading** | User code runs in an isolated **Judge0** sandbox; submissions are graded per **test case** with **partial credit** and hidden tests to prevent hardcoded answers |
| 📝 **MCQ Rounds** | Curated multiple-choice questions across Arrays, Graphs, DP, and OOP |
| ⏱️ **Timed Sessions** | 10-minute countdown with auto-submit, a live progress bar, and a circular timer ring |
| 💾 **Autosave & Resume** | Interview progress (answers, code, flags, timer) is saved to `localStorage` and resumable after a reload |
| 🤖 **AI Coach Review** | Post-interview feedback via an LLM (OpenRouter) with structured Overall / Strengths / Next Focus guidance |
| 🏆 **Global Leaderboard** | Top scores across all users, ranked by accuracy with a podium for the top 3 |
| 📈 **Analytics Dashboard** | Streak heatmap, topic-mastery rings, momentum trends, and full attempt history |
| 🛡️ **Admin Dashboard** | Role-based panel to author MCQ **and** code questions (with a sample-vs-hidden test-case editor) |
| 🔐 **JWT Auth** | bcrypt-hashed passwords, stateless JWTs, role-based middleware, and graceful expired-session handling |
| 🌙 **Dark Mode** | System-wide dark/light toggle persisted to `localStorage` |
| 🎨 **Premium UI** | Glass design system, cursor-spotlight hero, dynamic-island navbar, page transitions, and accessibility passes |

## 🛠️ Tech Stack

### Frontend
- **React 19** + **React Router v7** — UI, hooks/context, protected routes
- **Vite** — dev server & build
- **Tailwind CSS v4** — utility-first styling with a custom glass design system
- **@monaco-editor/react** — in-browser code editor
- **Axios** — HTTP client with a global 401 interceptor
- **Lucide React** — icons · **React Hot Toast** — notifications
- **Inter** + **Playfair Display** — typography

### Backend
- **Node.js + Express 5** — REST API
- **MongoDB + Mongoose** — database & ODM
- **Judge0 CE (via RapidAPI)** — sandboxed multi-language code execution
- **OpenRouter** — LLM provider for the AI coach
- **JWT** + **bcryptjs** — authentication
- **dotenv** · **CORS**

## 🏗️ Architecture Notes

- **Service-layer abstraction for code execution** — all engine-specific logic lives in `backend/src/services/codeExecutor.js` behind a stable `executeCode({ language, code, stdin })` function. (This isolation let the project migrate from Piston to Judge0 by touching a single file.)
- **Polymorphic question schema** — one Mongoose model serves both MCQ and code questions via conditional validators; an answer-key **sanitization layer** strips correct answers and hidden test cases before responses reach the client.
- **Per-test-case grading** — code submissions are run against all test cases in parallel (`Promise.all`) and scored proportionally.

## 📁 Project Structure

```
MockForge/
├── backend/
│   ├── server.js                  # Express entry + /health + SPA serving
│   └── src/
│       ├── config/                # Database connection
│       ├── controllers/           # authController, questionController,
│       │                          #   submissionController, executeController
│       ├── middleware/            # JWT auth + admin guards
│       ├── models/                # User, Questions, Submission
│       ├── routes/                # auth, questions, submissions, execute
│       ├── services/              # codeExecutor.js (Judge0 wrapper)
│       ├── seed/                  # seedQuestions.js (MCQ + DSA code questions)
│       └── utils/                 # token generation
│
├── client/
│   ├── index.html                 # meta + Open Graph tags
│   ├── public/                    # favicon, og-image
│   └── src/
│       ├── api/                   # axios instance + 401 interceptor
│       ├── components/            # Navbar, ProtectedRoute, CodeEditor
│       ├── context/               # Auth & Theme contexts
│       ├── pages/                 # Landing, Login, Register, Dashboard,
│       │                          #   Interview, Leaderboard, AdminDashboard
│       ├── App.jsx
│       └── main.jsx
│
└── screenshots/
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB Atlas** account (or local MongoDB)
- A **RapidAPI** key subscribed to **Judge0 CE** (for code execution)
- *(Optional)* an **OpenRouter** API key (for the AI coach)

### 1. Clone
```bash
git clone https://github.com/rudhar07/MockForge.git
cd MockForge
```

### 2. Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
RAPIDAPI_KEY=your_rapidapi_key            # enables code execution (Judge0 CE)
OPENROUTER_API_KEY=your_openrouter_key    # optional, enables AI coach
```

Seed the question bank (MCQ + DSA coding questions), then start the server:
```bash
npm run seed
npm run dev
```

> Seeding attaches questions to an existing **admin** user, so register a user and promote it to `admin` in the database first.

### 3. Frontend
```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:5173** (the Vite dev server proxies `/api` to the backend).

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login & receive a JWT | Public |

### Questions
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/questions` | Get all questions (sanitized) | Private |
| `GET` | `/api/questions/topic/:topic` | Get questions by topic | Private |
| `GET` | `/api/questions/:id` | Get full question (with answer key) | Admin |
| `POST` | `/api/questions` | Create a question (MCQ or code) | Admin |
| `PUT` | `/api/questions/:id` | Update a question | Admin |
| `DELETE` | `/api/questions/:id` | Delete a question | Admin |

### Submissions
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/submissions` | Submit an interview; grades & saves the attempt | Private |
| `POST` | `/api/submissions/review` | Regenerate the AI review without re-saving | Private |
| `GET` | `/api/submissions/history` | Current user's attempt history | Private |
| `GET` | `/api/submissions/leaderboard` | Global top scores | Private |

### Code Execution & Health
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/execute/run` | Run code (language, source, stdin) in the sandbox | Private |
| `GET` | `/health` | Lightweight uptime/health check | Public |

## 🗃️ Data Models

```
User
├── name (String, required)
├── email (String, required, unique)
├── password (String, bcrypt-hashed)
├── role (enum: 'user' | 'admin')
└── timestamps

Question
├── title (String, required)
├── description (String, required)
├── type (enum: 'mcq' | 'short' | 'code')
├── topic (enum: 'arrays' | 'dp' | 'graphs' | 'oop')
├── difficulty (enum: 'easy' | 'medium' | 'hard')
├── marks (Number, default: 10)
│   # MCQ fields
├── options ([String])
├── correctAnswer (String, required when type = 'mcq')
│   # Code fields
├── language (enum: python|javascript|cpp|java|c, required when type = 'code')
├── starterCode (String)
├── testCases ([{ input, expectedOutput, isSample }])  # ≥1 required for code
├── explanation (String)
├── createdBy (ref → User)
└── timestamps

Submission
├── user (ref → User)
├── topic (String)
├── score (Number)
├── totalPossible (Number)
└── timestamps
```

## 👤 Author

**Rudhar Bajaj**
- LinkedIn: [rudhar-bajaj](https://www.linkedin.com/in/rudhar-bajaj/)
- GitHub: [rudhar07](https://github.com/rudhar07)

## 📄 License

Licensed under the **MIT License** — see [LICENSE](LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/rudhar07">Rudhar Bajaj</a>
</p>
