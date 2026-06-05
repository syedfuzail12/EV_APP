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

// Supabase client (mock mode if not configured)
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null

// In-memory storage for mock mode
const mockDatabase = []

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
