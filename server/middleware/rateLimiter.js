import rateLimit from 'express-rate-limit'

// Strict rate limiter for form submissions (3 per hour per IP)
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 submissions per hour
  message: { 
    error: 'Too many registrations from this IP. Please try again in an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // Store in memory (for production, use Redis)
  store: undefined
})

// General API rate limiter (10 requests per minute per IP)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { 
    error: 'Too many requests. Please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Lenient rate limiter for WhatsApp webhook (allows chatbot conversations)
export const whatsappLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute (enough for conversation flow)
  message: 'Too many messages. Please wait a moment.',
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate limit if it's from Twilio (verify via signature later)
    return req.headers['x-twilio-signature'] !== undefined
  }
})
