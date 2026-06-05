import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { submitRider } from '../services/api'
import styles from './QuestionnaireForm.module.css'

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

function QuestionnaireForm() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [currentSection, setCurrentSection] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    city: '',
    platform: '',
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
    referredBy: false,
    referralCode: ''
  })

  useEffect(() => {
    // Auto-detect language based on city
    if (formData.city === 'Bangalore' || formData.city === 'bangalore') {
      if (i18n.language !== 'kn') {
        // Could suggest Kannada but respect user's choice
      }
    }
  }, [formData.city])

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
               formData.platform && formData.experience
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
        return !formData.referredBy || formData.referralCode
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateSection()) {
      if (currentSection < SECTIONS.length - 1) {
        setCurrentSection(prev => prev + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const result = await submitRider({
        ...formData,
        language: i18n.language,
        timestamp: new Date().toISOString()
      })
      navigate('/success', { state: { referralCode: result.referralCode, points: result.points } })
    } catch (error) {
      alert('Submission failed. Please try again.')
      setLoading(false)
    }
  }

  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return <SectionA formData={formData} onChange={handleChange} t={t} />
      case 1:
        return <SectionB formData={formData} onChange={handleChange} t={t} />
      case 2:
        return <SectionC formData={formData} onChange={handleChange} onMultiSelect={handleMultiSelect} t={t} />
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
      <div className={styles.progress}>
        <div className={styles.progressBar} style={{ width: `${((currentSection + 1) / SECTIONS.length) * 100}%` }} />
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>
            {t(`section${SECTIONS[currentSection]}`)}
          </h2>
          <span className={styles.step}>{currentSection + 1} / {SECTIONS.length}</span>
        </div>

        <div className={styles.formContent}>
          {renderSection()}
        </div>

        <div className={styles.actions}>
          {currentSection > 0 && (
            <button className={styles.backBtn} onClick={handleBack}>
              {t('back')}
            </button>
          )}
          <button 
            className={styles.nextBtn} 
            onClick={handleNext}
            disabled={!validateSection() || loading}
          >
            {loading ? '...' : currentSection === SECTIONS.length - 1 ? t('submit') : t('next')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Section Components
function SectionA({ formData, onChange, t }) {
  return (
    <div className={styles.section}>
      <input
        type="text"
        placeholder={t('fullName')}
        value={formData.fullName}
        onChange={(e) => onChange('fullName', e.target.value)}
        className={styles.input}
      />
      <input
        type="tel"
        placeholder={t('whatsapp')}
        value={formData.whatsapp}
        onChange={(e) => onChange('whatsapp', e.target.value)}
        className={styles.input}
        maxLength={10}
      />
      <select 
        value={formData.city}
        onChange={(e) => onChange('city', e.target.value)}
        className={styles.select}
      >
        <option value="">{t('city')}</option>
        <option value="Bangalore">{t('bangalore')}</option>
        <option value="Delhi">{t('delhi')}</option>
        <option value="Mumbai">{t('mumbai')}</option>
        <option value="Hyderabad">{t('hyderabad')}</option>
        <option value="Pune">{t('pune')}</option>
      </select>
      <select 
        value={formData.platform}
        onChange={(e) => onChange('platform', e.target.value)}
        className={styles.select}
      >
        <option value="">{t('platform')}</option>
        <option value="Swiggy">{t('swiggy')}</option>
        <option value="Zomato">{t('zomato')}</option>
        <option value="Blinkit">{t('blinkit')}</option>
        <option value="Porter">{t('porter')}</option>
        <option value="Dunzo">{t('dunzo')}</option>
        <option value="Other">{t('other')}</option>
      </select>
      <input
        type="number"
        placeholder={t('experience')}
        value={formData.experience}
        onChange={(e) => onChange('experience', e.target.value)}
        className={styles.input}
        min="0"
        step="0.5"
      />
    </div>
  )
}

function SectionB({ formData, onChange, t }) {
  return (
    <div className={styles.section}>
      <select 
        value={formData.vehicleType}
        onChange={(e) => onChange('vehicleType', e.target.value)}
        className={styles.select}
      >
        <option value="">{t('vehicleType')}</option>
        <option value="Petrol Two-Wheeler">{t('petrolTwoWheeler')}</option>
        <option value="Diesel Two-Wheeler">{t('dieselTwoWheeler')}</option>
        <option value="Electric Two-Wheeler">{t('electricTwoWheeler')}</option>
        <option value="Other">{t('other')}</option>
      </select>
      <input
        type="text"
        placeholder={t('vehicleBrand')}
        value={formData.vehicleBrand}
        onChange={(e) => onChange('vehicleBrand', e.target.value)}
        className={styles.input}
      />
      <select 
        value={formData.fuelMethod}
        onChange={(e) => onChange('fuelMethod', e.target.value)}
        className={styles.select}
      >
        <option value="">{t('fuelMethod')}</option>
        <option value="Petrol Pump">{t('petrolPump')}</option>
        <option value="Home Charging">{t('homeCharging')}</option>
        <option value="Swapping Station">{t('swappingStation')}</option>
        <option value="Other">{t('other')}</option>
      </select>
      <input
        type="number"
        placeholder={t('weeklyExpense')}
        value={formData.weeklyExpense}
        onChange={(e) => onChange('weeklyExpense', e.target.value)}
        className={styles.input}
      />
      <input
        type="number"
        placeholder={t('monthlyMaintenance')}
        value={formData.monthlyMaintenance}
        onChange={(e) => onChange('monthlyMaintenance', e.target.value)}
        className={styles.input}
      />
    </div>
  )
}

function SectionC({ formData, onChange, onMultiSelect, t }) {
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

  return (
    <div className={styles.section}>
      <label className={styles.label}>{t('challenges')}</label>
      <div className={styles.checkboxGroup}>
        {generalChallenges.map(challenge => (
          <label key={challenge} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.challenges.includes(challenge)}
              onChange={() => onMultiSelect('challenges', challenge)}
            />
            <span>{challenge}</span>
          </label>
        ))}
      </div>

      {formData.vehicleType === 'Electric Two-Wheeler' && (
        <>
          <label className={styles.label}>{t('evChallenges')}</label>
          <div className={styles.checkboxGroup}>
            {evChallenges.map(challenge => (
              <label key={challenge} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.evChallenges.includes(challenge)}
                  onChange={() => onMultiSelect('evChallenges', challenge)}
                />
                <span>{challenge}</span>
              </label>
            ))}
          </div>
        </>
      )}

      {formData.vehicleType === 'Petrol Two-Wheeler' && (
        <>
          <label className={styles.label}>{t('petrolChallenges')}</label>
          <div className={styles.checkboxGroup}>
            {petrolChallenges.map(challenge => (
              <label key={challenge} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.petrolChallenges.includes(challenge)}
                  onChange={() => onMultiSelect('petrolChallenges', challenge)}
                />
                <span>{challenge}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SectionD({ formData, onChange, t }) {
  return (
    <div className={styles.section}>
      <label className={styles.label}>{t('accidentInsurance')}</label>
      <div className={styles.radioGroup}>
        {['yes', 'no', 'notSure'].map(option => (
          <label key={option} className={styles.radio}>
            <input
              type="radio"
              name="accidentInsurance"
              checked={formData.accidentInsurance === option}
              onChange={() => onChange('accidentInsurance', option)}
            />
            <span>{t(option)}</span>
          </label>
        ))}
      </div>

      <label className={styles.label}>{t('healthInsurance')}</label>
      <div className={styles.radioGroup}>
        {['yes', 'no', 'notSure'].map(option => (
          <label key={option} className={styles.radio}>
            <input
              type="radio"
              name="healthInsurance"
              checked={formData.healthInsurance === option}
              onChange={() => onChange('healthInsurance', option)}
            />
            <span>{t(option)}</span>
          </label>
        ))}
      </div>

      <label className={styles.label}>{t('paidForAccident')}</label>
      <div className={styles.radioGroup}>
        {['yes', 'no'].map(option => (
          <label key={option} className={styles.radio}>
            <input
              type="radio"
              name="paidForAccident"
              checked={formData.paidForAccident === option}
              onChange={() => onChange('paidForAccident', option)}
            />
            <span>{t(option)}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SectionE({ formData, onChange, onMultiSelect, t }) {
  const switchReasons = [
    'Lower rental cost', 'Better battery range', 'Swap stations nearby',
    'Income guarantee', 'Employer subsidy', 'Other'
  ]

  const interests = [
    'EV rental offer', 'Insurance quote', 'Retrofit information', 'All of the above', 'None'
  ]

  return (
    <div className={styles.section}>
      <label className={styles.label}>{t('switchToEV')}</label>
      <div className={styles.radioGroup}>
        {['yes', 'no', 'alreadyOnEV', 'needMoreInfo'].map(option => (
          <label key={option} className={styles.radio}>
            <input
              type="radio"
              name="switchToEV"
              checked={formData.switchToEV === option}
              onChange={() => onChange('switchToEV', option)}
            />
            <span>{t(option)}</span>
          </label>
        ))}
      </div>

      <label className={styles.label}>{t('switchReasons')}</label>
      <div className={styles.checkboxGroup}>
        {switchReasons.map(reason => (
          <label key={reason} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.switchReasons.includes(reason)}
              onChange={() => onMultiSelect('switchReasons', reason)}
            />
            <span>{reason}</span>
          </label>
        ))}
      </div>

      <label className={styles.label}>{t('interested')}</label>
      <div className={styles.checkboxGroup}>
        {interests.map(interest => (
          <label key={interest} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.interested.includes(interest)}
              onChange={() => onMultiSelect('interested', interest)}
            />
            <span>{interest}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SectionF({ formData, onChange, t }) {
  return (
    <div className={styles.section}>
      <label className={styles.label}>{t('referredBy')}</label>
      <div className={styles.radioGroup}>
        {['yes', 'no'].map(option => (
          <label key={option} className={styles.radio}>
            <input
              type="radio"
              name="referredBy"
              checked={formData.referredBy === (option === 'yes')}
              onChange={() => onChange('referredBy', option === 'yes')}
            />
            <span>{t(option)}</span>
          </label>
        ))}
      </div>

      {formData.referredBy && (
        <input
          type="text"
          placeholder={t('referralCode')}
          value={formData.referralCode}
          onChange={(e) => onChange('referralCode', e.target.value.toUpperCase())}
          className={styles.input}
        />
      )}
    </div>
  )
}

export default QuestionnaireForm
