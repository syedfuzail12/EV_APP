import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './WelcomeScreen.module.css'

function WelcomeScreen() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const handleStart = () => {
    // Pass referral code from URL to questionnaire if present
    const refCode = searchParams.get('ref')
    if (refCode) {
      navigate('/questionnaire', { state: { referralCode: refCode } })
    } else {
      navigate('/questionnaire')
    }
  }

  return (
    <div className={styles.welcome}>
      <div className={styles.illustration}>
        <div className={styles.evBike}>🏍️</div>
        <div className={styles.lightning}>⚡</div>
      </div>
      
      <div className={styles.content}>
        <h1 className={styles.title}>{t('welcome')}</h1>
        <p className={styles.tagline}>{t('tagline')}</p>
        
        <div className={styles.languageSection}>
          <label className={styles.label}>{t('selectLanguage')}</label>
          <div className={styles.languageButtons}>
            <button
              className={`${styles.langBtn} ${selectedLanguage === 'en' ? styles.active : ''}`}
              onClick={() => handleLanguageSelect('en')}
            >
              English
            </button>
            <button
              className={`${styles.langBtn} ${selectedLanguage === 'hi' ? styles.active : ''}`}
              onClick={() => handleLanguageSelect('hi')}
            >
              हिंदी
            </button>
            <button
              className={`${styles.langBtn} ${selectedLanguage === 'kn' ? styles.active : ''}`}
              onClick={() => handleLanguageSelect('kn')}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        <button className={styles.startBtn} onClick={handleStart}>
          {t('next')}
        </button>

        <div className={styles.footer}>
          <a href="/score" className={styles.link}>{t('checkScore')}</a>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen
