# ⚡ Python Quest — Gamified Data Structures & Algorithms Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Python Quest** is a gamified, high-performance coding platform engineered to take developers from core Data Structures & Algorithms (DSA) to FAANG/Tier-1 interview readiness. It features a modern Notion × Linear × Stripe Docs design system, instant in-browser code execution, direct context-aware AI mentorship, line-by-line AST explanations, and comprehensive technical interview Q&A modules for every challenge.

---

## 🌟 Key Features & Architecture Highlights

- 🎯 **High-Frequency DSA Programs**: Structured chapters covering Strings, Two Pointers, Sliding Window, Linked Lists, Trees, Graphs, Dynamic Programming, and System Design patterns.
- 🤖 **Context-Direct AI Assistant**:
  - Direct context integration supporting **Groq** (`gpt-oss-120b`), **Google Gemini** (`gemini-3.6-flash`), and **GitHub Models / Copilot API** with automatic fallback.
  - Smart intent routing:
    - **Greetings & Casual Chat**: Concise, friendly 1-2 sentence replies without unwanted solution dumps.
    - **Code Requests**: Generates clean, interview-accepted solutions using the authoritative starter template.
    - **Debug Requests**: Analyzes user code & test tracebacks to explain bugs clearly.
- 🎨 **Notion × Linear × Stripe Docs Design System**:
  - High contrast Dark Mode UI with refined typography, 15px readable font size, and IDE-like code blocks.
  - Interactive tabbed workspace: Problem Specification, AI Chat Assistant, Solution Vault, and Spoken Interview Q&As.
- 🎙️ **15+ Technical Interview Q&As Per Problem**: Real technical screening questions, edge-case traps, and Big-O trade-offs to master verbal interview communication.
- ⚡ **Execution Sandbox & Test Runner**:
  - Secure function-based test runner supporting multiple test cases.
  - Instant line-by-line AST code explanation and dry-run state tracer.
- 🎮 **Gamification & User System**:
  - Guest Trial mode & permanent JWT user accounts.
  - XP, levels, streak tracking, hearts, coins, global leaderboard, and mystery box rewards.

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19, Turbopack, App Router)
- **Styling**: Vanilla CSS + Tailwind CSS utilities with custom dark terminal aesthetics
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Icons & UI Components**: Lucide React

### Backend
- **Framework**: FastAPI (Async ASGI)
- **Language**: Python 3.12+
- **Database & ORM**: SQLAlchemy 2.0 (AsyncIO) + SQLite / PostgreSQL (Neon Serverless)
- **Authentication**: JWT (HS256) with Passlib bcrypt hashing
- **Testing**: Pytest & Async HTTPX test client

---

## 🚀 Getting Started

### 1. Repository Setup
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
# Database & Auth
DATABASE_URL=sqlite+aiosqlite:///./python_quest.db
SECRET_KEY=your-super-secret-key-change-in-production

# AI Keys (Optional - automatic fallbacks enabled)
GROQ_API_KEY=
GEMINI_API_KEY=
COPILOT_API_KEY=
```

Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation available at: `http://localhost:8000/api/docs`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env.local` file in `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Build

```bash
# Frontend build check
cd frontend
npm run build

# Backend test suite
cd ../backend
PYTHONPATH=. pytest
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
