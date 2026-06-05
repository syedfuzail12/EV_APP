# 🗂️ Project Structure

Complete file organization with descriptions.

```
rider-connect/
│
├── 📱 FRONTEND (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── WelcomeScreen.jsx          # Landing page with language selection
│   │   │   ├── WelcomeScreen.module.css   # Welcome screen styles
│   │   │   ├── QuestionnaireForm.jsx      # Main 6-section form with validation
│   │   │   ├── QuestionnaireForm.module.css # Form styles
│   │   │   ├── SuccessScreen.jsx          # Post-submission celebration + referral code
│   │   │   ├── SuccessScreen.module.css   # Success screen styles
│   │   │   ├── ScoreChecker.jsx           # Public score lookup page
│   │   │   ├── ScoreChecker.module.css    # Score checker styles
│   │   │   ├── AdminDashboard.jsx         # Analytics dashboard for business team
│   │   │   └── AdminDashboard.module.css  # Admin dashboard styles
│   │   │
│   │   ├── services/
│   │   │   └── api.js                     # Backend API integration functions
│   │   │
│   │   ├── App.jsx                        # Main app with routing
│   │   ├── main.jsx                       # React entry point
│   │   ├── index.css                      # Global styles & CSS variables
│   │   └── i18n.js                        # Multilingual translations (EN/HI/KN)
│   │
│   ├── index.html                         # HTML template
│   └── vite.config.js                     # Vite build configuration
│
├── 🖥️ BACKEND (Node.js + Express)
│   └── server/
│       └── index.js                       # Complete API with all endpoints
│
├── 🗄️ DATABASE
│   └── supabase-schema.sql                # PostgreSQL table schema + indexes
│
├── ⚙️ CONFIGURATION
│   ├── package.json                       # Dependencies & scripts
│   ├── .env.example                       # Environment variables template
│   └── .gitignore                         # Git ignore rules
│
└── 📚 DOCUMENTATION
    ├── README.md                          # Full project overview
    ├── QUICKSTART.md                      # 5-minute setup guide
    ├── DEPLOYMENT.md                      # Production deployment guide
    ├── INSTALLATION_COMPLETE.md           # Post-install instructions
    ├── STANDOUT_FEATURES.md               # Competitive advantages
    ├── PROJECT_SUMMARY.md                 # Executive summary
    └── PROJECT_STRUCTURE.md               # This file
```

## 📄 File Purposes

### Frontend Components

| File | Purpose | Key Features |
|------|---------|--------------|
| **WelcomeScreen.jsx** | Entry point | Language selection (EN/HI/KN), animated illustrations |
| **QuestionnaireForm.jsx** | Main data collection | 6 sections, progress bar, validation, conditional logic |
| **SuccessScreen.jsx** | Completion page | Referral code display, WhatsApp share, milestone info |
| **ScoreChecker.jsx** | Public tool | Phone lookup, points display, leaderboard rank |
| **AdminDashboard.jsx** | Business intelligence | Stats, filters, leaderboard, lead segments |

### Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/riders` | POST | Submit new rider registration |
| `/api/riders/:phone` | GET | Get rider score and stats |
| `/api/riders` | GET | Get all riders (admin) |
| `/api/stats` | GET | Get dashboard statistics |
| `/api/qr/:referralCode` | GET | Generate QR code for referral |

### Core Logic Files

| File | Contains |
|------|----------|
| **server/index.js** | • Referral code generation<br>• Points calculation<br>• WhatsApp integration<br>• Duplicate prevention<br>• Auto-segmentation<br>• Milestone tracking |
| **src/i18n.js** | • Complete translations for EN/HI/KN<br>• 80+ translated strings<br>• Language switching logic |
| **src/services/api.js** | • All API calls<br>• Error handling<br>• Response parsing |

### Database Schema

**Table: `riders`**
- 25+ columns capturing all questionnaire data
- Indexes on: whatsapp, referral_code, city, vehicle_type, segment
- Auto-timestamp tracking
- Row-level security ready

## 🎨 Styling Architecture

**CSS Modules** for scoped styling:
- No global conflicts
- Component-specific styles
- Reusable CSS variables in `index.css`

**Design System** (`index.css`):
```css
--primary: #10b981         (Green)
--primary-dark: #059669    (Dark green)
--primary-light: rgba(16, 185, 129, 0.1)
--text-dark: #1f2937       (Almost black)
--text-gray: #6b7280       (Muted gray)
--bg-light: #f9fafb        (Off-white)
```

## 📊 Data Flow

```
User Input
    ↓
React Component (Validation)
    ↓
API Service (api.js)
    ↓
Express Backend (server/index.js)
    ↓
Supabase PostgreSQL
    ↓
[Side Effect] WhatsApp Message (Twilio)
```

## 🔄 Referral Flow

```
Rider A submits form
    ↓
Gets code: RW-A1B2 (10 points)
    ↓
Shares with Rider B
    ↓
Rider B enters RW-A1B2
    ↓
Rider A gets +5 points (15 total)
    ↓
At 10 referrals: +100 bonus
```

## 📱 Screen Flow

```
Welcome (/)
    ↓
Questionnaire (/questionnaire)
    ↓ [6 sections]
Success (/success)
    ↓ [rider can check anytime]
Score Checker (/score)

[Admin separate path]
Admin Dashboard (/admin)
```

## 🔐 Environment Variables

**Required for Production:**
```env
SUPABASE_URL          # Database connection
SUPABASE_KEY          # Database auth
TWILIO_ACCOUNT_SID    # WhatsApp integration
TWILIO_AUTH_TOKEN     # WhatsApp auth
TWILIO_WHATSAPP_NUMBER # Send from number
APP_URL               # Frontend URL
PORT                  # Backend port
VITE_API_URL          # API endpoint for frontend
```

## 📦 Dependencies Overview

### Frontend
- **react**: ^18.3.1 - UI library
- **react-router-dom**: ^6.26.0 - Routing
- **i18next**: ^23.11.5 - Translations
- **react-i18next**: ^14.1.2 - React i18n bindings

### Backend
- **express**: ^4.19.2 - Web framework
- **@supabase/supabase-js**: ^2.43.4 - Database client
- **twilio**: ^5.1.1 - WhatsApp API
- **qrcode**: ^1.5.3 - QR generation
- **cors**: ^2.8.5 - CORS middleware
- **dotenv**: ^16.4.5 - Environment vars

### Dev Tools
- **vite**: ^5.3.1 - Build tool
- **@vitejs/plugin-react**: ^4.3.1 - React plugin

## 🚀 Build Output

```bash
npm run build
```

Creates:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js    # Bundled React app
│   └── index-[hash].css   # Bundled styles
└── ...
```

**Production optimizations:**
- Code splitting
- Tree shaking
- Minification
- Asset hashing for cache busting

## 📈 Scalability Structure

**Modular architecture** allows easy scaling:

1. **Add new language**: Edit `src/i18n.js`
2. **Add new section**: Create component in `QuestionnaireForm.jsx`
3. **Add new endpoint**: Add route in `server/index.js`
4. **Add new filter**: Update `AdminDashboard.jsx`
5. **Add new field**: Update schema + form + backend

## 🧪 Testing Structure (Future)

Suggested test organization:
```
tests/
├── unit/
│   ├── components/       # Component tests
│   ├── services/         # API tests
│   └── utils/            # Utility tests
├── integration/
│   └── api/              # Backend API tests
└── e2e/
    └── flows/            # Full user flows
```

## 🔧 Key Files for Customization

**Want to...**
- Change colors? → `src/index.css`
- Add language? → `src/i18n.js`
- Modify form? → `src/components/QuestionnaireForm.jsx`
- Change rewards? → `server/index.js` (calculatePoints function)
- Update database? → `supabase-schema.sql`
- Add new page? → Create component + add route in `App.jsx`

## 📊 File Size Estimates

| Category | Files | Total Size |
|----------|-------|------------|
| Components | 10 | ~15 KB |
| Styles | 6 | ~8 KB |
| Backend | 1 | ~10 KB |
| Config | 3 | ~2 KB |
| Documentation | 7 | ~100 KB |
| **Total (source)** | **27** | **~135 KB** |

**Production build**: ~200 KB (minified + gzipped)

## 🎯 Critical Paths

**User Registration Path:**
1. `WelcomeScreen.jsx` → Language selection
2. `QuestionnaireForm.jsx` → Data collection
3. `api.js` → API call
4. `server/index.js` → Processing + WhatsApp
5. `SuccessScreen.jsx` → Confirmation

**Admin Analysis Path:**
1. `AdminDashboard.jsx` → Request data
2. `api.js` → API call
3. `server/index.js` → Query database
4. Returns filtered results
5. Display in table + charts

---

**Navigation Tips:**

- 🔍 Need to change UI? → Check `src/components/`
- 🔧 Need to change logic? → Check `server/index.js`
- 🎨 Need to change design? → Check `.module.css` files
- 🌐 Need to change text? → Check `src/i18n.js`
- 📚 Need guidance? → Check `README.md` or `QUICKSTART.md`
