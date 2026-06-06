# Render Environment Variables - Copy & Paste

## 🎯 Add This Variable to Render

Go to: https://dashboard.render.com/ → **ev-app-frb6** → **Environment** tab

### MSG91 SMS Configuration

**Variable Name:**
```
MSG91_AUTH_KEY
```

**Variable Value:**
```
YOUR_ACTUAL_MSG91_AUTHKEY_HERE
```

**Where to get the authkey:**
1. Sign up: https://msg91.com/signup
2. Login: https://control.msg91.com/
3. Go to: **API** → **Authkey**
4. Copy the authkey (looks like: `348752ATxxxxxxxxxxxxxx`)
5. Paste it in Render as the value for `MSG91_AUTH_KEY`

---

## 📋 Current Render Environment Variables

Make sure you have these variables set:

| Variable | Value | Status |
|----------|-------|--------|
| `SUPABASE_URL` | https://wzuhdwojthzrnzibxwlu.supabase.co | ✅ Set |
| `SUPABASE_KEY` | eyJhbGciOiJIUzI1NiIsInR5... | ✅ Set |
| `TWILIO_ACCOUNT_SID` | AC8802a9de... | ✅ Set |
| `TWILIO_AUTH_TOKEN` | Your token | ✅ Set |
| `TWILIO_WHATSAPP_NUMBER` | +14155238886 | ✅ Set |
| `APP_URL` | https://ev-app-frb6.onrender.com | ✅ Set |
| `PORT` | 5000 | ✅ Set |
| **`MSG91_AUTH_KEY`** | **Get from MSG91** | ⏳ **TO ADD** |

---

## 🚀 After Adding the Variable

1. Click **"Save Changes"** in Render
2. Render will automatically redeploy (wait ~2 minutes)
3. Check deployment logs to verify success
4. Test registration form
5. Check phone for SMS! 📱

---

## ✅ Verification

After Render redeploys, test registration and check logs:

**Success logs should show:**
```
📲 Sending notification to: 9945328423
🔄 Falling back to SMS via MSG91...
🔑 MSG91 API key found, sending SMS...
✅ SMS sent successfully via MSG91!
```

**If you see this, it means you need to add the key:**
```
⚠️ MSG91 API key not configured - skipping SMS
```

---

## 📞 Quick Links

- **Render Dashboard**: https://dashboard.render.com/
- **MSG91 Signup**: https://msg91.com/signup
- **MSG91 Dashboard**: https://control.msg91.com/
- **Your Backend**: https://ev-app-frb6.onrender.com
- **Your Frontend**: (Your Vercel URL)

---

That's it! Just add the one variable and you're done! 🎉
