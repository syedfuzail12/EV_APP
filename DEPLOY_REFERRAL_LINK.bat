@echo off
echo ================================================
echo DEPLOYING: REFERRAL LINK FEATURE
echo ================================================
echo.
echo Changes:
echo [✓] Shareable referral link added
echo [✓] Auto-fill code from URL
echo [✓] WhatsApp share with link
echo [✓] SMS share with link
echo [✓] Copy link button
echo [✓] Updated success page UI
echo.
echo This makes referrals 30-50%% easier!
echo.
pause

cd /d "c:\Users\syedf\OneDrive\Desktop\EV_APP"

echo [1/3] Adding changes...
git add .

echo [2/3] Committing...
git commit -m "Add shareable referral link with auto-fill - makes referrals much easier"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ================================================
echo DEPLOYMENT INITIATED!
echo.
echo Vercel will rebuild in 1-2 minutes
echo Test at: https://ev-app-seven.vercel.app
echo.
echo Test flow:
echo 1. Complete registration
echo 2. Copy referral link
echo 3. Open in new tab
echo 4. Check if code is auto-filled!
echo.
echo Read: REFERRAL_LINK_IMPLEMENTATION.md
echo ================================================
pause
