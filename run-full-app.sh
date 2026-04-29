#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

if ! command -v mvn >/dev/null 2>&1; then
  echo "Error: Maven (mvn) is required but not found in PATH."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but not found in PATH."
  exit 1
fi

if [[ ! -d "${FRONTEND_DIR}/node_modules" ]]; then
  echo "Installing frontend dependencies..."
  npm --prefix "${FRONTEND_DIR}" ci
fi

PIDS=()

cleanup() {
  echo
  echo "Stopping all services..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "${pid}" >/dev/null 2>&1; then
      kill "${pid}" >/dev/null 2>&1 || true
    fi
  done
  wait || true
  echo "All services stopped."
}

trap cleanup EXIT INT TERM

echo "Starting backend nodes..."
mvn -f "${BACKEND_DIR}/pom.xml" spring-boot:run -Dspring-boot.run.profiles=node5010 &
PIDS+=("$!")
mvn -f "${BACKEND_DIR}/pom.xml" spring-boot:run -Dspring-boot.run.profiles=node5011 &
PIDS+=("$!")
mvn -f "${BACKEND_DIR}/pom.xml" spring-boot:run -Dspring-boot.run.profiles=node5012 &
PIDS+=("$!")

echo "Starting frontend..."
npm --prefix "${FRONTEND_DIR}" run dev &
PIDS+=("$!")

echo
echo "App started:"
echo "- Backend nodes: http://localhost:5010, http://localhost:5011, http://localhost:5012"
echo "- Frontend:      http://localhost:5173"
echo
echo "Press Ctrl+C to stop everything."

wait
