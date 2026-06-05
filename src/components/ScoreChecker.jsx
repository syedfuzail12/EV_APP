import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getRiderScore } from '../services/api'
import styles from './ScoreChecker.module.css'

function ScoreChecker() {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleCheck = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await getRiderScore(phone)
      setResult(data)
    } catch (err) {
      setError('Rider not found. Please check your phone number.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.checker}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Check Your Score</h1>
          <p className={styles.subtitle}>Enter your WhatsApp number to view your points and referrals</p>
        </div>

        <div className={styles.card}>
          <input
            type="tel"
            placeholder="WhatsApp Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={styles.input}
            maxLength={10}
          />
          
          {error && <div className={styles.error}>{error}</div>}

          <button 
            className={styles.checkBtn}
            onClick={handleCheck}
            disabled={loading || phone.length !== 10}
          >
            {loading ? 'Checking...' : 'Check Score'}
          </button>
        </div>

        {result && (
          <div className={styles.resultCard}>
            <div className={styles.userName}>
              <span className={styles.userIcon}>👤</span>
              {result.fullName}
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{result.points}</span>
                <span className={styles.statLabel}>Total Points</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{result.referralCount}</span>
                <span className={styles.statLabel}>Referrals</span>
              </div>
            </div>

            <div className={styles.codeSection}>
              <label className={styles.label}>Your Referral Code</label>
              <div className={styles.codeBox}>{result.referralCode}</div>
            </div>

            <div className={styles.progress}>
              <div className={styles.progressLabel}>
                <span>Next Milestone: {result.nextMilestone} referrals</span>
                <span>{result.referralCount} / {result.nextMilestone}</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${(result.referralCount / result.nextMilestone) * 100}%` }}
                />
              </div>
            </div>

            {result.leaderboardRank && (
              <div className={styles.rank}>
                <span className={styles.rankIcon}>🏅</span>
                <span>You're rank #{result.leaderboardRank} on the leaderboard!</span>
              </div>
            )}
          </div>
        )}

        <a href="/" className={styles.backLink}>← Back to Home</a>
      </div>
    </div>
  )
}

export default ScoreChecker
