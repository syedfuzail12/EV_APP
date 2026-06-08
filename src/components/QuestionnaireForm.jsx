import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { submitRider } from '../services/api'
import styles from './QuestionnaireForm.module.css'

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

function QuestionnaireForm() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [currentSection, setCurrentSection] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // OTP verification state
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpCooldown, setOtpCooldown] = useState(0)
  
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    city: '',
    pinCode: '',
    platforms: [],
    platform: '', // Kept for backward compatibility
    experience: '',
    vehicleType: '',
    vehicleBrand: '',
    fuelMethod: '',
    weeklyExpense: '',
    monthlyMaintenance: '',
    challenges: [],
    evChallenges: [],
    petrolChallenges: [],
    accidentInsurance: '',
    healthInsurance: '',
    paidForAccident: '',
    switchToEV: '',
    switchReasons: [],
    interested: [],
    accessories: [],
    consentGiven: false,
    referredBy: false,
    referralCode: '',
    // Honeypot field (hidden from users, bots will fill it)
    website: ''
  })
  
  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpCooldown])

  useEffect(() => {
    // If there's a referral code from QR scan, pre-fill it
    if (location.state?.referralCode) {
      setFormData(prev => ({
        ...prev,
        referredBy: true,
        referralCode: location.state.referralCode
      }))
    }
  }, [location.state])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }))
  }
  
  // Send OTP to phone number
  const handleSendOTP = async () => {
    if (!formData.whatsapp || formData.whatsapp.length !== 10) {
      setOtpError('Please enter a valid 10-digit phone number')
      return
    }
    
    setOtpLoading(true)
    setOtpError('')
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.whatsapp })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setOtpSent(true)
        setOtpCooldown(60) // 60 second cooldown
        setOtpError('')
        // Show success message briefly
        alert('OTP sent to your mobile number!')
      } else {
        if (data.cooldown) {
          setOtpCooldown(data.cooldown)
          setOtpError(`Please wait ${data.cooldown} seconds before resending`)
        } else {
          setOtpError(data.error || 'Failed to send OTP. Please try again.')
        }
      }
    } catch (error) {
      setOtpError('Network error. Please check your connection.')
    } finally {
      setOtpLoading(false)
    }
  }
  
  // Verify OTP entered by user
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter 6-digit OTP')
      return
    }
    
    setOtpLoading(true)
    setOtpError('')
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: formData.whatsapp,
          otp: otp
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setOtpVerified(true)
        setOtpError('')
        setOtp('')
        alert('✅ Phone number verified successfully!')
      } else {
        setOtpError(data.error || 'Invalid OTP')
        if (data.attemptsLeft !== undefined) {
          setOtpError(`${data.error} (${data.attemptsLeft} attempts left)`)
        }
      }
    } catch (error) {
      setOtpError('Verification failed. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const validateSection = () => {
    switch (currentSection) {
      case 0: // Section A - Must verify OTP
        return formData.fullName && formData.whatsapp && 
               otpVerified && // OTP must be verified
               formData.city && 
               formData.platforms.length > 0 && formData.experience
      case 1: // Section B
        return formData.vehicleType && formData.fuelMethod && 
               formData.weeklyExpense && formData.monthlyMaintenance
      case 2: // Section C
        return formData.challenges.length > 0
      case 3: // Section D
        return formData.accidentInsurance && formData.healthInsurance && 
               formData.paidForAccident
      case 4: // Section E - conditional validation
        // Always need switchToEV answered (auto-set for EV riders)
        if (formData.vehicleType === 'Electric Two-Wheeler') {
          // Auto-set to 'alreadyOnEV' if not set
          if (!formData.switchToEV) {
            handleChange('switchToEV', 'alreadyOnEV')
          }
          return true
        }
        return formData.switchToEV // Required for non-EV riders
      case 5: // Section F
        return formData.consentGiven && (!formData.referredBy || formData.referralCode)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateSection()) {
      if (currentSection < SECTIONS.length - 1) {
        setCurrentSection(prev => prev + 1)
        window.scrollTo(0, 0)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Set platform to first selected platform for backward compatibility
      formData.platform = formData.platforms[0] || ''
      
      const result = await submitRider({
        ...formData,
        language: i18n.language,
        timestamp: new Date().toISOString()
      })
      navigate('/success', { 
        state: { 
          referralCode: result.referralCode, 
          points: result.points,
          leadTags: result.leadTags,
          notificationSent: result.notificationSent,
          notificationMethod: result.notificationMethod
        } 
      })
    } catch (error) {
      alert(error.message || 'Submission failed. Please try again.')
      setLoading(false)
    }
  }

  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return <SectionA 
          formData={formData} 
          onChange={handleChange} 
          onMultiSelect={handleMultiSelect} 
          t={t}
          otpSent={otpSent}
          otpVerified={otpVerified}
          otp={otp}
          setOtp={setOtp}
          otpLoading={otpLoading}
          otpError={otpError}
          otpCooldown={otpCooldown}
          onSendOTP={handleSendOTP}
          onVerifyOTP={handleVerifyOTP}
        />
      case 1:
        return <SectionB formData={formData} onChange={handleChange} t={t} />
      case 2:
        return <SectionC formData={formData} onChange={handleChange} onMultiSelect={handleMultiSelect} vehicleType={formData.vehicleType} t={t} />
      case 3:
        return <SectionD formData={formData} onChange={handleChange} t={t} />
      case 4:
        return <SectionE formData={formData} onChange={handleChange} onMultiSelect={handleMultiSelect} vehicleType={formData.vehicleType} t={t} />
      case 5:
        return <SectionF formData={formData} onChange={handleChange} t={t} />
      default:
        return null
    }
  }

  return (
    <div className={styles.questionnaire}>
      {/* Progress Indicator */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${((currentSection + 1) / SECTIONS.length) * 100}%` }}
          />
        </div>
        <div className={styles.progressText}>
          Section {currentSection + 1} of {SECTIONS.length}
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>
            {t(`section${SECTIONS[currentSection]}`)}
          </h2>
        </div>

        <div className={styles.formContent}>
          {renderSection()}
        </div>

        {/* Honeypot field - hidden from real users */}
        <input
          type="text"
          name="website"
          value={formData.website}
          onChange={(e) => handleChange('website', e.target.value)}
          style={{ display: 'none', position: 'absolute', left: '-9999px' }}
          tabIndex="-1"
          autoComplete="off"
        />

        <div className={styles.actions}>
          {currentSection > 0 && (
            <button className={styles.backBtn} onClick={handleBack} type="button">
              {t('back') || '← Back'}
            </button>
          )}
          <button 
            className={styles.nextBtn} 
            onClick={handleNext}
            disabled={!validateSection() || loading}
            type="button"
          >
            {loading ? 'Submitting...' : currentSection === SECTIONS.length - 1 ? t('submit') || 'Submit' : t('next') || 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Section A: Basic Info + Multi-select Platforms + PIN Code + OTP Verification
function SectionA({ formData, onChange, onMultiSelect, t, otpSent, otpVerified, otp, setOtp, otpLoading, otpError, otpCooldown, onSendOTP, onVerifyOTP }) {
  const [phoneError, setPhoneError] = useState('')
  const [checkingPhone, setCheckingPhone] = useState(false)

  const checkPhoneExists = async (phone) => {
    if (phone.length !== 10) {
      setPhoneError('')
      return
    }

    setCheckingPhone(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/riders/${phone}`)
      if (response.ok) {
        setPhoneError('This number is already registered!')
      } else {
        setPhoneError('')
      }
    } catch (error) {
      setPhoneError('')
    } finally {
      setCheckingPhone(false)
    }
  }

  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10)
    onChange('whatsapp', cleaned)
    
    if (cleaned.length === 10) {
      checkPhoneExists(cleaned)
    } else {
      setPhoneError('')
    }
  }

  const platforms = ['Swiggy', 'Zomato', 'Uber Eats', 'Amazon', 'Dunzo', 'Porter', 'Blinkit', 'Other']

  return (
    <div className={styles.section}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('fullName') || 'Full Name'} *</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('whatsapp') || 'WhatsApp Number'} *</label>
        <input
          type="tel"
          placeholder="10 digit mobile number"
          value={formData.whatsapp}
          onChange={(e) => handlePhoneChange(e.target.value)}
          className={`${styles.input} ${phoneError ? styles.inputError : ''} ${otpVerified ? styles.inputSuccess : ''}`}
          maxLength={10}
          disabled={otpVerified}
        />
        
        {checkingPhone && <span className={styles.checking}>Checking...</span>}
        {phoneError && <div className={styles.errorMessage}>{phoneError}</div>}
        
        {/* OTP Verified Badge */}
        {otpVerified && (
          <div className={styles.successMessage}>
            ✅ Phone number verified
          </div>
        )}
        
        {/* Send OTP Button */}
        {!otpVerified && formData.whatsapp.length === 10 && !phoneError && (
          <button
            type="button"
            onClick={onSendOTP}
            disabled={otpLoading || otpCooldown > 0}
            className={styles.otpButton}
          >
            {otpLoading ? 'Sending...' : otpCooldown > 0 ? `Wait ${otpCooldown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
          </button>
        )}
      </div>

      {/* OTP Verification Section */}
      {otpSent && !otpVerified && (
        <div className={styles.otpSection}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Enter OTP *</label>
            <p className={styles.helperText}>
              📱 We've sent a 6-digit code to your mobile number
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={styles.input}
              maxLength={6}
              autoComplete="off"
            />
            
            {otpError && <div className={styles.errorMessage}>{otpError}</div>}
            
            <div className={styles.otpActions}>
              <button
                type="button"
                onClick={onVerifyOTP}
                disabled={otpLoading || otp.length !== 6}
                className={styles.verifyButton}
              >
                {otpLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
              
              <button
                type="button"
                onClick={onSendOTP}
                disabled={otpLoading || otpCooldown > 0}
                className={styles.resendButton}
              >
                {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
              </button>
            </div>
            
            <p className={styles.helperText}>
              ⏰ OTP expires in 5 minutes • 3 attempts allowed
            </p>
          </div>
        </div>
      )}

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('city') || 'City'} *</label>
        <select 
          value={formData.city}
          onChange={(e) => onChange('city', e.target.value)}
          className={styles.select}
        >
          <option value="">Select your city</option>
          <option value="Bangalore">Bangalore</option>
          <option value="Delhi">Delhi</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Pune">Pune</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>PIN Code</label>
        <input
          type="text"
          placeholder="6-digit PIN code"
          value={formData.pinCode}
          onChange={(e) => onChange('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
          className={styles.input}
          maxLength={6}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('platform') || 'Delivery Platforms'} * (Select all that apply)</label>
        <div className={styles.checkboxGrid}>
          {platforms.map(platform => (
            <label key={platform} className={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={formData.platforms.includes(platform)}
                onChange={() => onMultiSelect('platforms', platform)}
              />
              <span className={styles.checkboxLabel}>{platform}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('experience') || 'Years of Experience'} *</label>
        <select 
          value={formData.experience}
          onChange={(e) => onChange('experience', e.target.value)}
          className={styles.select}
        >
          <option value="">Select experience</option>
          <option value="0.5">Less than 1 year</option>
          <option value="2">1-3 years</option>
          <option value="4">3-5 years</option>
          <option value="6">More than 5 years</option>
        </select>
      </div>
    </div>
  )
}

// Section B: Vehicle Info (with conditional fuel/charge methods)
// Section B: Vehicle Info (with conditional fuel/charge methods)
function SectionB({ formData, onChange, t }) {
  const isEV = formData.vehicleType === 'Electric Two-Wheeler'
  const isPetrol = formData.vehicleType === 'Petrol Two-Wheeler'

  return (
    <div className={styles.section}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('vehicleType') || 'Vehicle Type'} *</label>
        <select 
          value={formData.vehicleType}
          onChange={(e) => onChange('vehicleType', e.target.value)}
          className={styles.select}
        >
          <option value="">Select vehicle type</option>
          <option value="Petrol Two-Wheeler">Petrol Two-Wheeler</option>
          <option value="Electric Two-Wheeler">Electric Two-Wheeler</option>
          <option value="Four-Wheeler">Four-Wheeler</option>
          <option value="Bicycle">Bicycle</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('vehicleBrand') || 'Vehicle Brand'}</label>
        <input
          type="text"
          placeholder="e.g., Honda, TVS, Ola, Ather"
          value={formData.vehicleBrand}
          onChange={(e) => onChange('vehicleBrand', e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          {isEV ? 'Charging Method' : isPetrol ? 'Refueling Method' : 'Fuel/Charge Method'} *
        </label>
        <select 
          value={formData.fuelMethod}
          onChange={(e) => onChange('fuelMethod', e.target.value)}
          className={styles.select}
        >
          <option value="">Select method</option>
          
          {/* Show only for Petrol vehicles */}
          {isPetrol && (
            <>
              <option value="Petrol Pump">Petrol Pump</option>
              <option value="Other">Other</option>
            </>
          )}
          
          {/* Show only for EV */}
          {isEV && (
            <>
              <option value="Home Charging">Home Charging</option>
              <option value="Swapping Station">Swapping Station</option>
              <option value="Public Charging Station">Public Charging Station</option>
              <option value="Other">Other</option>
            </>
          )}
          
          {/* Show for other vehicles (Four-Wheeler, Bicycle, or not selected) */}
          {!isEV && !isPetrol && (
            <>
              <option value="Petrol Pump">Petrol Pump</option>
              <option value="Home Charging">Home Charging</option>
              <option value="Swapping Station">Swapping Station</option>
              <option value="Other">Other</option>
            </>
          )}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          {isEV ? 'Weekly Charging Expense (₹)' : 'Weekly Fuel/Charge Expense (₹)'} *
        </label>
        <input
          type="number"
          placeholder="e.g., 500"
          value={formData.weeklyExpense}
          onChange={(e) => onChange('weeklyExpense', e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('monthlyMaintenance') || 'Monthly Maintenance Cost (₹)'} *</label>
        <input
          type="number"
          placeholder="e.g., 1000"
          value={formData.monthlyMaintenance}
          onChange={(e) => onChange('monthlyMaintenance', e.target.value)}
          className={styles.input}
        />
      </div>
    </div>
  )
}

// Section C: Challenges (CONDITIONAL LOGIC - only show relevant challenges)
function SectionC({ formData, onChange, onMultiSelect, vehicleType, t }) {
  const isEV = vehicleType === 'Electric Two-Wheeler'
  const isPetrol = vehicleType === 'Petrol Two-Wheeler'

  // General challenges - filtered based on vehicle type
  const getGeneralChallenges = () => {
    const allChallenges = [
      'High fuel cost',
      'Frequent breakdown',
      'No nearby charging station',
      'Battery range anxiety',
      'Repair costs',
      'Long refuelling time',
      'Other'
    ]

    // Filter out irrelevant challenges
    if (isPetrol) {
      return allChallenges.filter(c => 
        c !== 'No nearby charging station' && 
        c !== 'Battery range anxiety'
      )
    }
    
    if (isEV) {
      return allChallenges.filter(c => 
        c !== 'High fuel cost' && 
        c !== 'Long refuelling time'
      )
    }

    return allChallenges
  }

  const generalChallenges = getGeneralChallenges()
  
  const evChallenges = [
    'Battery drains too fast', 'Swapping station too far', 'Long charging time at home',
    'Vehicle not powerful enough', 'Service centre not nearby', 'Other'
  ]
  
  const petrolChallenges = [
    'Fuel price too high', 'Frequent engine issues', 'Pollution fine risk',
    'High servicing cost', 'Other'
  ]

  return (
    <div className={styles.section}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('challenges') || 'What challenges do you face?'} *</label>
        <div className={styles.checkboxGrid}>
          {generalChallenges.map(challenge => (
            <label key={challenge} className={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={formData.challenges.includes(challenge)}
                onChange={() => onMultiSelect('challenges', challenge)}
              />
              <span className={styles.checkboxLabel}>{challenge}</span>
            </label>
          ))}
        </div>
      </div>

      {/* CONDITIONAL: Only show EV challenges for EV riders */}
      {isEV && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>{t('evChallenges') || 'Additional EV Challenges'}</label>
          <div className={styles.checkboxGrid}>
            {evChallenges.map(challenge => (
              <label key={challenge} className={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={formData.evChallenges.includes(challenge)}
                  onChange={() => onMultiSelect('evChallenges', challenge)}
                />
                <span className={styles.checkboxLabel}>{challenge}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* CONDITIONAL: Only show Petrol challenges for Petrol riders */}
      {isPetrol && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>{t('petrolChallenges') || 'Additional Petrol Vehicle Challenges'}</label>
          <div className={styles.checkboxGrid}>
            {petrolChallenges.map(challenge => (
              <label key={challenge} className={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={formData.petrolChallenges.includes(challenge)}
                  onChange={() => onMultiSelect('petrolChallenges', challenge)}
                />
                <span className={styles.checkboxLabel}>{challenge}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Section D: Insurance (unchanged)
function SectionD({ formData, onChange, t }) {
  return (
    <div className={styles.section}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('accidentInsurance') || 'Do you have accident insurance?'} *</label>
        <div className={styles.radioGroup}>
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'notSure', label: 'Not Sure' }
          ].map(option => (
            <label key={option.value} className={styles.radioCard}>
              <input
                type="radio"
                name="accidentInsurance"
                checked={formData.accidentInsurance === option.value}
                onChange={() => onChange('accidentInsurance', option.value)}
              />
              <span className={styles.radioLabel}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('healthInsurance') || 'Do you have health insurance?'} *</label>
        <div className={styles.radioGroup}>
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'notSure', label: 'Not Sure' }
          ].map(option => (
            <label key={option.value} className={styles.radioCard}>
              <input
                type="radio"
                name="healthInsurance"
                checked={formData.healthInsurance === option.value}
                onChange={() => onChange('healthInsurance', option.value)}
              />
              <span className={styles.radioLabel}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('paidForAccident') || 'Ever paid out-of-pocket for accident/health?'} *</label>
        <div className={styles.radioGroup}>
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ].map(option => (
            <label key={option.value} className={styles.radioCard}>
              <input
                type="radio"
                name="paidForAccident"
                checked={formData.paidForAccident === option.value}
                onChange={() => onChange('paidForAccident', option.value)}
              />
              <span className={styles.radioLabel}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// Section E: EV Interest + Product Accessories (HIGHLY CONDITIONAL)
function SectionE({ formData, onChange, onMultiSelect, vehicleType, t }) {
  const isEV = vehicleType === 'Electric Two-Wheeler'
  const isPetrol = vehicleType === 'Petrol Two-Wheeler'
  const isFourWheeler = vehicleType === 'Four-Wheeler'
  const isBicycle = vehicleType === 'Bicycle'

  const switchReasons = [
    'Lower rental cost', 'Better battery range', 'Swap stations nearby',
    'Income guarantee', 'Employer subsidy', 'Other'
  ]

  // Interests - conditional based on vehicle type
  const getInterests = () => {
    if (isEV) {
      return [
        'Better EV rental offer',
        'Insurance quote',
        'Accessories',
        'All of the above',
        'None'
      ]
    } else if (isPetrol) {
      return [
        'EV rental offer',
        'Retrofit information',
        'Insurance quote',
        'All of the above',
        'None'
      ]
    } else {
      return [
        'EV information',
        'Insurance quote',
        'Accessories',
        'All of the above',
        'None'
      ]
    }
  }

  const interests = getInterests()

  const accessories = [
    'Phone mount', 'Power bank', 'Emergency light', 'Raincoat',
    'Cable lock', 'Seat cushion', 'Handlebar charger', 'None needed'
  ]

  return (
    <div className={styles.section}>
      {/* CONDITIONAL: Only ask petrol/four-wheeler riders about switching to EV */}
      {!isEV && !isBicycle && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            {isPetrol ? 'Would you switch to an electric two-wheeler?' : 'Would you switch to an electric vehicle?'} *
          </label>
          <div className={styles.radioGroup}>
            {[
              { value: 'yes', label: 'Yes, interested' },
              { value: 'no', label: 'No, happy with current' },
              { value: 'needMoreInfo', label: 'Need more info' }
            ].map(option => (
              <label key={option.value} className={styles.radioCard}>
                <input
                  type="radio"
                  name="switchToEV"
                  checked={formData.switchToEV === option.value}
                  onChange={() => onChange('switchToEV', option.value)}
                />
                <span className={styles.radioLabel}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* CONDITIONAL: If already on EV, auto-set and don't show */}
      {isEV && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Vehicle Status *</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioCard}>
              <input
                type="radio"
                name="switchToEV"
                checked={true}
                onChange={() => onChange('switchToEV', 'alreadyOnEV')}
              />
              <span className={styles.radioLabel}>✅ Already using Electric Two-Wheeler</span>
            </label>
          </div>
        </div>
      )}

      {/* CONDITIONAL: If bicycle, different question */}
      {isBicycle && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Would you consider using an electric two-wheeler for deliveries? *</label>
          <div className={styles.radioGroup}>
            {[
              { value: 'yes', label: 'Yes, considering it' },
              { value: 'no', label: 'No, prefer bicycle' },
              { value: 'needMoreInfo', label: 'Need more info' }
            ].map(option => (
              <label key={option.value} className={styles.radioCard}>
                <input
                  type="radio"
                  name="switchToEV"
                  checked={formData.switchToEV === option.value}
                  onChange={() => onChange('switchToEV', option.value)}
                />
                <span className={styles.radioLabel}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* CONDITIONAL: Only ask reasons if they said yes or need more info */}
      {(formData.switchToEV === 'yes' || formData.switchToEV === 'needMoreInfo') && !isEV && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            {isPetrol ? 'What would make you switch to EV?' : 'What interests you about electric vehicles?'}
          </label>
          <div className={styles.checkboxGrid}>
            {switchReasons.map(reason => (
              <label key={reason} className={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={formData.switchReasons.includes(reason)}
                  onChange={() => onMultiSelect('switchReasons', reason)}
                />
                <span className={styles.checkboxLabel}>{reason}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* For all riders: What are you interested in? */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          {isEV ? 'What else can we help you with?' : 'What are you interested in?'}
        </label>
        <div className={styles.checkboxGrid}>
          {interests.map(interest => (
            <label key={interest} className={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={formData.interested.includes(interest)}
                onChange={() => onMultiSelect('interested', interest)}
              />
              <span className={styles.checkboxLabel}>{interest}</span>
            </label>
          ))}
        </div>
      </div>

      {/* For all riders: Product accessories */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          🎁 {isBicycle ? 'Which accessories would help your bicycle deliveries?' : 'Which rider accessories would help your work?'}
        </label>
        <div className={styles.checkboxGrid}>
          {accessories.map(accessory => (
            <label key={accessory} className={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={formData.accessories.includes(accessory)}
                onChange={() => onMultiSelect('accessories', accessory)}
              />
              <span className={styles.checkboxLabel}>{accessory}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// Section F: Referral + Privacy Consent
function SectionF({ formData, onChange, t }) {
  const isPreFilled = formData.referredBy && formData.referralCode
  
  return (
    <div className={styles.section}>
      {isPreFilled && (
        <div className={styles.successBanner}>
          ✅ Referral code applied: <strong>{formData.referralCode}</strong>
        </div>
      )}
      
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('referredBy') || 'Were you referred by someone?'}</label>
        <div className={styles.radioGroup}>
          {[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' }
          ].map(option => (
            <label key={String(option.value)} className={styles.radioCard}>
              <input
                type="radio"
                name="referredBy"
                checked={formData.referredBy === option.value}
                onChange={() => onChange('referredBy', option.value)}
              />
              <span className={styles.radioLabel}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {formData.referredBy && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>{t('referralCode') || 'Referral Code'}</label>
          <input
            type="text"
            placeholder="e.g., RW-A1B2"
            value={formData.referralCode}
            onChange={(e) => onChange('referralCode', e.target.value.toUpperCase())}
            className={styles.input}
          />
        </div>
      )}

      <div className={styles.fieldGroup}>
        <label className={styles.consentLabel}>
          <input
            type="checkbox"
            checked={formData.consentGiven}
            onChange={(e) => onChange('consentGiven', e.target.checked)}
            className={styles.consentCheckbox}
          />
          <span className={styles.consentText}>
            I agree that Bharat Riders may use my information to connect me with relevant EV, insurance, and product offers. *
          </span>
        </label>
      </div>
    </div>
  )
}

export default QuestionnaireForm
