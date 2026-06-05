# WhatsApp Chatbot Setup Guide

## Overview
The WhatsApp chatbot allows riders to complete the entire questionnaire through WhatsApp messages without opening a browser. It's a conversational flow where the bot asks questions and riders respond.

## Features
✅ **Multilingual**: English and Hindi support
✅ **Interactive**: Question-by-question conversation
✅ **User-Friendly**: Number-based menu selections
✅ **Complete**: All 6 sections covered
✅ **Auto-Save**: Data saved to database automatically
✅ **Referral Support**: Can enter referral codes via WhatsApp

## How It Works

### User Experience:
```
User: Hi
Bot: 🌟 Road Warrior Registration
     Select your language:
     1 - English
     2 - हिंदी (Hindi)

User: 1
Bot: 👋 Welcome to Road Warrior!
     I'll help you register in just 3 minutes.
     What's your full name?

User: Rahul Kumar
Bot: Great Rahul! 📱
     What's your WhatsApp number? (10 digits)

User: 9876543210
Bot: 📍 Which city do you work in?
     Type:
     1 - Bangalore
     2 - Mumbai
     3 - Delhi
     4 - Hyderabad
     5 - Other

... (continues through all sections)

Bot: 🎉 Registration Complete!
     ✅ Your Referral Code: RW-A1B2
     💎 Points: 10
     
     Share your code with friends to earn rewards!
```

## Setup Instructions

### Step 1: Configure Twilio Webhook

1. **Login to Twilio Console**: https://console.twilio.com
2. **Go to WhatsApp Sandbox**: Messaging → Try it out → WhatsApp
3. **Configure Webhook URL**:
   - Production: `https://ev-app-frb6.onrender.com/api/whatsapp`
   - Local testing (with ngrok): `https://your-ngrok-url.ngrok.io/api/whatsapp`
4. **Set "When a message comes in"** to your webhook URL
5. **Method**: POST
6. **Save**

### Step 2: Test with WhatsApp Sandbox

1. **Join Sandbox**:
   - Open WhatsApp on your phone
   - Send message to: `+1 415 523 8886`
   - Send code: `join [your-sandbox-code]`

2. **Start Conversation**:
   - Send: `start` or `hi`
   - Bot will respond with language selection

3. **Complete Registration**:
   - Follow the conversation
   - Answer each question
   - Receive your referral code at the end

### Step 3: Testing Locally with ngrok

If you want to test locally before deploying:

```bash
# Terminal 1: Start backend server
cd c:\Users\syedf\OneDrive\Desktop\EV_APP
npm run server

# Terminal 2: Start ngrok
ngrok http 5000

# Copy the ngrok HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this in Twilio webhook: https://abc123.ngrok.io/api/whatsapp
```

### Step 4: Deploy to Render

Your backend is already deployed to Render, so just update the Twilio webhook to:
```
https://ev-app-frb6.onrender.com/api/whatsapp
```

## Conversation Flow Mapping

| Step | Question | Valid Responses | Example |
|------|----------|-----------------|---------|
| Language | Select language | 1 or 2 | 1 |
| Name | Full name | Any text | Rahul Kumar |
| WhatsApp | Phone number | 10 digits | 9876543210 |
| City | City selection | 1-5 | 1 |
| Platform | Delivery platform | 1-6 | 2 |
| Experience | Years of experience | 1-4 | 2 |
| Vehicle Type | Vehicle type | 1-4 | 2 |
| Vehicle Brand | Brand name | Any text | Honda |
| Fuel Method | Refuel method | 1-4 | 1 |
| Weekly Expense | Amount in ₹ | Numbers | 500 |
| Monthly Maintenance | Amount in ₹ | Numbers | 1000 |
| Challenges | Challenge options | 1,2,3 (comma-separated) | 1,5 |
| Accident Insurance | Yes/No | yes or no | yes |
| Health Insurance | Yes/No | yes or no | no |
| Paid for Accident | Yes/No | yes or no | yes |
| Switch to EV | Yes/No | yes or no | yes |
| Switch Reasons | Reason text | Any text | Save money |
| Interested | Interest options | 1,2,3 (comma-separated) | 1,2 |
| Referral Code | Referral code or skip | Code or 'skip' | RW-A1B2 |

## Commands

| Command | Action |
|---------|--------|
| `start` or `restart` | Start new registration (clears previous progress) |
| `hi` or any message | Continue existing registration |

## Session Management

- **Session Storage**: In-memory (cleared on server restart)
- **Session Timeout**: No automatic timeout (active until completion)
- **Restart Anytime**: Type `restart` to begin fresh

## Testing Checklist

After deployment, test:
- [ ] Send "start" to WhatsApp bot
- [ ] Select language (1 or 2)
- [ ] Complete all questions
- [ ] Verify data saved in database
- [ ] Check referral code received
- [ ] Test referral code validation
- [ ] Verify referrer gets points

## Troubleshooting

### Bot Not Responding
1. Check Twilio webhook URL is correct
2. Verify Render backend is running
3. Check Render logs for errors
4. Ensure WhatsApp sandbox is active

### Messages Not Sending
1. Verify Twilio credentials in Render environment variables
2. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
3. Ensure recipient joined sandbox

### Data Not Saving
1. Check Supabase credentials in Render
2. Verify SUPABASE_URL and SUPABASE_KEY
3. Check Render logs for database errors

## Production Setup (After Twilio Approval)

Once Twilio approves your production WhatsApp number:

1. **Get Approved WhatsApp Number**: Apply through Twilio Console
2. **Update Environment Variable**:
   ```
   TWILIO_WHATSAPP_NUMBER=+your-approved-number
   ```
3. **Update Webhook**: Use production URL (not sandbox)
4. **No More Sandbox Join**: Users can directly message your number

## Benefits of WhatsApp Chatbot

1. **Zero App Download**: Works in WhatsApp directly
2. **Higher Completion**: Familiar chat interface
3. **Asynchronous**: Riders can pause and resume
4. **Low Data Usage**: Text-only, no browser needed
5. **Wider Reach**: Even basic phone users can participate

## Analytics

Track in Render logs:
- Number of conversations started
- Drop-off at each step
- Completion rate
- Average time to complete

---

**Ready to deploy!** Just push the code and configure Twilio webhook.
