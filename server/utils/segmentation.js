// Calculate lead tags based on rider responses (6 precise types)
export function calculateLeadTags(riderData) {
  const tags = []
  
  // 1. PERSONAL_INSURANCE_LEAD: No health insurance OR paid out-of-pocket
  if (riderData.healthInsurance === 'no' || riderData.paidForAccident === 'yes') {
    tags.push('PERSONAL_INSURANCE_LEAD')
  }
  
  // 2. BIKE_INSURANCE_LEAD: No accident insurance
  if (riderData.accidentInsurance === 'no') {
    tags.push('BIKE_INSURANCE_LEAD')
  }
  
  // 3. EV_SALE_LEAD: Petrol rider + willing to switch + interested in purchase
  if (
    riderData.vehicleType === 'Petrol Two-Wheeler' && 
    riderData.switchToEV === 'yes' &&
    (riderData.interested?.includes('EV rental offer') || 
     riderData.interested?.includes('All of the above'))
  ) {
    tags.push('EV_SALE_LEAD')
  }
  
  // 4. EV_RENTAL_LEAD: Interested in EV rental offer
  if (
    riderData.interested?.includes('EV rental offer') || 
    riderData.interested?.includes('All of the above')
  ) {
    tags.push('EV_RENTAL_LEAD')
  }
  
  // 5. RETROFIT_LEAD: Petrol rider + interested in retrofit
  if (
    riderData.vehicleType === 'Petrol Two-Wheeler' &&
    (riderData.interested?.includes('Retrofit information') ||
     riderData.interested?.includes('All of the above'))
  ) {
    tags.push('RETROFIT_LEAD')
  }
  
  // 6. PRODUCT_LEAD: Selected any accessories
  if (riderData.accessories && riderData.accessories.length > 0 && 
      !riderData.accessories.includes('None needed')) {
    tags.push('PRODUCT_LEAD')
  }
  
  return tags
}

// Legacy segment calculation (keep for backward compatibility)
export function calculateSegment(riderData) {
  const segments = []
  
  if (riderData.switchToEV === 'yes') {
    segments.push('Hot EV Lead')
  }
  
  if (riderData.accidentInsurance === 'no' || riderData.healthInsurance === 'no') {
    segments.push('Insurance Lead')
  }
  
  if (riderData.vehicleType === 'Petrol Two-Wheeler' && riderData.switchToEV === 'yes') {
    segments.push('Retrofit Lead')
  }
  
  return segments.join(', ') || 'General'
}

// Calculate follow-up status based on creation date and contact history
export function calculateFollowUpStatus(createdAt, contacted = false) {
  const now = new Date()
  const created = new Date(createdAt)
  const daysSinceCreation = Math.floor((now - created) / (1000 * 60 * 60 * 24))
  
  if (contacted) {
    return 'Contacted'
  } else if (daysSinceCreation === 0) {
    return 'New'
  } else if (daysSinceCreation >= 3) {
    return 'Needs Follow-up'
  } else {
    return 'Pending'
  }
}
