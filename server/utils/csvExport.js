// Convert riders array to CSV format
export function generateCSV(riders) {
  if (!riders || riders.length === 0) {
    return 'No data available'
  }
  
  // CSV headers
  const headers = [
    'Name', 'Phone', 'City', 'PIN Code', 'Platforms', 'Experience (years)', 
    'Vehicle Type', 'Vehicle Brand', 'Fuel Method', 'Weekly Expense (₹)', 
    'Monthly Maintenance (₹)', 'Challenges', 'EV Challenges', 'Petrol Challenges',
    'Accident Insurance', 'Health Insurance', 'Paid for Accident', 
    'Switch to EV', 'Switch Reasons', 'Interested In', 'Accessories',
    'Referral Code', 'Points', 'Referral Count', 'Segment', 'Lead Tags',
    'Follow-up Status', 'Language', 'Created At'
  ]
  
  // Convert data rows
  const rows = riders.map(rider => [
    escapeCSV(rider.fullName || rider.full_name || ''),
    escapeCSV(rider.whatsapp || ''),
    escapeCSV(rider.city || ''),
    escapeCSV(rider.pinCode || rider.pin_code || ''),
    escapeCSV(arrayToString(rider.platforms)),
    escapeCSV(rider.experience || ''),
    escapeCSV(rider.vehicleType || rider.vehicle_type || ''),
    escapeCSV(rider.vehicleBrand || rider.vehicle_brand || ''),
    escapeCSV(rider.fuelMethod || rider.fuel_method || ''),
    escapeCSV(rider.weeklyExpense || rider.weekly_expense || ''),
    escapeCSV(rider.monthlyMaintenance || rider.monthly_maintenance || ''),
    escapeCSV(arrayToString(rider.challenges)),
    escapeCSV(arrayToString(rider.evChallenges || rider.ev_challenges)),
    escapeCSV(arrayToString(rider.petrolChallenges || rider.petrol_challenges)),
    escapeCSV(rider.accidentInsurance || rider.accident_insurance || ''),
    escapeCSV(rider.healthInsurance || rider.health_insurance || ''),
    escapeCSV(rider.paidForAccident || rider.paid_for_accident || ''),
    escapeCSV(rider.switchToEV || rider.switch_to_ev || ''),
    escapeCSV(arrayToString(rider.switchReasons || rider.switch_reasons)),
    escapeCSV(arrayToString(rider.interested)),
    escapeCSV(arrayToString(rider.accessories)),
    escapeCSV(rider.referralCode || rider.referral_code || ''),
    escapeCSV(rider.points || 10),
    escapeCSV(rider.referralCount || rider.referral_count || 0),
    escapeCSV(rider.segment || ''),
    escapeCSV(arrayToString(rider.leadTags || rider.lead_tags)),
    escapeCSV(rider.followUpStatus || rider.follow_up_status || 'New'),
    escapeCSV(rider.language || 'en'),
    escapeCSV(formatDate(rider.createdAt || rider.created_at))
  ])
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  return csvContent
}

// Escape CSV special characters
function escapeCSV(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  
  // If contains comma, quotes, or newline, wrap in quotes and escape existing quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

// Convert array to comma-separated string
function arrayToString(arr) {
  if (!arr || !Array.isArray(arr)) return ''
  return arr.join('; ')
}

// Format date to readable string
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
