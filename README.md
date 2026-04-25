# Dory

AI agent spend management — track, monitor, and control costs across agentic AI APIs in one place.

## Stack

- **Frontend:** Next.js + Tailwind CSS
- **Backend:** FastAPI + MongoDB
- **Auth:** Auth0

## Getting started

```bash
# Backend
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```
