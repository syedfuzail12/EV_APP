import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import styles from './SuccessScreen.module.css'

function SuccessScreen() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { referralCode, points, notificationSent, notificationMethod } = location.state || { 
    referralCode: 'RW-0000', 
    points: 10, 
    notificationSent: false,
    notificationMethod: 'none'
  }
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [loadingQr, setLoadingQr] = useState(false)

  // Generate referral link
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
  const referralLink = `${appUrl}/?ref=${referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
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

  const shareText = `Join Rider Connect and earn rewards! Use my code: ${referralCode}\nOr click here to register: ${referralLink}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`

  return (
    <div className={styles.success}>
      <div className={styles.animation}>
        <div className={styles.checkmark}>✓</div>
      </div>

      <h1 className={styles.title}>{t('success')}</h1>
      
      {notificationSent && notificationMethod && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #28a745',
          borderRadius: '8px',
          padding: '12px 16px',
          margin: '16px 0',
          fontSize: '14px',
          color: '#155724'
        }}>
          ✅ {notificationMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'} confirmation sent to your phone!
        </div>
      )}
      
      {!notificationSent && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '12px 16px',
          margin: '16px 0',
          fontSize: '14px',
          color: '#856404'
        }}>
          📱 Notification couldn't be sent. Please save your referral code below!
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

        <div className={styles.linkSection}>
          <label className={styles.label}>📎 Your Referral Link (Easy to share!)</label>
          <div className={styles.linkBox}>
            <span className={styles.link}>{referralLink}</span>
            <button className={styles.copyBtn} onClick={handleCopyLink}>
              {linkCopied ? '✓' : '📋'}
            </button>
          </div>
          <p className={styles.linkHint}>Share this link with friends - when they click it, your code is auto-filled!</p>
        </div>

        <div className={styles.pointsSection}>
          <div className={styles.pointsBadge}>
            <span className={styles.pointsValue}>{points}</span>
            <span className={styles.pointsLabel}>{t('currentPoints')}</span>
          </div>
        </div>

        <p className={styles.message}>{t('shareWithFriends')}</p>

        <div className={styles.shareButtons}>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.shareBtn}>
            <span className={styles.whatsappIcon}>💬</span>
            Share on WhatsApp
          </a>

          <a href={smsUrl} className={styles.shareBtn}>
            <span className={styles.smsIcon}>📱</span>
            Share via SMS
          </a>
        </div>

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
