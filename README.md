# Rider Connect - EV Rider Data Collection Platform

A comprehensive multilingual platform for collecting delivery rider data with referral rewards system.

## 🎯 Features

### Core Features
- **Multilingual Support**: English, Hindi, and Kannada
- **Mobile-First Design**: Optimized for delivery riders on basic Android browsers
- **6-Section Questionnaire**: Complete rider profiling in under 3 minutes
- **Referral System**: Unique codes with point-based rewards
- **WhatsApp Integration**: Automated confirmations and milestone notifications
- **Admin Dashboard**: Real-time analytics and lead segmentation
- **Score Checker**: Riders can check points and referral stats

### Advanced Features
- Auto language detection based on city
- Duplicate phone number detection
- Automatic rider segmentation (Hot EV Lead, Insurance Lead, Retrofit Lead)
- QR code generation for offline sharing
- Leaderboard with top referrers
- Milestone bonuses (10, 25, 50 referrals)

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- React Router
- i18next (multilingual)
- CSS Modules

### Backend
- Node.js
- Express
- Supabase (PostgreSQL)
- Twilio (WhatsApp)
- QR Code generation

## 📦 Installation

### Prerequisites
- Node.js 18+
- Supabase account
- Twilio account with WhatsApp enabled

### Setup

1. **Clone and Install**
```bash
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- Supabase URL and Key
- Twilio credentials
- App URL

3. **Setup Database**

Go to your Supabase project → SQL Editor → Run the contents of `supabase-schema.sql`

4. **Start Development**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy dist folder to Vercel
```

### Backend (Railway/Render)
```bash
# Deploy server folder to Railway or Render
# Set environment variables in platform dashboard
```

## 📱 Usage

### For Riders
1. Visit homepage
2. Select language (English/Hindi/Kannada)
3. Fill 6-section questionnaire (3 minutes)
4. Receive WhatsApp confirmation with referral code
5. Share code to earn points

### For Admins
Visit `/admin` to access:
- Total rider statistics
- Vehicle type breakdown
- Hot leads filtering
- Insurance leads identification
- Top referrers leaderboard

## 🎁 Referral System

| Milestone | Reward |
|-----------|--------|
| Sign up | 10 points |
| Per referral | +5 points |
| 10 referrals | +100 bonus points |
| 25 referrals | +300 bonus points |
| 50 referrals | +500 points + Lucky draw entry |

## 🔧 API Endpoints

### POST `/api/riders`
Submit new rider registration

### GET `/api/riders/:phone`
Get rider score and stats

### GET `/api/riders`
Get all riders (admin)

### GET `/api/stats`
Get dashboard statistics

### GET `/api/qr/:referralCode`
Generate QR code for referral

## 🎨 UI/UX Highlights

- Clean, modern design with green theme
- Smooth animations and transitions
- Progress indicator during form filling
- Mobile-optimized touch targets
- Accessible form validation
- WhatsApp-style success confirmation

## 📊 Data Collected

**Section A - Basic Profile**
- Name, Phone, City, Platform, Experience

**Section B - Current Vehicle**
- Type, Brand, Fuel method, Expenses

**Section C - Challenges**
- General, EV-specific, Petrol-specific challenges

**Section D - Insurance**
- Accident, Health, Out-of-pocket expenses

**Section E - EV Interest**
- Switch willingness, Reasons, Interests

**Section F - Referral**
- Referral code entry

## 🔐 Security

- Phone number validation
- Duplicate prevention
- Input sanitization
- Environment variable protection
- Supabase Row Level Security

## 📈 Business Value

Every submission generates:
- **EV Conversion Leads**: Riders open to switching
- **Insurance Leads**: Riders without coverage
- **Retrofit Leads**: Petrol riders interested in EV
- **Partner Data**: Platform, city, expense insights

## 🌟 Standout Features

1. **True Multilingual**: Not just UI, but WhatsApp messages too
2. **Auto-Segmentation**: Business intelligence built-in
3. **WhatsApp Native**: Riders live on WhatsApp
4. **Offline-Ready**: QR codes for petrol pump sharing
5. **Gamification**: Points, milestones, leaderboards
6. **Speed**: Under 3 minutes to complete

## 📝 License

MIT

## 👥 Support

For issues or questions, contact the development team.

---

**Built for the 72-Hour Build Challenge**
*Connecting riders to the EV revolution, one referral at a time* ⚡
. 
