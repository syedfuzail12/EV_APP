# ⚡ QUICK REFERENCE CARD

## 🎯 WEBHOOK CONFIGURATION

### Your Webhook URL:
```
https://ev-app-frb6.onrender.com/api/whatsapp
```

### Configure At:
```
https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
```

### Settings:
- **Field**: "When a message comes in"
- **URL**: `https://ev-app-frb6.onrender.com/api/whatsapp`
- **Method**: `HTTP POST`

---

## 🔑 ENVIRONMENT VARIABLES (Render)

Add these 3 to Render → ev-app-frb6 → Environment:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
```

---

## 📱 TESTING

### Join Sandbox:
```
Send to +14155238886:
join [your-code]
```

### Test Chatbot:
```
Send to +14155238886:
start
```

### Expected Reply:
```
🌟 Road Warrior Registration

Select your language:
1 - English
2 - हिंदी (Hindi)
```

---

## 🔗 QUICK LINKS

| Service | URL |
|---------|-----|
| **Twilio Console** | https://console.twilio.com/ |
| **WhatsApp Sandbox** | https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn |
| **Render Dashboard** | https://dashboard.render.com/ |
| **Backend API** | https://ev-app-frb6.onrender.com |
| **Supabase** | https://supabase.com/dashboard |

---

## 🚨 TROUBLESHOOTING

### Bot Not Responding?
1. Check webhook URL is correct
2. Check method is POST
3. Send "restart" to bot
4. Check Render logs

### No WhatsApp After Web Form?
1. Check 3 env vars in Render
2. Check Render deployed successfully
3. Check joined sandbox
4. Check Render logs

---

## 📖 DOCUMENTATION

| Guide | Purpose |
|-------|---------|
| **[CONFIGURE_TWILIO_WEBHOOK.md](CONFIGURE_TWILIO_WEBHOOK.md)** | Webhook setup |
| **[ACTIVATE_WHATSAPP_NOW.md](ACTIVATE_WHATSAPP_NOW.md)** | Full setup |
| **[DEBUG_WHATSAPP.md](DEBUG_WHATSAPP.md)** | Debugging |
| **[INDEX.md](INDEX.md)** | All docs |

---

## ✅ VERIFICATION

### Check Render Logs For:
```
✅ Twilio setup: hasSID: true, hasToken: true, hasWhatsApp: true
✅ Server running on 0.0.0.0:10000
✅ WhatsApp sent! SID: SM...
📩 Webhook received: ...
```

### Test Checklist:
- [ ] Webhook configured in Twilio
- [ ] 3 env vars added to Render
- [ ] Render deployed successfully
- [ ] Joined WhatsApp sandbox
- [ ] Send "start" → Get reply
- [ ] Complete chatbot → Get QR code
- [ ] Submit web form → Get WhatsApp message

---

## 🎯 COMMANDS

### Chatbot Commands:
- `start` - Start registration
- `restart` - Restart conversation
- `1` - English
- `2` - Hindi

---

## 📊 CURRENT STATUS

✅ Code deployed  
✅ Database connected  
✅ Web form working  
⏳ WhatsApp waiting for credentials  

**Add 3 env vars → LIVE!** 🚀
