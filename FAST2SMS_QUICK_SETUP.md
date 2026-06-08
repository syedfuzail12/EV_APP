# ⚡ FAST2SMS - SUPER QUICK SETUP (15 MIN)

**For the impatient developer who wants OTP working NOW!**

---

## 🚀 3 STEPS TO OTP

### STEP 1: Get API Key (10 min)

1. Go to: https://www.fast2sms.com/
2. Click "Sign Up" → Fill form → Verify email
3. Login → Click "Wallet" → Add ₹100
4. Click "Dev API" → Copy the long string under "Authorization"
5. ✅ You have your API key!

**API key looks like:**
```
AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKlMn
```

---

### STEP 2: Add to .env (1 min)

Open: `c:\Users\syedf\OneDrive\Desktop\EV_APP\.env`

Find this line:
```env
FAST2SMS_API_KEY=your_fast2sms_api_key_here
```

Replace with YOUR actual key:
```env
FAST2SMS_API_KEY=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKlMn
```

Save file (Ctrl + S)

---

### STEP 3: Test It (2 min)

Open terminal:
```cmd
cd c:\Users\syedf\OneDrive\Desktop\EV_APP\server
npm start
```

In another terminal:
```cmd
curl -X POST http://localhost:5000/api/otp/send -H "Content-Type: application/json" -d "{\"phone\":\"YOUR_10_DIGIT_NUMBER\"}"
```

Replace `YOUR_10_DIGIT_NUMBER` with your actual phone (e.g., 9945328423)

**Check your phone → You should get SMS! ✅**

---

## ✅ DONE!

Backend OTP is working!

**Next:** Say "add OTP UI" for me to implement the frontend.

---

## 🆘 TROUBLESHOOT

**Not receiving SMS?**
1. Check Fast2SMS wallet has money
2. Restart backend after changing .env
3. Try test SMS from Fast2SMS dashboard first

**API error?**
- Double-check API key (no extra spaces)
- Make sure you copied full key

---

## 📊 WHAT YOU GOT

✅ Backend sends OTP  
✅ Backend verifies OTP  
✅ 5-minute expiry  
✅ Max 3 attempts  
✅ 60-second cooldown  
✅ Auto-cleanup  

**Cost:** ₹0.15 per OTP  
**Speed:** SMS in 5-10 seconds  
**Reliability:** 99%+ delivery  

---

**NOW WORKING? Say "add OTP UI" for frontend!** 🚀
