# ✅ WHATSAPP ACTIVATION CHECKLIST

## 📋 BEFORE YOU START
- [ ] Have access to your phone (for WhatsApp)
- [ ] Have a NEW email address (for new Twilio account)
- [ ] 10 minutes of time

---

## STEP 1: CREATE TWILIO ACCOUNT (3 MIN)
- [ ] Go to: https://www.twilio.com/try-twilio
- [ ] Sign up with NEW email
- [ ] Verify phone number
- [ ] You get $15 free credit!

---

## STEP 2: GET CREDENTIALS (2 MIN)
- [ ] Login: https://console.twilio.com/
- [ ] Copy **Account SID**: `AC____________________` 
- [ ] Copy **Auth Token**: `________________________________`
- [ ] Save these somewhere safe!

---

## STEP 3: JOIN WHATSAPP SANDBOX (2 MIN)
- [ ] Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
- [ ] Note **WhatsApp Number**: `+14155238886` (or different)
- [ ] Note **Join Code**: `join ___________`
- [ ] Open WhatsApp on phone
- [ ] Send message to that number: `join [your-code]`
- [ ] Receive confirmation: "You are all set!" ✅

---

## STEP 4: CONFIGURE WEBHOOK (2 MIN)
- [ ] In Twilio Console → **WhatsApp Sandbox Settings**
- [ ] Find: "When a message comes in"
- [ ] Enter URL: `https://ev-app-frb6.onrender.com/api/whatsapp`
- [ ] Method: **POST**
- [ ] Click **Save**

---

## STEP 5: ADD TO RENDER (3 MIN)
- [ ] Go to: https://dashboard.render.com/
- [ ] Click: **ev-app-frb6** service
- [ ] Click: **Environment** tab
- [ ] Add variable: `TWILIO_ACCOUNT_SID` = `AC...`
- [ ] Add variable: `TWILIO_AUTH_TOKEN` = `your_token`
- [ ] Add variable: `TWILIO_WHATSAPP_NUMBER` = `+14155238886`
- [ ] Click: **Save Changes**
- [ ] **Wait 2 minutes** for redeploy ⏳

---

## STEP 6: TEST WEB FORM (1 MIN)
- [ ] Open your web app
- [ ] Fill registration form
- [ ] Submit
- [ ] **Check WhatsApp** → Should receive message! ✅

---

## STEP 7: TEST CHATBOT (3 MIN)
- [ ] Open WhatsApp
- [ ] Send to `+14155238886`: **`start`**
- [ ] Bot asks for language → Reply **`1`**
- [ ] Answer all questions
- [ ] Receive referral code message ✅
- [ ] Receive QR code image ✅

---

## ✅ DONE!

If all checkboxes are checked, your WhatsApp integration is LIVE! 🎉

---

## 🚨 IF SOMETHING FAILS

### No WhatsApp after web form?
1. Check Render → Environment → All 3 variables added?
2. Check Render → Events → Deployment finished?
3. Send "join [code]" to WhatsApp sandbox?
4. Check Render → Logs → Any errors?

### Chatbot not responding?
1. Webhook configured in Twilio?
2. Webhook URL correct?
3. Send "restart" to bot

### QR code not received?
1. Complete ALL questions
2. Wait 20 seconds
3. Check Render logs

---

## 📞 QUICK LINKS

- **Twilio**: https://www.twilio.com/try-twilio
- **Console**: https://console.twilio.com/
- **Render**: https://dashboard.render.com/
- **Backend**: https://ev-app-frb6.onrender.com

---

**START NOW:** https://www.twilio.com/try-twilio

Your code is ready, just add credentials! 🚀
