import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import styles from './SuccessScreen.module.css'

function SuccessScreen() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { referralCode, points, whatsappSent } = location.state || { referralCode: 'RW-0000', points: 10, whatsappSent: false }
  const [copied, setCopied] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [loadingQr, setLoadingQr] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateQR = async () => {
    setLoadingQr(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/qr/${referralCode}`)
      const data = await response.json()
      setQrCode(data.qrCode)
    } catch (error) {
      console.error('Failed to generate QR:', error)
    } finally {
      setLoadingQr(false)
    }
  }

  const shareText = `Join Rider Connect and earn rewards! Use my code: ${referralCode}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <div className={styles.success}>
      <div className={styles.animation}>
        <div className={styles.checkmark}>✓</div>
      </div>

      <h1 className={styles.title}>{t('success')}</h1>
      
      {!whatsappSent && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '12px 16px',
          margin: '16px 0',
          fontSize: '14px',
          color: '#856404'
        }}>
          📱 WhatsApp confirmation couldn't be sent. Please save your referral code below!
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.codeSection}>
          <label className={styles.label}>{t('yourReferralCode')}</label>
          <div className={styles.codeBox}>
            <span className={styles.code}>{referralCode}</span>
            <button className={styles.copyBtn} onClick={handleCopy}>
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>

        <div className={styles.pointsSection}>
          <div className={styles.pointsBadge}>
            <span className={styles.pointsValue}>{points}</span>
            <span className={styles.pointsLabel}>{t('currentPoints')}</span>
          </div>
        </div>

        <p className={styles.message}>{t('shareWithFriends')}</p>

        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.shareBtn}>
          <span className={styles.whatsappIcon}>💬</span>
          Share on WhatsApp
        </a>

        <button className={styles.qrBtn} onClick={generateQR} disabled={loadingQr}>
          {loadingQr ? 'Generating...' : '📱 Generate QR Code'}
        </button>

        {qrCode && (
          <div className={styles.qrContainer}>
            <p className={styles.qrLabel}>Scan to refer friends:</p>
            <img src={qrCode} alt="QR Code" className={styles.qrImage} />
            <p className={styles.qrHint}>Print and share at petrol pumps!</p>
          </div>
        )}
      </div>

      <div className={styles.rewards}>
        <h3 className={styles.rewardsTitle}>Earn More Points</h3>
        <div className={styles.milestones}>
          <div className={styles.milestone}>
            <span className={styles.milestoneIcon}>🎯</span>
            <div>
              <div className={styles.milestoneCount}>10 Referrals</div>
              <div className={styles.milestoneReward}>+100 Bonus Points</div>
            </div>
          </div>
          <div className={styles.milestone}>
            <span className={styles.milestoneIcon}>🏆</span>
            <div>
              <div className={styles.milestoneCount}>25 Referrals</div>
              <div className={styles.milestoneReward}>+300 Bonus Points</div>
            </div>
          </div>
          <div className={styles.milestone}>
            <span className={styles.milestoneIcon}>🎁</span>
            <div>
              <div className={styles.milestoneCount}>50 Referrals</div>
              <div className={styles.milestoneReward}>Lucky Draw Entry</div>
            </div>
          </div>
        </div>
      </div>

      <button className={styles.homeBtn} onClick={() => navigate('/')}>
        Back to Home
      </button>
    </div>
  )
}

export default SuccessScreen
