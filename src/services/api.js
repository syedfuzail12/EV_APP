const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function submitRider(data) {
  try {
    console.log('Submitting to:', `${API_URL}/riders`)
    console.log('Data:', data)
    
    const response = await fetch(`${API_URL}/riders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Error response:', errorData)
      throw new Error(errorData.error || 'Failed to submit rider data')
    }
    
    return response.json()
  } catch (error) {
    console.error('Submit error:', error)
    throw error
  }
}

export async function getRiderScore(phone) {
  const response = await fetch(`${API_URL}/riders/${phone}`)
  
  if (!response.ok) {
    throw new Error('Rider not found')
  }
  
  return response.json()
}

export async function getAllRiders() {
  const response = await fetch(`${API_URL}/riders`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch riders')
  }
  
  return response.json()
}

export async function getStats() {
  const response = await fetch(`${API_URL}/stats`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch stats')
  }
  
  return response.json()
}
