@echo off
echo DataAL Panel Masaustu Uygulamasi Baslatiliyor...
set NODE_ENV=development
cd /d "%~dp0"
start npm run dev
timeout /t 5
start electron .
