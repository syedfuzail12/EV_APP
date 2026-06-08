@echo off
echo ========================================
echo DEPLOYING: Conditional Logic Fix
echo ========================================
echo.
echo Changes made:
echo - Section B: Fuel/charge method now conditional
echo - Petrol riders: Only see "Petrol Pump" option
echo - EV riders: Only see charging options
echo - Section C: General challenges filtered by vehicle type
echo.

cd /d "c:\Users\syedf\OneDrive\Desktop\EV_APP"

echo Adding changes...
git add .

echo Committing...
git commit -m "Fix: Make fuel/charge method conditional based on vehicle type"

echo Pushing to GitHub (triggers Vercel deploy)...
git push origin main

echo.
echo ========================================
echo DONE! 
echo.
echo Vercel will auto-deploy in 1-2 minutes.
echo Check: https://ev-app-seven.vercel.app
echo ========================================
pause
