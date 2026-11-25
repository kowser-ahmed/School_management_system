
import { useEffect, useState } from 'react';
import API from '../api/axios';
import './Holidays.css';

function Holidays({ user }) {
    const role = user?.role?.toLowerCase() || '';
    const isAdmin = role === 'admin';

    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [refreshKey, setRefreshKey] = useState(0);

    const initialFormData = {
        holiday_name: '',
        start_date: '',
        end_date: '',
        description: ''
    };

    const [formData, setFormData] = useState(initialFormData);

    // ================= FETCH HOLIDAYS =================

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await API.get('/holidays');

                setHolidays(response.data.data || []);

            } catch (err) {
                console.error('Holiday loading error:', err);

                setError(
                    err.response?.data?.message ||
                    'Unable to load holidays.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchHolidays();
    }, [refreshKey]);

    // ================= SEARCH =================

    const filteredHolidays = holidays.filter((holiday) => {
        const searchText = search.toLowerCase();

        return (
            holiday.holiday_name?.toLowerCase().includes(searchText) ||
            holiday.description?.toLowerCase().includes(searchText)
        );
    });

    // ================= DATE FORMAT =================

const toDateInputValue = (date) => {
    if (!date) return '';

    if (date instanceof Date) {
        return date.toISOString().slice(0, 10);
    }

    return String(date).slice(0, 10);
};

const formatDate = (date) => {
    const dateString = toDateInputValue(date);

    if (!dateString) return '-';

    const [year, month, day] = dateString.split('-');

    return `${day}/${month}/${year}`;
};
    // ================= OPEN ADD FORM =================

    const openAddForm = () => {
        setEditingId(null);
        setFormData(initialFormData);
        setFormError('');
        setShowForm(true);
    };

    // ================= OPEN EDIT FORM =================

    const openEditForm = (holiday) => {
        setEditingId(holiday.holiday_id);

        setFormData({
            holiday_name: holiday.holiday_name || '',
            start_date: toDateInputValue(holiday.start_date),
            end_date: toDateInputValue(holiday.end_date),
            description: holiday.description || ''
        });

        setFormError('');
        setShowForm(true);
    };

    // ================= FORM CHANGE =================

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // ================= SUBMIT FORM =================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFormError('');

        if (!formData.holiday_name.trim()) {
            setFormError('Holiday name is required.');
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            setFormError('Both start date and end date are required.');
            return;
        }

        if (formData.end_date < formData.start_date) {
            setFormError('End date cannot be earlier than start date.');
            return;
        }

        if (formData.holiday_name.trim().length > 100) {
            setFormError('Holiday name cannot exceed 100 characters.');
            return;
        }

        if (formData.description.trim().length > 255) {
            setFormError('Description cannot exceed 255 characters.');
            return;
        }

        const payload = {
            holiday_name: formData.holiday_name.trim(),
            start_date: formData.start_date,
            end_date: formData.end_date,
            description: formData.description.trim()
        };

        try {
            setSaving(true);

            if (editingId) {
                await API.put(`/holidays/${editingId}`, payload);
            } else {
                await API.post('/holidays', payload);
            }

            setShowForm(false);
            setFormData(initialFormData);
            setEditingId(null);
            setRefreshKey((prev) => prev + 1);

        } catch (err) {
            console.error('Holiday save error:', err);

            const serverErrors = err.response?.data?.errors;

            setFormError(
                Array.isArray(serverErrors)
                    ? serverErrors.join(' ')
                    : err.response?.data?.message ||
                      'Unable to save holiday.'
            );
        } finally {
            setSaving(false);
        }
    };

    // ================= DELETE HOLIDAY =================

    const handleDelete = async (holiday) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${holiday.holiday_name}"?`
        );

        if (!confirmed) return;

        try {
            await API.delete(`/holidays/${holiday.holiday_id}`);

            setRefreshKey((prev) => prev + 1);

        } catch (err) {
            console.error('Holiday delete error:', err);

            setError(
                err.response?.data?.message ||
                'Unable to delete holiday.'
            );
        }
    };

    // ================= CLOSE FORM =================

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        setFormError('');
    };

    // ================= PAGE =================

    if (!user) {
        return (
            <div className="holiday-message">
                Please log in to view holidays.
            </div>
        );
    }

    return (
        <div className="holiday-page">

            {/* PAGE HEADING */}
            <div className="holiday-heading">
                <div>
                    <h2>Holiday Management</h2>
                    <p>View and manage school holidays.</p>
                </div>

                {isAdmin && (
                    <button
                        className="holiday-add-button"
                        onClick={openAddForm}
                    >
                        + Add New Holiday
                    </button>
                )}
            </div>

            {/* HOLIDAY LIST */}
            <div className="holiday-list-card">

                <div className="holiday-table-header">
                    <div>
                        <h3>School Holidays</h3>
                        <p>
                            Total holidays: {holidays.length}
                        </p>
                    </div>

                    <input
                        type="text"
                        className="holiday-search"
                        placeholder="Search holidays..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="holiday-error">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="holiday-message">
                        Loading holidays...
                    </div>
                ) : (
                    <div className="holiday-table-container">
                        <table className="holiday-table">
                            <thead>
                                <tr>
                                    <th>Holiday Name</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Description</th>

                                    {isAdmin && <th>Actions</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredHolidays.length > 0 ? (
                                    filteredHolidays.map((holiday) => (
                                        <tr key={holiday.holiday_id}>
                                            <td className="holiday-name-cell">
                                                {holiday.holiday_name}
                                            </td>

                                            <td>
                                                {formatDate(holiday.start_date)}
                                            </td>

                                            <td>
                                                {formatDate(holiday.end_date)}
                                            </td>

                                            <td className="holiday-description-cell">
                                                {holiday.description || '-'}
                                            </td>

                                            {isAdmin && (
                                                <td>
                                                    <div className="holiday-row-actions">
                                                        <button
                                                            className="holiday-edit-button"
                                                            onClick={() => openEditForm(holiday)}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="holiday-delete-button"
                                                            onClick={() => handleDelete(holiday)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={isAdmin ? 5 : 4}
                                            className="holiday-empty"
                                        >
                                            {search
                                                ? 'No matching holidays found.'
                                                : 'No holidays available.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}
            {showForm && isAdmin && (
                <div className="holiday-modal-backdrop">
                    <div className="holiday-modal">

                        <div className="holiday-modal-header">
                            <h3>
                                {editingId
                                    ? 'Edit Holiday'
                                    : 'Add New Holiday'}
                            </h3>

                            <button
                                className="holiday-modal-close"
                                onClick={closeForm}
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="holiday-form-group">
                                <label>Holiday Name *</label>

                                <input
                                    type="text"
                                    name="holiday_name"
                                    placeholder="Enter holiday name"
                                    value={formData.holiday_name}
                                    onChange={handleFormChange}
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="holiday-form-group">
                                <label>Start Date *</label>

                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="holiday-form-group">
                                <label>End Date *</label>

                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleFormChange}
                                    min={formData.start_date || undefined}
                                    required
                                />
                            </div>

                            <div className="holiday-form-group">
                                <label>Description</label>

                                <textarea
                                    name="description"
                                    placeholder="Enter holiday description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    maxLength={255}
                                    rows={4}
                                />
                            </div>

                            {formError && (
                                <div className="holiday-form-error">
                                    {formError}
                                </div>
                            )}

                            <div className="holiday-form-actions">
                                <button
                                    type="button"
                                    className="holiday-cancel-button"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="holiday-save-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editingId
                                            ? 'Update Holiday'
                                            : 'Save Holiday'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Holidays;
