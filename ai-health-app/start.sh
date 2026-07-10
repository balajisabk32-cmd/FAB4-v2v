#!/bin/bash

# Kill any existing processes on ports 8000, 3001, 3000/3002
echo "Cleaning up ports..."
npx kill-port 8000 3001 3000 3002 2>/dev/null

# 1. Start FastAPI ML Service
echo "Starting FastAPI ML Service on port 8000..."
cd ml-service
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null
uvicorn main:app --host 127.0.0.1 --port 8000 &
ML_PID=$!
cd ..

# 2. Start Express Backend
echo "Starting Express Orchestration Backend on port 3001..."
cd backend
npm run start &
EXPRESS_PID=$!
cd ..

# 3. Start Next.js Frontend
echo "Starting Next.js Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "All services launching. Press Ctrl+C to terminate all."
trap "kill $ML_PID $EXPRESS_PID $FRONTEND_PID; exit" INT
wait
