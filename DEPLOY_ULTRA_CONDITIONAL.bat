@echo off
echo ================================================
echo DEPLOYING: ULTRA-CONDITIONAL PERSONALIZED FORM
echo ================================================
echo.
echo Changes:
echo [✓] Section B: Vehicle-specific fuel/charge options
echo [✓] Section C: Filtered challenges by vehicle type
echo [✓] Section E: Hyper-conditional EV interest questions
echo [✓] Labels change dynamically
echo [✓] Questions appear/disappear based on answers
echo.
echo This is now a WORLD-CLASS personalized form!
echo.

cd /d "c:\Users\syedf\OneDrive\Desktop\EV_APP"

echo [1/3] Adding changes...
git add .

echo [2/3] Committing...
git commit -m "Feat: Ultra-conditional logic - fully personalized form for each vehicle type"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ================================================
echo DEPLOYMENT COMPLETE!
echo.
echo Vercel will rebuild in 1-2 minutes
echo Test at: https://ev-app-seven.vercel.app
echo.
echo Read ULTRA_CONDITIONAL_LOGIC.md for testing guide
echo ================================================
pause
