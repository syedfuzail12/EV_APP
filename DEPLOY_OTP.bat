@echo off
echo ================================================
echo DEPLOYING: OTP VERIFICATION SYSTEM
echo ================================================
echo.
echo Changes:
echo [✓] Backend: OTP utility + endpoints
echo [✓] Frontend: OTP UI with verification flow
echo [✓] Security: Rate limiting + validation
echo [✓] Styles: Beautiful mobile-first design
echo.
echo IMPORTANT: Make sure you've added Fast2SMS API key to .env!
echo.
pause

cd /d "c:\Users\syedf\OneDrive\Desktop\EV_APP"

echo [1/3] Adding changes...
git add .

echo [2/3] Committing...
git commit -m "Security: Add OTP verification with Fast2SMS - Phone number verification required for registration"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ================================================
echo DEPLOYMENT INITIATED!
echo.
echo Next steps:
echo 1. Wait 5 minutes for Render + Vercel to deploy
echo 2. Add Fast2SMS env vars to Render dashboard:
echo    - FAST2SMS_API_KEY=your_api_key
echo    - FAST2SMS_SENDER_ID=FSTSMS
echo 3. Test at: https://ev-app-seven.vercel.app
echo.
echo Full guide: OTP_DEPLOY_AND_TEST.md
echo ================================================
pause
