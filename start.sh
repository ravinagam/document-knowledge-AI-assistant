#!/bin/bash
# One-command startup for Document Knowledge Assistant
echo "Starting Document Knowledge Assistant..."
echo "First run will download the Llama 3.2 model (~2 GB) — this takes a few minutes."
echo ""
docker compose up --build -d
echo ""
echo "App is starting up. Open http://localhost:3000 in your browser."
echo "Backend API: http://localhost:8000/docs"
echo ""
echo "To stop: docker compose down"
echo "To view logs: docker compose logs -f"
