# WhatsApp Chatbot - Quick Start Guide

## 🚀 5-Minute Activation

### Step 1: Configure Twilio (2 minutes)
1. Go to: https://console.twilio.com
2. Navigate: **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Under "Sandbox Configuration", set:
   - **WHEN A MESSAGE COMES IN**: `https://ev-app-frb6.onrender.com/api/whatsapp`
   - **METHOD**: POST
4. Click **Save**

### Step 2: Test It (3 minutes)
1. Open WhatsApp on your phone
2. Send to: `+1 415 523 8886`
3. Send: `join [your-sandbox-code]` (shown in Twilio console)
4. Send: `start`
5. Follow the conversation
6. Complete all questions
7. Receive referral code

### Step 3: Verify
1. Go to: https://your-vercel-app.vercel.app/admin
2. See the new rider in the list
3. Go to: https://your-vercel-app.vercel.app/score
4. Enter the phone number you used
5. Should show 10 points

---

## 📱 Example Conversation (30 seconds)

```
You: start
Bot: Select language: 1-English, 2-Hindi

You: 1
Bot: What's your full name?

You: Test User
Bot: WhatsApp number? (10 digits)

You: 9999999999
Bot: City? 1-Bangalore, 2-Mumbai...

You: 1
Bot: Platform? 1-Swiggy, 2-Zomato...

... (continues for 18 questions)

Bot: 🎉 Registration Complete!
     Your Referral Code: RW-XY12
     Points: 10
```

---

## 🎯 What to Share with Riders

**English:**
```
🚀 Register in WhatsApp! No browser needed.

Send "start" to: +1 415 523 8886
(First send: join abc-def)

3 minutes. Get rewards. Share your code!
```

**Hindi:**
```
🚀 व्हाट्सएप में रजिस्टर करें! ब्राउज़र की ज़रूरत नहीं।

"start" भेजें: +1 415 523 8886
(पहले भेजें: join abc-def)

3 मिनट। इनाम पाएं। अपना कोड शेयर करें!
```

---

## ⚡ Quick Test Script

Copy-paste these messages one by one:
```
start
1
Test User
9999999999
1
1
1
2
Honda
1
300
500
1,2
yes
yes
no
yes
save money
1
skip
```

Should complete registration and give referral code!

---

## 🔍 Troubleshooting

### Bot not responding?
- Check Twilio webhook URL is correct
- Verify Render service is running (green)
- Check webhook method is POST

### Messages not saving?
- Verify Supabase credentials in Render
- Check Render logs for errors

### Friend can't test?
- They must join sandbox: `join [code]` to +1 415 523 8886

---

## 📊 Monitor Activity

**Render Logs**: https://dashboard.render.com → Your Service → Logs

Look for:
```
📱 WhatsApp message from: 9876543210 → Test User
📝 WhatsApp rider saved: Test User
```

**Admin Dashboard**: https://your-app.vercel.app/admin

---

## ✅ Success Checklist

- [ ] Twilio webhook configured
- [ ] Test message sent
- [ ] Bot responded with language selection
- [ ] Completed full conversation
- [ ] Received referral code
- [ ] Data visible in `/admin`
- [ ] Score checkable at `/score`

---

**All documentation in these files:**
- `WHATSAPP_CHATBOT_SETUP.md` - Full setup guide
- `WHATSAPP_EXAMPLE_CONVERSATION.md` - Conversation examples
- `WHATSAPP_ACTIVATION_CHECKLIST.md` - Detailed checklist
- `WHATSAPP_FEATURE_SUMMARY.md` - Technical details
- `WHATSAPP_QUICK_START.md` - This file

**Ready to go!** 🎉
