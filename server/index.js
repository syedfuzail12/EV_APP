import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import QRCode from 'qrcode'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // For Twilio webhook

// Supabase client (mock mode if not configured)
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null

// In-memory storage for mock mode
const mockDatabase = []

// WhatsApp conversation sessions (stores user progress)
const whatsappSessions = new Map()

// Twilio client (optional, for WhatsApp)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

// Generate unique referral code
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'RW-'
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Calculate points based on milestones
function calculatePoints(referralCount) {
  let points = 10 // Initial points
  points += referralCount * 5 // 5 points per referral
  
  if (referralCount >= 10) points += 100
  if (referralCount >= 25) points += 300
  if (referralCount >= 50) points += 500
  
  return points
}

// Segment rider based on responses
function segmentRider(data) {
  const segments = []
  
  if (data.switchToEV === 'yes') {
    segments.push('Hot EV Lead')
  }
  
  if (data.accidentInsurance === 'no' || data.healthInsurance === 'no') {
    segments.push('Insurance Lead')
  }
  
  if (data.vehicleType === 'Petrol Two-Wheeler' && data.switchToEV === 'yes') {
    segments.push('Retrofit Lead')
  }
  
  return segments.join(', ') || 'General'
}

// Send WhatsApp message
async function sendWhatsAppMessage(phone, message) {
  if (!twilioClient) {
    console.log('📱 WhatsApp (mock):', message.substring(0, 50) + '...')
    return
  }
  
  try {
    await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+91${phone}`
    })
  } catch (error) {
    console.error('WhatsApp send failed:', error)
  }
}

// Check for duplicate phone number
async function checkDuplicate(phone) {
  const { data, error } = await supabase
    .from('riders')
    .select('id')
    .eq('whatsapp', phone)
    .single()
  
  return !!data
}

// Submit rider
app.post('/api/riders', async (req, res) => {
  try {
    const riderData = req.body
    
    // Generate referral code
    const referralCode = generateReferralCode()
    
    // MOCK MODE: If no database configured
    if (!supabase) {
      console.log('📝 Mock submission received:', riderData.fullName, riderData.whatsapp)
      
      // Store in mock database
      const newRider = {
        id: Date.now().toString(),
        full_name: riderData.fullName,
        whatsapp: riderData.whatsapp,
        city: riderData.city,
        platform: riderData.platform,
        experience: riderData.experience,
        vehicle_type: riderData.vehicleType,
        vehicle_brand: riderData.vehicleBrand,
        fuel_method: riderData.fuelMethod,
        weekly_expense: riderData.weeklyExpense,
        monthly_maintenance: riderData.monthlyMaintenance,
        challenges: riderData.challenges,
        ev_challenges: riderData.evChallenges,
        petrol_challenges: riderData.petrolChallenges,
        accident_insurance: riderData.accidentInsurance,
        health_insurance: riderData.healthInsurance,
        paid_for_accident: riderData.paidForAccident,
        switch_to_ev: riderData.switchToEV,
        switch_reasons: riderData.switchReasons,
        interested: riderData.interested,
        referred_by_code: riderData.referralCode || null,
        referral_code: referralCode,
        points: 10,
        referral_count: 0,
        segment: segmentRider(riderData),
        language: riderData.language,
        created_at: new Date().toISOString()
      }
      
      // Check if referral code is valid and update referrer
      if (riderData.referredBy && riderData.referralCode) {
        const referrer = mockDatabase.find(r => r.referral_code === riderData.referralCode)
        if (referrer) {
          referrer.referral_count = (referrer.referral_count || 0) + 1
          referrer.points = calculatePoints(referrer.referral_count)
          console.log(`✅ Referral credited to: ${referrer.full_name}`)
        }
      }
      
      mockDatabase.push(newRider)
      
      // Send mock WhatsApp message
      console.log(`📱 Would send WhatsApp to: ${riderData.whatsapp}`)
      console.log(`✉️ Message: Welcome ${riderData.fullName}! Your referral code is: ${referralCode}`)
      
      return res.json({
        success: true,
        referralCode: referralCode,
        points: 10,
        rider: newRider
      })
    }
    
    // REAL MODE: Database operations below
    // Check for duplicate
    const isDuplicate = await checkDuplicate(riderData.whatsapp)
    if (isDuplicate) {
      return res.status(400).json({ error: 'Phone number already registered' })
    }
    
    // Process referral if provided
    let referrerUpdated = false
    if (riderData.referredBy && riderData.referralCode) {
      const { data: referrer } = await supabase
        .from('riders')
        .select('*')
        .eq('referral_code', riderData.referralCode)
        .single()
      
      if (referrer) {
        const newReferralCount = (referrer.referral_count || 0) + 1
        const newPoints = calculatePoints(newReferralCount)
        
        await supabase
          .from('riders')
          .update({ 
            referral_count: newReferralCount,
            points: newPoints
          })
          .eq('id', referrer.id)
        
        referrerUpdated = true
        
        // Send milestone message if applicable
        if (newReferralCount === 10) {
          await sendWhatsAppMessage(
            referrer.whatsapp,
            `🎉 Milestone achieved! You've referred 10 riders. +100 bonus points! Keep going!`
          )
        } else if (newReferralCount === 25) {
          await sendWhatsAppMessage(
            referrer.whatsapp,
            `🏆 Amazing! You've referred 25 riders. +300 bonus points! You're a Road Warrior!`
          )
        } else if (newReferralCount === 50) {
          await sendWhatsAppMessage(
            referrer.whatsapp,
            `🎁 Legendary! 50 referrals! +500 bonus points + Lucky Draw entry! 🎉`
          )
        }
      }
    }
    
    // Segment the rider
    const segment = segmentRider(riderData)
    
    // Insert rider
    const { data: newRider, error } = await supabase
      .from('riders')
      .insert([{
        full_name: riderData.fullName,
        whatsapp: riderData.whatsapp,
        city: riderData.city,
        platform: riderData.platform,
        experience: riderData.experience,
        vehicle_type: riderData.vehicleType,
        vehicle_brand: riderData.vehicleBrand,
        fuel_method: riderData.fuelMethod,
        weekly_expense: riderData.weeklyExpense,
        monthly_maintenance: riderData.monthlyMaintenance,
        challenges: riderData.challenges,
        ev_challenges: riderData.evChallenges,
        petrol_challenges: riderData.petrolChallenges,
        accident_insurance: riderData.accidentInsurance,
        health_insurance: riderData.healthInsurance,
        paid_for_accident: riderData.paidForAccident,
        switch_to_ev: riderData.switchToEV,
        switch_reasons: riderData.switchReasons,
        interested: riderData.interested,
        referred_by_code: riderData.referralCode || null,
        referral_code: referralCode,
        points: 10,
        referral_count: 0,
        segment: segment,
        language: riderData.language,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    
    // Send welcome WhatsApp message
    const messages = {
      en: `Welcome ${riderData.fullName}! You are now registered. Your referral code is: ${referralCode}. Share it with other riders to earn points and rewards. Road Warrior — let's go!`,
      hi: `नमस्ते ${riderData.fullName} भाई! आपका रजिस्ट्रेशन हो गया। आपका रेफरल कोड है: ${referralCode}. इस कोड को अपने दोस्तों के साथ शेयर करो और पॉइंट्स कमाओ। Road Warrior बनो!`,
      kn: `ಸ್ವಾಗತ ${riderData.fullName}! ನೀವು ಈಗ ನೋಂದಾಯಿಸಿದ್ದೀರಿ. ನಿಮ್ಮ ರೆಫರಲ್ ಕೋಡ್: ${referralCode}. ಪಾಯಿಂಟ್‌ಗಳನ್ನು ಗಳಿಸಲು ಇತರ ರೈಡರ್‌ಗಳೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ. Road Warrior!`
    }
    
    await sendWhatsAppMessage(
      riderData.whatsapp,
      messages[riderData.language] || messages.en
    )
    
    res.json({
      success: true,
      referralCode: referralCode,
      points: 10,
      rider: newRider
    })
  } catch (error) {
    console.error('Error submitting rider:', error)
    res.status(500).json({ error: 'Failed to register rider' })
  }
})

// Get rider score
app.get('/api/riders/:phone', async (req, res) => {
  try {
    const { phone } = req.params
    
    // MOCK MODE: Search in mock database
    if (!supabase) {
      const rider = mockDatabase.find(r => r.whatsapp === phone)
      
      if (!rider) {
        return res.status(404).json({ error: 'Rider not found' })
      }
      
      // Calculate next milestone
      let nextMilestone = 10
      if (rider.referral_count >= 50) nextMilestone = 100
      else if (rider.referral_count >= 25) nextMilestone = 50
      else if (rider.referral_count >= 10) nextMilestone = 25
      
      // Calculate rank
      const sortedRiders = [...mockDatabase].sort((a, b) => b.referral_count - a.referral_count)
      const rank = sortedRiders.findIndex(r => r.whatsapp === phone) + 1
      
      return res.json({
        fullName: rider.full_name,
        points: rider.points || 10,
        referralCount: rider.referral_count || 0,
        referralCode: rider.referral_code,
        nextMilestone: nextMilestone,
        leaderboardRank: rank
      })
    }
    
    // REAL MODE: Query database
    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .eq('whatsapp', phone)
      .single()
    
    if (error || !data) {
      return res.status(404).json({ error: 'Rider not found' })
    }
    
    // Calculate next milestone
    let nextMilestone = 10
    if (data.referral_count >= 50) nextMilestone = 100
    else if (data.referral_count >= 25) nextMilestone = 50
    else if (data.referral_count >= 10) nextMilestone = 25
    
    // Get leaderboard rank
    const { data: allRiders } = await supabase
      .from('riders')
      .select('referral_count')
      .order('referral_count', { ascending: false })
    
    const rank = allRiders.findIndex(r => r.referral_count <= data.referral_count) + 1
    
    res.json({
      fullName: data.full_name,
      points: data.points || 10,
      referralCount: data.referral_count || 0,
      referralCode: data.referral_code,
      nextMilestone: nextMilestone,
      leaderboardRank: rank
    })
  } catch (error) {
    console.error('Error fetching rider:', error)
    res.status(500).json({ error: 'Failed to fetch rider data' })
  }
})

// Get all riders (admin)
app.get('/api/riders', async (req, res) => {
  try {
    // MOCK MODE: Return mock database
    if (!supabase) {
      const riders = mockDatabase.map(r => ({
        fullName: r.full_name,
        whatsapp: r.whatsapp,
        city: r.city,
        platform: r.platform,
        experience: r.experience,
        vehicleType: r.vehicle_type,
        vehicleBrand: r.vehicle_brand,
        fuelMethod: r.fuel_method,
        weeklyExpense: r.weekly_expense,
        monthlyMaintenance: r.monthly_maintenance,
        challenges: r.challenges,
        evChallenges: r.ev_challenges,
        petrolChallenges: r.petrol_challenges,
        accidentInsurance: r.accident_insurance,
        healthInsurance: r.health_insurance,
        paidForAccident: r.paid_for_accident,
        switchToEV: r.switch_to_ev,
        switchReasons: r.switch_reasons,
        interested: r.interested,
        referralCode: r.referral_code,
        points: r.points || 10,
        referralCount: r.referral_count || 0,
        segment: r.segment,
        language: r.language,
        createdAt: r.created_at
      }))
      
      return res.json(riders)
    }
    
    // REAL MODE: Query database
    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    const riders = data.map(r => ({
      fullName: r.full_name,
      whatsapp: r.whatsapp,
      city: r.city,
      platform: r.platform,
      experience: r.experience,
      vehicleType: r.vehicle_type,
      vehicleBrand: r.vehicle_brand,
      fuelMethod: r.fuel_method,
      weeklyExpense: r.weekly_expense,
      monthlyMaintenance: r.monthly_maintenance,
      challenges: r.challenges,
      evChallenges: r.ev_challenges,
      petrolChallenges: r.petrol_challenges,
      accidentInsurance: r.accident_insurance,
      healthInsurance: r.health_insurance,
      paidForAccident: r.paid_for_accident,
      switchToEV: r.switch_to_ev,
      switchReasons: r.switch_reasons,
      interested: r.interested,
      referralCode: r.referral_code,
      points: r.points || 10,
      referralCount: r.referral_count || 0,
      segment: r.segment,
      language: r.language,
      createdAt: r.created_at
    }))
    
    res.json(riders)
  } catch (error) {
    console.error('Error fetching riders:', error)
    res.status(500).json({ error: 'Failed to fetch riders' })
  }
})

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    // MOCK MODE: Calculate from mock database
    if (!supabase) {
      const stats = {
        totalRiders: mockDatabase.length,
        evRiders: mockDatabase.filter(r => r.vehicle_type === 'Electric Two-Wheeler').length,
        petrolRiders: mockDatabase.filter(r => r.vehicle_type === 'Petrol Two-Wheeler').length,
        hotLeads: mockDatabase.filter(r => r.switch_to_ev === 'yes').length,
        insuranceLeads: mockDatabase.filter(r => r.accident_insurance === 'no' || r.health_insurance === 'no').length
      }
      
      return res.json(stats)
    }
    
    // REAL MODE: Query database
    const { data, error } = await supabase
      .from('riders')
      .select('vehicle_type, switch_to_ev, accident_insurance, health_insurance')
    
    if (error) throw error
    
    const stats = {
      totalRiders: data.length,
      evRiders: data.filter(r => r.vehicle_type === 'Electric Two-Wheeler').length,
      petrolRiders: data.filter(r => r.vehicle_type === 'Petrol Two-Wheeler').length,
      hotLeads: data.filter(r => r.switch_to_ev === 'yes').length,
      insuranceLeads: data.filter(r => r.accident_insurance === 'no' || r.health_insurance === 'no').length
    }
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// ============================================
// WHATSAPP CHATBOT - Interactive Questionnaire
// ============================================

// WhatsApp conversation flow structure
const WHATSAPP_QUESTIONS = {
  en: {
    welcome: "👋 Welcome to Road Warrior!\n\nI'll help you register in just 3 minutes. Let's start!\n\nWhat's your full name?",
    whatsapp: "Great {name}! 📱\n\nWhat's your WhatsApp number? (10 digits)",
    city: "📍 Which city do you work in?\n\nType:\n1 - Bangalore\n2 - Mumbai\n3 - Delhi\n4 - Hyderabad\n5 - Other",
    platform: "🛵 Which platform do you ride for?\n\nType:\n1 - Swiggy\n2 - Zomato\n3 - Uber Eats\n4 - Amazon\n5 - Dunzo\n6 - Other",
    experience: "⏱️ How many years of delivery experience?\n\nType:\n1 - Less than 1 year\n2 - 1-3 years\n3 - 3-5 years\n4 - More than 5 years",
    vehicleType: "🏍️ What vehicle do you use?\n\nType:\n1 - Electric Two-Wheeler\n2 - Petrol Two-Wheeler\n3 - Four-Wheeler\n4 - Bicycle",
    vehicleBrand: "What's your vehicle brand? (e.g., Honda, TVS, Ola Electric)",
    fuelMethod: "⛽ How do you refuel/charge?\n\nType:\n1 - Petrol Pump\n2 - Home Charging\n3 - Swapping Station\n4 - Other",
    weeklyExpense: "💰 Weekly fuel/charging expense? (in ₹)",
    monthlyMaintenance: "🔧 Monthly maintenance cost? (in ₹)",
    challenges: "⚠️ What challenges do you face? (Type numbers separated by commas)\n\n1 - High fuel cost\n2 - Frequent breakdown\n3 - No nearby charging station\n4 - Battery range anxiety\n5 - Repair costs\n6 - Long refuelling time\n7 - Other",
    accidentInsurance: "🛡️ Do you have accident insurance?\n\nType: yes or no",
    healthInsurance: "🏥 Do you have health insurance?\n\nType: yes or no",
    paidForAccident: "💸 Have you paid out-of-pocket for accident/health issues?\n\nType: yes or no",
    switchToEV: "⚡ Would you switch to an electric vehicle?\n\nType: yes or no",
    switchReasons: "Why? (Optional - just type your reason)",
    interested: "📚 What are you interested in? (Type numbers separated by commas)\n\n1 - EV loans\n2 - Insurance schemes\n3 - Maintenance workshops\n4 - Safety training\n5 - Other benefits",
    referralCode: "🎁 Were you referred by someone?\n\nType their referral code or 'skip'",
    complete: "🎉 Registration Complete!\n\n✅ Your Referral Code: {code}\n💎 Points: 10\n\nShare your code with friends to earn rewards!\n\n🏆 Milestones:\n• 10 referrals = +100 points\n• 25 referrals = +300 points\n• 50 referrals = +500 points + Lucky Draw\n\nThank you for joining Road Warrior! ⚡"
  },
  hi: {
    welcome: "👋 रोड वॉरियर में आपका स्वागत है!\n\nमैं आपको 3 मिनट में रजिस्टर करने में मदद करूंगा। चलिए शुरू करते हैं!\n\nआपका पूरा नाम क्या है?",
    whatsapp: "बहुत बढ़िया {name}! 📱\n\nआपका व्हाट्सएप नंबर क्या है? (10 अंक)",
    city: "📍 आप किस शहर में काम करते हैं?\n\nटाइप करें:\n1 - बैंगलोर\n2 - मुंबई\n3 - दिल्ली\n4 - हैदराबाद\n5 - अन्य",
    platform: "🛵 आप किस प्लेटफ़ॉर्म के लिए राइड करते हैं?\n\nटाइप करें:\n1 - स्विगी\n2 - ज़ोमैटो\n3 - उबर ईट्स\n4 - अमेज़न\n5 - डन्ज़ो\n6 - अन्य",
    experience: "⏱️ कितने साल का डिलीवरी अनुभव?\n\nटाइप करें:\n1 - 1 साल से कम\n2 - 1-3 साल\n3 - 3-5 साल\n4 - 5 साल से अधिक",
    vehicleType: "🏍️ आप कौन सा वाहन उपयोग करते हैं?\n\nटाइप करें:\n1 - इलेक्ट्रिक टू-व्हीलर\n2 - पेट्रोल टू-व्हीलर\n3 - फोर-व्हीलर\n4 - साइकिल",
    vehicleBrand: "आपके वाहन का ब्रांड? (जैसे Honda, TVS, Ola Electric)",
    fuelMethod: "⛽ आप कैसे रीफ्यूल/चार्ज करते हैं?\n\nटाइप करें:\n1 - पेट्रोल पंप\n2 - घर पर चार्जिंग\n3 - स्वैपिंग स्टेशन\n4 - अन्य",
    weeklyExpense: "💰 साप्ताहिक ईंधन/चार्जिंग खर्च? (₹ में)",
    monthlyMaintenance: "🔧 मासिक रखरखाव लागत? (₹ में)",
    challenges: "⚠️ आपको क्या चुनौतियाँ हैं? (नंबर कॉमा से अलग करके टाइप करें)\n\n1 - महंगा ईंधन\n2 - बार-बार खराबी\n3 - पास में चार्जिंग नहीं\n4 - बैटरी रेंज की चिंता\n5 - मरम्मत की लागत\n6 - रीफ्यूल में समय\n7 - अन्य",
    accidentInsurance: "🛡️ क्या आपके पास दुर्घटना बीमा है?\n\nटाइप करें: yes या no",
    healthInsurance: "🏥 क्या आपके पास स्वास्थ्य बीमा है?\n\nटाइप करें: yes या no",
    paidForAccident: "💸 क्या आपने दुर्घटना/स्वास्थ्य के लिए जेब से पैसे दिए हैं?\n\nटाइप करें: yes या no",
    switchToEV: "⚡ क्या आप इलेक्ट्रिक वाहन में स्विच करेंगे?\n\nटाइप करें: yes या no",
    switchReasons: "क्यों? (वैकल्पिक - बस अपना कारण लिखें)",
    interested: "📚 आप किसमें रुचि रखते हैं? (नंबर कॉमा से अलग करें)\n\n1 - EV लोन\n2 - बीमा योजनाएं\n3 - रखरखाव वर्कशॉप\n4 - सुरक्षा प्रशिक्षण\n5 - अन्य लाभ",
    referralCode: "🎁 क्या किसी ने आपको रेफर किया?\n\nउनका रेफरल कोड टाइप करें या 'skip' लिखें",
    complete: "🎉 रजिस्ट्रेशन पूरा हुआ!\n\n✅ आपका रेफरल कोड: {code}\n💎 पॉइंट्स: 10\n\nअपने दोस्तों के साथ कोड शेयर करो और इनाम जीतो!\n\n🏆 माइलस्टोन:\n• 10 रेफरल = +100 पॉइंट्स\n• 25 रेफरल = +300 पॉइंट्स\n• 50 रेफरल = +500 पॉइंट्स + लकी ड्रा\n\nरोड वॉरियर में शामिल होने के लिए धन्यवाद! ⚡"
  }
}

// Initialize new WhatsApp session
function initWhatsAppSession(phone) {
  return {
    phone,
    step: 'language',
    language: 'en',
    data: {},
    lastActivity: Date.now()
  }
}

// Get session or create new one
function getWhatsAppSession(phone) {
  if (!whatsappSessions.has(phone)) {
    whatsappSessions.set(phone, initWhatsAppSession(phone))
  }
  const session = whatsappSessions.get(phone)
  session.lastActivity = Date.now()
  return session
}

// Process user response and return next question
function processWhatsAppResponse(session, message) {
  const lang = session.language
  const questions = WHATSAPP_QUESTIONS[lang]
  const step = session.step
  const text = message.trim()

  // Language selection
  if (step === 'language') {
    if (text === '1' || text.toLowerCase().includes('eng')) {
      session.language = 'en'
    } else if (text === '2' || text.toLowerCase().includes('hin')) {
      session.language = 'hi'
    } else {
      session.language = 'en' // Default
    }
    session.step = 'welcome'
    return WHATSAPP_QUESTIONS[session.language].welcome
  }

  // Welcome - collect name
  if (step === 'welcome') {
    session.data.fullName = text
    session.step = 'whatsapp'
    return questions.whatsapp.replace('{name}', text)
  }

  // WhatsApp number
  if (step === 'whatsapp') {
    if (text.length === 10 && /^\d+$/.test(text)) {
      session.data.whatsapp = text
      session.step = 'city'
      return questions.city
    }
    return "❌ Please enter a valid 10-digit number"
  }

  // City
  if (step === 'city') {
    const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Other']
    const cityMap = { '1': 'Bangalore', '2': 'Mumbai', '3': 'Delhi', '4': 'Hyderabad', '5': 'Other' }
    session.data.city = cityMap[text] || text
    session.step = 'platform'
    return questions.platform
  }

  // Platform
  if (step === 'platform') {
    const platformMap = { '1': 'Swiggy', '2': 'Zomato', '3': 'Uber Eats', '4': 'Amazon', '5': 'Dunzo', '6': 'Other' }
    session.data.platform = platformMap[text] || text
    session.step = 'experience'
    return questions.experience
  }

  // Experience
  if (step === 'experience') {
    const expMap = { '1': 'Less than 1 year', '2': '1-3 years', '3': '3-5 years', '4': 'More than 5 years' }
    session.data.experience = expMap[text] || text
    session.step = 'vehicleType'
    return questions.vehicleType
  }

  // Vehicle Type
  if (step === 'vehicleType') {
    const vehicleMap = { '1': 'Electric Two-Wheeler', '2': 'Petrol Two-Wheeler', '3': 'Four-Wheeler', '4': 'Bicycle' }
    session.data.vehicleType = vehicleMap[text] || text
    session.step = 'vehicleBrand'
    return questions.vehicleBrand
  }

  // Vehicle Brand
  if (step === 'vehicleBrand') {
    session.data.vehicleBrand = text
    session.step = 'fuelMethod'
    return questions.fuelMethod
  }

  // Fuel Method
  if (step === 'fuelMethod') {
    const fuelMap = { '1': 'Petrol Pump', '2': 'Home Charging', '3': 'Swapping Station', '4': 'Other' }
    session.data.fuelMethod = fuelMap[text] || text
    session.step = 'weeklyExpense'
    return questions.weeklyExpense
  }

  // Weekly Expense
  if (step === 'weeklyExpense') {
    session.data.weeklyExpense = text
    session.step = 'monthlyMaintenance'
    return questions.monthlyMaintenance
  }

  // Monthly Maintenance
  if (step === 'monthlyMaintenance') {
    session.data.monthlyMaintenance = text
    session.step = 'challenges'
    return questions.challenges
  }

  // Challenges
  if (step === 'challenges') {
    const challengeMap = {
      '1': 'High fuel cost', '2': 'Frequent breakdown', '3': 'No nearby charging station',
      '4': 'Battery range anxiety', '5': 'Repair costs', '6': 'Long refuelling time', '7': 'Other'
    }
    const selectedChallenges = text.split(',').map(n => challengeMap[n.trim()]).filter(Boolean)
    session.data.challenges = selectedChallenges.join(', ')
    session.step = 'accidentInsurance'
    return questions.accidentInsurance
  }

  // Accident Insurance
  if (step === 'accidentInsurance') {
    session.data.accidentInsurance = text.toLowerCase().includes('yes') ? 'yes' : 'no'
    session.step = 'healthInsurance'
    return questions.healthInsurance
  }

  // Health Insurance
  if (step === 'healthInsurance') {
    session.data.healthInsurance = text.toLowerCase().includes('yes') ? 'yes' : 'no'
    session.step = 'paidForAccident'
    return questions.paidForAccident
  }

  // Paid for Accident
  if (step === 'paidForAccident') {
    session.data.paidForAccident = text.toLowerCase().includes('yes') ? 'yes' : 'no'
    session.step = 'switchToEV'
    return questions.switchToEV
  }

  // Switch to EV
  if (step === 'switchToEV') {
    session.data.switchToEV = text.toLowerCase().includes('yes') ? 'yes' : 'no'
    session.step = 'switchReasons'
    return questions.switchReasons
  }

  // Switch Reasons
  if (step === 'switchReasons') {
    session.data.switchReasons = text
    session.step = 'interested'
    return questions.interested
  }

  // Interested
  if (step === 'interested') {
    const interestMap = {
      '1': 'EV loans', '2': 'Insurance schemes', '3': 'Maintenance workshops',
      '4': 'Safety training', '5': 'Other benefits'
    }
    const selectedInterests = text.split(',').map(n => interestMap[n.trim()]).filter(Boolean)
    session.data.interested = selectedInterests.join(', ')
    session.step = 'referralCode'
    return questions.referralCode
  }

  // Referral Code (final step)
  if (step === 'referralCode') {
    if (!text.toLowerCase().includes('skip')) {
      session.data.referredByCode = text.toUpperCase()
    }
    session.step = 'complete'
    return 'complete' // Signal to save data
  }

  return "❌ Something went wrong. Type 'restart' to begin again."
}

// Save WhatsApp rider data
async function saveWhatsAppRider(sessionData) {
  const referralCode = generateReferralCode()
  const segment = segmentRider(sessionData)

  const riderData = {
    full_name: sessionData.fullName,
    whatsapp: sessionData.whatsapp,
    city: sessionData.city,
    platform: sessionData.platform,
    experience: sessionData.experience,
    vehicle_type: sessionData.vehicleType,
    vehicle_brand: sessionData.vehicleBrand,
    fuel_method: sessionData.fuelMethod,
    weekly_expense: sessionData.weeklyExpense,
    monthly_maintenance: sessionData.monthlyMaintenance,
    challenges: sessionData.challenges,
    ev_challenges: '',
    petrol_challenges: '',
    accident_insurance: sessionData.accidentInsurance,
    health_insurance: sessionData.healthInsurance,
    paid_for_accident: sessionData.paidForAccident,
    switch_to_ev: sessionData.switchToEV,
    switch_reasons: sessionData.switchReasons,
    interested: sessionData.interested,
    referred_by_code: sessionData.referredByCode || null,
    referral_code: referralCode,
    points: 10,
    referral_count: 0,
    segment: segment,
    language: sessionData.language || 'en',
    created_at: new Date().toISOString()
  }

  // MOCK MODE
  if (!supabase) {
    console.log('📝 WhatsApp rider saved (mock):', sessionData.fullName)
    mockDatabase.push(riderData)
    return referralCode
  }

  // REAL MODE
  const { error } = await supabase.from('riders').insert([riderData])
  if (error) throw error

  // Update referrer if applicable
  if (sessionData.referredByCode) {
    const { data: referrer } = await supabase
      .from('riders')
      .select('*')
      .eq('referral_code', sessionData.referredByCode)
      .single()

    if (referrer) {
      const newCount = (referrer.referral_count || 0) + 1
      await supabase
        .from('riders')
        .update({ 
          referral_count: newCount,
          points: calculatePoints(newCount)
        })
        .eq('id', referrer.id)
    }
  }

  return referralCode
}

// WhatsApp Webhook - Receive messages
app.post('/api/whatsapp', async (req, res) => {
  try {
    const from = req.body.From?.replace('whatsapp:+91', '') || ''
    const body = req.body.Body?.trim() || ''

    console.log('📱 WhatsApp message from:', from, '→', body)

    if (!from || !body) {
      return res.status(400).send('Invalid request')
    }

    // Handle restart command
    if (body.toLowerCase() === 'restart' || body.toLowerCase() === 'start') {
      whatsappSessions.delete(from)
      const session = getWhatsAppSession(from)
      const welcomeMsg = "🌟 *Road Warrior Registration*\n\nSelect your language:\n\n1 - English\n2 - हिंदी (Hindi)"
      await sendWhatsAppMessage(from, welcomeMsg)
      return res.status(200).send('OK')
    }

    // Get or create session
    const session = getWhatsAppSession(from)

    // First time user
    if (session.step === 'language' && !body) {
      const welcomeMsg = "🌟 *Road Warrior Registration*\n\nSelect your language:\n\n1 - English\n2 - हिंदी (Hindi)"
      await sendWhatsAppMessage(from, welcomeMsg)
      return res.status(200).send('OK')
    }

    // Process response
    const response = processWhatsAppResponse(session, body)

    // Check if complete
    if (response === 'complete') {
      const referralCode = await saveWhatsAppRider(session.data)
      const lang = session.language
      const completeMsg = WHATSAPP_QUESTIONS[lang].complete.replace('{code}', referralCode)
      await sendWhatsAppMessage(from, completeMsg)
      
      // Clear session
      whatsappSessions.delete(from)
    } else {
      await sendWhatsAppMessage(from, response)
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    res.status(500).send('Error')
  }
})

// Generate QR code
app.get('/api/qr/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params
    const url = `${process.env.APP_URL}/?ref=${referralCode}`
    const qrCode = await QRCode.toDataURL(url)
    res.json({ qrCode })
  } catch (error) {
    console.error('Error generating QR code:', error)
    res.status(500).json({ error: 'Failed to generate QR code' })
  }
})

const PORT = process.env.PORT || 5000
const HOST = '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`)
})
