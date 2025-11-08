// File: EventModel.jsx
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

  // Update form data when initialData changes 
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
    setError('');
  };

  // Make handleSubmit async to await onSave (API call) and handle errors
  const handleSubmit = async (e) => { 
    e.preventDefault();

    // Basic Validation: Check for required fields
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      setError('Title, Date, Start Time, and End Time are required.');
      return;
    }

    // Basic Validation: Check time logic
    const startDateTime = dayjs(`${formData.date} ${formData.startTime}`);
    const endDateTime = dayjs(`${formData.date} ${formData.endTime}`);
    if (endDateTime.isBefore(startDateTime) || endDateTime.isSame(startDateTime)) {
        setError('End time must be after start time.');
        return;
    }
    
    setError(''); 

    // Use try/catch to display API errors in the modal
    try {
        await onSave(formData); 
    } catch (apiError) {
        setError(apiError.message || 'An unknown error occurred while saving.');
    }
  };

  const handleDeleteClick = () => {
    onDelete(formData.id);
  }

  if (!isOpen) return null;

  return (
    // Modal Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50" onClick={onClose}>
      {/* Modal Content */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 transform transition-all"
        onClick={e => e.stopPropagation()} 
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
          {isEditMode ? 'Edit Event' : 'Create Event'}
        </h2>
        
        {/* Error Message */}
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        {/* Event Form */}
        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="mb-4">
            <input
              type="text"
              name="title"
              placeholder="Add title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 text-lg font-medium border-b-2 border-gray-300 focus:border-blue-500 outline-none transition"
              required
            />
          </div>

          {/* Date and Time Inputs */}
          <div className="mb-4 flex space-x-4 items-center">
            <label className="text-gray-600 w-16">Date:</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="p-2 border rounded" required />
          </div>
          <div className="mb-6 flex space-x-4 items-center">
            <label className="text-gray-600 w-16">Time:</label>
            <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="p-2 border rounded" required />
            <span>—</span>
            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="p-2 border rounded" required />
          </div>

          {/* Description Textarea */}
          <div className="mb-6">
            <textarea
              name="description"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border rounded focus:border-blue-500 outline-none transition"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            {isEditMode && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded transition font-medium"
              >
                Delete
              </button>
            )}
            <div className="flex justify-end space-x-2 ml-auto">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-medium"
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
