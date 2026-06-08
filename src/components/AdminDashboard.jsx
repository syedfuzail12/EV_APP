import { useState, useEffect } from 'react'
import { getAllRiders, getStats } from '../services/api'
import styles from './AdminDashboard.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function AdminDashboard() {
  const [riders, setRiders] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('')
  const [pinCodeFilter, setPinCodeFilter] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
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

  // Get unique values for filters
  const cities = [...new Set(riders.map(r => r.city).filter(Boolean))]
  const pinCodes = [...new Set(riders.map(r => r.pinCode || r.pin_code).filter(Boolean))]

  const filteredRiders = riders.filter(rider => {
    // Vehicle type filter
    if (filter === 'ev' && rider.vehicleType !== 'Electric Two-Wheeler') return false
    if (filter === 'petrol' && rider.vehicleType !== 'Petrol Two-Wheeler') return false
    if (filter === 'hot-leads' && rider.switchToEV !== 'yes') return false
    if (filter === 'no-insurance' && rider.accidentInsurance !== 'no' && rider.healthInsurance !== 'no') return false
    
    // City filter
    if (cityFilter && rider.city !== cityFilter) return false
    
    // PIN code filter
    if (pinCodeFilter && (rider.pinCode || rider.pin_code) !== pinCodeFilter) return false
    
    // Segment filter (lead tags)
    if (segmentFilter && !(rider.leadTags || rider.lead_tags || []).includes(segmentFilter)) return false
    
    return true
  })

  // CSV Export function
  const handleCSVExport = (segment = null) => {
    let url = `${API_URL}/export/csv?`
    if (segment) url += `segment=${segment}&`
    if (cityFilter) url += `city=${cityFilter}&`
    if (pinCodeFilter) url += `pinCode=${pinCodeFilter}&`
    
    window.open(url, '_blank')
  }

  // Calculate segment stats
  const segmentStats = {
    PERSONAL_INSURANCE_LEAD: riders.filter(r => (r.leadTags || r.lead_tags || []).includes('PERSONAL_INSURANCE_LEAD')).length,
    BIKE_INSURANCE_LEAD: riders.filter(r => (r.leadTags || r.lead_tags || []).includes('BIKE_INSURANCE_LEAD')).length,
    EV_SALE_LEAD: riders.filter(r => (r.leadTags || r.lead_tags || []).includes('EV_SALE_LEAD')).length,
    EV_RENTAL_LEAD: riders.filter(r => (r.leadTags || r.lead_tags || []).includes('EV_RENTAL_LEAD')).length,
    RETROFIT_LEAD: riders.filter(r => (r.leadTags || r.lead_tags || []).includes('RETROFIT_LEAD')).length,
    PRODUCT_LEAD: riders.filter(r => (r.leadTags || r.lead_tags || []).includes('PRODUCT_LEAD')).length
  }

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <button className={styles.exportBtn} onClick={() => handleCSVExport()}>
          📥 Export All CSV
        </button>
      </div>

      {/* Stats Grid */}
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

      {/* Lead Segments */}
      <div className={styles.segmentSection}>
        <h2 className={styles.sectionTitle}>Lead Segments (6 Types)</h2>
        <div className={styles.segmentGrid}>
          {Object.entries(segmentStats).map(([segment, count]) => (
            <div key={segment} className={styles.segmentCard}>
              <div className={styles.segmentHeader}>
                <span className={styles.segmentName}>{segment.replace(/_/g, ' ')}</span>
                <span className={styles.segmentCount}>{count}</span>
              </div>
              <button 
                className={styles.segmentExportBtn}
                onClick={() => handleCSVExport(segment)}
                disabled={count === 0}
              >
                📥 Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <h2 className={styles.sectionTitle}>Filters</h2>
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

        <div className={styles.advancedFilters}>
          <select 
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select 
            value={pinCodeFilter}
            onChange={(e) => setPinCodeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All PIN Codes</option>
            {pinCodes.map(pin => (
              <option key={pin} value={pin}>{pin}</option>
            ))}
          </select>

          <select 
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Segments</option>
            <option value="PERSONAL_INSURANCE_LEAD">Personal Insurance Lead</option>
            <option value="BIKE_INSURANCE_LEAD">Bike Insurance Lead</option>
            <option value="EV_SALE_LEAD">EV Sale Lead</option>
            <option value="EV_RENTAL_LEAD">EV Rental Lead</option>
            <option value="RETROFIT_LEAD">Retrofit Lead</option>
            <option value="PRODUCT_LEAD">Product Lead</option>
          </select>

          {(cityFilter || pinCodeFilter || segmentFilter) && (
            <button 
              className={styles.clearFiltersBtn}
              onClick={() => {
                setCityFilter('')
                setPinCodeFilter('')
                setSegmentFilter('')
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Riders Table */}
      <div className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>
          Riders ({filteredRiders.length})
        </h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>PIN</th>
                <th>Vehicle</th>
                <th>Platforms</th>
                <th>Lead Tags</th>
                <th>Follow-up</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.map((rider, idx) => (
                <tr key={idx}>
                  <td>{rider.fullName}</td>
                  <td>{rider.whatsapp}</td>
                  <td>{rider.city}</td>
                  <td>{rider.pinCode || rider.pin_code || '-'}</td>
                  <td>
                    <span className={styles.badge}>
                      {rider.vehicleType === 'Electric Two-Wheeler' ? '⚡' : '⛽'} 
                      {rider.vehicleType}
                    </span>
                  </td>
                  <td>
                    {(rider.platforms || [rider.platform]).join(', ')}
                  </td>
                  <td>
                    <div className={styles.tags}>
                      {(rider.leadTags || rider.lead_tags || []).map((tag, i) => (
                        <span key={i} className={styles.tag}>{tag.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.followUpBadge} ${styles[rider.followUpStatus || rider.follow_up_status || 'New']}`}>
                      {rider.followUpStatus || rider.follow_up_status || 'New'}
                    </span>
                  </td>
                  <td><strong>{rider.points || 10}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaderboard */}
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
