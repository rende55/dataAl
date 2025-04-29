@echo off
echo DataAL Panel Masaustu Uygulamasi Baslatiliyor...
set NODE_ENV=production
cd /d "%~dp0"
npx electron .
