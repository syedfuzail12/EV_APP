# 🚀 Kaleyra SMS Setup Guide

## ✅ Clean 2-Tier SMS System

Your app now uses a simple, reliable SMS system:
1. **Kaleyra** (Primary - Indian provider with trial credits)
2. **Twilio SMS** (Fallback - resets tomorrow)

All other providers (MSG91, 2Factor, TextLocal) have been removed for simplicity.

---

## 🎯 Setup Kaleyra (5 Minutes)

### Step 1: Sign Up for Kaleyra
1. Go to: **https://www.kaleyra.com/signup/**
2. Fill in:
   - Business Email
   - Company Name
   - Phone Number
3. Click **"Sign Up"**
4. Verify your email

### Step 2: Get Trial Credits
- Kaleyra provides **FREE trial credits** (₹100-200)
- Enough for **50-100 test SMS**
- No credit card required for trial

### Step 3: Get API Credentials
1. Login to: https://dashboard.kaleyra.com/
2. Go to: **"API Keys"** or **"Settings"** → **"API"**
3. Copy these 2 values:
   - **API Key** (looks like: `A1b2c3d4e5f6g7h8i9j0`)
   - **SID** (Account SID, looks like: `HXabcdef1234567890`)

### Step 4: Get Sender ID (Optional)
1. In Kaleyra dashboard
2. Go to: **"Sender IDs"**
3. Default: `KALERA` or `TXTSMS`
4. You can request custom sender ID (takes 1-2 days approval)

### Step 5: Add to Render
1. Open: https://dashboard.render.com/
2. Service: **ev-app-frb6** → **Environment**
3. Add these 3 variables:

| Key | Value |
|-----|-------|
| `KALEYRA_API_KEY` | (paste your API key) |
| `KALEYRA_SID` | (paste your SID) |
| `KALEYRA_SENDER` | `KALERA` (or your custom sender) |

4. Click **"Save Changes"**
5. Wait 2 minutes for redeploy

### Step 6: Test!
1. Fill registration form
2. Submit
3. Check phone for SMS! 📱

---

## 📊 How It Works Now

```
User Registers
    ↓
Try WhatsApp (Twilio) → If fails (quota)
    ↓
Try Kaleyra SMS → ✅ Should work with trial credits!
    ↓
Try Twilio SMS (fallback) → Works tomorrow when quota resets
    ↓
Show referral code on screen (always works)
```

---

## 💰 Kaleyra Pricing

### Trial Account:
- **FREE credits**: ₹100-200
- **SMS cost**: ~₹0.15-0.20 per SMS
- **Test volume**: 50-100 SMS
- **No credit card**: Required only for production

### Paid Plans:
- **Pay-as-you-go**: ₹0.15 per SMS
- **No monthly fee**: Only pay for what you use
- **Bulk discounts**: Available for high volume

---

## ✅ Benefits of Kaleyra

| Feature | Kaleyra | Others |
|---------|---------|--------|
| **Trial Credits** | ✅ FREE ₹100-200 | ❌ Most need payment |
| **Indian Numbers** | ✅ Optimized for India | ⚠️ Hit or miss |
| **DLT Support** | ✅ Built-in | ⚠️ Complex setup |
| **Delivery Rate** | ✅ 95%+ | ⚠️ Variable |
| **Support** | ✅ Indian support | ❌ International |
| **Setup Time** | ✅ 5 minutes | ⚠️ Hours/days |

---

## 🔍 Verify It's Working

After Render redeploys, check logs:

**✅ Success:**
```
📱 Starting SMS send process for: 9945328423
🔄 Trying Kaleyra SMS...
📤 Sending SMS via Kaleyra
📩 Kaleyra response status: 200
✅ SMS sent via Kaleyra!
✅ SMS sent successfully via kaleyra
```

**❌ Not configured:**
```
⚠️ Kaleyra credentials not configured
🔄 Trying Twilio SMS as fallback...
```

---

## 🚨 Troubleshooting

### Issue: "Kaleyra credentials not configured"
**Solution**: Add `KALEYRA_API_KEY` and `KALEYRA_SID` to Render environment

### Issue: "Trial credits exhausted"
**Solution**: 
- Check Kaleyra dashboard for credit balance
- Add credits (₹500 minimum) if needed
- Or wait for Twilio quota to reset (tomorrow)

### Issue: "Invalid sender ID"
**Solution**: 
- Use default `KALERA` or `TXTSMS`
- Or request custom sender ID in dashboard (takes 1-2 days)

### Issue: "DLT registration required"
**Solution**:
- For testing: Use trial credits (works without DLT)
- For production: Register DLT entity and templates (takes 2-5 days)

---

## 📞 Kaleyra Support

- **Website**: https://www.kaleyra.com/
- **Dashboard**: https://dashboard.kaleyra.com/
- **Support**: support@kaleyra.com
- **Docs**: https://docs.kaleyra.com/

---

## 🎉 Summary

**What You Get:**
- ✅ Simple 2-tier SMS system (Kaleyra → Twilio)
- ✅ FREE trial credits (₹100-200)
- ✅ 50-100 test SMS included
- ✅ Optimized for Indian numbers
- ✅ No credit card for trial
- ✅ 5-minute setup

**What You Need:**
1. Sign up at https://www.kaleyra.com/signup/
2. Get API Key and SID
3. Add to Render environment
4. Test registration!

**Time Required:** 5-10 minutes total

---

## 🚀 Quick Start Checklist

- [ ] Sign up at Kaleyra
- [ ] Verify email
- [ ] Get API Key from dashboard
- [ ] Get SID from dashboard  
- [ ] Add `KALEYRA_API_KEY` to Render
- [ ] Add `KALEYRA_SID` to Render
- [ ] Add `KALEYRA_SENDER` = `KALERA` to Render
- [ ] Wait for Render redeploy (~2 min)
- [ ] Test registration form
- [ ] Receive SMS! 📱

---

**Ready to get started? Sign up at: https://www.kaleyra.com/signup/**
