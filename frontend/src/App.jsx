
import { useState, useEffect } from 'react'
import './App.css'

import Students from './pages/Students'
import Classes from './pages/Classes'
import Sections from './pages/Sections'
import Teachers from './pages/Teachers'
import Subjects from './pages/Subjects'
import API from './api/axios'

const menuGroups = [
  {
    title: 'MAIN MENU',
    items: [
      { name: 'Dashboard', icon: '▦' },
      { name: 'Students', icon: '♟' },
      { name: 'Teachers', icon: '♙' },
      { name: 'Classes', icon: '▤' },
      { name: 'Sections', icon: '▣' },
      { name: 'Subjects', icon: '▧' }
    ]
  },
  {
    title: 'ACADEMIC',
    items: [
      { name: 'Attendance', icon: '✓' },
      { name: 'Examinations', icon: '▤' },
      { name: 'Results', icon: '▥' }
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Fees & Accounts', icon: '৳' },
      { name: 'Settings', icon: '⚙' }
    ]
  }
]

function App() {
  const [activeMenu, setActiveMenu] = useState('Dashboard')

  const [stats, setStats] = useState([
    { title: 'Total Students', value: 0, icon: '♟', color: 'blue' },
    { title: 'Total Teachers', value: 0, icon: '♙', color: 'green' },
    { title: 'Total Classes', value: 0, icon: '▤', color: 'orange' },
    { title: 'Total Subjects', value: 0, icon: '▧', color: 'purple' }
  ])

  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (activeMenu !== 'Dashboard') return

    const fetchDashboardStats = async () => {
      setLoadingStats(true)

      try {
        const [students, teachers, classes, subjects] =
          await Promise.all([
            API.get('/students'),
            API.get('/teachers'),
            API.get('/classes'),
            API.get('/subjects')
          ])

        setStats([
          {
            title: 'Total Students',
            value: students.data.data.length,
            icon: '♟',
            color: 'blue'
          },
          {
            title: 'Total Teachers',
            value: teachers.data.data.length,
            icon: '♙',
            color: 'green'
          },
          {
            title: 'Total Classes',
            value: classes.data.data.length,
            icon: '▤',
            color: 'orange'
          },
          {
            title: 'Total Subjects',
            value: subjects.data.data.length,
            icon: '▧',
            color: 'purple'
          }
        ])
      } catch (error) {
        console.error('Dashboard statistics error:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchDashboardStats()
  }, [activeMenu])

  const openPage = (page) => {
    setActiveMenu(page)
  }

  return (
    <div className="app-container">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">E</div>
          <div className="brand-text">
            <h2>EduManage</h2>
            <p>School Management</p>
          </div>
        </div>

        <div className="sidebar-navigation">
          {menuGroups.map((group) => (
            <div className="menu-group" key={group.title}>
              <p className="menu-heading">{group.title}</p>

              <nav className="sidebar-menu">
                {group.items.map((item) => (
                  <button
                    key={item.name}
                    className={`menu-item ${
                      activeMenu === item.name ? 'active' : ''
                    }`}
                    onClick={() => openPage(item.name)}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span>{item.name}</span>

                    {activeMenu === item.name && (
                      <span className="active-indicator"></span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">?</div>
            <div>
              <strong>Need Help?</strong>
              <p>Contact system support</p>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="admin-avatar">A</div>
            <div className="admin-info">
              <strong>Administrator</strong>
              <p>System Admin</p>
            </div>
            <span className="footer-dots">•••</span>
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="main-content">

        {/* Topbar */}
        <header className="topbar">

          <div className="topbar-title">
            <div className="mobile-brand">EduManage</div>
            <h2>{activeMenu}</h2>
            <p>Welcome to your school management system</p>
          </div>

          <div className="topbar-right">

            <div className="system-status">
              <span className="online-dot"></span>
              System Online
            </div>

            <button
              className="notification-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              ♧
              <span className="notification-dot"></span>
            </button>

            <div className="topbar-divider"></div>

            <div className="topbar-profile">
              <div className="admin-avatar">A</div>
              <div className="topbar-profile-info">
                <strong>Admin</strong>
                <p>Administrator</p>
              </div>
              <span className="profile-arrow">⌄</span>
            </div>

          </div>
        </header>

        {/* Dashboard */}
        {activeMenu === 'Dashboard' ? (

          <div className="dashboard-content">

            {/* Welcome Section */}
            <section className="welcome-banner">

              <div className="welcome-text">
                <span className="welcome-label">ADMIN OVERVIEW</span>
                <h1>Welcome back, Administrator!</h1>
                <p>
                  Here's what's happening at your school.
                  Manage everything from one place.
                </p>

                <button
                  className="welcome-button"
                  onClick={() => openPage('Students')}
                >
                  Manage Students <span>→</span>
                </button>
              </div>

              <div className="welcome-decoration">
                <div className="decoration-circle circle-one"></div>
                <div className="decoration-circle circle-two"></div>
                <div className="welcome-building">🏫</div>
              </div>

            </section>

            {/* Overview Heading */}
            <div className="dashboard-section-heading">
              <div>
                <h2>School Overview</h2>
                <p>A quick look at your school's key statistics</p>
              </div>

              <span className="overview-badge">
                <span className="online-dot"></span>
                Live overview
              </span>
            </div>

            {/* Statistics */}
            <section className="stats-grid">

              {stats.map((stat) => (
                <div className="stat-card" key={stat.title}>

                  <div className="stat-card-top">
                    <div className={`stat-icon ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <span className="stat-menu">•••</span>
                  </div>

                  <div className="stat-card-bottom">
                    <p>{stat.title}</p>
                    <h2>
                      {loadingStats ? '...' : stat.value}
                    </h2>
                    <span className="stat-description">
                      Current registered records
                    </span>
                  </div>

                </div>
              ))}

            </section>

            {/* Main Dashboard Grid */}
            <section className="dashboard-main-grid">

              {/* Quick Actions */}
              <div className="dashboard-card quick-actions-card">

                <div className="card-heading">
                  <div>
                    <h3>Quick Actions</h3>
                    <p>Frequently used management tools</p>
                  </div>
                </div>

                <div className="quick-actions-grid">

                  <button
                    className="quick-action"
                    onClick={() => openPage('Students')}
                  >
                    <span className="quick-action-icon blue">♟</span>
                    <span>
                      <strong>Students</strong>
                      <small>Manage students</small>
                    </span>
                    <b>→</b>
                  </button>

                  <button
                    className="quick-action"
                    onClick={() => openPage('Teachers')}
                  >
                    <span className="quick-action-icon green">♙</span>
                    <span>
                      <strong>Teachers</strong>
                      <small>Manage teachers</small>
                    </span>
                    <b>→</b>
                  </button>

                  <button
                    className="quick-action"
                    onClick={() => openPage('Classes')}
                  >
                    <span className="quick-action-icon orange">▤</span>
                    <span>
                      <strong>Classes</strong>
                      <small>Manage classes</small>
                    </span>
                    <b>→</b>
                  </button>

                  <button
                    className="quick-action"
                    onClick={() => openPage('Sections')}
                  >
                    <span className="quick-action-icon purple">▣</span>
                    <span>
                      <strong>Sections</strong>
                      <small>Manage sections</small>
                    </span>
                    <b>→</b>
                  </button>

                </div>
              </div>

              {/* System Information */}
              <div className="dashboard-card system-card">

                <div className="card-heading">
                  <div>
                    <h3>System Information</h3>
                    <p>Current system details</p>
                  </div>
                  <span className="system-card-icon">⌘</span>
                </div>

                <div className="system-info-list">

                  <div className="system-info-row">
                    <span>Academic Year</span>
                    <strong>2026</strong>
                  </div>

                  <div className="system-info-row">
                    <span>System Status</span>
                    <strong className="active-status">
                      <span className="online-dot"></span>
                      Active
                    </strong>
                  </div>

                  <div className="system-info-row">
                    <span>User Role</span>
                    <strong>Administrator</strong>
                  </div>

                  <div className="system-info-row">
                    <span>Platform</span>
                    <strong>EduManage</strong>
                  </div>

                </div>

              </div>

            </section>

            {/* Bottom Dashboard Grid */}
            <section className="dashboard-bottom-grid">

              {/* Recent Activities */}
              <div className="dashboard-card activity-card">

                <div className="card-heading">
                  <div>
                    <h3>Recent Activities</h3>
                    <p>Latest updates from your school</p>
                  </div>
                  <span className="card-heading-icon">◷</span>
                </div>

                <div className="empty-state">
                  <div className="empty-state-icon">▤</div>
                  <strong>No recent activities yet</strong>
                  <p>
                    New student, teacher and academic updates
                    will appear here.
                  </p>
                </div>

              </div>

              {/* AI Insights */}
              <div className="dashboard-card ai-card">

                <div className="ai-card-heading">
                  <div className="ai-icon">✦</div>
                  <div>
                    <h3>AI Insights</h3>
                    <p>Intelligent school monitoring</p>
                  </div>
                  <span className="ai-coming-soon">AI</span>
                </div>

                <div className="ai-content">
                  <div className="ai-content-icon">✧</div>
                  <strong>Smart insights are coming soon</strong>
                  <p>
                    AI-powered student performance analysis,
                    attendance anomaly detection and progress
                    summaries will be available here.
                  </p>
                </div>

              </div>

            </section>

            <footer className="dashboard-footer">
              <span>© 2026 EduManage School Management System</span>
              <span>Designed for smarter school management</span>
            </footer>

          </div>

        ) : activeMenu === 'Students' ? (
          <Students />
        ) : activeMenu === 'Teachers' ? (
          <Teachers />
        ) : activeMenu === 'Classes' ? (
          <Classes />
        ) : activeMenu === 'Sections' ? (
          <Sections />
        ) : activeMenu === 'Subjects' ? (
          <Subjects />
        ) : (

          <div className="dashboard-content">
            <div className="dashboard-card page-placeholder">
              <div className="placeholder-icon">⚙</div>
              <h2>{activeMenu} Management</h2>
              <p>
                This module will be developed with backend API integration.
              </p>
              <button
                className="placeholder-button"
                onClick={() => openPage('Dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

        )}

      </main>
    </div>
  )
}

export default App
