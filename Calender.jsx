// frontend/src/Calendar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { getEvents, createEvent, updateEvent, deleteEvent } from './api';
import EventModal from './EventModel';

dayjs.extend(isBetween);

// Utility function to get all days in the current month view (6 weeks)
const generateMonthMatrix = (date) => {
  const startOfMonth = date.startOf('month');
  const endOfMonth = date.endOf('month');
  const startDay = startOfMonth.startOf('week'); // Start of the week containing the first day
  
  const matrix = [];
  let currentDay = startDay;

  // Render 6 rows (weeks)
  for (let i = 0; i < 42; i++) {
    matrix.push(currentDay);
    currentDay = currentDay.add(1, 'day');
  }

  return matrix;
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({}); // Used for pre-filling create/edit form
  const [viewMode, setViewMode] = useState('month'); // Currently only 'month' is fully implemented

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    const startRange = currentDate.startOf('month').startOf('week').format('YYYY-MM-DD');
    const endRange = currentDate.endOf('month').endOf('week').format('YYYY-MM-DD');
    const fetchedEvents = await getEvents(startRange, endRange);
    setEvents(fetchedEvents);
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- Handlers for Navigation and Modal ---

  const handlePrev = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const handleNext = () => setCurrentDate(currentDate.add(1, 'month'));
  const handleToday = () => setCurrentDate(dayjs());
  
  const handleCellClick = (day) => {
    setModalData({ date: day.format('YYYY-MM-DD') });
    setIsModalOpen(true);
  };

  const handleEventClick = (event) => {
    // Format dates/times for the modal
    setModalData({
        id: event.id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description,
    });
    setIsModalOpen(true);
  };
  
  const handleSave = async (data) => {
    try {
      if (data.id) {
        // Update event
        await updateEvent(data.id, data);
      } else {
        // Create event
        await createEvent(data);
      }
      setIsModalOpen(false);
      setModalData({});
      fetchEvents(); // Refresh data
    } catch (e) {
      console.error(e.message);
      // In a real app, you'd show a user-friendly error toast
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
        try {
            await deleteEvent(id);
            setIsModalOpen(false);
            setModalData({});
            fetchEvents(); // Refresh data
        } catch (e) {
            console.error(e.message);
        }
    }
  };

  // --- Month View Renderer ---
  const daysInMonthView = generateMonthMatrix(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 md:p-8">
      {/* Header and Controls */}
      <div className="flex justify-between items-center mb-6 p-2 rounded-lg bg-white shadow-md">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-700">Calendar</h1>
          
          <button onClick={handleToday} className="px-4 py-2 border rounded-full text-sm font-medium hover:bg-gray-100 transition">
            Today
          </button>
          
          <div className="flex space-x-1">
            <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-100 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-100 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>

          <h2 className="text-xl font-medium text-gray-700">
            {currentDate.format('MMMM YYYY')}
          </h2>
        </div>

        <div className="flex space-x-2">
            <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="p-2 border rounded text-sm cursor-pointer"
            >
                <option value="month">Month</option>
                <option value="week">Week (Demo)</option>
                <option value="day">Day (Demo)</option>
            </select>
            <button
                onClick={() => handleCellClick(dayjs())}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition shadow-md"
            >
                + Create
            </button>
        </div>
      </div>
      
      {/* Calendar Grid (Month View) */}
      <div className="calendar-grid bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Day Headers */}
        {dayNames.map(name => (
          <div key={name} className="text-center py-2 text-sm font-medium text-gray-500 border-b-2 border-r border-gray-200">
            {name}
          </div>
        ))}
        
        {/* Date Cells */}
        {daysInMonthView.map((day, index) => {
          const isCurrentMonth = day.month() === currentDate.month();
          const isToday = day.isSame(dayjs(), 'day');
          const dayString = day.format('YYYY-MM-DD');
          
          // Get events for this specific day
          const dayEvents = events
            .filter(e => e.date === dayString)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={index}
              className={`calendar-cell cursor-pointer ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
              onClick={() => handleCellClick(day)}
            >
              <div className={`absolute top-1 right-1 h-7 w-7 flex items-center justify-center rounded-full text-sm font-medium transition ${
                isToday ? 'bg-blue-500 text-white' : 'text-gray-700'
              }`}>
                {day.date()}
              </div>

              <div className="mt-8 space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div 
                    key={event.id}
                    className="text-xs bg-blue-100 text-blue-800 rounded px-1 truncate hover:bg-blue-200 transition"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent cell click
                      handleEventClick(event);
                    }}
                    title={`${event.title} (${event.startTime} - ${event.endTime})`}
                  >
                    {event.startTime.slice(0, 5)} {event.title}
                  </div>
                ))}
                
                {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-600 px-1 mt-1">
                        +{dayEvents.length - 2} more
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={modalData}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Calendar;