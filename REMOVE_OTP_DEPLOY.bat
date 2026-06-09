@echo off
echo ================================================
echo REMOVING: OTP VERIFICATION SYSTEM
echo ================================================
echo.
echo Changes:
echo [✓] Removed OTP state and functions
echo [✓] Removed OTP UI from Section A
echo [✓] Restored simple phone number field
echo [✓] Form validation back to normal
echo.
echo OTP backend endpoints remain (inactive) but won't be called
echo.
pause

cd /d "c:\Users\syedf\OneDrive\Desktop\EV_APP"

echo [1/3] Adding changes...
git add .

echo [2/3] Committing...
git commit -m "Remove OTP verification - per interviewer request"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ================================================
echo DEPLOYMENT INITIATED!
echo.
echo Wait 2 minutes for Vercel to deploy
echo Test at: https://ev-app-seven.vercel.app
echo.
echo Form is now back to simple phone number field
echo No OTP verification required
echo ================================================
pause
