# 🔍 WHATSAPP DEBUGGING GUIDE

## 🎯 HOW TO CHECK IF IT'S WORKING

### Step 1: Check Render Environment Variables
1. Go to: https://dashboard.render.com/
2. Click: **ev-app-frb6** service
3. Click: **Environment** tab
4. Verify these 3 variables exist:

```
✅ TWILIO_ACCOUNT_SID = ACxxx... (starts with AC)
✅ TWILIO_AUTH_TOKEN = (32 characters)
✅ TWILIO_WHATSAPP_NUMBER = +14155238886 (or similar)
```

**If missing:** Add them and wait 2 minutes for redeploy

---

### Step 2: Check Render Logs
1. Render Dashboard → **ev-app-frb6** → **Logs** tab
2. Look for this on startup:

```
🔧 Twilio setup: {
  hasSID: true,
  hasToken: true,
  hasWhatsApp: true,
  clientInitialized: true
}
Server running on 0.0.0.0:10000
```

**✅ GOOD**: All `true` means Twilio is configured  
**❌ BAD**: Any `false` means credentials missing/wrong

---

### Step 3: Check Twilio Sandbox
1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Verify:
   - **Status**: Active
   - **Your phone joined**: Shows your number
   - **Webhook configured**: Shows your URL

**Webhook should be:**
```
https://ev-app-frb6.onrender.com/api/whatsapp
Method: POST
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: "No WhatsApp message after web form submission"

**Check in Render Logs:**
```
📲 Sending notification to: 9945328423
📤 Attempting to send WhatsApp message to: 9945328423
✅ WhatsApp sent! SID: SMxxxxx
```

**If you see `⚠️ Twilio not configured`:**
- **Problem**: Environment variables not set in Render
- **Fix**: Add the 3 variables to Render → Environment

**If you see `❌ WhatsApp failed: 63007`:**
- **Problem**: Phone number not joined sandbox
- **Fix**: Send `join [code]` from your phone to `+14155238886`

**If you see `❌ WhatsApp failed: 21608`:**
- **Problem**: TWILIO_WHATSAPP_NUMBER is wrong
- **Fix**: Check Twilio sandbox for correct number, update in Render

**If you see `❌ WhatsApp failed: 20003`:**
- **Problem**: TWILIO_AUTH_TOKEN is wrong
- **Fix**: Get correct token from Twilio dashboard, update in Render

**If you see `❌ WhatsApp failed: Account not authorized`:**
- **Problem**: Trial account can only send to verified numbers
- **Fix**: Twilio Console → Verified Caller IDs → Add your number

---

### Issue 2: "Chatbot not responding to 'start' message"

**Check in Render Logs:**
```
📩 Webhook received: {"From":"whatsapp:+919945328423","Body":"start"}
📱 From: 9945328423 (raw: whatsapp:+919945328423) | Body: start
🔄 Restart/Start command received
📤 Sending welcome message
```

**If you see NOTHING in logs:**
- **Problem**: Webhook not configured in Twilio
- **Fix**: 
  1. Twilio Console → WhatsApp Sandbox Settings
  2. "When a message comes in" → Enter webhook URL
  3. Save

**If webhook IS configured but still nothing:**
- **Problem**: Webhook URL is wrong
- **Fix**: Double-check URL: `https://ev-app-frb6.onrender.com/api/whatsapp`

**If you see `❌ Missing from or body`:**
- **Problem**: Twilio sending wrong format
- **Fix**: Check webhook method is POST (not GET)

---

### Issue 3: "QR code not received after chatbot"

**Check in Render Logs:**
```
✅ Registration complete
💾 Data saved, code: RW-4821
📱 Generating QR for: https://your-app.vercel.app/?ref=RW-4821
📤 Sending QR via Twilio
✅ WhatsApp media sent! SID: SMxxxxx
```

**If you see `⚠️ Twilio client not initialized`:**
- **Problem**: Credentials missing or wrong
- **Fix**: Re-check the 3 environment variables in Render

**If you see `❌ Save error:`:**
- **Problem**: Database write failed
- **Fix**: Check SUPABASE_URL and SUPABASE_KEY in Render

**If QR generation takes too long:**
- **Normal**: QR generation can take 10-20 seconds
- **Wait**: Be patient, it will arrive

---

### Issue 4: "Bot sends messages but I don't receive them"

**Check:**
1. **Did you join sandbox?**
   - Send `join [code]` to `+14155238886`
   - You should get: "You are all set!"

2. **Is your number verified?** (for trial accounts)
   - Twilio Console → Verified Caller IDs
   - Add your number if not there

3. **Render logs show success?**
   - Look for: `✅ WhatsApp sent! SID: SMxxxxx`
   - If yes, problem is on Twilio side

4. **Check Twilio logs:**
   - Twilio Console → Monitor → Logs → Messaging
   - Find your SID (from Render logs)
   - See delivery status

---

### Issue 5: "Bot stuck on a question"

**User Actions:**
- Send: `restart` to restart conversation
- Send: `start` to begin fresh

**Check Session:**
- Sessions stored in memory (JavaScript Map)
- If server restarts, sessions lost (this is normal)
- User just needs to send `restart`

---

### Issue 6: "Referral code not valid when scanning QR"

**Check:**
1. **QR contains correct URL?**
   - Should be: `https://your-app.vercel.app/?ref=RW-XXXX`
   - Not: `http://localhost:5173/?ref=RW-XXXX`

2. **APP_URL set correctly in Render?**
   - Render → Environment → `APP_URL`
   - Should be your Vercel URL

3. **Referral code exists in database?**
   - Admin dashboard → Check if code is there
   - Score checker → Enter code → Should find rider

---

## 🔎 DETAILED LOG INTERPRETATION

### Successful Web Form Submission:
```
📲 Sending notification to: 9945328423
📤 Attempting to send WhatsApp message to: 9945328423
📝 Message preview: Welcome Ramesh! You are now registered...
📞 Twilio client initialized, sending message...
From: +14155238886
To: +919945328423
✅ WhatsApp sent! SID: SMa1b2c3d4e5f6
✅ WhatsApp notification sent
```
**Meaning**: Everything worked! User should receive message.

---

### Successful Chatbot Conversation:
```
📩 Webhook received: {"From":"whatsapp:+919945328423","Body":"start"}
📱 From: 9945328423 | Body: start
🔄 Restart/Start command received
📤 Sending welcome message

📩 Webhook received: {"From":"whatsapp:+919945328423","Body":"1"}
📱 From: 9945328423 | Body: 1
📊 Session: { step: 'language', language: 'en' }
⚙️ Processing response
💬 Response: 👋 Welcome to Road Warrior!...
📤 Sending next question

... (continues for each question) ...

✅ Registration complete
💾 Data saved, code: RW-4821
📱 Generating QR for: https://your-app/?ref=RW-4821
📤 Sending QR via Twilio
✅ WhatsApp media sent! SID: SMf6e5d4c3b2a1
```
**Meaning**: Complete conversation, QR sent successfully.

---

### Failed WhatsApp Send:
```
📤 Attempting to send WhatsApp message to: 9945328423
❌ WhatsApp failed: The 'To' number +919945328423 is not currently reachable via SMS or WhatsApp.
Error code: 63007
⚠️ WhatsApp failed: 63007
ℹ️ Using on-screen notification
```
**Meaning**: Number not joined sandbox. App still works (shows code on screen).

---

## 🧪 TESTING CHECKLIST

### Before Testing:
- [ ] All 3 environment variables added to Render
- [ ] Render deployment finished (check Events tab)
- [ ] Joined WhatsApp sandbox (sent "join [code]")
- [ ] Webhook configured in Twilio
- [ ] Webhook URL is correct
- [ ] Webhook method is POST

### Test 1: Web Form → WhatsApp
- [ ] Open web app
- [ ] Fill form with YOUR phone number
- [ ] Select language (EN or HI)
- [ ] Submit
- [ ] Check Render logs for `✅ WhatsApp sent!`
- [ ] Check your WhatsApp for message
- [ ] Message should be in selected language
- [ ] Message should contain referral code

### Test 2: WhatsApp Chatbot
- [ ] Open WhatsApp
- [ ] Send "start" to `+14155238886`
- [ ] Receive language selection message
- [ ] Reply "1" (English)
- [ ] Receive welcome message
- [ ] Answer all questions
- [ ] Receive referral code message
- [ ] Wait 20 seconds
- [ ] Receive QR code image

### Test 3: QR Code Scan
- [ ] Screenshot QR code from WhatsApp
- [ ] Use phone camera to scan QR
- [ ] Opens web app
- [ ] URL contains `?ref=RW-XXXX`
- [ ] Referral code auto-filled in Section F
- [ ] Green banner shows "Referral code applied"
- [ ] Submit form
- [ ] Check database: referred_by_code should be set

### Test 4: Referral Points
- [ ] Submit form with referral code
- [ ] Check admin dashboard
- [ ] Original referrer should have +5 points
- [ ] Referral count increased by 1

---

## 📊 TWILIO CONSOLE CHECKS

### Check Message Logs:
1. Twilio Console → Monitor → Logs → Messaging
2. See all sent messages
3. Click on message → See delivery status

**Statuses:**
- ✅ **Delivered**: Success!
- ⏳ **Queued**: In progress
- ❌ **Failed**: See error reason
- ⚠️ **Undelivered**: Number unreachable

### Check Usage:
1. Twilio Console → Monitor → Usage
2. See how many messages sent
3. Check remaining credit

### Check Verified Numbers:
1. Twilio Console → Phone Numbers → Manage → Verified Caller IDs
2. Add your test numbers here (for trial accounts)

---

## 🛠️ MANUAL TESTS

### Test Webhook Manually:
```bash
curl -X POST https://ev-app-frb6.onrender.com/api/whatsapp \
  -d "From=whatsapp:+919945328423" \
  -d "Body=start"
```

**Expected Response:** `OK`

**Check Render Logs:**
```
📩 Webhook received: {"From":"whatsapp:+919945328423","Body":"start"}
```

---

### Test QR Generation:
Open in browser:
```
https://ev-app-frb6.onrender.com/api/qr/RW-4821
```

**Expected Response:**
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KG..."
}
```

---

### Test Rider Lookup:
Open in browser:
```
https://ev-app-frb6.onrender.com/api/riders/9945328423
```

**Expected Response:**
```json
{
  "fullName": "Ramesh Kumar",
  "points": 10,
  "referralCount": 0,
  "referralCode": "RW-4821",
  ...
}
```

---

## 🚨 EMERGENCY FIXES

### If Render is Down:
1. Render Dashboard → Service → Check status
2. If "Build Failed" → Check build logs
3. If "Crashed" → Check runtime logs
4. Manual Deploy → Click "Manual Deploy" → "Deploy latest commit"

### If Twilio Quota Exceeded:
```
❌ WhatsApp failed: Account exceeded the 50 daily messages limit
```
**Fix**: 
- Add credit card to Twilio account (removes limit)
- Or wait 24 hours for quota reset
- Or create new trial account

### If Database Connection Failed:
```
❌ Database save error: relation "riders" does not exist
```
**Fix**:
- Check SUPABASE_URL and SUPABASE_KEY in Render
- Run SQL schema: Copy from `supabase-schema.sql` → Run in Supabase SQL editor

### If Environment Variables Not Working:
1. Render → Environment → Edit variable
2. Click "Save Changes"
3. **IMPORTANT**: Wait 2 minutes for redeploy
4. Check Logs tab to see if deployment finished
5. Look for: `🔧 Twilio setup: { hasSID: true, ... }`

---

## 📞 GET HELP

### Render Logs:
```
https://dashboard.render.com/ → ev-app-frb6 → Logs
```

### Twilio Logs:
```
https://console.twilio.com/ → Monitor → Logs → Messaging
```

### Supabase Logs:
```
https://supabase.com/dashboard → Your Project → Logs
```

### Check Server Status:
```
https://ev-app-frb6.onrender.com/
```
Should return: "EV Rider Data Collection API"

---

## ✅ SUCCESS INDICATORS

**Everything is working when you see:**

### In Render Logs:
```
✅ Twilio setup: all true
✅ Server running on 0.0.0.0:10000
✅ WhatsApp sent! SID: SM...
✅ WhatsApp media sent! SID: SM...
```

### In Your WhatsApp:
```
✅ Registration confirmation message received
✅ Bot responds to "start" message
✅ Bot asks questions one by one
✅ QR code image received
```

### In Database (Supabase):
```
✅ New rider entry created
✅ Referral code saved
✅ Points = 10
✅ Referred_by_code set (if used referral)
```

### In Admin Dashboard:
```
✅ New rider appears in list
✅ Correct segment assigned
✅ Language saved correctly
```

---

## 🎯 MOST COMMON MISTAKES

1. ❌ **Forgot to join sandbox** → Send "join [code]" first
2. ❌ **Wrong WhatsApp number** → Check Twilio sandbox for correct number
3. ❌ **Webhook not configured** → Set in Twilio WhatsApp Sandbox Settings
4. ❌ **Webhook method is GET** → Should be POST
5. ❌ **Environment variables not saved** → Click "Save Changes" in Render
6. ❌ **Didn't wait for redeploy** → Wait 2 minutes after saving variables
7. ❌ **Testing with unverified number** → Add to Verified Caller IDs (trial accounts)
8. ❌ **APP_URL is localhost** → Should be your Vercel URL

---

## 🎊 FINAL CHECKLIST

If all these are ✅, WhatsApp WILL work:

- [ ] TWILIO_ACCOUNT_SID in Render (starts with AC)
- [ ] TWILIO_AUTH_TOKEN in Render (32 chars)
- [ ] TWILIO_WHATSAPP_NUMBER in Render (+1...)
- [ ] Render deployment finished (no errors)
- [ ] Joined WhatsApp sandbox (got confirmation)
- [ ] Webhook URL configured in Twilio
- [ ] Webhook method is POST
- [ ] Render logs show: `hasSID: true, hasToken: true, hasWhatsApp: true`
- [ ] Test phone number verified (for trial accounts)

**If ALL checked, test now!** 🚀

---

Need more help? Check these files:
- **ACTIVATE_WHATSAPP_NOW.md** - Full setup guide
- **WHATSAPP_FEATURE_SUMMARY.md** - What features you have
- **WHATSAPP_EXAMPLE_CONVERSATION.md** - See how it works

