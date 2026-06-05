# Debug WhatsApp Bot Issue

## Problem:
You send "start" to WhatsApp bot but don't receive the registration form.

## Root Causes:

### 1. **Twilio Credentials Missing in Render**
The bot can RECEIVE your messages (webhook works) but cannot SEND replies because Twilio credentials are not set.

**Check Render Environment Variables:**
Go to: https://dashboard.render.com → Your Service → Environment

**These MUST be set:**
```
TWILIO_ACCOUNT_SID = Your Twilio Account SID (starts with AC...)
TWILIO_AUTH_TOKEN = Your Twilio Auth Token
TWILIO_WHATSAPP_NUMBER = +14155238886
```

### 2. **Render Service Needs Restart**
After setting environment variables, Render needs to restart.

---

## ✅ FIX IT NOW - Step by Step:

### Step 1: Get Twilio Credentials

1. Go to: https://console.twilio.com
2. On the dashboard, you'll see:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)
3. Copy both

### Step 2: Set in Render

1. Go to: https://dashboard.render.com
2. Find your service: **ev-app-frb6**
3. Click **Environment** in left menu
4. Add/Update these variables:

```
TWILIO_ACCOUNT_SID = AC... (paste your Account SID)
TWILIO_AUTH_TOKEN = ... (paste your Auth Token)
TWILIO_WHATSAPP_NUMBER = +14155238886
APP_URL = https://your-vercel-app.vercel.app
```

5. Click **Save Changes**
6. Service will automatically restart (takes 1-2 minutes)

### Step 3: Wait for Restart

Check Render logs, you should see:
```
Starting service...
Server running on 0.0.0.0:5000
```

### Step 4: Test Again

1. Open WhatsApp
2. Send to: **+1 415 523 8886**
3. Send: **restart** (to clear any old session)
4. You should immediately receive:

```
🌟 Road Warrior Registration

Select your language:

1 - English
2 - हिंदी (Hindi)
```

5. Reply: **1**
6. You should receive: "👋 Welcome to Road Warrior! What's your full name?"

---

## 🔍 How to Check if Credentials Are Set:

### In Render Dashboard:
1. Go to your service
2. Click **Environment**
3. You should see:
   - ✅ TWILIO_ACCOUNT_SID (value hidden)
   - ✅ TWILIO_AUTH_TOKEN (value hidden)
   - ✅ TWILIO_WHATSAPP_NUMBER
   - ✅ SUPABASE_URL
   - ✅ SUPABASE_KEY
   - ✅ APP_URL

### In Render Logs:
After restart, send "start" and check logs for:
```
📱 WhatsApp message from: 9945328423 → start
```

If you see an error like:
```
Error: Twilio credentials not configured
```
Then credentials are missing.

---

## 🚨 Common Issues:

### Issue 1: Bot receives but doesn't reply
**Cause:** Twilio credentials not set in Render
**Fix:** Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Render Environment

### Issue 2: "Message failed" in logs
**Cause:** Wrong credentials or WhatsApp number format
**Fix:** Verify Account SID starts with "AC", Auth Token is correct

### Issue 3: No logs showing in Render
**Cause:** Webhook URL not configured in Twilio
**Fix:** Go to Twilio Sandbox, set webhook to `https://ev-app-frb6.onrender.com/api/whatsapp`

### Issue 4: Getting old messages/errors
**Cause:** Old session stuck
**Fix:** Send "restart" to clear session

---

## 📝 Quick Checklist:

- [ ] Twilio webhook configured: `https://ev-app-frb6.onrender.com/api/whatsapp`
- [ ] Webhook method set to: **POST**
- [ ] TWILIO_ACCOUNT_SID added to Render
- [ ] TWILIO_AUTH_TOKEN added to Render
- [ ] TWILIO_WHATSAPP_NUMBER = +14155238886
- [ ] Render service restarted
- [ ] Sent "restart" to WhatsApp bot
- [ ] Joined Twilio sandbox (sent "join [code]")

---

## 🎯 Test If It's Working:

Send this sequence to **+1 415 523 8886**:

```
1. restart
   → Should receive: Language selection

2. 1
   → Should receive: "What's your full name?"

3. Test User
   → Should receive: "WhatsApp number?"
```

If you get stuck at any point, **check Render logs** for the exact error message.

---

## 📱 Where to Find Everything:

**Twilio Credentials:**
https://console.twilio.com → Dashboard

**Twilio Webhook Config:**
https://console.twilio.com → Messaging → Try it out → WhatsApp

**Render Environment:**
https://dashboard.render.com → ev-app-frb6 → Environment

**Render Logs:**
https://dashboard.render.com → ev-app-frb6 → Logs

---

**Most likely issue:** TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are not set in Render Environment Variables. Add them and restart! 🚀
