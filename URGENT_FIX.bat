@echo off
echo ========================================
echo URGENT FIX: Committing Render Config
echo ========================================
echo.

cd /d "c:\Users\syedf\OneDrive\Desktop\EV_APP"

echo Adding changes...
git add .

echo Committing...
git commit -m "Fix: Update Render build configuration"

echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo DONE! Now update Render settings:
echo.
echo 1. Go to https://render.com/dashboard
echo 2. Click your service
echo 3. Click Settings
echo 4. Set Root Directory: server
echo 5. Set Build Command: npm install
echo 6. Set Start Command: node index.js
echo 7. Click Save Changes
echo 8. Click Manual Deploy
echo ========================================
pause
