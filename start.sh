#!/bin/bash

# ==============================================================================
# ADVANCED LOCAL RUNNER & HEALTH CHECKER (Email Service + Backend + Frontend)
# ==============================================================================

# Color codes for premium terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}===============================================================${NC}"
echo -e "${CYAN}         Starting Onemoregift Services Locally                 ${NC}"
echo -e "${CYAN}===============================================================${NC}"

# 1. Validate environment
if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "email-service" ]; then
    echo -e "${RED}Error: Run this script from the project root directory containing backend, frontend, and email-service!${NC}"
    exit 1
fi

# Check Node.js version
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}Error: Node.js is not installed!${NC}"
    exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 20 ]; then
    echo -e "${YELLOW}Warning: Node.js version is $NODE_VER. Recommended version is >= 20.${NC}"
fi

# Helper function to find PID occupying a port
get_port_pid() {
    local port=$1
    local pid=""
    # 1. Try ss (most reliable on this system)
    if command -v ss >/dev/null 2>&1; then
        pid=$(ss -ltnp "sport = :$port" 2>/dev/null | grep -oP 'pid=\K\d+' | head -n 1)
    fi
    # 2. Try lsof fallback
    if [ -z "$pid" ] && command -v lsof >/dev/null 2>&1; then
        pid=$(lsof -t -i :$port -sTCP:LISTEN 2>/dev/null | head -n 1)
    fi
    # 3. Try fuser fallback
    if [ -z "$pid" ] && command -v fuser >/dev/null 2>&1; then
        pid=$(fuser $port/tcp 2>/dev/null | tr -d ' ' | cut -d'/' -f1)
    fi
    echo "$pid"
}

# 2. Check and resolve port conflicts
check_and_resolve_port() {
    local port=$1
    local name=$2
    local pid=$(get_port_pid $port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Port $port ($name) is currently occupied by PID $pid.${NC}"
        if [ -t 0 ]; then
            read -p "Would you like to kill PID $pid and continue? (y/N): " confirm
            if [[ "$confirm" =~ ^[Yy]$ ]]; then
                echo -e "${GREEN}Killing PID $pid...${NC}"
                kill -9 $pid 2>/dev/null
                sleep 1.5
            else
                echo -e "${RED}Cannot proceed while port $port is occupied. Exiting.${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}Non-interactive shell. Automatically releasing port $port (Killing PID $pid)...${NC}"
            kill -9 $pid 2>/dev/null
            sleep 1.5
        fi
    fi
}

check_and_resolve_port 8080 "Email Service"
check_and_resolve_port 9000 "Backend"
check_and_resolve_port 3000 "Frontend"

# 3. Ensure dependencies are installed
check_node_modules() {
    local dir=$1
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${YELLOW}node_modules missing in /$dir. Running npm install...${NC}"
        (cd "$dir" && npm install)
    fi
}

check_node_modules "email-service"
check_node_modules "backend"
check_node_modules "frontend"

# 4. Graceful Cleanup Handler
cleanup() {
    # Disable trap to avoid loop
    trap - SIGINT SIGTERM EXIT
    echo -e "\n${RED}===============================================================${NC}"
    echo -e "${RED}         Stopping all services & cleaning ports                ${NC}"
    echo -e "${RED}===============================================================${NC}"
    
    # Kill all child jobs of this shell
    local pids=$(jobs -p)
    if [ ! -z "$pids" ]; then
        kill $pids 2>/dev/null
        sleep 1
        kill -9 $pids 2>/dev/null
    fi
    
    # Direct cleanup of ports to ensure no orphaned processes
    for port in 8080 9000 3000 3001; do
        local pid=$(get_port_pid $port)
        if [ ! -z "$pid" ]; then
            echo -e "${YELLOW}Cleaning orphaned process on port $port (PID $pid)...${NC}"
            kill -9 $pid 2>/dev/null
        fi
    done
    
    echo -e "${GREEN}All services stopped cleanly. Goodbye!${NC}"
    exit 0
}

# Bind cleanup to termination signals
trap cleanup SIGINT SIGTERM EXIT

# 5. Launch Services
echo -e "\n${CYAN}Starting services...${NC}"

# Start Email Service
(cd email-service && npm start) &
EMAIL_JOB=$!

# Start Backend
(cd backend && npm start) &
BACKEND_JOB=$!

# Start Frontend (Force port 3000 to prevent Next.js from auto-falling back)
(cd frontend && npm run dev -- -p 3000) &
FRONTEND_JOB=$!

# 6. Active Health Verification
echo -e "\n${CYAN}Performing Active Health Checks...${NC}"

# Email Service Health Check
EMAIL_HEALTHY=false
for i in {1..30}; do
    if ! kill -0 $EMAIL_JOB 2>/dev/null; then
        echo -e "${RED}Email Service process crashed unexpectedly!${NC}"
        exit 1
    fi
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || true)
    if [ "$STATUS" -eq 200 ]; then
        echo -e "${GREEN}✔ Email Service is HEALTHY (HTTP 200 at http://localhost:8080/health)${NC}"
        EMAIL_HEALTHY=true
        break
    fi
    sleep 1
done

if [ "$EMAIL_HEALTHY" = false ]; then
    echo -e "${RED}✘ Email Service health check timed out!${NC}"
    exit 1
fi

# Backend Health Check
BACKEND_HEALTHY=false
for i in {1..30}; do
    if ! kill -0 $BACKEND_JOB 2>/dev/null; then
        echo -e "${RED}Backend process crashed unexpectedly!${NC}"
        exit 1
    fi
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/api/v1/health || true)
    if [ "$STATUS" -eq 200 ]; then
        echo -e "${GREEN}✔ Backend is HEALTHY (HTTP 200 at http://localhost:9000/api/v1/health)${NC}"
        BACKEND_HEALTHY=true
        break
    fi
    sleep 1
done

if [ "$BACKEND_HEALTHY" = false ]; then
    echo -e "${RED}✘ Backend health check timed out!${NC}"
    exit 1
fi

# Frontend Health Check
FRONTEND_HEALTHY=false
for i in {1..45}; do
    if ! kill -0 $FRONTEND_JOB 2>/dev/null; then
        echo -e "${RED}Frontend process crashed unexpectedly!${NC}"
        exit 1
    fi
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || true)
    if [ "$STATUS" -ge 200 ] && [ "$STATUS" -lt 400 ]; then
        echo -e "${GREEN}✔ Frontend is HEALTHY (HTTP $STATUS at http://localhost:3000)${NC}"
        FRONTEND_HEALTHY=true
        break
    fi
    sleep 1
done

if [ "$FRONTEND_HEALTHY" = false ]; then
    echo -e "${RED}✘ Frontend health check timed out!${NC}"
    exit 1
fi

echo -e "\n${GREEN}===============================================================${NC}"
echo -e "${GREEN}    SUCCESS: All services running & healthy!                   ${NC}"
echo -e "${GREEN}    - Email Service: http://localhost:8080                     ${NC}"
echo -e "${GREEN}    - Backend:       http://localhost:9000                     ${NC}"
echo -e "${GREEN}    - Frontend:      http://localhost:3000                     ${NC}"
echo -e "${GREEN}                                                               ${NC}"
echo -e "${GREEN}    NOTE: OTP codes will also print in Backend terminal logs.  ${NC}"
echo -e "${GREEN}===============================================================${NC}\n"

# Keep script alive and stream logs
wait
