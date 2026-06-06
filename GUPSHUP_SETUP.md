# 🚀 Gupshup SMS Setup Guide

## ✅ Simple 2-Tier SMS System

Your app now uses Gupshup - one of India's largest SMS providers!

**SMS Flow**: Gupshup → Twilio SMS → On-Screen

---

## 🎯 Setup Gupshup (5 Minutes)

### Step 1: Sign Up for Gupshup
1. Go to: **https://www.gupshup.io/developer/home**
2. Click **"Sign Up"** or **"Get Started"**
3. Fill in:
   - Email address
   - Password
   - Company name (can be personal project name)
4. Verify your email
5. Login to dashboard

### Step 2: Get Trial Credits
- Gupshup provides **FREE trial credits**
- Usually **₹100-500 credits** (50-200 SMS)
- No credit card required for trial
- Instant activation

### Step 3: Get API Credentials
1. Login to: https://www.gupshup.io/developer/dashboard
2. Go to: **"SMS"** → **"Settings"** or **"API"**
3. You need 3 values:

#### Option A: Using API Key (Simpler)
- **API Key**: Look for "API Key" or "Access Token"
- Copy the key

#### Option B: Using UserID + Password
- **UserID**: Your Gupshup username/email
- **Password**: Your account password (or API password)

**Note**: Gupshup uses either API Key OR UserID+Password authentication

### Step 4: Add to Render
1. Open: https://dashboard.render.com/
2. Service: **ev-app-frb6** → **Environment**
3. Add ONE of these sets:

**If using API Key:**
| Key | Value |
|-----|-------|
| `GUPSHUP_API_KEY` | (paste your API key) |
| `GUPSHUP_USERID` | (your gupshup email/userid) |
| `GUPSHUP_PASSWORD` | (leave blank or use dummy value) |

**If using UserID + Password:**
| Key | Value |
|-----|-------|
| `GUPSHUP_API_KEY` | (leave blank) |
| `GUPSHUP_USERID` | (your userid/email) |
| `GUPSHUP_PASSWORD` | (your password) |

4. Click **"Save Changes"**
5. Wait 2 minutes for redeploy

### Step 5: Test!
1. Fill registration form
2. Submit
3. Check phone for SMS! 📱

---

## 📊 How It Works

```
User Registers
    ↓
Try WhatsApp (Twilio) → If fails (quota)
    ↓
Try Gupshup SMS → ✅ Trial credits available!
    ↓
Try Twilio SMS (fallback) → Resets tomorrow
    ↓
Show referral code on screen → Always works
```

---

## 💰 Gupshup Pricing

### Trial Account:
- **FREE credits**: ₹100-500
- **SMS cost**: ~₹0.10-0.15 per SMS
- **Test volume**: 50-200 SMS
- **No credit card**: Trial is completely free

### Paid Plans:
- **Pay-as-you-go**: ₹0.10-0.15 per SMS
- **No monthly fee**: Only pay for usage
- **Bulk rates**: Cheaper for high volume
- **DLT included**: Templates managed in dashboard

---

## ✅ Benefits of Gupshup

| Feature | Gupshup | Others |
|---------|---------|--------|
| **Trial Credits** | ✅ ₹100-500 FREE | ⚠️ Variable |
| **Indian Market** | ✅ #1 in India | ⚠️ Hit or miss |
| **Setup** | ✅ 5 minutes | ⚠️ Complex |
| **DLT Support** | ✅ Built-in | ⚠️ Manual |
| **Delivery Rate** | ✅ 98%+ | ⚠️ 80-95% |
| **Support** | ✅ 24/7 | ⚠️ Limited |
| **API Simplicity** | ✅ Very simple | ⚠️ Complex |

---

## 🔍 Verify It's Working

After Render redeploys, check logs:

**✅ Success:**
```
📱 Starting SMS send process for: 9945328423
🔄 Trying Gupshup SMS...
📤 Sending SMS via Gupshup
📩 Gupshup response status: 200
📩 Gupshup response data: success | 1234567890
✅ SMS sent via Gupshup!
✅ Message ID: 1234567890
✅ SMS sent successfully via gupshup
```

**❌ Not configured:**
```
⚠️ Gupshup API key not configured
🔄 Trying Twilio SMS as fallback...
```

---

## 🚨 Troubleshooting

### Issue: "Gupshup API key not configured"
**Solution**: Add `GUPSHUP_API_KEY` (and USERID/PASSWORD) to Render environment

### Issue: "Error | 104 | Invalid Credentials"
**Solution**: 
- Check UserID and Password are correct
- OR get API Key from dashboard instead
- Make sure you're using the right authentication method

### Issue: "Error | 201 | Trial Balance Exhausted"
**Solution**: 
- Check dashboard for credit balance
- Add credits (₹500 minimum top-up)
- Or wait for Twilio quota to reset

### Issue: "Error | 203 | DLT Not Registered"
**Solution**:
- For testing: Should work with trial credits
- For production: Register DLT entity and templates
- Check Gupshup dashboard for DLT status

---

## 📱 SMS Format

Gupshup will send:
```
Welcome John! You are now registered. Your referral code is: RW-A1B2. 
Share it with other riders to earn points and rewards. Road Warrior — let's go!
```

Supports:
- ✅ English
- ✅ Hindi (हिंदी)
- ✅ Kannada (ಕನ್ನಡ)
- ✅ All Indian languages

---

## 📞 Gupshup Support

- **Website**: https://www.gupshup.io/
- **Dashboard**: https://www.gupshup.io/developer/dashboard
- **Docs**: https://docs.gupshup.io/
- **Support**: support@gupshup.io
- **Phone**: +91-22-6727-7000

---

## 🎉 Why Gupshup is Best for India

1. **Market Leader**: Largest SMS provider in India
2. **High Delivery**: 98%+ delivery rate to Indian numbers
3. **DLT Integrated**: Managed DLT templates
4. **Trial Credits**: Generous free credits
5. **Simple API**: Easy integration (just 3 parameters!)
6. **Indian Support**: 24/7 support in India timezone
7. **Trusted**: Used by Flipkart, Uber, Swiggy, etc.

---

## 🚀 Quick Start Checklist

- [ ] Sign up at https://www.gupshup.io/developer/home
- [ ] Verify email
- [ ] Check trial credits in dashboard
- [ ] Get API Key (or UserID + Password)
- [ ] Add `GUPSHUP_API_KEY` to Render
- [ ] Add `GUPSHUP_USERID` to Render
- [ ] Add `GUPSHUP_PASSWORD` to Render (if using password auth)
- [ ] Wait for Render redeploy (~2 min)
- [ ] Test registration form
- [ ] Receive SMS! 📱

---

## 💡 Pro Tips

1. **Use API Key method** - Simpler than userid+password
2. **Check dashboard regularly** - Monitor credit balance
3. **Set up DLT early** - For production use
4. **Use templates** - Better delivery rates
5. **Monitor delivery reports** - Available in dashboard

---

**Ready? Sign up at: https://www.gupshup.io/developer/home**

Gupshup is the most reliable SMS provider for India! 🇮🇳
