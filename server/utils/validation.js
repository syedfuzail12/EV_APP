// Phone validation: Must be Indian mobile number starting with 6-9, exactly 10 digits
export function validatePhone(phone) {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone)
}

// PIN code validation: Exactly 6 digits
export function validatePinCode(pinCode) {
  const pinRegex = /^\d{6}$/
  return pinRegex.test(pinCode)
}

// Honeypot detection: If this field is filled, it's a bot
export function detectHoneypot(req) {
  const honeypotField = req.body.website || req.body.url || req.body.hp
  return !!honeypotField // If truthy, it's a bot
}

// Sanitize string input
export function sanitizeString(str) {
  if (!str) return ''
  return String(str).trim().slice(0, 500) // Max 500 chars
}

// Validate referral code format
export function validateReferralCode(code) {
  if (!code) return true // Optional field
  const codeRegex = /^RW-[A-Z0-9]{4}$/
  return codeRegex.test(code)
}
