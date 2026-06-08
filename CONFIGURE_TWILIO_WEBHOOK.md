# 🔧 Configure WhatsApp Sandbox Webhook in Twilio

## 📋 STEP-BY-STEP GUIDE

### Step 1: Login to Twilio Console
1. Go to: **https://console.twilio.com/**
2. Login with your Twilio account

---

### Step 2: Navigate to WhatsApp Sandbox
You have **3 ways** to get there:

#### Option A: Direct Link (Fastest)
- Go to: **https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn**

#### Option B: From Left Menu
1. Click **"Messaging"** in left sidebar
2. Click **"Try it out"**
3. Click **"Send a WhatsApp message"**

#### Option C: Search
1. Use search bar at top
2. Type: "WhatsApp sandbox"
3. Click on result

---

### Step 3: Join Sandbox (If Not Already Done)
You'll see a page with:
- **Sandbox number**: `+14155238886` (or similar)
- **Join code**: `join [word]-[word]`

**If you haven't joined yet:**
1. Open WhatsApp on your phone
2. Send message to `+14155238886`:
   ```
   join [your-code]
   ```
3. You'll receive: "You are all set!"

---

### Step 4: Configure Webhook (THIS IS THE IMPORTANT PART!)

On the WhatsApp Sandbox page, scroll down to see:

```
┌─────────────────────────────────────────────┐
│  WhatsApp Sandbox Settings                  │
├─────────────────────────────────────────────┤
│                                             │
│  When a message comes in                    │
│  ┌─────────────────────────────────────┐   │
│  │ https://                             │   │
│  └─────────────────────────────────────┘   │
│  [HTTP POST ▼]                              │
│                                             │
│  Status callback URL (optional)             │
│  ┌─────────────────────────────────────┐   │
│  │                                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Save]                                     │
└─────────────────────────────────────────────┘
```

---

### Step 5: Enter Your Webhook URL

1. **Find the field**: "When a message comes in"
2. **Enter this URL**:
   ```
   https://ev-app-frb6.onrender.com/api/whatsapp
   ```
3. **Check the dropdown**: Make sure it says **"HTTP POST"**
4. **Leave "Status callback URL" empty** (optional field, not needed)
5. **Click "Save"** button at bottom

---

## 🎯 EXACT SETTINGS

### Webhook Configuration:
```
Field: "When a message comes in"
URL: https://ev-app-frb6.onrender.com/api/whatsapp
Method: HTTP POST
```

### Visual Reference:
```
When a message comes in:
┌────────────────────────────────────────────────────┐
│ https://ev-app-frb6.onrender.com/api/whatsapp     │
└────────────────────────────────────────────────────┘
[HTTP POST ▼]
```

---

## ✅ VERIFICATION

After clicking "Save", you should see:
- ✅ **Green checkmark** or success message
- ✅ Your URL saved in the field
- ✅ Method is "HTTP POST"

---

## 🧪 TEST THE WEBHOOK

### Immediate Test:
1. Open WhatsApp on your phone
2. Send message to `+14155238886`:
   ```
   start
   ```
3. **Expected**: Bot replies with language selection:
   ```
   🌟 Road Warrior Registration
   
   Select your language:
   
   1 - English
   2 - हिंदी (Hindi)
   ```

### If Bot Responds:
✅ **SUCCESS!** Webhook is configured correctly!

### If No Response:
❌ **Check:**
1. Did you save the webhook URL?
2. Is the URL exactly: `https://ev-app-frb6.onrender.com/api/whatsapp`
3. Is method "HTTP POST" (not GET)?
4. Check Render logs for incoming webhook

---

## 🔍 DETAILED SCREENSHOTS GUIDE

### What You'll See on Twilio Page:

**Top Section - Sandbox Number:**
```
┌────────────────────────────────────────────┐
│  Try WhatsApp with Your Sandbox            │
├────────────────────────────────────────────┤
│                                            │
│  To connect your sandbox to WhatsApp,      │
│  send this code to +1 415 523 8886:        │
│                                            │
│      join [your-code-here]                 │
│                                            │
│  ✓ Joined as: +91 9945328423              │
└────────────────────────────────────────────┘
```

**Middle Section - Webhook Configuration:**
```
┌────────────────────────────────────────────┐
│  Configure your Sandbox                    │
├────────────────────────────────────────────┤
│                                            │
│  When a message comes in                   │
│  ┌──────────────────────────────────────┐ │
│  │ https://ev-app-frb6.onrender.com/    │ │
│  │ api/whatsapp                          │ │
│  └──────────────────────────────────────┘ │
│  [HTTP POST ▼]                             │
│                                            │
│  Status callback URL (optional)            │
│  ┌──────────────────────────────────────┐ │
│  │                                       │ │
│  └──────────────────────────────────────┘ │
│  [HTTP POST ▼]                             │
│                                            │
│  [Save]                                    │
└────────────────────────────────────────────┘
```

---

## 🚨 COMMON MISTAKES

### ❌ Wrong:
```
http://ev-app-frb6.onrender.com/api/whatsapp  (http not https)
https://ev-app-frb6.onrender.com              (missing /api/whatsapp)
https://ev-app-frb6.onrender.com/whatsapp     (missing /api)
localhost:5000/api/whatsapp                    (localhost won't work)
```

### ✅ Correct:
```
https://ev-app-frb6.onrender.com/api/whatsapp
```

### ❌ Wrong Method:
```
HTTP GET  ← Wrong!
```

### ✅ Correct Method:
```
HTTP POST  ← Correct!
```

---

## 📝 COPY-PASTE READY

**Webhook URL (copy this exactly):**
```
https://ev-app-frb6.onrender.com/api/whatsapp
```

---

## 🔄 IF YOU NEED TO CHANGE IT LATER

1. Go back to WhatsApp Sandbox Settings page
2. The URL will still be there in the field
3. Edit the URL if needed
4. Click "Save" again
5. Test with "start" message

---

## 🎯 QUICK CHECKLIST

Before saving, verify:
- [ ] URL starts with `https://` (not `http://`)
- [ ] URL is your Render backend: `ev-app-frb6.onrender.com`
- [ ] URL ends with `/api/whatsapp`
- [ ] Method is **HTTP POST**
- [ ] No typos in URL
- [ ] Clicked **Save** button

After saving:
- [ ] Send "start" to WhatsApp sandbox
- [ ] Receive bot reply within 5 seconds
- [ ] Check Render logs for: `📩 Webhook received:`

---

## 🔍 HOW TO FIND THIS PAGE AGAIN

### If You Lose the Page:

**Method 1 - Direct Link:**
```
https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
```

**Method 2 - Navigation:**
1. Twilio Console home
2. Left sidebar → **Messaging**
3. Click **Try it out**
4. Click **Send a WhatsApp message**

**Method 3 - Search:**
1. Top search bar in Twilio Console
2. Type: "sandbox"
3. Click "WhatsApp Sandbox"

---

## 📊 WHAT HAPPENS AFTER CONFIGURATION

### User Journey:
```
User sends WhatsApp → Twilio receives → 
Twilio calls your webhook → Your server processes → 
Your server sends reply → Twilio delivers to user
```

### Technical Flow:
```
WhatsApp Message
    ↓
Twilio WhatsApp API
    ↓
POST https://ev-app-frb6.onrender.com/api/whatsapp
    ↓
Your server (Render)
    ↓
Process message & generate reply
    ↓
Send back to Twilio
    ↓
Twilio sends to WhatsApp
    ↓
User receives reply
```

---

## 🎓 UNDERSTANDING WEBHOOKS

### What is a Webhook?
A webhook is like a phone number for your app. When someone messages your WhatsApp, Twilio "calls" your webhook URL to notify your app.

### Your Webhook URL:
```
https://ev-app-frb6.onrender.com/api/whatsapp
```

**Means**: "Twilio, when you receive a WhatsApp message for me, send it to this URL"

### What Data is Sent:
When user sends "start", Twilio POSTs:
```json
{
  "From": "whatsapp:+919945328423",
  "To": "whatsapp:+14155238886",
  "Body": "start"
}
```

Your server receives this, processes it, and sends back the reply.

---

## 🔐 WEBHOOK SECURITY (Optional)

For production, you can verify webhook requests are from Twilio:

1. Twilio signs each request
2. Your server can verify the signature
3. Prevents fake webhook calls

**Currently**: Your code accepts all requests (fine for MVP)  
**Future**: Add signature verification for production

---

## 🧪 TESTING WEBHOOK MANUALLY

### Test from Command Line (Windows):
```cmd
curl -X POST https://ev-app-frb6.onrender.com/api/whatsapp -d "From=whatsapp:+919945328423" -d "Body=start"
```

### Expected Response:
```
OK
```

### Check Render Logs:
You should see:
```
📩 Webhook received: {"From":"whatsapp:+919945328423","Body":"start"}
```

---

## 📱 SANDBOX vs PRODUCTION

### Sandbox (What You're Using Now):
- ✅ FREE
- ✅ Easy setup (no approval needed)
- ✅ Test with multiple phones
- ⚠️ Users must "join" sandbox first
- ⚠️ Messages show "Test" badge
- ⚠️ Limited to verified numbers (trial account)

### Production (Future):
- 💰 Paid ($0.005/message)
- 📝 Requires Facebook Business verification
- ✅ No "join" required
- ✅ No "Test" badge
- ✅ Send to any number
- ✅ Your own WhatsApp number

**For now**: Sandbox is perfect! ✅

---

## 🎯 FINAL VERIFICATION STEPS

After configuring webhook:

1. **Check Twilio Console**
   - Webhook URL saved correctly? ✅
   - Method is POST? ✅

2. **Test Message**
   - Send "start" to sandbox
   - Receive reply within 5 seconds? ✅

3. **Check Render Logs**
   - See `📩 Webhook received:`? ✅
   - See `📤 Sending welcome message`? ✅

4. **Test Full Flow**
   - Complete registration via chatbot
   - Receive referral code? ✅
   - Receive QR code image? ✅

---

## 🚀 YOU'RE DONE!

If webhook is configured correctly:
- ✅ Users can send "start" to register
- ✅ Bot asks questions
- ✅ Registration completes
- ✅ QR code sent via WhatsApp

**Next**: Test it! Send "start" to your sandbox number.

---

## 📞 QUICK REFERENCE

| What | Value |
|------|-------|
| **Webhook URL** | `https://ev-app-frb6.onrender.com/api/whatsapp` |
| **Method** | `HTTP POST` |
| **Configure At** | https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn |
| **Test By Sending** | `start` to your sandbox number |
| **Expected Response** | Language selection message |

---

## 💡 PRO TIP

**Bookmark this page** in Twilio Console so you can find it easily later:
```
https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
```

---

## 🎊 SUMMARY

**What You Did:**
1. Logged into Twilio Console
2. Went to WhatsApp Sandbox page
3. Entered webhook URL: `https://ev-app-frb6.onrender.com/api/whatsapp`
4. Set method: `HTTP POST`
5. Clicked Save

**What This Does:**
- Routes all incoming WhatsApp messages to your server
- Your server (Render) receives the messages
- Your chatbot processes and replies
- Users can now register via WhatsApp!

**Test Now:**
Send `start` to your WhatsApp sandbox number! 🚀

