# ✅ MSG91 SMS Setup Guide (FREE - 25 SMS/day)

## ✅ MSG91 Integration Complete!

Your application now supports **FREE SMS notifications** via MSG91 REST API (25 SMS/day for India).

---

## 🚀 Setup Steps

### Step 1: Sign Up for MSG91 (FREE)
1. Visit: https://msg91.com/signup
2. Enter your email and create password
3. Verify your email address
4. Complete phone verification
5. **No payment required!** Free tier gives you **25 SMS/day**

### Step 2: Get Your API Key (AUTH_KEY)
1. Log in to MSG91 dashboard: https://control.msg91.com/
2. Go to **"API"** section in left sidebar
3. Click on **"Authkey"**
4. Copy your **Authkey** (looks like: `348752ATxxxxxxxxxxxxxx`)

### Step 3: Add to Render Environment Variables
1. Open your Render dashboard: https://dashboard.render.com/
2. Go to your backend service: `ev-app-frb6`
3. Click **"Environment"** tab
4. Add new environment variable:
   - **Key**: `MSG91_AUTH_KEY`
   - **Value**: `YOUR_ACTUAL_AUTHKEY_HERE` (paste the authkey from step 2)
5. Click **"Save Changes"**
6. Render will auto-redeploy (takes ~1-2 minutes)

### Step 4: Test SMS
After Render redeploys:
1. Open your app registration form
2. Fill out and submit the form
3. Check your phone - you should receive SMS with referral code! 📱

---

## 📊 How It Works

**Notification Priority:**
1. **First**: Tries WhatsApp (if Twilio configured, but limited to 50/day)
2. **Fallback**: Tries SMS via MSG91 REST API (25/day FREE)
3. **Final**: Shows referral code on screen if both fail

**SMS Message Format:**
```
Welcome John! You are now registered. Your referral code is: RW-A1B2. 
Share it with other riders to earn points and rewards. Road Warrior — let's go!
```

**Languages Supported:**
- English
- Hindi (हिंदी)
- Kannada (ಕನ್ನಡ)

---

## 🔧 Configuration (Simple - Only 1 Required)

### Required Configuration
```env
MSG91_AUTH_KEY=348752ATxxxxxxxxxxxxxx
```

That's it! Just add the authkey to Render and it works!

---

## 📱 Daily Limits

| Service | Free Limit | Paid Upgrade |
|---------|-----------|--------------|
| **MSG91 SMS** | 25/day | ₹0.15/SMS |
| Twilio WhatsApp | 50/day | $20/month |

**Recommendation**: MSG91 is perfect for testing and small-scale use (25 riders/day).

---

## ✅ Success Indicators

Check Render logs to verify SMS is working:

**✅ Success:**
```
📲 Sending notification to: 9945328423
⚠️ WhatsApp failed: 63038 (quota exceeded)
🔄 Falling back to SMS via MSG91...
📱 Attempting to send SMS via MSG91 to: 9945328423
🔑 MSG91 API key found, sending SMS...
📤 Sending SMS to: 9945328423
✅ SMS sent successfully via MSG91!
```

**❌ Not Configured:**
```
⚠️ MSG91 API key not configured - skipping SMS
ℹ️ Get your free API key from: https://msg91.com/signup
```

---

## 🎯 What Happens Now

### When User Registers:
1. Form submission → Backend receives data
2. Backend tries WhatsApp (fails due to 50 msg/day limit)
3. Backend tries MSG91 SMS via REST API ✅
4. User receives SMS with referral code
5. Success screen shows confirmation

### User Experience:
- ✅ Receives SMS notification immediately
- ✅ Sees referral code on screen
- ✅ Can share QR code with others
- ✅ Earns points for referrals

---

## 🚨 Troubleshooting

### Issue: "MSG91 API key not configured"
**Solution**: Add `MSG91_AUTH_KEY` to Render environment variables and wait for redeploy.

### Issue: "SMS send failed"
**Check:**
- Is your authkey correct?
- Have you used 25 SMS today already?
- Is the phone number valid (10 digits)?
- Check Render logs for detailed error

### Issue: "Cannot find package 'msg91-sdk'"
**Solution**: Fixed! We now use REST API directly (no SDK needed).

---

## 📞 Support

**MSG91 Support:**
- Email: support@msg91.com
- Docs: https://docs.msg91.com/
- API Docs: https://docs.msg91.com/reference/send-sms

**Your Integration:**
- Code location: `server/index.js` (sendSMS function uses REST API)
- Test endpoint: `POST /api/riders`
- Method: Direct HTTP POST to MSG91 API

---

## 🎉 You're All Set!

Once you add the `MSG91_AUTH_KEY` to Render, your app will automatically send SMS notifications via REST API. No additional packages or dependencies needed!

**Next Steps:**
1. Sign up at https://msg91.com/signup
2. Copy your authkey from dashboard
3. Add `MSG91_AUTH_KEY` to Render environment
4. Wait for auto-redeploy (~2 min)
5. Test registration form
6. Receive SMS! 📱

**Current Status:** ✅ Code deployed, waiting for your MSG91 authkey!
