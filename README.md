# PyForge - AI-Powered Placement Preparation Platform

PyForge is a modern DSA and placement learning platform for Python coders, featuring **15+ high-yield spoken interview Q&As per challenge**, **line-by-line code tracing**, **common mistake bug traps**, and an **AI mentor**.

---

## 🚀 Live Tech Stack
- **Frontend**: Next.js 16 (React 19, TailwindCSS 4, Turbopack, Lucide Icons)
- **Backend**: FastAPI, SQLAlchemy Async, Pydantic v2
- **Database**: **Neon PostgreSQL** (Cloud Serverless)
- **Deployment**: Vercel (Frontend) & Render / Railway (Backend API)

---

## 🛠️ Local Development Setup

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Environment Variables

### Backend `.env`
```env
DATABASE_URL=postgresql://neondb_owner:npg_PuF8eGWo0siL@ep-calm-pine-aen7hl2d-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=your-super-secret-key
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```
