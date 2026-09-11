# ⚡ Python — Interactive Python DSA & Technical Interview Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Python** is a gamified, developer-first coding platform designed to take developers from Python DSA basics to FAANG/Tier-1 placement readiness. It combines in-browser code execution, live progressive AI mentorship, line-by-line solution breakdowns, and spoken technical interview preparation.

---

## 🌟 Key Features

- 🎯 **70 High-Frequency DSA Challenges**: Curated curriculum spanning Strings, Two Pointers, Sliding Window, Linked Lists, Trees, Graphs, Dynamic Programming, and System Design patterns.
- 🤖 **Multi-Engine AI Mentor (Byte)**:
  - Powered by **Groq** (Llama 3.3 70B), **Google Gemini 1.5/2.0**, and **GitHub Models / Copilot** with automatic fallback.
  - Progressive 5-tier Socratic nudges (concept clue → structural pattern → partial snippet → complete breakdown).
- 🎙️ **15+ Technical Interview Q&As Per Problem**: Real interview screening questions, edge-case traps, and optimal Big-O explanations candidates are asked to explain verbally.
- ⚡ **Dual Code Execution**:
  - **In-Browser Sandbox**: Instant AST validation and test case verification.
  - **Secure Backend Runner**: Isolated Python 3.12 execution environment with resource and execution quotas.
- 🎮 **Gamification & Engagement**:
  - Daily practice targets & consecutive streak tracker.
  - Interactive **Solution Vault** (unlocked upon passing or solving).
  - Terminal output viewer with side-by-side test suite evaluation.
- 👤 **Frictionless Onboarding**:
  - **Guest Mode**: Code immediately with zero sign-up barrier.
  - **Full Member Accounts**: Track persistent statistics, rankings, and mastery milestones.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19, Turbopack, App Router)
- **Styling**: Vanilla CSS + Tailwind CSS utilities with dark Cyber-terminal aesthetics
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Audio & Animations**: Sound effects engine for run/submit feedback, Lucide Icons

### Backend
- **API Framework**: FastAPI (Async ASGI)
- **Language**: Python 3.12+
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Security & Auth**: JWT (HS256) with password hashing
- **Database**: PostgreSQL (Neon Serverless) / SQLite (Local dev)

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Spidey173/Python.git
cd Python
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```env
# Database
DATABASE_URL=sqlite+aiosqlite:///./python_quest.db

# Security
SECRET_KEY=your-super-secret-key-change-in-production

# AI Keys (Optional - has automatic built-in fallback)
GROQ_API_KEY=
GEMINI_API_KEY=
GITHUB_TOKEN=
```

Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/api/docs`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env.local` file in `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Start the Next.js dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Configuration

| Variable | Description | Location |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL or SQLite connection string | Backend (`.env`) |
| `SECRET_KEY` | Secret key used for signing JWT auth tokens | Backend (`.env`) |
| `GROQ_API_KEY` | *(Optional)* High-speed LLM inference | Backend / Frontend |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini AI | Backend / Frontend |
| `GITHUB_TOKEN` | *(Optional)* GitHub Models / Copilot API | Backend / Frontend |
| `NEXT_PUBLIC_API_URL` | Backend REST API endpoint URL | Frontend (`.env.local`) |

---

## 🧪 Testing & Verification

```bash
# Frontend typecheck & build
cd frontend
npm run build

# Backend unit & integration tests
cd ../backend
pytest
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
