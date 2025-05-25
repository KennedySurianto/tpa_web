@echo off

start "User Service" cmd /k "cd backend/user-service && go run cmd/main.go"
start "Auth Service" cmd /k "cd backend/auth-service && go run cmd/main.go"
start "Frontend" cmd /k "cd frontend && npm run dev"
