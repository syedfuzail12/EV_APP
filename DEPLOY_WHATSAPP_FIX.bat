@echo off
echo ========================================
echo  DEPLOYING WHATSAPP CHATBOT FIX
echo ========================================
echo.

echo [1/4] Adding files...
git add server/index.js WHATSAPP_CRASH_FIX.md

echo [2/4] Committing changes...
git commit -m "fix: WhatsApp chatbot crash on undefined response + add missing accessories step"

echo [3/4] Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Render will auto-deploy in 2-3 minutes
echo Backend: https://ev-app-frb6.onrender.com
echo.
echo WHAT WAS FIXED:
echo - Added safety check for undefined responses
echo - Added missing accessories step
echo - Chatbot now matches web form exactly
echo - No more crashes!
echo.
echo TEST WHATSAPP CHATBOT:
echo 1. Send WhatsApp to: +1 (415) 523-8886
echo 2. Type: restart
echo 3. Complete full flow
echo 4. Verify accessories question appears
echo 5. Should reach completion without crashes
echo.
pause
