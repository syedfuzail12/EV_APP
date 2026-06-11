import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import QRCode from 'qrcode'
import axios from 'axios'
import helmet from 'helmet'
import { submissionLimiter, apiLimiter, whatsappLimiter } from './middleware/rateLimiter.js'
import { validatePhone, validatePinCode, detectHoneypot, sanitizeString } from './utils/validation.js'
import { calculateLeadTags, calculateSegment, calculateFollowUpStatus } from './utils/segmentation.js'
import { generateCSV } from './utils/csvExport.js'
import { generateOTP, sendOTP, verifyOTP, canResendOTP, getResendCooldown } from './utils/otp.js'

dotenv.config()

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow loading external resources (QR codes, etc.)
  crossOriginEmbedderPolicy: false
}))

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // For Twilio webhook

// Apply general API rate limiting
app.use('/api', apiLimiter)

// Supabase client (mock mode if not configured)
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null

// In-memory storage for mock mode
const mockDatabase = []

// WhatsApp conversation sessions (stores user progress)
const whatsappSessions = new Map()

// Twilio client (will be enabled when you add credentials)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

console.log('🔧 Twilio setup:', {
  hasSID: !!process.env.TWILIO_ACCOUNT_SID,
  hasToken: !!process.env.TWILIO_AUTH_TOKEN,
  hasWhatsApp: !!process.env.TWILIO_WHATSAPP_NUMBER,
  clientInitialized: !!twilioClient
})

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

// Segment rider based on responses (LEGACY - for backward compatibility)
function segmentRider(data) {
  return calculateSegment(data)
}

// Send WhatsApp message
async function sendWhatsAppMessage(phone, message) {
  console.log('📤 Attempting to send WhatsApp message to:', phone)
  
  if (!twilioClient) {
    console.log('⚠️ Twilio not configured - skipping WhatsApp')
    return { success: false, reason: 'no_twilio_client' }
  }
  
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+91${phone}`
    })
    
    console.log('✅ WhatsApp sent! SID:', result.sid)
    return { success: true, sid: result.sid }
  } catch (error) {
    console.error('❌ WhatsApp failed:', error.message)
    return { success: false, reason: error.code || error.message }
  }
}

// Send WhatsApp media (for QR code images)
async function sendWhatsAppMedia(phone, mediaUrl, caption) {
  console.log('📤 Sending WhatsApp media to:', phone)
  
  if (!twilioClient) {
    console.log('⚠️ Twilio not configured')
    return { success: false, reason: 'no_twilio_client' }
  }
  
  try {
    const result = await twilioClient.messages.create({
      body: caption || '',
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+91${phone}`,
      mediaUrl: [mediaUrl]
    })
    
    console.log('✅ WhatsApp media sent! SID:', result.sid)
    return { success: true, sid: result.sid }
  } catch (error) {
    console.error('❌ WhatsApp media failed:', error.message)
    return { success: false, reason: error.message }
  }
}

// Send notification (WhatsApp with fallback to on-screen)
async function sendNotification(phone, message) {
  console.log('📲 Sending notification to:', phone)
  
  if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER) {
    const whatsappResult = await sendWhatsAppMessage(phone, message)
    
    if (whatsappResult.success) {
      console.log('✅ WhatsApp notification sent')
      return { success: true, method: 'whatsapp', ...whatsappResult }
    }
    
    console.log('⚠️ WhatsApp failed, showing on screen')
  }
  
  // Fallback to on-screen notification
  console.log('ℹ️ Using on-screen notification')
  return { success: false, method: 'screen', reason: 'whatsapp_unavailable' }
}

// Send notification (disabled - just show on screen)
async function sendNotification_OLD(phone, message) {
  console.log('📲 Notification disabled - showing on screen only')
  console.log('📱 Would send to:', phone)
  console.log('📝 Message:', message.substring(0, 100))
  
  // No SMS/WhatsApp - user sees referral code on success screen
  return { success: false, method: 'screen', reason: 'notifications_disabled' }
}

// Send SMS via Twilio
async function sendSMS_Twilio(phone, message) {
  console.log('📱 Attempting to send SMS via Twilio to:', phone)
  
  if (!twilioClient) {
    console.log('⚠️ Twilio client not initialized')
    return { success: false, reason: 'no_twilio_client' }
  }
  
  try {
    // Truncate message to 160 characters (SMS limit)
    const smsMessage = message.length > 160 ? message.substring(0, 157) + '...' : message
    
    console.log('📤 Sending SMS to:', `+91${phone}`)
    
    // Send SMS using Twilio (not WhatsApp)
    const result = await twilioClient.messages.create({
      body: smsMessage,
      from: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER?.replace('whatsapp:', ''),
      to: `+91${phone}`
    })
    
    console.log('✅ Twilio SMS sent! SID:', result.sid)
    return { success: true, provider: 'twilio_sms', sid: result.sid }
  } catch (error) {
    console.error('❌ Twilio SMS failed:', error.message)
    return { success: false, reason: error.code || error.message }
  }
}

// Send SMS (just uses Twilio)
async function sendSMS(phone, message) {
  console.log('📱 Starting SMS send process for:', phone)
  return await sendSMS_Twilio(phone, message)
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

// ============================================
// OTP VERIFICATION ENDPOINTS
// ============================================

// Send OTP to phone number
app.post('/api/otp/send', apiLimiter, async (req, res) => {
  try {
    const { phone } = req.body
    
    console.log(`📱 OTP request for: ${phone}`)
    
    // Validate phone number format
    if (!validatePhone(phone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Must be 10 digits starting with 6-9' 
      })
    }
    
    // Check if can resend (rate limiting - 60 seconds cooldown)
    if (!canResendOTP(phone)) {
      const cooldown = getResendCooldown(phone)
      return res.status(429).json({ 
        error: `Please wait ${cooldown} seconds before requesting new OTP`,
        cooldown: cooldown
      })
    }
    
    // Generate OTP
    const otp = generateOTP()
    console.log(`🔢 Generated OTP: ${otp} for ${phone}`)
    
    // Send OTP via Fast2SMS
    const result = await sendOTP(phone, otp)
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'OTP sent successfully to your mobile number',
        // In development, you can uncomment this to see OTP in response
        // otp: process.env.NODE_ENV === 'development' ? otp : undefined
      })
    } else {
      console.error('❌ OTP send failed:', result.reason)
      res.status(500).json({ 
        error: 'Failed to send OTP. Please try again.',
        reason: result.reason
      })
    }
  } catch (error) {
    console.error('❌ OTP send error:', error)
    res.status(500).json({ error: 'Failed to send OTP' })
  }
})

// Verify OTP entered by user
app.post('/api/otp/verify', apiLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body
    
    console.log(`🔍 OTP verification for: ${phone}`)
    
    // Validate inputs
    if (!phone || !otp) {
      return res.status(400).json({ 
        error: 'Phone number and OTP are required' 
      })
    }
    
    if (!validatePhone(phone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number' 
      })
    }
    
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ 
        error: 'OTP must be exactly 6 digits' 
      })
    }
    
    // Verify OTP
    const result = verifyOTP(phone, otp)
    
    if (result.success) {
      console.log(`✅ OTP verified for ${phone}`)
      res.json({ 
        success: true, 
        message: 'Phone number verified successfully' 
      })
    } else {
      // Handle different failure reasons
      const errorMessages = {
        'otp_not_found': 'No OTP found. Please request a new one.',
        'otp_expired': 'OTP has expired. Please request a new one.',
        'max_attempts_exceeded': 'Too many failed attempts. Please request a new OTP.',
        'invalid_otp': `Invalid OTP. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`
      }
      
      console.log(`❌ OTP verification failed: ${result.reason}`)
      
      res.status(400).json({ 
        error: errorMessages[result.reason] || 'Verification failed',
        attemptsLeft: result.attemptsLeft
      })
    }
  } catch (error) {
    console.error('❌ OTP verify error:', error)
    res.status(500).json({ error: 'Failed to verify OTP' })
  }
})

// ============================================
// RIDER SUBMISSION
// ============================================

// Submit rider with SECURITY and NEW FIELDS
app.post('/api/riders', submissionLimiter, async (req, res) => {
  try {
    const riderData = req.body
    
    // SECURITY: Check honeypot (bot detection)
    if (detectHoneypot(req)) {
      console.log('🤖 Bot detected via honeypot')
      return res.status(400).json({ error: 'Invalid submission' })
    }
    
    // SECURITY: Validate phone number
    if (!validatePhone(riderData.whatsapp)) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Must be 10 digits starting with 6-9' 
      })
    }
    
    // SECURITY: Validate PIN code if provided
    if (riderData.pinCode && !validatePinCode(riderData.pinCode)) {
      return res.status(400).json({ 
        error: 'Invalid PIN code. Must be exactly 6 digits' 
      })
    }
    
    // SECURITY: Check consent
    if (!riderData.consentGiven) {
      return res.status(400).json({ 
        error: 'Privacy consent is required to register' 
      })
    }
    
    // Sanitize string inputs
    riderData.fullName = sanitizeString(riderData.fullName)
    riderData.vehicleBrand = sanitizeString(riderData.vehicleBrand)
    
    // Generate referral code
    const referralCode = generateReferralCode()
    
    // Calculate lead tags (6 precise types)
    const leadTags = calculateLeadTags(riderData)
    console.log('🏷️ Calculated lead tags:', leadTags, 'for rider:', riderData.fullName)
    console.log('📊 Input data for tags:', {
      vehicleType: riderData.vehicleType,
      switchToEV: riderData.switchToEV,
      interested: riderData.interested,
      healthInsurance: riderData.healthInsurance,
      accidentInsurance: riderData.accidentInsurance,
      paidForAccident: riderData.paidForAccident,
      accessories: riderData.accessories
    })
    
    // Calculate follow-up status
    const followUpStatus = calculateFollowUpStatus(new Date().toISOString(), false)
    
    // MOCK MODE: If no database configured
    if (!supabase) {
      console.log('📝 Mock submission received:', riderData.fullName, riderData.whatsapp)
      
      // Store in mock database
      const newRider = {
        id: Date.now().toString(),
        full_name: riderData.fullName,
        whatsapp: riderData.whatsapp,
        city: riderData.city,
        pin_code: riderData.pinCode || null,
        platforms: riderData.platforms || [riderData.platform],
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
        accessories: riderData.accessories || [],
        consent_given: riderData.consentGiven,
        referred_by_code: riderData.referralCode || null,
        referral_code: referralCode,
        points: 10,
        referral_count: 0,
        segment: segmentRider(riderData),
        lead_tags: leadTags,
        follow_up_status: followUpStatus,
        language: riderData.language,
        otp_verified: false,
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
        leadTags: leadTags,
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
          await sendNotification(
            referrer.whatsapp,
            `🎉 Milestone achieved! You've referred 10 riders. +100 bonus points! Keep going!`
          )
        } else if (newReferralCount === 25) {
          await sendNotification(
            referrer.whatsapp,
            `🏆 Amazing! You've referred 25 riders. +300 bonus points! You're a Road Warrior!`
          )
        } else if (newReferralCount === 50) {
          await sendNotification(
            referrer.whatsapp,
            `🎁 Legendary! 50 referrals! +500 bonus points + Lucky Draw entry! 🎉`
          )
        }
      }
    }
    
    // Segment the rider
    const segment = segmentRider(riderData)
    
    // Insert rider with NEW FIELDS
    const { data: newRider, error } = await supabase
      .from('riders')
      .insert([{
        full_name: riderData.fullName,
        whatsapp: riderData.whatsapp,
        city: riderData.city,
        pin_code: riderData.pinCode || null,
        platforms: riderData.platforms || [riderData.platform],
        platform: riderData.platform, // Keep for backward compatibility
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
        accessories: riderData.accessories || [],
        consent_given: riderData.consentGiven,
        referred_by_code: riderData.referralCode || null,
        referral_code: referralCode,
        points: 10,
        referral_count: 0,
        segment: segment,
        lead_tags: leadTags,
        follow_up_status: followUpStatus,
        language: riderData.language,
        otp_verified: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    
    // Send welcome notification (WhatsApp → SMS fallback)
    const messages = {
      en: `Welcome ${riderData.fullName}! You are now registered. Your referral code is: ${referralCode}. Share it with other riders to earn points and rewards. Road Warrior — let's go!`,
      hi: `नमस्ते ${riderData.fullName} भाई! आपका रजिस्ट्रेशन हो गया। आपका रेफरल कोड है: ${referralCode}. इस कोड को अपने दोस्तों के साथ शेयर करो और पॉइंट्स कमाओ। Road Warrior बनो!`,
      kn: `ಸ್ವಾಗತ ${riderData.fullName}! ನೀವು ಈಗ ನೋಂದಾಯಿಸಿದ್ದೀರಿ. ನಿಮ್ಮ ರೆಫರಲ್ ಕೋಡ್: ${referralCode}. ಪಾಯಿಂಟ್‌ಗಳನ್ನು ಗಳಿಸಲು ಇತರ ರೈಡರ್‌ಗಳೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ. Road Warrior!`
    }
    
    const notificationResult = await sendNotification(
      riderData.whatsapp,
      messages[riderData.language] || messages.en
    )
    
    res.json({
      success: true,
      referralCode: referralCode,
      points: 10,
      leadTags: leadTags,
      rider: newRider,
      notificationSent: notificationResult.success,
      notificationMethod: notificationResult.method
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
        pinCode: r.pin_code,
        platforms: r.platforms || [r.platform],
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
        accessories: r.accessories || [],
        referralCode: r.referral_code,
        points: r.points || 10,
        referralCount: r.referral_count || 0,
        segment: r.segment,
        leadTags: r.lead_tags || [],
        followUpStatus: r.follow_up_status || 'New',
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
      pinCode: r.pin_code,
      platforms: r.platforms || [r.platform],
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
      accessories: r.accessories || [],
      referralCode: r.referral_code,
      points: r.points || 10,
      referralCount: r.referral_count || 0,
      segment: r.segment,
      leadTags: r.lead_tags || [],
      followUpStatus: r.follow_up_status || 'New',
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

// Temporary endpoint to get Render's outbound IP
app.get('/api/ip', async (req, res) => {
  try {
    // Get Render's outbound IP by calling external service
    const response = await axios.get('https://api.ipify.org?format=json')
    res.json({ 
      ip: response.data.ip,
      message: 'Add this IP to MSG91 authkey whitelist'
    })
  } catch (error) {
    res.json({ 
      error: 'Could not get IP',
      alternative: 'Check Render logs for actual IP making request to MSG91'
    })
  }
})

// CSV Export endpoint (with segment filtering)
app.get('/api/export/csv', async (req, res) => {
  try {
    const { segment, city, pinCode, platform, followUp } = req.query
    
    let riders = []
    
    // MOCK MODE
    if (!supabase) {
      riders = mockDatabase
    } else {
      // REAL MODE: Query database
      let query = supabase.from('riders').select('*')
      
      // Apply filters
      if (segment && segment !== 'all') {
        query = query.contains('lead_tags', [segment])
      }
      if (city) {
        query = query.eq('city', city)
      }
      if (pinCode) {
        query = query.eq('pin_code', pinCode)
      }
      if (platform) {
        query = query.eq('platform', platform)
      }
      if (followUp) {
        query = query.eq('follow_up_status', followUp)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      riders = data
    }
    
    // Convert to CSV
    const csv = generateCSV(riders)
    
    // Set headers for file download
    const filename = `riders_export_${Date.now()}.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (error) {
    console.error('Error exporting CSV:', error)
    res.status(500).json({ error: 'Failed to export data' })
  }
})

// ============================================
// WHATSAPP CHATBOT - Interactive Questionnaire
// ============================================

// WhatsApp conversation flow structure (WITH CONDITIONAL LOGIC)
const WHATSAPP_QUESTIONS = {
  en: {
    welcome: "👋 Welcome to Road Warrior!\n\nI'll help you register in just 3 minutes. Let's start!\n\n*What's your full name?*",
    whatsapp: "Great {name}! 📱\n\n*What's your WhatsApp number?* (10 digits)",
    city: "📍 *Which city do you work in?*\n\nType:\n1 - Bangalore\n2 - Mumbai\n3 - Delhi\n4 - Hyderabad\n5 - Pune\n6 - Other",
    platform: "🛵 *Which platforms do you ride for?*\n(Type numbers separated by commas, e.g., 1,2,4)\n\n1 - Swiggy\n2 - Zomato\n3 - Uber Eats\n4 - Amazon\n5 - Dunzo\n6 - Porter\n7 - Blinkit\n8 - Other",
    experience: "⏱️ *How many years of delivery experience?*\n\nType:\n1 - Less than 1 year\n2 - 1-3 years\n3 - 3-5 years\n4 - More than 5 years",
    vehicleType: "🏍️ *What vehicle do you use?*\n\nType:\n1 - Electric Two-Wheeler\n2 - Petrol Two-Wheeler\n3 - Four-Wheeler\n4 - Bicycle",
    vehicleBrand: "*What's your vehicle brand?*\n(e.g., Honda, TVS, Ola Electric, Ather)",
    // CONDITIONAL: EV-specific fuel method
    fuelMethodEV: "⚡ *Charging Method*\n\nType:\n1 - Home Charging\n2 - Swapping Station\n3 - Public Charging Station\n4 - Other",
    // CONDITIONAL: Petrol-specific fuel method
    fuelMethodPetrol: "⛽ *Refueling Method*\n\nType:\n1 - Petrol Pump\n2 - Other",
    // General fuel method (for other vehicles)
    fuelMethod: "⛽ *How do you refuel/charge?*\n\nType:\n1 - Petrol Pump\n2 - Home Charging\n3 - Swapping Station\n4 - Other",
    weeklyExpenseEV: "💰 *Weekly charging expense?*\n(in ₹, e.g., 500)",
    weeklyExpensePetrol: "💰 *Weekly fuel expense?*\n(in ₹, e.g., 500)",
    weeklyExpense: "💰 *Weekly fuel/charging expense?*\n(in ₹, e.g., 500)",
    monthlyMaintenance: "🔧 *Monthly maintenance cost?*\n(in ₹, e.g., 1000)",
    // CONDITIONAL: EV challenges (filtered - no fuel cost, no refuelling time)
    challengesEV: "⚠️ *What challenges do you face?*\n(Type numbers separated by commas)\n\n1 - Frequent breakdown\n2 - No nearby charging station\n3 - Battery range anxiety\n4 - Repair costs\n5 - Other",
    // CONDITIONAL: Petrol challenges (filtered - no charging station, no battery anxiety)
    challengesPetrol: "⚠️ *What challenges do you face?*\n(Type numbers separated by commas)\n\n1 - High fuel cost\n2 - Frequent breakdown\n3 - Repair costs\n4 - Long refuelling time\n5 - Other",
    // General challenges (all vehicles)
    challenges: "⚠️ *What challenges do you face?*\n(Type numbers separated by commas)\n\n1 - High fuel cost\n2 - Frequent breakdown\n3 - No nearby charging station\n4 - Battery range anxiety\n5 - Repair costs\n6 - Long refuelling time\n7 - Other",
    evChallenges: "⚡ *Additional EV challenges?*\n(Type numbers separated by commas, or 'skip')\n\n1 - Battery drains too fast\n2 - Swapping station too far\n3 - Long charging time at home\n4 - Vehicle not powerful enough\n5 - Service centre not nearby\n6 - Other",
    petrolChallenges: "🛢️ *Additional Petrol vehicle challenges?*\n(Type numbers separated by commas, or 'skip')\n\n1 - Fuel price too high\n2 - Frequent engine issues\n3 - Pollution fine risk\n4 - High servicing cost\n5 - Other",
    accidentInsurance: "🛡️ *Do you have accident insurance?*\n\nType:\n1 - Yes\n2 - No\n3 - Not sure",
    healthInsurance: "🏥 *Do you have health insurance?*\n\nType:\n1 - Yes\n2 - No\n3 - Not sure",
    paidForAccident: "💸 *Have you paid out-of-pocket for accident/health issues?*\n\nType: yes or no",
    // CONDITIONAL: Different switch questions for different vehicles
    switchToEVPetrol: "⚡ *Would you switch to an electric two-wheeler?*\n\nType:\n1 - Yes, interested\n2 - No, happy with current\n3 - Need more info",
    switchToEVFourWheeler: "⚡ *Would you switch to an electric vehicle?*\n\nType:\n1 - Yes, interested\n2 - No, happy with current\n3 - Need more info",
    switchToEVBicycle: "⚡ *Would you consider using an electric two-wheeler for deliveries?*\n\nType:\n1 - Yes, considering it\n2 - No, prefer bicycle\n3 - Need more info",
    switchToEVAlready: "✅ *You're already on an Electric Two-Wheeler!*\n\nGreat choice for the environment and your wallet! 🌱\n\n_Moving to next question..._",
    switchReasons: "💡 *What would make you switch to EV?*\n(Type numbers separated by commas)\n\n1 - Lower rental cost\n2 - Better battery range\n3 - Swap stations nearby\n4 - Income guarantee\n5 - Employer subsidy\n6 - Other",
    // CONDITIONAL: Different interests for different vehicles
    interestedEV: "📚 *What else can we help you with?*\n(Type numbers separated by commas)\n\n1 - Better EV rental offer\n2 - Insurance quote\n3 - Accessories\n4 - All of the above\n5 - None",
    interestedPetrol: "📚 *What are you interested in?*\n(Type numbers separated by commas)\n\n1 - EV rental offer\n2 - Retrofit information\n3 - Insurance quote\n4 - All of the above\n5 - None",
    interested: "📚 *What are you interested in?*\n(Type numbers separated by commas)\n\n1 - EV information\n2 - Insurance quote\n3 - Accessories\n4 - All of the above\n5 - None",
    referralCode: "🎁 *Were you referred by someone?*\n\nType their referral code or 'skip'",
    complete: "🎉 *Registration Complete!*\n\n✅ Referral Code: *{code}*\n💎 Points: 10\n\n📎 *Your Referral Link:*\n{link}\n\n📲 Share this link with friends!\nWhen they click it, your code is auto-filled.\n\n🏆 *Earn Rewards:*\n• 10 referrals = +100 points\n• 25 referrals = +300 points\n• 50 referrals = +500 points + Lucky Draw\n\n⚡ Getting your QR code...",
    qrCode: "📱 *Your QR Code:*\n\n{qrImage}\n\n🖨️ *Share this QR code:*\n• Print and put at petrol pumps\n• Share in rider WhatsApp groups\n• Show to other delivery riders\n\n💡 *Or share your referral link* (easier!):\n{link}\n\n⚡ Thank you for joining Road Warrior!"
  },
  hi: {
    welcome: "👋 रोड वॉरियर में आपका स्वागत है!\n\nमैं आपको 3 मिनट में रजिस्टर करने में मदद करूंगा। चलिए शुरू करते हैं!\n\n*आपका पूरा नाम क्या है?*",
    whatsapp: "बहुत बढ़िया {name}! 📱\n\n*आपका व्हाट्सएप नंबर क्या है?* (10 अंक)",
    city: "📍 *आप किस शहर में काम करते हैं?*\n\nटाइप करें:\n1 - बैंगलोर\n2 - मुंबई\n3 - दिल्ली\n4 - हैदराबाद\n5 - पुणे\n6 - अन्य",
    platform: "🛵 *आप किन प्लेटफ़ॉर्म के लिए राइड करते हैं?*\n(नंबर कॉमा से अलग करें, जैसे 1,2,4)\n\n1 - स्विगी\n2 - ज़ोमैटो\n3 - उबर ईट्स\n4 - अमेज़न\n5 - डन्ज़ो\n6 - पोर्टर\n7 - ब्लिंकिट\n8 - अन्य",
    experience: "⏱️ *कितने साल का डिलीवरी अनुभव?*\n\nटाइप करें:\n1 - 1 साल से कम\n2 - 1-3 साल\n3 - 3-5 साल\n4 - 5 साल से अधिक",
    vehicleType: "🏍️ *आप कौन सा वाहन उपयोग करते हैं?*\n\nटाइप करें:\n1 - इलेक्ट्रिक टू-व्हीलर\n2 - पेट्रोल टू-व्हीलर\n3 - फोर-व्हीलर\n4 - साइकिल",
    vehicleBrand: "*आपके वाहन का ब्रांड?*\n(जैसे Honda, TVS, Ola Electric, Ather)",
    fuelMethodEV: "⚡ *चार्जिंग विधि*\n\nटाइप करें:\n1 - घर पर चार्जिंग\n2 - स्वैपिंग स्टेशन\n3 - पब्लिक चार्जिंग स्टेशन\n4 - अन्य",
    fuelMethodPetrol: "⛽ *रीफ्यूलिंग विधि*\n\nटाइप करें:\n1 - पेट्रोल पंप\n2 - अन्य",
    fuelMethod: "⛽ *आप कैसे रीफ्यूल/चार्ज करते हैं?*\n\nटाइप करें:\n1 - पेट्रोल पंप\n2 - घर पर चार्जिंग\n3 - स्वैपिंग स्टेशन\n4 - अन्य",
    weeklyExpenseEV: "💰 *साप्ताहिक चार्जिंग खर्च?*\n(₹ में, जैसे 500)",
    weeklyExpensePetrol: "💰 *साप्ताहिक ईंधन खर्च?*\n(₹ में, जैसे 500)",
    weeklyExpense: "💰 *साप्ताहिक ईंधन/चार्जिंग खर्च?*\n(₹ में, जैसे 500)",
    monthlyMaintenance: "🔧 *मासिक रखरखाव लागत?*\n(₹ में, जैसे 1000)",
    challengesEV: "⚠️ *आपको क्या चुनौतियाँ हैं?*\n(नंबर कॉमा से अलग करें)\n\n1 - बार-बार खराबी\n2 - पास में चार्जिंग नहीं\n3 - बैटरी रेंज की चिंता\n4 - मरम्मत की लागत\n5 - अन्य",
    challengesPetrol: "⚠️ *आपको क्या चुनौतियाँ हैं?*\n(नंबर कॉमा से अलग करें)\n\n1 - महंगा ईंधन\n2 - बार-बार खराबी\n3 - मरम्मत की लागत\n4 - रीफ्यूल में समय\n5 - अन्य",
    challenges: "⚠️ *आपको क्या चुनौतियाँ हैं?*\n(नंबर कॉमा से अलग करें)\n\n1 - महंगा ईंधन\n2 - बार-बार खराबी\n3 - पास में चार्जिंग नहीं\n4 - बैटरी रेंज की चिंता\n5 - मरम्मत की लागत\n6 - रीफ्यूल में समय\n7 - अन्य",
    evChallenges: "⚡ *अतिरिक्त EV चुनौतियाँ?*\n(नंबर कॉमा से अलग करें, या 'skip' लिखें)\n\n1 - बैटरी जल्दी खत्म\n2 - स्वैपिंग स्टेशन दूर\n3 - घर पर चार्जिंग में समय\n4 - वाहन पावरफुल नहीं\n5 - सर्विस सेंटर दूर\n6 - अन्य",
    petrolChallenges: "🛢️ *अतिरिक्त पेट्रोल वाहन चुनौतियाँ?*\n(नंबर कॉमा से अलग करें, या 'skip' लिखें)\n\n1 - ईंधन की कीमत ज्यादा\n2 - इंजन में समस्या\n3 - प्रदूषण जुर्माना\n4 - सर्विसिंग महंगी\n5 - अन्य",
    accidentInsurance: "🛡️ *क्या आपके पास दुर्घटना बीमा है?*\n\nटाइप करें:\n1 - हां\n2 - नहीं\n3 - पता नहीं",
    healthInsurance: "🏥 *क्या आपके पास स्वास्थ्य बीमा है?*\n\nटाइप करें:\n1 - हां\n2 - नहीं\n3 - पता नहीं",
    paidForAccident: "💸 *क्या आपने दुर्घटना/स्वास्थ्य के लिए जेब से पैसे दिए हैं?*\n\nटाइप करें: yes या no",
    switchToEVPetrol: "⚡ *क्या आप इलेक्ट्रिक टू-व्हीलर में स्विच करेंगे?*\n\nटाइप करें:\n1 - हां, इच्छुक हूं\n2 - नहीं, खुश हूं\n3 - और जानकारी चाहिए",
    switchToEVFourWheeler: "⚡ *क्या आप इलेक्ट्रिक वाहन में स्विच करेंगे?*\n\nटाइप करें:\n1 - हां, इच्छुक हूं\n2 - नहीं, खुश हूं\n3 - और जानकारी चाहिए",
    switchToEVBicycle: "⚡ *क्या आप डिलीवरी के लिए इलेक्ट्रिक टू-व्हीलर इस्तेमाल करना चाहेंगे?*\n\nटाइप करें:\n1 - हां, सोच रहा हूं\n2 - नहीं, साइकिल पसंद है\n3 - और जानकारी चाहिए",
    switchToEVAlready: "✅ *आप पहले से इलेक्ट्रिक टू-व्हीलर पर हैं!*\n\nपर्यावरण और आपकी जेब के लिए बढ़िया विकल्प! 🌱\n\n_अगले सवाल पर जा रहे हैं..._",
    switchReasons: "💡 *आप क्यों स्विच करेंगे?*\n(नंबर कॉमा से अलग करें)\n\n1 - कम किराया\n2 - बेहतर बैटरी रेंज\n3 - पास में स्वैप स्टेशन\n4 - आय की गारंटी\n5 - नियोक्ता सब्सिडी\n6 - अन्य",
    interestedEV: "📚 *हम और कैसे मदद कर सकते हैं?*\n(नंबर कॉमा से अलग करें)\n\n1 - बेहतर EV किराया ऑफर\n2 - बीमा कोट\n3 - एक्सेसरीज\n4 - सब कुछ\n5 - कुछ नहीं",
    interestedPetrol: "📚 *आप किसमें रुचि रखते हैं?*\n(नंबर कॉमा से अलग करें)\n\n1 - EV किराया ऑफर\n2 - रेट्रोफिट जानकारी\n3 - बीमा कोट\n4 - सब कुछ\n5 - कुछ नहीं",
    interested: "📚 *आप किसमें रुचि रखते हैं?*\n(नंबर कॉमा से अलग करें)\n\n1 - EV जानकारी\n2 - बीमा कोट\n3 - एक्सेसरीज\n4 - सब कुछ\n5 - कुछ नहीं",
    referralCode: "🎁 *क्या किसी ने आपको रेफर किया?*\n\nउनका रेफरल कोड टाइप करें या 'skip' लिखें",
    complete: "🎉 *रजिस्ट्रेशन पूरा हुआ!*\n\n✅ रेफरल कोड: *{code}*\n💎 पॉइंट्स: 10\n\n📎 *आपका रेफरल लिंक:*\n{link}\n\n📲 दोस्तों के साथ यह लिंक शेयर करें!\nजब वे क्लिक करेंगे, आपका कोड ऑटो-भरा होगा।\n\n🏆 *इनाम पाएं:*\n• 10 रेफरल = +100 पॉइंट्स\n• 25 रेफरल = +300 पॉइंट्स\n• 50 रेफरल = +500 पॉइंट्स + लकी ड्रा\n\n⚡ आपका QR कोड आ रहा है...",
    qrCode: "📱 *आपका QR कोड:*\n\n{qrImage}\n\n🖨️ *यह QR कोड शेयर करें:*\n• प्रिंट करके पेट्रोल पंप पर लगाएं\n• राइडर व्हाट्सएप ग्रुप में शेयर करें\n• अन्य डिलीवरी राइडर्स को दिखाएं\n\n💡 *या अपना रेफरल लिंक शेयर करें* (आसान!):\n{link}\n\n⚡ रोड वॉरियर में शामिल होने के लिए धन्यवाद!"
  },
  kn: {
    welcome: "👋 ರೋಡ್ ವಾರಿಯರ್‌ಗೆ ಸ್ವಾಗತ!\n\nನಾನು 3 ನಿಮಿಷಗಳಲ್ಲಿ ನಿಮ್ಮನ್ನು ನೋಂದಾಯಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಪ್ರಾರಂಭಿಸೋಣ!\n\n*ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?*",
    whatsapp: "ಅದ್ಭುತ {name}! 📱\n\n*ನಿಮ್ಮ ವಾಟ್ಸಾಪ್ ನಂಬರ್ ಏನು?* (10 ಅಂಕೆಗಳು)",
    city: "📍 *ನೀವು ಯಾವ ನಗರದಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಬೆಂಗಳೂರು\n2 - ಮುಂಬೈ\n3 - ದೆಹಲಿ\n4 - ಹೈದರಾಬಾದ್\n5 - ಪುಣೆ\n6 - ಇತರೆ",
    platform: "🛵 *ನೀವು ಯಾವ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳಿಗಾಗಿ ರೈಡ್ ಮಾಡುತ್ತೀರಿ?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ ಸಂಖ್ಯೆಗಳನ್ನು, ಉದಾ: 1,2,4)\n\n1 - ಸ್ವಿಗ್ಗಿ\n2 - ಝೊಮಾಟೊ\n3 - ಉಬರ್ ಈಟ್ಸ್\n4 - ಆಮೆಜಾನ್\n5 - ಡನ್ಜೊ\n6 - ಪೋರ್ಟರ್\n7 - ಬ್ಲಿಂಕಿಟ್\n8 - ಇತರೆ",
    experience: "⏱️ *ಎಷ್ಟು ವರ್ಷಗಳ ಡೆಲಿವರಿ ಅನುಭವ?*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - 1 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ\n2 - 1-3 ವರ್ಷಗಳು\n3 - 3-5 ವರ್ಷಗಳು\n4 - 5 ವರ್ಷಗಳಿಗಿಂತ ಹೆಚ್ಚು",
    vehicleType: "🏍️ *ನೀವು ಯಾವ ವಾಹನವನ್ನು ಬಳಸುತ್ತೀರಿ?*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಎಲೆಕ್ಟ್ರಿಕ್ ಟು-ವೀಲರ್\n2 - ಪೆಟ್ರೋಲ್ ಟು-ವೀಲರ್\n3 - ಫೋರ್-ವೀಲರ್\n4 - ಸೈಕಲ್",
    vehicleBrand: "*ನಿಮ್ಮ ವಾಹನದ ಬ್ರಾಂಡ್ ಏನು?*\n(ಉದಾ: Honda, TVS, Ola Electric, Ather)",
    fuelMethodEV: "⚡ *ಚಾರ್ಜಿಂಗ್ ವಿಧಾನ*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಮನೆಯಲ್ಲಿ ಚಾರ್ಜಿಂಗ್\n2 - ಸ್ವಾಪಿಂಗ್ ಸ್ಟೇಷನ್\n3 - ಸಾರ್ವಜನಿಕ ಚಾರ್ಜಿಂಗ್ ಸ್ಟೇಷನ್\n4 - ಇತರೆ",
    fuelMethodPetrol: "⛽ *ಇಂಧನ ತುಂಬುವ ವಿಧಾನ*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಪೆಟ್ರೋಲ್ ಪಂಪ್\n2 - ಇತರೆ",
    fuelMethod: "⛽ *ನೀವು ಹೇಗೆ ಇಂಧನ/ಚಾರ್ಜ್ ಮಾಡುತ್ತೀರಿ?*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಪೆಟ್ರೋಲ್ ಪಂಪ್\n2 - ಮನೆಯಲ್ಲಿ ಚಾರ್ಜಿಂಗ್\n3 - ಸ್ವಾಪಿಂಗ್ ಸ್ಟೇಷನ್\n4 - ಇತರೆ",
    weeklyExpenseEV: "💰 *ವಾರದ ಚಾರ್ಜಿಂಗ್ ಖರ್ಚು?*\n(₹ನಲ್ಲಿ, ಉದಾ: 500)",
    weeklyExpensePetrol: "💰 *ವಾರದ ಇಂಧನ ಖರ್ಚು?*\n(₹ನಲ್ಲಿ, ಉದಾ: 500)",
    weeklyExpense: "💰 *ವಾರದ ಇಂಧನ/ಚಾರ್ಜಿಂಗ್ ಖರ್ಚು?*\n(₹ನಲ್ಲಿ, ಉದಾ: 500)",
    monthlyMaintenance: "🔧 *ತಿಂಗಳ ನಿರ್ವಹಣೆ ವೆಚ್ಚ?*\n(₹ನಲ್ಲಿ, ಉದಾ: 1000)",
    challengesEV: "⚠️ *ನೀವು ಯಾವ ಸವಾಲುಗಳನ್ನು ಎದುರಿಸುತ್ತೀರಿ?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ ಸಂಖ್ಯೆಗಳನ್ನು)\n\n1 - ಆಗಾಗ್ಗೆ ಹಾನಿ\n2 - ಹತ್ತಿರ ಚಾರ್ಜಿಂಗ್ ಇಲ್ಲ\n3 - ಬ್ಯಾಟರಿ ರೇಂಜ್ ಚಿಂತೆ\n4 - ದುರಸ್ತಿ ವೆಚ್ಚ\n5 - ಇತರೆ",
    challengesPetrol: "⚠️ *ನೀವು ಯಾವ ಸವಾಲುಗಳನ್ನು ಎದುರಿಸುತ್ತೀರಿ?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ ಸಂಖ್ಯೆಗಳನ್ನು)\n\n1 - ಹೆಚ್ಚಿನ ಇಂಧನ ವೆಚ್ಚ\n2 - ಆಗಾಗ್ಗೆ ಹಾನಿ\n3 - ದುರಸ್ತಿ ವೆಚ್ಚ\n4 - ಇಂಧನ ತುಂಬಲು ಸಮಯ\n5 - ಇತರೆ",
    challenges: "⚠️ *ನೀವು ಯಾವ ಸವಾಲುಗಳನ್ನು ಎದುರಿಸುತ್ತೀರಿ?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ ಸಂಖ್ಯೆಗಳನ್ನು)\n\n1 - ಹೆಚ್ಚಿನ ಇಂಧನ ವೆಚ್ಚ\n2 - ಆಗಾಗ್ಗೆ ಹಾನಿ\n3 - ಹತ್ತಿರ ಚಾರ್ಜಿಂಗ್ ಇಲ್ಲ\n4 - ಬ್ಯಾಟರಿ ರೇಂಜ್ ಚಿಂತೆ\n5 - ದುರಸ್ತಿ ವೆಚ್ಚ\n6 - ಇಂಧನ ತುಂಬಲು ಸಮಯ\n7 - ಇತರೆ",
    evChallenges: "⚡ *ಹೆಚ್ಚುವರಿ EV ಸವಾಲುಗಳು?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ, ಅಥವಾ 'skip' ಎಂದು ಬರೆಯಿರಿ)\n\n1 - ಬ್ಯಾಟರಿ ಬೇಗ ಖಾಲಿ\n2 - ಸ್ವಾಪಿಂಗ್ ಸ್ಟೇಷನ್ ದೂರ\n3 - ಮನೆಯಲ್ಲಿ ಚಾರ್ಜಿಂಗ್ ಸಮಯ\n4 - ವಾಹನ ಶಕ್ತಿಯುತವಲ್ಲ\n5 - ಸೇವಾ ಕೇಂದ್ರ ದೂರ\n6 - ಇತರೆ",
    petrolChallenges: "🛢️ *ಹೆಚ್ಚುವರಿ ಪೆಟ್ರೋಲ್ ವಾಹನ ಸವಾಲುಗಳು?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ, ಅಥವಾ 'skip' ಎಂದು ಬರೆಯಿರಿ)\n\n1 - ಇಂಧನ ಬೆಲೆ ಹೆಚ್ಚು\n2 - ಆಗಾಗ್ಗೆ ಎಂಜಿನ್ ಸಮಸ್ಯೆ\n3 - ಮಾಲಿನ್ಯ ದಂಡ\n4 - ಸರ್ವಿಸಿಂಗ್ ದುಬಾರಿ\n5 - ಇತರೆ",
    accidentInsurance: "🛡️ *ನಿಮ್ಮ ಬಳಿ ಅಪಘಾತ ವಿಮೆ ಇದೆಯೇ?*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಹೌದು\n2 - ಇಲ್ಲ\n3 - ಖಚಿತವಿಲ್ಲ",
    healthInsurance: "🏥 *ನಿಮ್ಮ ಬಳಿ ಆರೋಗ್ಯ ವಿಮೆ ಇದೆಯೇ?*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಹೌದು\n2 - ಇಲ್ಲ\n3 - ಖಚಿತವಿಲ್ಲ",
    paidForAccident: "💸 *ಅಪಘಾತ/ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳಿಗೆ ನೀವು ಜೇಬಿನಿಂದ ಪಾವತಿಸಿದ್ದೀರಾ?*\n\nಟೈಪ್ ಮಾಡಿ: yes ಅಥವಾ no",
    switchToEVPetrol: "⚡ *ನೀವು ಎಲೆಕ್ಟ್ರಿಕ್ ಟು-ವೀಲರ್‌ಗೆ ಬದಲಾಯಿಸುತ್ತೀರಾ?*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಹೌದು, ಆಸಕ್ತಿ ಇದೆ\n2 - ಇಲ್ಲ, ಸಂತೋಷವಾಗಿದೆ\n3 - ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕು",
    switchToEVFourWheeler: "⚡ *ನೀವು ಎಲೆಕ್ಟ್ರಿಕ್ ವಾಹನಕ್ಕೆ ಬದಲಾಯಿಸುತ್ತೀರಾ?*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಹೌದು, ಆಸಕ್ತಿ ಇದೆ\n2 - ಇಲ್ಲ, ಸಂತೋಷವಾಗಿದೆ\n3 - ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕು",
    switchToEVBicycle: "⚡ *ಡೆಲಿವರಿಗಾಗಿ ಎಲೆಕ್ಟ್ರಿಕ್ ಟು-ವೀಲರ್ ಬಳಸಲು ಪರಿಗಣಿಸುತ್ತೀರಾ?*\n\nಟೈಪ್ ಮಾಡಿ:\n1 - ಹೌದು, ಆಲೋಚನೆ ಮಾಡುತ್ತಿದ್ದೇನೆ\n2 - ಇಲ್ಲ, ಸೈಕಲ್ ಇಷ್ಟ\n3 - ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕು",
    switchToEVAlready: "✅ *ನೀವು ಈಗಾಗಲೇ ಎಲೆಕ್ಟ್ರಿಕ್ ಟು-ವೀಲರ್‌ನಲ್ಲಿದ್ದೀರಿ!*\n\nಪರಿಸರ ಮತ್ತು ನಿಮ್ಮ ಜೇಬಿಗೆ ಉತ್ತಮ ಆಯ್ಕೆ! 🌱\n\n_ಮುಂದಿನ ಪ್ರಶ್ನೆಗೆ ಹೋಗುತ್ತಿದೆ..._",
    switchReasons: "💡 *ನೀವು ಏಕೆ ಬದಲಾಯಿಸುತ್ತೀರಿ?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ ಸಂಖ್ಯೆಗಳನ್ನು)\n\n1 - ಕಡಿಮೆ ಬಾಡಿಗೆ ವೆಚ್ಚ\n2 - ಉತ್ತಮ ಬ್ಯಾಟರಿ ರೇಂಜ್\n3 - ಹತ್ತಿರ ಸ್ವಾಪ್ ಸ್ಟೇಷನ್\n4 - ಆದಾಯದ ಭರವಸೆ\n5 - ಉದ್ಯೋಗದಾತ ಸಬ್ಸಿಡಿ\n6 - ಇತರೆ",
    interestedEV: "📚 *ನಾವು ಇನ್ನೇನು ಸಹಾಯ ಮಾಡಬಹುದು?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ ಸಂಖ್ಯೆಗಳನ್ನು)\n\n1 - ಉತ್ತಮ EV ಬಾಡಿಗೆ ಆಫರ್\n2 - ವಿಮೆ ಕೋಟ್\n3 - ಆಕ್ಸೆಸರಿಗಳು\n4 - ಎಲ್ಲಾ\n5 - ಯಾವುದೂ ಇಲ್ಲ",
    interestedPetrol: "📚 *ನೀವು ಯಾವುದರಲ್ಲಿ ಆಸಕ್ತಿ ಹೊಂದಿದ್ದೀರಿ?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ ಸಂಖ್ಯೆಗಳನ್ನು)\n\n1 - EV ಬಾಡಿಗೆ ಆಫರ್\n2 - ರೆಟ್ರೋಫಿಟ್ ಮಾಹಿತಿ\n3 - ವಿಮೆ ಕೋಟ್\n4 - ಎಲ್ಲಾ\n5 - ಯಾವುದೂ ಇಲ್ಲ",
    interested: "📚 *ನೀವು ಯಾವುದರಲ್ಲಿ ಆಸಕ್ತಿ ಹೊಂದಿದ್ದೀರಿ?*\n(ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ ಸಂಖ್ಯೆಗಳನ್ನು)\n\n1 - EV ಮಾಹಿತಿ\n2 - ವಿಮೆ ಕೋಟ್\n3 - ಆಕ್ಸೆಸರಿಗಳು\n4 - ಎಲ್ಲಾ\n5 - ಯಾವುದೂ ಇಲ್ಲ",
    referralCode: "🎁 *ಯಾರಾದರೂ ನಿಮ್ಮನ್ನು ರೆಫರ್ ಮಾಡಿದ್ದಾರೆಯೇ?*\n\nಅವರ ರೆಫರಲ್ ಕೋಡ್ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ 'skip' ಎಂದು ಬರೆಯಿರಿ",
    complete: "🎉 *ನೋಂದಣಿ ಪೂರ್ಣಗೊಂಡಿದೆ!*\n\n✅ ರೆಫರಲ್ ಕೋಡ್: *{code}*\n💎 ಪಾಯಿಂಟ್ಸ್: 10\n\n📎 *ನಿಮ್ಮ ರೆಫರಲ್ ಲಿಂಕ್:*\n{link}\n\n📲 ಸ್ನೇಹಿತರೊಂದಿಗೆ ಈ ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ!\nಅವರು ಕ್ಲಿಕ್ ಮಾಡಿದಾಗ, ನಿಮ್ಮ ಕೋಡ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ತುಂಬುತ್ತದೆ.\n\n🏆 *ಬಹುಮಾನಗಳನ್ನು ಗಳಿಸಿ:*\n• 10 ರೆಫರಲ್ಸ್ = +100 ಪಾಯಿಂಟ್ಸ್\n• 25 ರೆಫರಲ್ಸ್ = +300 ಪಾಯಿಂಟ್ಸ್\n• 50 ರೆಫರಲ್ಸ್ = +500 ಪಾಯಿಂಟ್ಸ್ + ಲಕ್ಕಿ ಡ್ರಾ\n\n⚡ ನಿಮ್ಮ QR ಕೋಡ್ ಬರುತ್ತಿದೆ...",
    qrCode: "📱 *ನಿಮ್ಮ QR ಕೋಡ್:*\n\n{qrImage}\n\n🖨️ *ಈ QR ಕೋಡ್ ಹಂಚಿಕೊಳ್ಳಿ:*\n• ಪ್ರಿಂಟ್ ಮಾಡಿ ಪೆಟ್ರೋಲ್ ಪಂಪ್‌ನಲ್ಲಿ ಇರಿಸಿ\n• ರೈಡರ್ ವಾಟ್ಸಾಪ್ ಗ್ರೂಪ್‌ಗಳಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ\n• ಇತರ ಡೆಲಿವರಿ ರೈಡರ್‌ಗಳಿಗೆ ತೋರಿಸಿ\n\n💡 *ಅಥವಾ ನಿಮ್ಮ ರೆಫರಲ್ ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ* (ಸುಲಭ!):\n{link}\n\n⚡ ರೋಡ್ ವಾರಿಯರ್‌ಗೆ ಸೇರಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!"
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
    } else if (text === '3' || text.toLowerCase().includes('kan')) {
      session.language = 'kn'
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
    const cityMap = { '1': 'Bangalore', '2': 'Mumbai', '3': 'Delhi', '4': 'Hyderabad', '5': 'Pune', '6': 'Other' }
    session.data.city = cityMap[text] || text
    session.step = 'platform'
    return questions.platform
  }

  // Platform (UPDATED: Multi-select support)
  if (step === 'platform') {
    const platformMap = { 
      '1': 'Swiggy', '2': 'Zomato', '3': 'Uber Eats', '4': 'Amazon', 
      '5': 'Dunzo', '6': 'Porter', '7': 'Blinkit', '8': 'Other' 
    }
    // Handle comma-separated input
    const numbers = text.split(',').map(n => n.trim())
    const platforms = numbers.map(n => platformMap[n]).filter(Boolean)
    
    session.data.platforms = platforms.length > 0 ? platforms : [platformMap[text] || text]
    session.data.platform = session.data.platforms[0] || 'Other' // Backward compatibility
    
    session.step = 'experience'
    return questions.experience
  }

  // Experience
  if (step === 'experience') {
    const expMap = { 
      '1': 'Less than 1 year', 
      '2': '1-3 years', 
      '3': '3-5 years', 
      '4': 'More than 5 years' 
    }
    session.data.experience = expMap[text] || text
    
    // Store numeric value for database
    const expNumericMap = { '1': 0.5, '2': 2, '3': 4, '4': 6 }
    session.data.experienceNumeric = expNumericMap[text] || 2
    
    session.step = 'vehicleType'
    return questions.vehicleType
  }

  // Vehicle Type (Store for conditional logic)
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
    
    // CONDITIONAL: Ask vehicle-specific fuel method question
    const isEV = session.data.vehicleType === 'Electric Two-Wheeler'
    const isPetrol = session.data.vehicleType === 'Petrol Two-Wheeler'
    
    if (isEV) {
      return questions.fuelMethodEV
    } else if (isPetrol) {
      return questions.fuelMethodPetrol
    } else {
      return questions.fuelMethod
    }
  }

  // Fuel Method (CONDITIONAL: Different maps for different vehicles)
  if (step === 'fuelMethod') {
    const isEV = session.data.vehicleType === 'Electric Two-Wheeler'
    const isPetrol = session.data.vehicleType === 'Petrol Two-Wheeler'
    
    if (isEV) {
      const fuelMapEV = { '1': 'Home Charging', '2': 'Swapping Station', '3': 'Public Charging Station', '4': 'Other' }
      session.data.fuelMethod = fuelMapEV[text] || text
    } else if (isPetrol) {
      const fuelMapPetrol = { '1': 'Petrol Pump', '2': 'Other' }
      session.data.fuelMethod = fuelMapPetrol[text] || text
    } else {
      const fuelMap = { '1': 'Petrol Pump', '2': 'Home Charging', '3': 'Swapping Station', '4': 'Other' }
      session.data.fuelMethod = fuelMap[text] || text
    }
    
    session.step = 'weeklyExpense'
    
    // CONDITIONAL: Ask vehicle-specific expense question
    if (isEV) {
      return questions.weeklyExpenseEV
    } else if (isPetrol) {
      return questions.weeklyExpensePetrol
    } else {
      return questions.weeklyExpense
    }
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
    
    // CONDITIONAL: Ask vehicle-specific challenges
    const isEV = session.data.vehicleType === 'Electric Two-Wheeler'
    const isPetrol = session.data.vehicleType === 'Petrol Two-Wheeler'
    
    if (isEV) {
      return questions.challengesEV
    } else if (isPetrol) {
      return questions.challengesPetrol
    } else {
      return questions.challenges
    }
  }

  // General Challenges (CONDITIONAL: Different maps for different vehicles)
  if (step === 'challenges') {
    const isEV = session.data.vehicleType === 'Electric Two-Wheeler'
    const isPetrol = session.data.vehicleType === 'Petrol Two-Wheeler'
    
    if (isEV) {
      // EV challenges map (no fuel cost, no refuelling time)
      const challengeMapEV = {
        '1': 'Frequent breakdown', '2': 'No nearby charging station', '3': 'Battery range anxiety',
        '4': 'Repair costs', '5': 'Other'
      }
      const selectedChallenges = text.split(',').map(n => challengeMapEV[n.trim()]).filter(Boolean)
      session.data.challenges = selectedChallenges
    } else if (isPetrol) {
      // Petrol challenges map (no charging station, no battery anxiety)
      const challengeMapPetrol = {
        '1': 'High fuel cost', '2': 'Frequent breakdown', '3': 'Repair costs',
        '4': 'Long refuelling time', '5': 'Other'
      }
      const selectedChallenges = text.split(',').map(n => challengeMapPetrol[n.trim()]).filter(Boolean)
      session.data.challenges = selectedChallenges
    } else {
      // All challenges
      const challengeMap = {
        '1': 'High fuel cost', '2': 'Frequent breakdown', '3': 'No nearby charging station',
        '4': 'Battery range anxiety', '5': 'Repair costs', '6': 'Long refuelling time', '7': 'Other'
      }
      const selectedChallenges = text.split(',').map(n => challengeMap[n.trim()]).filter(Boolean)
      session.data.challenges = selectedChallenges
    }
    
    // Based on vehicle type, ask specific challenges or move forward
    if (isEV) {
      session.step = 'evChallenges'
      return questions.evChallenges
    } else if (isPetrol) {
      session.step = 'petrolChallenges'
      return questions.petrolChallenges
    } else {
      session.step = 'accidentInsurance'
      return questions.accidentInsurance
    }
  }

  // EV-specific challenges
  if (step === 'evChallenges') {
    if (!text.toLowerCase().includes('skip')) {
      const evChallengeMap = {
        '1': 'Battery drains too fast', '2': 'Swapping station too far', '3': 'Long charging time at home',
        '4': 'Vehicle not powerful enough', '5': 'Service centre not nearby', '6': 'Other'
      }
      const selectedChallenges = text.split(',').map(n => evChallengeMap[n.trim()]).filter(Boolean)
      session.data.evChallenges = selectedChallenges // Store as array
    } else {
      session.data.evChallenges = [] // Empty array for skip
    }
    session.step = 'accidentInsurance'
    return questions.accidentInsurance
  }

  // Petrol-specific challenges
  if (step === 'petrolChallenges') {
    if (!text.toLowerCase().includes('skip')) {
      const petrolChallengeMap = {
        '1': 'Fuel price too high', '2': 'Frequent engine issues', '3': 'Pollution fine risk',
        '4': 'High servicing cost', '5': 'Other'
      }
      const selectedChallenges = text.split(',').map(n => petrolChallengeMap[n.trim()]).filter(Boolean)
      session.data.petrolChallenges = selectedChallenges // Store as array
    } else {
      session.data.petrolChallenges = [] // Empty array for skip
    }
    session.step = 'accidentInsurance'
    return questions.accidentInsurance
  }

  // Accident Insurance
  if (step === 'accidentInsurance') {
    const insuranceMap = { '1': 'yes', '2': 'no', '3': 'notSure' }
    session.data.accidentInsurance = insuranceMap[text] || (text.toLowerCase().includes('yes') ? 'yes' : 'no')
    session.step = 'healthInsurance'
    return questions.healthInsurance
  }

  // Health Insurance
  if (step === 'healthInsurance') {
    const insuranceMap = { '1': 'yes', '2': 'no', '3': 'notSure' }
    session.data.healthInsurance = insuranceMap[text] || (text.toLowerCase().includes('yes') ? 'yes' : 'no')
    session.step = 'paidForAccident'
    return questions.paidForAccident
  }

  // Paid for Accident
  if (step === 'paidForAccident') {
    session.data.paidForAccident = text.toLowerCase().includes('yes') ? 'yes' : 'no'
    session.step = 'switchToEV'
    return questions.switchToEV
  }

  // Switch to EV (CONDITIONAL: Different questions for different vehicles)
  if (step === 'switchToEV') {
    const isEV = session.data.vehicleType === 'Electric Two-Wheeler'
    const isPetrol = session.data.vehicleType === 'Petrol Two-Wheeler'
    const isFourWheeler = session.data.vehicleType === 'Four-Wheeler'
    const isBicycle = session.data.vehicleType === 'Bicycle'
    
    // If already on EV, auto-set and skip
    if (isEV) {
      session.data.switchToEV = 'alreadyOnEV'
      session.step = 'interested'
      // Send info message and move to interested
      setTimeout(() => {}, 1000) // Small delay for UX
      return questions.switchToEVAlready + '\n\n' + questions.interestedEV
    }
    
    // Otherwise, parse their answer
    const switchMap = { '1': 'yes', '2': 'no', '3': 'needMoreInfo' }
    session.data.switchToEV = switchMap[text] || (text.toLowerCase().includes('yes') ? 'yes' : 'no')
    
    // CONDITIONAL: Only ask switch reasons if interested
    if (session.data.switchToEV === 'yes' || session.data.switchToEV === 'needMoreInfo') {
      session.step = 'switchReasons'
      return questions.switchReasons
    } else {
      // Skip switch reasons, go to interested
      session.data.switchReasons = []
      session.step = 'interested'
      
      // Return appropriate interested question
      if (isPetrol) {
        return questions.interestedPetrol
      } else {
        return questions.interested
      }
    }
  }

  // Switch Reasons (CONDITIONAL: Only shown if interested)
  if (step === 'switchReasons') {
    const reasonMap = {
      '1': 'Lower rental cost', '2': 'Better battery range', '3': 'Swap stations nearby',
      '4': 'Income guarantee', '5': 'Employer subsidy', '6': 'Other'
    }
    const selectedReasons = text.split(',').map(n => reasonMap[n.trim()]).filter(Boolean)
    session.data.switchReasons = selectedReasons.length > 0 ? selectedReasons : [text]
    
    session.step = 'interested'
    
    // CONDITIONAL: Different interested options based on vehicle
    const isPetrol = session.data.vehicleType === 'Petrol Two-Wheeler'
    const isEV = session.data.vehicleType === 'Electric Two-Wheeler'
    
    if (isEV) {
      return questions.interestedEV
    } else if (isPetrol) {
      return questions.interestedPetrol
    } else {
      return questions.interested
    }
  }

  // Interested (CONDITIONAL: Different maps for different vehicles)
  if (step === 'interested') {
    const isEV = session.data.vehicleType === 'Electric Two-Wheeler'
    const isPetrol = session.data.vehicleType === 'Petrol Two-Wheeler'
    
    let interestMap
    if (isEV) {
      interestMap = {
        '1': 'Better EV rental offer', '2': 'Insurance quote', '3': 'Accessories',
        '4': 'All of the above', '5': 'None'
      }
    } else if (isPetrol) {
      interestMap = {
        '1': 'EV rental offer', '2': 'Retrofit information', '3': 'Insurance quote',
        '4': 'All of the above', '5': 'None'
      }
    } else {
      interestMap = {
        '1': 'EV information', '2': 'Insurance quote', '3': 'Accessories',
        '4': 'All of the above', '5': 'None'
      }
    }
    
    const selectedInterests = text.split(',').map(n => interestMap[n.trim()]).filter(Boolean)
    session.data.interested = selectedInterests.length > 0 ? selectedInterests : ['None']
    
    session.step = 'accessories'
    return questions.accessories || "🎁 *Which accessories would help your work?*\n\n1 - Phone mount\n2 - Power bank\n3 - Emergency light\n4 - Raincoat\n5 - Cable lock\n6 - Seat cushion\n7 - Handlebar charger\n8 - None needed\n\n(Type numbers separated by commas)"
  }

  // Accessories (NEW STEP)
  if (step === 'accessories') {
    if (!text.toLowerCase().includes('skip') && text !== '8') {
      const accessoryMap = {
        '1': 'Phone mount', '2': 'Power bank', '3': 'Emergency light', '4': 'Raincoat',
        '5': 'Cable lock', '6': 'Seat cushion', '7': 'Handlebar charger', '8': 'None needed'
      }
      const selectedAccessories = text.split(',').map(n => accessoryMap[n.trim()]).filter(Boolean)
      session.data.accessories = selectedAccessories.length > 0 ? selectedAccessories : []
    } else {
      session.data.accessories = []
    }
    
    session.step = 'referralCode'
    return questions.referralCode
  }

  // Referral Code (final step)
  if (step === 'referralCode') {
    if (!text.toLowerCase().includes('skip')) {
      session.data.referredByCode = text.toUpperCase()
    } else {
      session.data.referredByCode = null
    }
    session.step = 'complete'
    return 'complete' // Signal to save data
  }

  return "❌ Something went wrong. Type 'restart' to begin again."
}

// Save WhatsApp rider data
async function saveWhatsAppRider(sessionData) {
  const referralCode = generateReferralCode()
  
  // Log session data for debugging
  console.log('💾 Saving rider with data:', {
    fullName: sessionData.fullName,
    whatsapp: sessionData.whatsapp,
    city: sessionData.city,
    platforms: sessionData.platforms,
    platform: sessionData.platform
  })
  
  const segment = segmentRider(sessionData)

  const riderData = {
    full_name: sessionData.fullName,
    whatsapp: sessionData.whatsapp,
    city: sessionData.city,
    platforms: sessionData.platforms || [sessionData.platform], // Multi-select platforms
    platform: sessionData.platform, // Backward compatibility
    experience: sessionData.experienceNumeric || 2, // Use numeric value
    vehicle_type: sessionData.vehicleType,
    vehicle_brand: sessionData.vehicleBrand,
    fuel_method: sessionData.fuelMethod,
    weekly_expense: parseInt(sessionData.weeklyExpense) || 0,
    monthly_maintenance: parseInt(sessionData.monthlyMaintenance) || 0,
    challenges: Array.isArray(sessionData.challenges) ? sessionData.challenges : [],
    ev_challenges: Array.isArray(sessionData.evChallenges) ? sessionData.evChallenges : [],
    petrol_challenges: Array.isArray(sessionData.petrolChallenges) ? sessionData.petrolChallenges : [],
    accident_insurance: sessionData.accidentInsurance,
    health_insurance: sessionData.healthInsurance,
    paid_for_accident: sessionData.paidForAccident,
    switch_to_ev: sessionData.switchToEV,
    switch_reasons: Array.isArray(sessionData.switchReasons) ? sessionData.switchReasons : [],
    interested: Array.isArray(sessionData.interested) ? sessionData.interested : [],
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
  if (error) {
    console.error('Database save error:', error)
    throw error
  }

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
    console.log('📩 Webhook received:', JSON.stringify(req.body))
    
    const fromRaw = req.body.From || ''
    const from = fromRaw.replace('whatsapp:+91', '').replace('whatsapp:+', '').replace('whatsapp:', '')
    const body = req.body.Body?.trim() || ''

    console.log('📱 From:', from, '(raw:', fromRaw, ') | Body:', body)

    if (!from || !body) {
      console.log('❌ Missing from or body')
      return res.status(400).send('Invalid request')
    }

    // Handle restart command
    if (body.toLowerCase() === 'restart' || body.toLowerCase() === 'start') {
      console.log('🔄 Restart/Start command received')
      whatsappSessions.delete(from)
      const session = getWhatsAppSession(from)
      const welcomeMsg = "🌟 *Road Warrior Registration*\n\nSelect your language:\n\n1 - English\n2 - हिंदी (Hindi)\n3 - ಕನ್ನಡ (Kannada)"
      console.log('📤 Sending welcome message')
      await sendNotification(from, welcomeMsg)
      return res.status(200).send('OK')
    }

    // Get or create session
    const session = getWhatsAppSession(from)
    console.log('📊 Session:', { step: session.step, language: session.language })

    // Process response (this handles language selection too)
    console.log('⚙️ Processing response')
    const response = processWhatsAppResponse(session, body)
    
    // Add safety check for undefined response
    if (!response) {
      console.error('❌ Response is undefined for step:', session.step)
      await sendNotification(from, "❌ Something went wrong. Type 'restart' to begin again.")
      return res.status(200).send('OK')
    }
    
    console.log('💬 Response:', typeof response === 'string' ? response.substring(0, 100) : response)

    // Check if complete
    if (response === 'complete') {
      try {
        console.log('✅ Registration complete')
        const referralCode = await saveWhatsAppRider(session.data)
        console.log('💾 Data saved, code:', referralCode)
        const lang = session.language
        
        // Generate referral link
        const appUrl = process.env.APP_URL || 'https://ev-app-seven.vercel.app'
        const referralLink = `${appUrl}/?ref=${referralCode}`
        
        // Send completion message with referral link
        const completeMsg = WHATSAPP_QUESTIONS[lang].complete
          .replace('{code}', referralCode)
          .replace('{link}', referralLink)
        await sendNotification(from, completeMsg)
        
        // Generate and send QR code
        const qrUrl = referralLink
        console.log('📱 Generating QR for:', qrUrl)
        
        // Create QR code image URL (publicly accessible)
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`
        
        // Send QR message with instructions and referral link
        const qrTextMessage = WHATSAPP_QUESTIONS[lang].qrCode
          .replace('{qrImage}', '')
          .replace('{link}', referralLink)
        
        if (twilioClient) {
          console.log('📤 Sending QR image via Twilio')
          await twilioClient.messages.create({
            body: qrTextMessage,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:+91${from}`,
            mediaUrl: [qrImageUrl]
          })
        } else {
          console.log('⚠️ Twilio client not initialized')
        }
        
        // Clear session
        whatsappSessions.delete(from)
      } catch (saveError) {
        console.error('❌ Save error:', saveError)
        console.error('❌ Error details:', saveError.message)
        console.error('❌ Session data:', JSON.stringify(session.data))
        
        // Handle duplicate phone number
        if (saveError.code === '23505' && saveError.message.includes('whatsapp_key')) {
          await sendNotification(from, `❌ This phone number (${session.data.whatsapp}) is already registered! Each number can only register once. If you need help, type 'restart' to start over with a different number.`)
        } else {
          await sendNotification(from, "❌ Sorry, something went wrong. Please try again or type 'restart'")
        }
      }
    } else {
      console.log('📤 Sending next question')
      await sendNotification(from, response)
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('❌ Webhook error:', error)
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
