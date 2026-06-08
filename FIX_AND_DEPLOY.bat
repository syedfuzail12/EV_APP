@echo off
echo ====================================
echo FIXING RENDER DEPLOYMENT ERROR
echo ====================================
echo.

cd /d "c:\Users\syedf\OneDrive\Desktop\EV_APP"

echo Step 1: Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo Step 2: Adding all changes to git...
git add .

echo.
echo Step 3: Committing changes...
git commit -m "Fix: Add missing dependencies for Render deployment"

echo.
echo Step 4: Pushing to GitHub (this will trigger Render deploy)...
git push origin main

echo.
echo ====================================
echo DONE! Render will now redeploy.
echo Wait 3-5 minutes and check Render dashboard.
echo ====================================
pause
