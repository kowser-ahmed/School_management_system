
import { useState, useEffect } from 'react'
import './App.css'

import Students from './pages/Students'
import Classes from './pages/Classes'
import Sections from './pages/Sections'
import Teachers from './pages/Teachers'
import Staff from './pages/staffs'
import Subjects from './pages/Subjects'
import API from './api/axios'
import Login from './pages/Login'
import Users from './pages/Users'
import ChangePassword from './pages/ChangePassword'
import Accounts from './pages/Accounts'
import StudentAttendance from './pages/StudentAttendance'
import TeacherAssignment from './pages/TeacherAssignment'

// ================= MENU CONFIGURATION =================

const roleMenuGroups = {
  admin: [
    {
      title: 'MAIN MENU',
      items: [
        { name: 'Dashboard', icon: '▦' },
        { name: 'Students', icon: '♟' },
        { name: 'Teachers', icon: '♙' },
        { name: 'Staff Management', icon: '♟' },
        { name: 'Teacher Assignment', icon: '📚' },
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
        { name: 'User Management', icon: '♙' },
        { name: 'Fees & Accounts', icon: '৳' },
        { name: 'Change Password', icon: '🔐' },
        { name: 'Settings', icon: '⚙' }
      ]
    }
  ],

  teacher: [
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
      title: 'ACCOUNT',
      items: [
        { name: 'Change Password', icon: '🔐' }
      ]
    }
  ],

  accountant: [
    {
      title: 'MAIN MENU',
      items: [
        { name: 'Dashboard', icon: '▦' },
        { name: 'Fees & Accounts', icon: '৳' }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { name: 'Change Password', icon: '🔐' }
      ]
    }
  ],

  parent: [
    {
      title: 'MAIN MENU',
      items: [
        { name: 'Dashboard', icon: '▦' },
        { name: 'Attendance', icon: '✓' },
        { name: 'Results', icon: '▥' }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { name: 'Change Password', icon: '🔐' }
      ]
    }
  ],

  student: [
    {
      title: 'MAIN MENU',
      items: [
        { name: 'Dashboard', icon: '▦' },
        { name: 'Attendance', icon: '✓' },
        { name: 'Results', icon: '▥' },
        { name: 'Fees & Accounts', icon: '৳' }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { name: 'Change Password', icon: '🔐' }
      ]
    }
  ]
}

// ================= APP =================

function App() {
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [stats, setStats] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)

  // ================= USER ROLE =================

  const userRole = user?.role?.toLowerCase() || ''

  const menuGroups = roleMenuGroups[userRole] || []

  const allowedMenus = menuGroups.flatMap(group =>
    group.items.map(item => item.name)
  )

  const displayRole = userRole
    ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
    : 'User'

  const canViewAcademicStats = ['admin', 'teacher'].includes(userRole)

  // ================= AUTHENTICATION =================

  useEffect(() => {
    const verifyLogin = async () => {
      const token = sessionStorage.getItem('token')

      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const response = await API.get('/auth/me')
        setUser(response.data.user)
      } catch (error) {
        sessionStorage.removeItem('token')
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    verifyLogin()
  }, [])

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser)
    setActiveMenu('Dashboard')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    setUser(null)
    setStats([])
    setActiveMenu('Dashboard')
  }

  // ================= PAGE NAVIGATION =================

  const openPage = (page) => {
    if (allowedMenus.includes(page)) {
      setActiveMenu(page)
    }
  }

  // Keep active page valid when user changes
  useEffect(() => {
    if (user && !allowedMenus.includes(activeMenu)) {
      setActiveMenu('Dashboard')
    }
  }, [user, activeMenu, allowedMenus])

  // ================= DASHBOARD STATISTICS =================

  useEffect(() => {
    if (authLoading || !user || activeMenu !== 'Dashboard') {
      return
    }

    let isMounted = true

    const fetchDashboardStats = async () => {
      if (!canViewAcademicStats) {
        setStats([])
        setLoadingStats(false)
        return
      }

      setLoadingStats(true)

      try {
        const [students, teachers, classes, subjects] =
          await Promise.all([
            API.get('/students'),
            API.get('/teachers'),
            API.get('/classes'),
            API.get('/subjects')
          ])

        if (!isMounted) return

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
        if (isMounted) setStats([])
      } finally {
        if (isMounted) setLoadingStats(false)
      }
    }

    fetchDashboardStats()

    return () => {
      isMounted = false
    }
  }, [activeMenu, authLoading, user, canViewAcademicStats])

  // ================= LOADING =================

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px'
      }}>
        Checking authentication...
      </div>
    )
  }

  // ================= LOGIN =================

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  // ================= MAIN LAYOUT =================

  return (
    <div className="app-container">

      {/* SIDEBAR */}

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

        {/* SIDEBAR FOOTER */}

        <div className="sidebar-bottom">

          <div className="sidebar-help">
            <div className="help-icon">?</div>

            <div>
              <strong>Need Help?</strong>
              <p>Contact system support</p>
            </div>
          </div>

          <div className="sidebar-footer">

            <div className="admin-avatar">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>

            <div className="admin-info">
              <strong>{user?.full_name}</strong>
              <p>{displayRole.toUpperCase()}</p>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              ↪
            </button>

          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOPBAR */}

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

              <div className="admin-avatar">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>

              <div className="topbar-profile-info">
                <strong>{user?.full_name}</strong>
                <p>{displayRole}</p>
              </div>

              <span className="profile-arrow">⌄</span>

            </div>

          </div>

        </header>

        {/* DASHBOARD */}

        {activeMenu === 'Dashboard' ? (

          <div className="dashboard-content">

            {/* WELCOME SECTION */}

            <section className="welcome-banner">

              <div className="welcome-text">

                <span className="welcome-label">
                  {displayRole.toUpperCase()} DASHBOARD
                </span>

                <h1>Welcome back, {user?.full_name}!</h1>

                <p>
                  Here's what's happening at your school.
                  Manage everything from one place.
                </p>

                {allowedMenus.includes('Students') && (
                  <button
                    className="welcome-button"
                    onClick={() => openPage('Students')}
                  >
                    Manage Students <span>→</span>
                  </button>
                )}

                {userRole === 'accountant' && (
                  <button
                    className="welcome-button"
                    onClick={() => openPage('Fees & Accounts')}
                  >
                    Manage Accounts <span>→</span>
                  </button>
                )}

              </div>

              <div className="welcome-decoration">
                <div className="decoration-circle circle-one"></div>
                <div className="decoration-circle circle-two"></div>
                <div className="welcome-building">🏫</div>
              </div>

            </section>

            {/* OVERVIEW HEADING */}

            {canViewAcademicStats && (
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
            )}

            {/* STATISTICS */}

            {canViewAcademicStats && (
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
            )}

            {/* MAIN DASHBOARD GRID */}

            <section className="dashboard-main-grid">

              {/* QUICK ACTIONS */}

              <div className="dashboard-card quick-actions-card">

                <div className="card-heading">
                  <div>
                    <h3>Quick Actions</h3>
                    <p>Frequently used management tools</p>
                  </div>
                </div>

                <div className="quick-actions-grid">

                  {[
                    { name: 'Students', icon: '♟', color: 'blue', description: 'Manage students' },
                    { name: 'Teachers', icon: '♙', color: 'green', description: 'Manage teachers' },
                    { name: 'Classes', icon: '▤', color: 'orange', description: 'Manage classes' },
                    { name: 'Sections', icon: '▣', color: 'purple', description: 'Manage sections' }
                  ]
                    .filter(action => allowedMenus.includes(action.name))
                    .map(action => (
                      <button
                        key={action.name}
                        className="quick-action"
                        onClick={() => openPage(action.name)}
                      >
                        <span className={`quick-action-icon ${action.color}`}>
                          {action.icon}
                        </span>

                        <span>
                          <strong>{action.name}</strong>
                          <small>{action.description}</small>
                        </span>

                        <b>→</b>
                      </button>
                    ))}

                  {userRole === 'accountant' && (
                    <button
                      className="quick-action"
                      onClick={() => openPage('Fees & Accounts')}
                    >
                      <span className="quick-action-icon orange">৳</span>
                      <span>
                        <strong>Fees & Accounts</strong>
                        <small>Manage accounts</small>
                      </span>
                      <b>→</b>
                    </button>
                  )}

                  {userRole === 'student' && (
                    <button
                      className="quick-action"
                      onClick={() => openPage('Fees & Accounts')}
                    >
                      <span className="quick-action-icon orange">৳</span>
                      <span>
                        <strong>Fees & Accounts</strong>
                        <small>View your fees and payments</small>
                      </span>
                      <b>→</b>
                    </button>
                  )}

                  {(userRole === 'parent' || userRole === 'student') && (
                    <>
                      <button
                        className="quick-action"
                        onClick={() => openPage('Attendance')}
                      >
                        <span className="quick-action-icon green">✓</span>
                        <span>
                          <strong>Attendance</strong>
                          <small>View attendance</small>
                        </span>
                        <b>→</b>
                      </button>

                      <button
                        className="quick-action"
                        onClick={() => openPage('Results')}
                      >
                        <span className="quick-action-icon purple">▥</span>
                        <span>
                          <strong>Results</strong>
                          <small>View results</small>
                        </span>
                        <b>→</b>
                      </button>
                    </>
                  )}

                </div>

              </div>

              {/* SYSTEM INFORMATION */}

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
                    <strong>{displayRole}</strong>
                  </div>

                  <div className="system-info-row">
                    <span>Platform</span>
                    <strong>EduManage</strong>
                  </div>

                </div>

              </div>

            </section>

            {/* BOTTOM DASHBOARD GRID */}

            <section className="dashboard-bottom-grid">

              {/* RECENT ACTIVITIES */}

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

              {/* AI INSIGHTS */}

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

            {/* FOOTER */}

            <footer className="dashboard-footer">
              <span>© 2026 EduManage School Management System</span>
              <span>Designed for smarter school management</span>
            </footer>

          </div>

        ) : activeMenu === 'Students' ? (

          <Students />

        ) : activeMenu === 'Teachers' ? (

          <Teachers />

        ) : activeMenu === 'Teacher Assignment' ? (

          <TeacherAssignment />

        ) : activeMenu === 'Staff Management' ? (

          <Staff />

        ) : activeMenu === 'Classes' ? (

          <Classes />

        ) : activeMenu === 'Sections' ? (

          <Sections />

        ) : activeMenu === 'Subjects' ? (

          <Subjects />

        ) : activeMenu === 'Attendance' ? (

          <StudentAttendance userRole={userRole} />

        ) : activeMenu === 'Fees & Accounts' ? (

          <Accounts user={user} />

        ) : activeMenu === 'User Management' ? (

          <Users />

        ) : activeMenu === 'Change Password' ? (

          <ChangePassword onLogout={handleLogout} />

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
