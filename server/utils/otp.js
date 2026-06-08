import axios from 'axios'

// Store OTPs in memory (for production, consider using Redis)
const otpStore = new Map()

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP via Fast2SMS
 * @param {string} phone - 10-digit Indian mobile number
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, reason?: string}>}
 */
export async function sendOTP(phone, otp) {
  if (!process.env.FAST2SMS_API_KEY) {
    console.error('❌ FAST2SMS_API_KEY not configured')
    return { success: false, reason: 'api_key_missing' }
  }

  try {
    console.log(`📤 Sending OTP ${otp} to ${phone}...`)
    
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        sender_id: process.env.FAST2SMS_SENDER_ID || 'FSTSMS',
        message: `Your Road Warrior verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        route: 'v3',
        numbers: phone
      },
      timeout: 10000 // 10 second timeout
    })
    
    console.log('Fast2SMS response:', response.data)
    
    if (response.data.return === true) {
      console.log(`✅ OTP sent successfully to ${phone}`)
      
      // Store OTP with expiry (5 minutes)
      otpStore.set(phone, {
        otp: otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        attempts: 0
      })
      
      return { success: true }
    } else {
      console.error('❌ Fast2SMS failed:', response.data)
      return { 
        success: false, 
        reason: response.data.message || 'sms_failed' 
      }
    }
  } catch (error) {
    console.error('❌ OTP send error:', error.message)
    return { 
      success: false, 
      reason: error.response?.data?.message || error.message 
    }
  }
}

/**
 * Verify OTP entered by user
 * @param {string} phone - 10-digit mobile number
 * @param {string} inputOTP - OTP entered by user
 * @returns {{success: boolean, reason?: string, attemptsLeft?: number}}
 */
export function verifyOTP(phone, inputOTP) {
  const stored = otpStore.get(phone)
  
  // No OTP found for this phone
  if (!stored) {
    console.log(`❌ No OTP found for ${phone}`)
    return { success: false, reason: 'otp_not_found' }
  }
  
  // Check if OTP expired
  if (Date.now() > stored.expiresAt) {
    console.log(`⏰ OTP expired for ${phone}`)
    otpStore.delete(phone)
    return { success: false, reason: 'otp_expired' }
  }
  
  // Check max attempts (3 attempts allowed)
  if (stored.attempts >= 3) {
    console.log(`🚫 Max attempts exceeded for ${phone}`)
    otpStore.delete(phone)
    return { success: false, reason: 'max_attempts_exceeded' }
  }
  
  // Verify OTP
  if (stored.otp === inputOTP) {
    console.log(`✅ OTP verified for ${phone}`)
    otpStore.delete(phone) // Clear OTP after successful verification
    return { success: true }
  } else {
    // Wrong OTP, increment attempts
    stored.attempts += 1
    otpStore.set(phone, stored)
    
    const attemptsLeft = 3 - stored.attempts
    console.log(`❌ Invalid OTP for ${phone}. Attempts left: ${attemptsLeft}`)
    
    return { 
      success: false, 
      reason: 'invalid_otp', 
      attemptsLeft: attemptsLeft 
    }
  }
}

/**
 * Check if user can request a new OTP (rate limiting)
 * @param {string} phone - 10-digit mobile number
 * @returns {boolean} - true if can resend, false otherwise
 */
export function canResendOTP(phone) {
  const stored = otpStore.get(phone)
  
  // No OTP sent yet, can send
  if (!stored) return true
  
  // Must wait 60 seconds before resending
  const timeSinceCreated = Date.now() - stored.createdAt
  return timeSinceCreated > 60 * 1000 // 60 seconds
}

/**
 * Get remaining time before OTP can be resent
 * @param {string} phone - 10-digit mobile number
 * @returns {number} - seconds remaining, 0 if can resend
 */
export function getResendCooldown(phone) {
  const stored = otpStore.get(phone)
  if (!stored) return 0
  
  const timeSinceCreated = Date.now() - stored.createdAt
  const cooldown = 60 - Math.floor(timeSinceCreated / 1000)
  return cooldown > 0 ? cooldown : 0
}

/**
 * Clear expired OTPs (cleanup job)
 * Should be called periodically
 */
export function cleanupExpiredOTPs() {
  const now = Date.now()
  let cleaned = 0
  
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(phone)
      cleaned++
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired OTPs`)
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000)
