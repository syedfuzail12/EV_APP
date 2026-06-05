# WhatsApp Chatbot - Activation Checklist

## ✅ Step-by-Step Setup (5 minutes)

### 1. Wait for Render Deployment
- [ ] Check GitHub repo shows latest commit
- [ ] Wait 2-3 minutes for Render to auto-deploy
- [ ] Verify deployment at: https://ev-app-frb6.onrender.com/api/stats
- [ ] Should show JSON with rider stats

### 2. Configure Twilio Webhook

#### A. Login to Twilio
- [ ] Go to: https://console.twilio.com
- [ ] Login with your account (9945328423)

#### B. Access WhatsApp Sandbox
- [ ] Click "Messaging" in left sidebar
- [ ] Click "Try it out" → "Send a WhatsApp message"
- [ ] You'll see your sandbox settings

#### C. Set Webhook URL
- [ ] Find "Sandbox Configuration" section
- [ ] Look for "WHEN A MESSAGE COMES IN"
- [ ] Enter: `https://ev-app-frb6.onrender.com/api/whatsapp`
- [ ] Method: **POST**
- [ ] Click **Save**

### 3. Test the Chatbot

#### A. Join Sandbox (if not already)
- [ ] Open WhatsApp on your phone
- [ ] Send message to: `+1 415 523 8886`
- [ ] Send code shown in Twilio console (e.g., `join abc-def`)
- [ ] Wait for confirmation message

#### B. Start Registration
- [ ] Send: `start` or `hi`
- [ ] Bot should respond with language selection
- [ ] Choose: `1` (English) or `2` (Hindi)
- [ ] Bot should welcome you and ask for name

#### C. Complete Flow
- [ ] Answer all 18 questions
- [ ] At the end, receive referral code
- [ ] Bot should say "🎉 Registration Complete!"

### 4. Verify Data Saved

#### A. Check Database
- [ ] Go to Vercel app: `/admin` page
- [ ] Should see new rider in the list
- [ ] Verify all details are correct

#### B. Test Score Checker
- [ ] Go to: `/score`
- [ ] Enter the WhatsApp number you used
- [ ] Should show: 10 points, referral code, 0 referrals

### 5. Test Referral Flow

#### A. Get Referral Code
- [ ] Note the referral code from completion message (e.g., RW-AB12)

#### B. Register Another User
- [ ] Use different phone for testing
- [ ] Join sandbox if needed
- [ ] Send `start` to bot
- [ ] Complete registration
- [ ] When asked for referral code, enter the code from first user
- [ ] Should see completion message

#### C. Verify Points Updated
- [ ] Go to `/score`
- [ ] Enter first user's number
- [ ] Should now show: 15 points, 1 referral

---

## 🎯 Quick Test (30 seconds)

Send this to your WhatsApp bot to test:

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

Each line is a response. The bot should complete registration and give you a referral code!

---

## 🚨 Troubleshooting

### Bot Not Responding
**Problem**: Send message, no response
**Fix**:
1. Check Render logs: https://dashboard.render.com → Your Service → Logs
2. Verify webhook URL in Twilio is correct
3. Ensure webhook method is POST, not GET
4. Check Render service is running (green status)

### "Something Went Wrong" Message
**Problem**: Bot responds but shows error
**Fix**:
1. Check Render environment variables are set:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_WHATSAPP_NUMBER = +14155238886
2. Restart Render service if needed

### Messages Not Saving
**Problem**: Complete flow but data not in database
**Fix**:
1. Verify Supabase credentials in Render:
   - SUPABASE_URL = https://wzuhdwojthzrnzibxwlu.supabase.co
   - SUPABASE_KEY = your_anon_key
2. Check Render logs for database errors
3. If credentials missing, it will save to mock database (still works but not persistent)

### Friend Can't Receive Messages
**Problem**: You receive messages, friend doesn't
**Fix**:
- Friend must join sandbox by sending `join [code]` to +1 415 523 8886
- Sandbox limitation: Only users who join can receive messages
- For production (all users): Need Twilio approval for dedicated WhatsApp number

---

## 📊 Monitor Usage

### Render Logs
View at: https://dashboard.render.com → Your Service → Logs

You'll see:
```
📱 WhatsApp message from: 9876543210 → Test User
📝 WhatsApp rider saved (mock): Test User
```

### Database
Check Supabase dashboard:
- Go to: https://supabase.com/dashboard/project/wzuhdwojthzrnzibxwlu
- Click "Table Editor"
- Select "riders" table
- See all WhatsApp registrations with `language` field

---

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Bot responds to "start" command
- ✅ Asks questions in sequence
- ✅ Accepts valid responses
- ✅ Shows error for invalid responses (e.g., non-numeric phone)
- ✅ Completes flow and gives referral code
- ✅ Data appears in `/admin` dashboard
- ✅ Rider can check score at `/score`
- ✅ Referrer gets +5 points when someone uses their code

---

## 📱 Share with Riders

Once working, share this message:

```
🚀 NEW: Register via WhatsApp!

No need to open browser. Complete registration 
directly in WhatsApp. Just 3 minutes!

Send "start" to: +1 415 523 8886
(First join with: join abc-def)

Earn rewards:
• 10 referrals = +100 points
• 25 referrals = +300 points  
• 50 referrals = +500 points + Lucky Draw

Road Warrior - Let's go! ⚡
```

---

## 🔄 Commands Reference

| User Types | Bot Action |
|------------|------------|
| `start` or `restart` | Begin new registration |
| `hi` or any text | Continue/resume registration |
| `1` or `2` | Select language |
| Numbers | Answer multiple choice questions |
| Text | Answer open-ended questions |
| `yes` or `no` | Answer yes/no questions |
| `skip` | Skip referral code |

---

**Ready to activate?** Just complete the checklist above! 🚀
