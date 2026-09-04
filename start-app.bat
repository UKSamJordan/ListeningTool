@echo off
title Cambridge Stage 6 Listening Tool
echo ========================================================
echo Starting Cambridge Stage 6 Listening Lab (ListenQuest)...
echo ========================================================
set PATH=C:\Users\SAMUELRHAJ1\.gemini\antigravity\scratch\tools\node-v20.18.0-win-x64;%PATH%
cd /d "%~dp0"
start "" "http://localhost:3001"
node server/index.js
pause
