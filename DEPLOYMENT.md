# Deployment Guide

## Quick Deploy (Recommended)

### 1. Setup Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Go to SQL Editor
4. Copy entire contents of `supabase-schema.sql` and run it
5. Go to Settings → API to get:
   - Project URL (SUPABASE_URL)
   - Anon/Public Key (SUPABASE_KEY)

### 2. Setup Twilio (WhatsApp)

1. Go to [twilio.com](https://twilio.com/try-twilio) and sign up
2. Get Account SID and Auth Token from dashboard
3. Activate WhatsApp Sandbox:
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to activate
   - Get your WhatsApp number (format: +14155238886)

### 3. Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Select your repo
4. Set Root Directory: `server`
5. Add environment variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_WHATSAPP_NUMBER=+14155238886
   APP_URL=https://your-frontend-url.vercel.app
   PORT=5000
   ```
6. Deploy!
7. Copy the generated URL (e.g., `https://xxx.railway.app`)

### 4. Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import Git Repository
3. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```
5. Deploy!

### 5. Update Backend APP_URL

Go back to Railway and update:
```
APP_URL=https://your-actual-frontend.vercel.app
```

## Alternative Deployment Options

### Backend on Render

1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Settings:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
5. Add environment variables (same as Railway)

### Frontend on Netlify

1. Go to [netlify.com](https://netlify.com)
2. Add new site → Import from Git
3. Settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url
   ```

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run backend (terminal 1)
npm run server

# Run frontend (terminal 2)
npm run dev
```

## Production Checklist

- [ ] Supabase project created and schema deployed
- [ ] Twilio account activated with WhatsApp sandbox
- [ ] Backend deployed with all environment variables
- [ ] Frontend deployed with API URL configured
- [ ] Test complete flow: signup → WhatsApp message → referral
- [ ] Test admin dashboard at `/admin`
- [ ] Test score checker at `/score`

## Testing WhatsApp Integration

Before going live, test the WhatsApp flow:

1. Join Twilio WhatsApp Sandbox (send code via WhatsApp)
2. Submit a test registration
3. Check if you receive WhatsApp message
4. Test referral: use your code in another registration
5. Verify milestone messages at 10, 25, 50 referrals

## Cost Estimation

- **Supabase**: Free tier (500MB database, 50MB file storage)
- **Twilio**: $0.005 per WhatsApp message (first 1,000 free)
- **Railway**: Free tier ($5 credit/month)
- **Vercel**: Free tier (100GB bandwidth)

**Total for 1,000 riders**: ~$0 (all free tiers)

## Troubleshooting

### WhatsApp messages not sending
- Verify TWILIO credentials in backend .env
- Ensure recipient joined WhatsApp Sandbox
- Check Twilio console for error logs

### Database connection failed
- Verify SUPABASE_URL and SUPABASE_KEY
- Check Supabase dashboard for table existence
- Ensure RLS policies allow access

### CORS errors
- Verify VITE_API_URL in frontend matches backend URL
- Check backend has `cors()` middleware enabled

### Form submission fails
- Open browser console for error details
- Check backend logs in Railway/Render
- Verify API endpoint URL is correct

## Scaling for Production

When you get 1,000+ riders:

1. **Supabase**: Upgrade to Pro ($25/month)
2. **Twilio**: Add credit for WhatsApp messages
3. **Railway**: Upgrade plan if needed
4. **CDN**: Add Cloudflare for static assets

## Security Hardening

Before launch:

1. Add rate limiting to API endpoints
2. Implement API authentication for admin routes
3. Add CAPTCHA to prevent spam submissions
4. Enable Supabase Row Level Security policies
5. Use environment-specific configs

## Monitoring

Set up:
- Supabase dashboard for database monitoring
- Twilio console for message delivery rates
- Railway/Render logs for error tracking
- Vercel analytics for user traffic

---

**Need Help?**
Check the README.md for more details or contact the dev team.
