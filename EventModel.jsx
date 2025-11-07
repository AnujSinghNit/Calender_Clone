// frontend/src/EventModal.jsx
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

const EventModal = ({ isOpen, onClose, initialData, onSave, onDelete }) => {
  const isEditMode = !!initialData.id;

  const [formData, setFormData] = useState({
    id: initialData.id || null,
    title: initialData.title || '',
    date: initialData.date || dayjs().format('YYYY-MM-DD'),
    startTime: initialData.startTime || '09:00',
    endTime: initialData.endTime || '10:00',
    description: initialData.description || '',
  });

  const [error, setError] = useState('');

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (isOpen) {
        setFormData({
            id: initialData.id || null,
            title: initialData.title || '',
            date: initialData.date || dayjs().format('YYYY-MM-DD'),
            startTime: initialData.startTime || '09:00',
            endTime: initialData.endTime || '10:00',
            description: initialData.description || '',
        });
        setError('');
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      setError('Title, Date, Start Time, and End Time are required.');
      return;
    }
    if (formData.startTime >= formData.endTime) {
        setError('End time must be after start time.');
        return;
    }
    setError('');
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 transform transition-transform duration-300 scale-100">
        <h2 className="text-xl font-medium text-gray-700 mb-4 flex justify-between items-center">
          {isEditMode ? 'Edit Event' : 'Create Event'}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </h2>

        {error && <p className="text-red-500 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              name="title"
              placeholder="Add title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border-b-2 text-lg focus:border-blue-500 outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 items-center">
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="p-2 border rounded" required />
            <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="p-2 border rounded" required />
            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="p-2 border rounded" required />
          </div>

          <div className="mb-6">
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border rounded focus:border-blue-500 outline-none transition"
            ></textarea>
          </div>

          <div className="flex justify-between items-center">
            {isEditMode && (
              <button
                type="button"
                onClick={() => onDelete(formData.id)}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded transition"
              >
                Delete
              </button>
            )}
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  {isEditMode ? 'Save' : 'Create'}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;