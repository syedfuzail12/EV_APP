# 🚀 Quick Start Guide - Rider Connect

Get your project running in **5 minutes**!

## Prerequisites
- Node.js 18+ installed
- Code editor (VS Code recommended)

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Setup Environment (2 min)

### Option A: Use Mock Data (Testing Only)
```bash
# Copy example env
cp .env.example .env

# Edit .env and set:
VITE_API_URL=http://localhost:5000/api
PORT=5000
```

Note: WhatsApp and database won't work without real credentials, but the UI will function.

### Option B: Full Setup (Production Ready)

1. **Get Supabase Credentials** (Free)
   - Go to [supabase.com](https://supabase.com) → New Project
   - Copy Project URL and Anon Key
   - Run `supabase-schema.sql` in SQL Editor

2. **Get Twilio Credentials** (Free Trial)
   - Go to [twilio.com/try-twilio](https://twilio.com/try-twilio)
   - Get Account SID and Auth Token
   - Activate WhatsApp Sandbox

3. **Update .env file**
```env
SUPABASE_URL=your_url_here
SUPABASE_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886
APP_URL=http://localhost:3000
PORT=5000
VITE_API_URL=http://localhost:5000/api
```

## Step 3: Run the App (1 min)

Open **two terminals**:

### Terminal 1 - Backend
```bash
npm run server
```
Should see: `Server running on port 5000`

### Terminal 2 - Frontend
```bash
npm run dev
```
Should see: `Local: http://localhost:3000`

## Step 4: Test It! (1 min)

1. Open browser: `http://localhost:3000`
2. Select language (English/Hindi/Kannada)
3. Fill the questionnaire
4. Check success screen with referral code
5. Visit `/admin` for dashboard
6. Visit `/score` to check rider points

## 🎯 What Works Without Setup

**Without Supabase/Twilio** (Mock mode):
✅ All UI screens and navigation
✅ Form validation and multi-step flow
✅ Language switching
✅ Success screen with mock code
❌ Data persistence
❌ WhatsApp messages
❌ Admin dashboard data
❌ Score checker

**With Full Setup**:
✅ Everything works!
✅ Real database storage
✅ WhatsApp notifications
✅ Referral tracking
✅ Admin analytics
✅ Score checking

## 📱 Test the Full Flow

1. **Register Rider 1**
   - Name: "Ramesh Kumar"
   - Phone: "9876543210"
   - Complete form
   - Note your referral code (e.g., RW-A1B2)

2. **Register Rider 2** (as referral)
   - Name: "Suresh Patel"
   - Phone: "9876543211"
   - When asked "Referred by another rider?" → Yes
   - Enter code: RW-A1B2

3. **Check Score**
   - Go to `/score`
   - Enter Ramesh's phone: 9876543210
   - Should show: 15 points (10 base + 5 for referral)

4. **View Admin Dashboard**
   - Go to `/admin`
   - See both riders listed
   - Filter by vehicle type, leads, etc.

## 🐛 Troubleshooting

### "npm: command not found"
Install Node.js from [nodejs.org](https://nodejs.org)

### Backend won't start
- Check if port 5000 is free
- Try different port: `PORT=5001 npm run server`

### Frontend can't connect to backend
- Verify backend is running (check Terminal 1)
- Check VITE_API_URL in .env matches backend port

### WhatsApp not working
- Ensure you joined Twilio WhatsApp Sandbox
- Verify Twilio credentials in .env
- Check backend terminal for Twilio errors

### Database errors
- Verify Supabase credentials
- Run `supabase-schema.sql` in Supabase SQL Editor
- Check table "riders" exists in Supabase dashboard

## 📂 Project Structure

```
rider-connect/
├── src/
│   ├── components/       # React components
│   ├── services/         # API calls
│   ├── App.jsx          # Main app
│   └── i18n.js          # Translations
├── server/
│   └── index.js         # Backend API
├── package.json         # Dependencies
├── .env                 # Your config
└── README.md           # Full docs
```

## 🎨 Key Features to Showcase

1. **Language Switcher** - Try all 3 languages
2. **Progress Bar** - Smooth section transitions
3. **Smart Validation** - Can't proceed without required fields
4. **Conditional Questions** - Different for EV vs Petrol riders
5. **Success Animation** - Satisfying completion feedback
6. **Referral System** - Track points and milestones
7. **Admin Analytics** - Filter and segment riders

## 🚢 Ready to Deploy?

See `DEPLOYMENT.md` for production deployment to:
- Vercel (Frontend)
- Railway (Backend)
- Supabase (Database)

Total cost: **FREE** for first 1,000 riders!

## 💡 Tips for Demo

1. Keep 2-3 test registrations ready
2. Show the WhatsApp message on screen
3. Demonstrate the referral flow
4. Highlight the admin dashboard filtering
5. Show mobile responsive design (resize browser)
6. Switch languages mid-demo

---

**Need more help?** Check README.md or DEPLOYMENT.md

**Built for 72-Hour Challenge** ⚡
