@echo off
echo ========================================
echo    KYC API Testing Suite (Windows)
echo ========================================
echo.
echo Testing all KYC APIs...
echo.

node scripts/test-kyc-apis.js

echo.
echo Press any key to exit...
pause >nul
