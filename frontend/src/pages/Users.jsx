
import { useEffect, useMemo, useState } from 'react'
import API from '../api/axios'
import './Users.css'

const initialForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'teacher',
  teacher_id: '',
  student_id: '',
  staff_id: '',
  phone: '',
  status: 'active'
}

const roles = ['teacher', 'student', 'parent', 'accountant', 'staff']

function Users() {
  const [users, setUsers] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [staffs, setStaffs] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(initialForm)

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await API.get('/users')
      setUsers(response.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch teacher profiles
  const fetchTeachers = async () => {
    try {
      const response = await API.get('/teachers')
      const data = response.data.data || []

      setTeachers(
        data.filter(
          teacher =>
            teacher.status === 'active' || teacher.status == null
        )
      )
    } catch (err) {
      console.error('Failed to load teachers:', err)
    }
  }

  // Fetch student profiles
  const fetchStudents = async () => {
    try {
      const response = await API.get('/students')
      const data = response.data.data || []

      setStudents(
        data.filter(
          student =>
            student.status === 'active' || student.status == null
        )
      )
    } catch (err) {
      console.error('Failed to load students:', err)
    }
  }

  // Fetch staff profiles
  const fetchStaffs = async () => {
    try {
      const response = await API.get('/staff')
      const data = response.data.data || []

      setStaffs(
        data.filter(
          staff =>
            staff.status === 'active' || staff.status == null
        )
      )
    } catch (err) {
      console.error('Failed to load staff profiles:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchTeachers()
    fetchStudents()
    fetchStaffs()
  }, [])

  // Search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchText = search.toLowerCase()

      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchText) ||
        user.email?.toLowerCase().includes(searchText) ||
        user.phone?.toLowerCase().includes(searchText)

      const matchesRole =
        roleFilter === 'all' || user.role === roleFilter

      const matchesStatus =
        statusFilter === 'all' || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const activeCount = users.filter(
    user => user.status === 'active'
  ).length

  const inactiveCount = users.filter(
    user => user.status === 'inactive'
  ).length

  // Open Add User modal
  const openAddModal = () => {
    setEditingUser(null)
    setForm(initialForm)
    setError('')
    setShowModal(true)
  }

  // Open Edit User modal
  const openEditModal = user => {
    setEditingUser(user)

    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'teacher',
      teacher_id: user.teacher_id
        ? String(user.teacher_id)
        : '',
      student_id: user.student_id
        ? String(user.student_id)
        : '',
      staff_id: user.staff_id
        ? String(user.staff_id)
        : '',
      phone: user.phone || '',
      status: user.status || 'active'
    })

    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setForm(initialForm)
    setError('')
  }

  const handleChange = e => {
    const { name, value } = e.target

    setForm(previous => {
      const updated = {
        ...previous,
        [name]: value
      }

      // Clear old profile selection when role changes
      if (name === 'role') {
        updated.teacher_id = ''
        updated.student_id = ''
        updated.staff_id = ''
      }

      return updated
    })
  }

  // Create or update user
  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (!editingUser && form.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (form.role === 'teacher' && !form.teacher_id) {
      setError('Please select a Teacher Profile.')
      return
    }

    if (form.role === 'student' && !form.student_id) {
      setError('Please select a Student Profile.')
      return
    }

    if (form.role === 'staff' && !form.staff_id) {
      setError('Please select a Staff Profile.')
      return
    }

    try {
      setSaving(true)

      const userData = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,

        teacher_id:
          form.role === 'teacher'
            ? Number(form.teacher_id)
            : null,

        student_id:
          form.role === 'student'
            ? Number(form.student_id)
            : null,

        staff_id:
          form.role === 'staff'
            ? Number(form.staff_id)
            : null,

        phone: form.phone.trim()
      }

      if (editingUser) {
        await API.put(`/users/${editingUser.user_id}`, {
          ...userData,
          status: form.status
        })
      } else {
        await API.post('/users', {
          ...userData,
          password: form.password
        })
      }

      closeModal()

      await fetchUsers()
      await fetchTeachers()
      await fetchStudents()
      await fetchStaffs()

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Delete user
  const handleDelete = async user => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.full_name}?`
    )

    if (!confirmed) return

    try {
      await API.delete(`/users/${user.user_id}`)

      await fetchUsers()
      await fetchTeachers()
      await fetchStudents()
      await fetchStaffs()

    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.')
    }
  }

  return (
    <div className="users-page">

      <div className="users-heading">
        <div>
          <h1>User Management</h1>
          <p>Manage school accounts, roles and access status.</p>
        </div>

        <button className="users-add-btn" onClick={openAddModal}>
          + Add New User
        </button>
      </div>

      {/* Statistics */}
      <div className="users-stats">

        <div className="users-stat-card">
          <span className="users-stat-icon total">♙</span>
          <div>
            <p>Total Users</p>
            <h2>{users.length}</h2>
          </div>
        </div>

        <div className="users-stat-card">
          <span className="users-stat-icon active">✓</span>
          <div>
            <p>Active Users</p>
            <h2>{activeCount}</h2>
          </div>
        </div>

        <div className="users-stat-card">
          <span className="users-stat-icon inactive">⊘</span>
          <div>
            <p>Inactive Users</p>
            <h2>{inactiveCount}</h2>
          </div>
        </div>

      </div>

      {/* Users Table */}
      <div className="users-table-card">

        <div className="users-table-heading">
          <div>
            <h2>All Users</h2>
            <p>{filteredUsers.length} user(s) found</p>
          </div>
        </div>

        <div className="users-filters">

          <input
            type="search"
            placeholder="Search name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>

            {roles.map(role => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}

            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            className="users-refresh-btn"
            onClick={() => {
              fetchUsers()
              fetchTeachers()
              fetchStudents()
              fetchStaffs()
            }}
            title="Refresh users"
          >
            ↻ Refresh
          </button>

        </div>

        {error && !showModal && (
          <div className="users-error">{error}</div>
        )}

        {loading ? (
          <div className="users-empty">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-empty">
            <span>♙</span>
            <h3>No users found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.user_id}>
                    <td>
                      <div className="users-name-cell">
                        <div className="users-avatar">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{user.full_name}</strong>
                          <small>ID: {user.user_id}</small>
                        </div>
                      </div>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <span className={`users-role ${user.role}`}>
                        {user.role}
                      </span>
                    </td>

                    <td>{user.phone || '—'}</td>

                    <td>
                      <span className={`users-status ${user.status}`}>
                        <span></span>
                        {user.status}
                      </span>
                    </td>

                    <td>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      <div className="users-actions">
                        <button
                          className="users-edit-btn"
                          onClick={() => openEditModal(user)}
                        >
                          Edit
                        </button>

                        <button
                          className="users-delete-btn"
                          onClick={() => handleDelete(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="users-modal-overlay">
          <div className="users-modal">

            <div className="users-modal-heading">
              <div>
                <h2>
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h2>

                <p>
                  {editingUser
                    ? 'Update account information.'
                    : 'Add a new account to your school system.'}
                </p>
              </div>

              <button
                type="button"
                className="users-modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="users-form-grid">

                <div className="users-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="users-form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                {!editingUser && (
                  <div className="users-form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                    />
                  </div>
                )}

                <div className="users-form-group">
                  <label>Role *</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    required
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teacher Profile */}
                {form.role === 'teacher' && (
                  <div className="users-form-group">
                    <label>Teacher Profile *</label>

                    <select
                      name="teacher_id"
                      value={form.teacher_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Teacher Profile</option>

                      {teachers.map(teacher => {
                        const linkedToAnotherUser =
                          teacher.user_id &&
                          Number(teacher.user_id) !==
                            Number(editingUser?.user_id)

                        return (
                          <option
                            key={teacher.teacher_id}
                            value={teacher.teacher_id}
                            disabled={Boolean(linkedToAnotherUser)}
                          >
                            {teacher.full_name} ({teacher.employee_code})
                            {linkedToAnotherUser ? ' - Already Linked' : ''}
                          </option>
                        )
                      })}
                    </select>

                    {teachers.length === 0 && (
                      <small>No active Teacher Profile found.</small>
                    )}
                  </div>
                )}

                {/* Student Profile */}
                {form.role === 'student' && (
                  <div className="users-form-group">
                    <label>Student Profile *</label>

                    <select
                      name="student_id"
                      value={form.student_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Student Profile</option>

                      {students.map(student => {
                        const linkedToAnotherUser =
                          student.user_id &&
                          Number(student.user_id) !==
                            Number(editingUser?.user_id)

                        return (
                          <option
                            key={student.student_id}
                            value={student.student_id}
                            disabled={Boolean(linkedToAnotherUser)}
                          >
                            {student.full_name} ({student.student_code})
                            {linkedToAnotherUser ? ' - Already Linked' : ''}
                          </option>
                        )
                      })}
                    </select>

                    {students.length === 0 && (
                      <small>
                        No active Student Profile found. Create a student profile first.
                      </small>
                    )}
                  </div>
                )}

                {/* Staff Profile */}
                {form.role === 'staff' && (
                  <div className="users-form-group">
                    <label>Staff Profile *</label>

                    <select
                      name="staff_id"
                      value={form.staff_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Staff Profile</option>

                      {staffs.map(staff => {
                        const linkedToAnotherUser =
                          staff.user_id &&
                          Number(staff.user_id) !==
                            Number(editingUser?.user_id)

                        return (
                          <option
                            key={staff.staff_id}
                            value={staff.staff_id}
                            disabled={Boolean(linkedToAnotherUser)}
                          >
                            {staff.full_name} ({staff.employee_code})
                            {linkedToAnotherUser ? ' - Already Linked' : ''}
                          </option>
                        )
                      })}
                    </select>

                    {staffs.length === 0 && (
                      <small>
                        No active Staff Profile found. Create a staff profile first.
                      </small>
                    )}
                  </div>
                )}

                <div className="users-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>

                {editingUser && (
                  <div className="users-form-group">
                    <label>Account Status *</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}

              </div>

              {error && (
                <div className="users-error">{error}</div>
              )}

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="users-save-btn"
                  disabled={
                    saving ||
                    (form.role === 'teacher' && !form.teacher_id) ||
                    (form.role === 'student' && !form.student_id) ||
                    (form.role === 'staff' && !form.staff_id)
                  }
                >
                  {saving
                    ? 'Saving...'
                    : editingUser
                      ? 'Update User'
                      : 'Create User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Users
