// File: api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/events';

// --- Event API Functions ---

// Fetch events within a date range
export const getEvents = async (startDate, endDate) => {
  try {
    const response = await axios.get(API_BASE_URL, {
      params: {
        start_date: startDate, 
        end_date: endDate      
      }
    });
    return response.data.data; 
  } catch (error) {
    console.error("Error fetching events:", error.response?.data?.error || error.message);
    return [];
  }
};

// Create a new event
export const createEvent = async (eventData) => {
  try {
    const response = await axios.post(API_BASE_URL, eventData);
    return response.data.data; 
  } catch (error) {
    console.error("Error creating event:", error.response?.data?.error || error.message);
    throw new Error('Failed to create event: ' + (error.response?.data?.error || error.message));
  }
};

// Update an existing event
export const updateEvent = async (id, eventData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, eventData);
    return response.data.data; 
  } catch (error) {
    console.error("Error updating event:", error.response?.data?.error || error.message);
    throw new Error('Failed to update event: ' + (error.response?.data?.error || error.message));
  }
};

// Delete an event
export const deleteEvent = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting event:", error.response?.data?.error || error.message);
    throw new Error('Failed to delete event: ' + (error.response?.data?.error || error.message));
  }
};
