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

  const validateSection = () => {
    switch (currentSection) {
      case 0: // Section A
        return formData.fullName && formData.whatsapp && formData.city && 
               formData.platforms.length > 0 && formData.experience
      case 1: // Section B
        return formData.vehicleType && formData.fuelMethod && 
               formData.weeklyExpense && formData.monthlyMaintenance
      case 2: // Section C
        return formData.challenges.length > 0
      case 3: // Section D
        return formData.accidentInsurance && formData.healthInsurance && 
               formData.paidForAccident
      case 4: // Section E
        return formData.switchToEV
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
        return <SectionA formData={formData} onChange={handleChange} onMultiSelect={handleMultiSelect} t={t} />
      case 1:
        return <SectionB formData={formData} onChange={handleChange} t={t} />
      case 2:
        return <SectionC formData={formData} onChange={handleChange} onMultiSelect={handleMultiSelect} vehicleType={formData.vehicleType} t={t} />
      case 3:
        return <SectionD formData={formData} onChange={handleChange} t={t} />
      case 4:
        return <SectionE formData={formData} onChange={handleChange} onMultiSelect={handleMultiSelect} t={t} />
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

// Section A: Basic Info + Multi-select Platforms + PIN Code
function SectionA({ formData, onChange, onMultiSelect, t }) {
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
          className={`${styles.input} ${phoneError ? styles.inputError : ''}`}
          maxLength={10}
        />
        {checkingPhone && <span className={styles.checking}>Checking...</span>}
        {phoneError && <div className={styles.errorMessage}>{phoneError}</div>}
      </div>

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

// Section B: Vehicle Info (unchanged)
function SectionB({ formData, onChange, t }) {
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
        <label className={styles.fieldLabel}>{t('fuelMethod') || 'Refuel/Charge Method'} *</label>
        <select 
          value={formData.fuelMethod}
          onChange={(e) => onChange('fuelMethod', e.target.value)}
          className={styles.select}
        >
          <option value="">Select method</option>
          <option value="Petrol Pump">Petrol Pump</option>
          <option value="Home Charging">Home Charging</option>
          <option value="Swapping Station">Swapping Station</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('weeklyExpense') || 'Weekly Fuel/Charge Expense (₹)'} *</label>
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
  const generalChallenges = [
    'High fuel cost', 'Frequent breakdown', 'No nearby charging station',
    'Battery range anxiety', 'Repair costs', 'Long refuelling time', 'Other'
  ]
  
  const evChallenges = [
    'Battery drains too fast', 'Swapping station too far', 'Long charging time at home',
    'Vehicle not powerful enough', 'Service centre not nearby', 'Other'
  ]
  
  const petrolChallenges = [
    'Fuel price too high', 'Frequent engine issues', 'Pollution fine risk',
    'High servicing cost', 'Other'
  ]

  const isEV = vehicleType === 'Electric Two-Wheeler'
  const isPetrol = vehicleType === 'Petrol Two-Wheeler'

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

// Section E: EV Interest + Product Accessories
function SectionE({ formData, onChange, onMultiSelect, t }) {
  const switchReasons = [
    'Lower rental cost', 'Better battery range', 'Swap stations nearby',
    'Income guarantee', 'Employer subsidy', 'Other'
  ]

  const interests = [
    'EV rental offer', 'Insurance quote', 'Retrofit information', 'All of the above', 'None'
  ]

  const accessories = [
    'Phone mount', 'Power bank', 'Emergency light', 'Raincoat',
    'Cable lock', 'Seat cushion', 'Handlebar charger', 'None needed'
  ]

  return (
    <div className={styles.section}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('switchToEV') || 'Would you switch to an electric vehicle?'} *</label>
        <div className={styles.radioGroup}>
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'alreadyOnEV', label: 'Already on EV' },
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

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('switchReasons') || 'Why would you switch?'}</label>
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

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{t('interested') || 'What are you interested in?'}</label>
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

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>🎁 Which rider accessories would help your work?</label>
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
