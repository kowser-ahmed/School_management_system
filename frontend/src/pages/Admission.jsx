import React, { useState, useEffect } from 'react'
import './Admission.css'
import API from '../api/axios'

const initialFormData = {
  applicant_name: '',
  date_of_birth: '',
  gender: '',
  guardian_name: '',
  guardian_phone: '',
  email: '',
  address: '',
  applying_class: '',
}

const Admission = () => {
  const [formData, setFormData] = useState(initialFormData)
  const [admissions, setAdmissions] = useState([])

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')

  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchAdmissions = async () => {
    try {
      setListLoading(true)
      setListError('')

      const response = await API.get('/admissions')

      if (response.data.success) {
        setAdmissions(response.data.data || [])
      } else {
        setListError('Failed to load admission applications.')
      }
    } catch (err) {
      console.error(
        'Fetch Admissions Error:',
        err.response?.data || err.message
      )

      setListError(
        err.response?.data?.message ||
          'Failed to load admission applications.'
      )
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmissions()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Bangladesh mobile number validation
  const isValidBangladeshPhone = (phone) => {
    const phoneRegex = /^01[3-9]\d{8}$/
    return phoneRegex.test(phone)
  }

  // Gmail format validation
  const isValidGmail = (email) => {
    const gmailRegex =
      /^[a-zA-Z0-9](?:[a-zA-Z0-9._+-]*[a-zA-Z0-9])?@gmail\.com$/

    if (!gmailRegex.test(email)) {
      return false
    }

    // Prevent consecutive dots
    if (email.includes('..')) {
      return false
    }

    // Gmail username must not contain invalid characters
    const username = email.split('@')[0]

    if (!username) {
      return false
    }

    if (username.length > 30) {
      return false
    }

    if (username.startsWith('.') || username.endsWith('.')) {
      return false
    }

    return true
  }

  const validateForm = () => {
    if (!formData.applicant_name.trim()) {
      return 'Applicant name is required.'
    }

    // Date of birth has NO format/age validation.
    // It is only checked for required value.
    if (!formData.date_of_birth) {
      return 'Date of birth is required.'
    }

    if (!formData.gender) {
      return 'Gender is required.'
    }

    if (!formData.guardian_name.trim()) {
      return 'Guardian name is required.'
    }

    const phone = formData.guardian_phone.trim()

    if (!phone) {
      return 'Guardian phone number is required.'
    }

    if (!isValidBangladeshPhone(phone)) {
      return 'Please enter a valid Bangladesh mobile number.'
    }

    const email = formData.email.trim()

    if (!email) {
      return 'Gmail address is required.'
    }

    if (!isValidGmail(email)) {
      return 'Please enter a valid Gmail address.'
    }

    if (!formData.address.trim()) {
      return 'Address is required.'
    }

    if (!formData.applying_class.trim()) {
      return 'Applying class is required.'
    }

    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        applicant_name: formData.applicant_name.trim(),
        guardian_name: formData.guardian_name.trim(),
        guardian_phone: formData.guardian_phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        applying_class: formData.applying_class.trim(),
      }

      const response = await API.post('/admissions', submitData)

      if (response.data.success) {
        setMessage(
          response.data.message ||
            'Admission application submitted successfully!'
        )

        setFormData({ ...initialFormData })

        await fetchAdmissions()
      }
    } catch (err) {
      console.error(
        'Admission Submit Error:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
          'Failed to submit admission application.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    const confirmed = window.confirm(
      `Are you sure you want to change this application status to ${status}?`
    )

    if (!confirmed) return

    try {
      setUpdatingId(id)
      setMessage('')
      setError('')

      const response = await API.patch(
        `/admissions/${id}/status`,
        { status }
      )

      if (response.data.success) {
        setMessage(
          `Admission status updated to ${status} successfully.`
        )

        await fetchAdmissions()
      }
    } catch (err) {
      console.error(
        'Status Update Error:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
          'Failed to update admission status.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleEnroll = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to enroll this applicant? This will add the applicant to the Students List.'
    )

    if (!confirmed) return

    try {
      setUpdatingId(id)
      setMessage('')
      setError('')

      const response = await API.post(
        `/admissions/${id}/enroll`
      )

      if (response.data.success) {
        setMessage(
          response.data.message ||
            'Applicant successfully enrolled and added to Students List!'
        )

        await fetchAdmissions()
      }
    } catch (err) {
      console.error(
        'Enroll Error:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message ||
          'Failed to enroll applicant.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'approved'
      case 'rejected':
        return 'rejected'
      case 'enrolled':
        return 'enrolled'
      default:
        return 'pending'
    }
  }

  return (
    <div className="admission-page">
      <div className="admission-container">

        <div className="admission-header">
          <h1>Online Admission</h1>
          <p>Submit and manage student admission applications.</p>
        </div>

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="admission-form"
          noValidate
        >
          <div className="form-group">
            <label>Applicant Name *</label>

            <input
              type="text"
              name="applicant_name"
              value={formData.applicant_name}
              onChange={handleChange}
              placeholder="Enter applicant name"
            />
          </div>

          <div className="form-group">
            <label>Date of Birth *</label>

            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Gender *</label>

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Guardian Name *</label>

            <input
              type="text"
              name="guardian_name"
              value={formData.guardian_name}
              onChange={handleChange}
              placeholder="Enter guardian name"
            />
          </div>

          <div className="form-group">
            <label>Guardian Phone *</label>

            <input
              type="tel"
              name="guardian_phone"
              value={formData.guardian_phone}
              onChange={handleChange}
              placeholder="Example: 01712345678"
              maxLength="11"
            />

            <small>
              Enter a valid Bangladesh mobile number.
            </small>
          </div>

          <div className="form-group">
            <label>Gmail Address *</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
            />

            <small>
              Only valid Gmail addresses are accepted.
            </small>
          </div>

          <div className="form-group">
            <label>Address *</label>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter address"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Applying Class *</label>

            <input
              type="text"
              name="applying_class"
              value={formData.applying_class}
              onChange={handleChange}
              placeholder="Example: Class 6"
            />
          </div>

          <button
            type="submit"
            className="admission-submit-btn"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

        <div className="admission-records">

          <div className="records-header">
            <div>
              <h2>Admission Applications</h2>
              <p>View and manage all submitted applications.</p>
            </div>

            <button
              type="button"
              className="refresh-btn"
              onClick={fetchAdmissions}
              disabled={listLoading}
            >
              {listLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {listError && (
            <div className="error-message">
              {listError}
            </div>
          )}

          {listLoading ? (
            <div className="records-info">
              Loading admission applications...
            </div>
          ) : listError ? null : admissions.length === 0 ? (
            <div className="empty-message">
              No admission applications found.
            </div>
          ) : (
            <div className="table-wrapper">

              <table className="admission-table">

                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Applicant Name</th>
                    <th>Date of Birth</th>
                    <th>Gender</th>
                    <th>Guardian Name</th>
                    <th>Guardian Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Applying Class</th>
                    <th>Application Date</th>
                    <th>Status</th>
                    <th>Admin Action</th>
                  </tr>
                </thead>

                <tbody>
                  {admissions.map((admission) => (
                    <tr key={admission.application_id}>

                      <td>{admission.application_id}</td>

                      <td>{admission.applicant_name}</td>

                      <td>
                        {admission.date_of_birth
                          ? String(admission.date_of_birth).split('T')[0]
                          : '-'}
                      </td>

                      <td>
                        {admission.gender || '-'}
                      </td>

                      <td>
                        {admission.guardian_name || '-'}
                      </td>

                      <td>
                        {admission.guardian_phone || '-'}
                      </td>

                      <td>
                        {admission.email || '-'}
                      </td>

                      <td>
                        {admission.address || '-'}
                      </td>

                      <td>
                        {admission.applying_class || '-'}
                      </td>

                      <td>
                        {admission.application_date
                          ? new Date(
                              admission.application_date
                            ).toLocaleDateString()
                          : '-'}
                      </td>

                      <td>
                        <span
                          className={`status ${getStatusClass(
                            admission.status
                          )}`}
                        >
                          {admission.status}
                        </span>
                      </td>

                      <td>
                        <div className="admission-actions">

                          <button
                            type="button"
                            className="approve-btn"
                            disabled={
                              updatingId ===
                                admission.application_id ||
                              admission.status === 'approved' ||
                              admission.status === 'enrolled'
                            }
                            onClick={() =>
                              handleStatusChange(
                                admission.application_id,
                                'approved'
                              )
                            }
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            className="reject-btn"
                            disabled={
                              updatingId ===
                                admission.application_id ||
                              admission.status === 'rejected' ||
                              admission.status === 'enrolled'
                            }
                            onClick={() =>
                              handleStatusChange(
                                admission.application_id,
                                'rejected'
                              )
                            }
                          >
                            Reject
                          </button>

                          <button
                            type="button"
                            className="enroll-btn"
                            disabled={
                              updatingId ===
                                admission.application_id ||
                              admission.status !== 'approved'
                            }
                            onClick={() =>
                              handleEnroll(
                                admission.application_id
                              )
                            }
                          >
                            {updatingId ===
                            admission.application_id
                              ? 'Processing...'
                              : 'Enroll'}
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

          <p className="records-count">
            Total Applications: {admissions.length}
          </p>

        </div>
      </div>
    </div>
  )
}

export default Admission