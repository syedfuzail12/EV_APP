import { useState, useEffect } from 'react'
import { getAllRiders, getStats } from '../services/api'
import styles from './AdminDashboard.module.css'

function AdminDashboard() {
  const [riders, setRiders] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ridersData, statsData] = await Promise.all([
        getAllRiders(),
        getStats()
      ])
      setRiders(ridersData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRiders = riders.filter(rider => {
    if (filter === 'all') return true
    if (filter === 'ev') return rider.vehicleType === 'Electric Two-Wheeler'
    if (filter === 'petrol') return rider.vehicleType === 'Petrol Two-Wheeler'
    if (filter === 'hot-leads') return rider.switchToEV === 'yes'
    if (filter === 'no-insurance') return rider.accidentInsurance === 'no' || rider.healthInsurance === 'no'
    return true
  })

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Rider Connect Analytics</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <span className={styles.statValue}>{stats?.totalRiders || 0}</span>
          <span className={styles.statLabel}>Total Riders</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⚡</span>
          <span className={styles.statValue}>{stats?.evRiders || 0}</span>
          <span className={styles.statLabel}>EV Riders</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⛽</span>
          <span className={styles.statValue}>{stats?.petrolRiders || 0}</span>
          <span className={styles.statLabel}>Petrol Riders</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔥</span>
          <span className={styles.statValue}>{stats?.hotLeads || 0}</span>
          <span className={styles.statLabel}>Hot EV Leads</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All Riders
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'ev' ? styles.active : ''}`}
            onClick={() => setFilter('ev')}
          >
            EV Riders
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'petrol' ? styles.active : ''}`}
            onClick={() => setFilter('petrol')}
          >
            Petrol Riders
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'hot-leads' ? styles.active : ''}`}
            onClick={() => setFilter('hot-leads')}
          >
            Hot Leads
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'no-insurance' ? styles.active : ''}`}
            onClick={() => setFilter('no-insurance')}
          >
            No Insurance
          </button>
        </div>

        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>Vehicle</th>
                <th>Platform</th>
                <th>Switch Interest</th>
                <th>Points</th>
                <th>Referrals</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.map((rider, idx) => (
                <tr key={idx}>
                  <td>{rider.fullName}</td>
                  <td>{rider.whatsapp}</td>
                  <td>{rider.city}</td>
                  <td>
                    <span className={styles.badge}>
                      {rider.vehicleType === 'Electric Two-Wheeler' ? '⚡' : '⛽'} 
                      {rider.vehicleType}
                    </span>
                  </td>
                  <td>{rider.platform}</td>
                  <td>
                    {rider.switchToEV === 'yes' && <span className={styles.hotBadge}>🔥 Hot Lead</span>}
                    {rider.switchToEV === 'alreadyOnEV' && <span className={styles.evBadge}>✓ On EV</span>}
                    {rider.switchToEV === 'needMoreInfo' && <span className={styles.warmBadge}>ℹ️ Warm</span>}
                  </td>
                  <td><strong>{rider.points || 10}</strong></td>
                  <td>{rider.referralCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.leaderboard}>
        <h2 className={styles.sectionTitle}>Top Referrers</h2>
        <div className={styles.leaderboardList}>
          {riders
            .filter(r => r.referralCount > 0)
            .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
            .slice(0, 10)
            .map((rider, idx) => (
              <div key={idx} className={styles.leaderboardItem}>
                <span className={styles.rank}>#{idx + 1}</span>
                <span className={styles.leaderName}>{rider.fullName}</span>
                <span className={styles.leaderPoints}>{rider.points || 10} pts</span>
                <span className={styles.leaderRefs}>{rider.referralCount || 0} refs</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
