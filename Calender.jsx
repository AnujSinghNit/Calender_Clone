// File: Calender.jsx (Modified for enhanced visual appeal and colors)
import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { getEvents, createEvent, updateEvent, deleteEvent } from './api';
import EventModal from './EventModel';

dayjs.extend(isBetween);

// Utility function to get all days in the current month view (6 weeks)
const generateMonthMatrix = (date) => {
  const startDay = date.startOf('month').startOf('week'); 
  const matrix = [];
  let currentDay = startDay;
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
  const [modalData, setModalData] = useState({}); 
  const [viewMode] = useState('month'); 

  const monthMatrix = generateMonthMatrix(currentDate);

  // Helper function to sort events
  const sortEvents = (eventList) => {
    return eventList.sort((a, b) => {
        if (a.date !== b.date) return dayjs(a.date).valueOf() - dayjs(b.date).valueOf();
        return a.startTime.localeCompare(b.startTime);
    });
  };

  // --- Data Fetching Logic ---
  const fetchEvents = useCallback(async () => {
    const startDate = monthMatrix[0].format('YYYY-MM-DD');
    const endDate = monthMatrix[monthMatrix.length - 1].format('YYYY-MM-DD');
    
    const fetchedEvents = await getEvents(startDate, endDate);
    setEvents(sortEvents(fetchedEvents));
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  // --- Event Handlers ---
  const handleCellClick = (day) => {
    setModalData({ date: day.format('YYYY-MM-DD') });
    setIsModalOpen(true);
  };

  const handleEventClick = (event) => {
    setModalData(event); 
    setIsModalOpen(true);
  };

  const handleSave = async (data) => {
    try {
      let savedEvent;
      if (data.id) {
        savedEvent = await updateEvent(data.id, data);
        setEvents(prev => sortEvents(
          prev.map(e => (String(e.id) === String(savedEvent.id) ? savedEvent : e))
        ));
      } else {
        savedEvent = await createEvent(data);
        setEvents(prev => sortEvents([...prev, savedEvent]));
      }
      
      setIsModalOpen(false);
      setModalData({});
    } catch (e) {
      console.error("Event save failed:", e.message);
      throw e; 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
        try {
            await deleteEvent(id);
            setEvents(prev => prev.filter(e => String(e.id) !== String(id)));
            setIsModalOpen(false);
            setModalData({});
        } catch (e) {
            console.error("Delete failed:", e.message);
            alert(e.message); 
        }
    }
  };

  // --- Navigation ---
  const goToPreviousMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const goToNextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const goToToday = () => setCurrentDate(dayjs());
  
  // --- Rendering Helpers ---
  const getEventsForDay = (day) => {
    const dayStr = day.format('YYYY-MM-DD');
    return events.filter(event => event.date === dayStr);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    // Added background to the outer container
    <div className="p-4 md:p-8 min-h-screen bg-gray-50"> 
      
      {/* Header and Controls - Stronger visual contrast and shadow */}
      <header className="flex justify-between items-center mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-light text-gray-900">
            {currentDate.format('MMMM YYYY')}
          </h1>
          <button 
            onClick={goToToday}
            className="px-4 py-2 border border-blue-400 rounded-full text-sm font-medium text-blue-600 hover:bg-blue-50 transition shadow-sm"
          >
            Today
          </button>
        </div>
        <div className="flex space-x-1">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            aria-label="Previous Month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <button 
            onClick={goToNextMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            aria-label="Next Month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </header>

      {/* Weekday Headers - Sticky for professional feel */}
      <div className="sticky top-0 z-10 grid grid-cols-7 text-center font-bold text-sm text-gray-700 bg-white border-x border-t border-gray-200 shadow-md">
        {weekDays.map(day => (
          <div key={day} className="py-3 border-b border-r border-gray-200 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid bg-white shadow-xl">
        {monthMatrix.map((day, index) => {
          const isCurrentMonth = day.month() === currentDate.month();
          const isToday = day.isSame(dayjs(), 'day');
          const dayEvents = getEventsForDay(day);

          return (
            <div
              key={day.format('YYYY-MM-DD')}
              className={`calendar-cell relative cursor-pointer ${
                isCurrentMonth 
                  ? 'bg-white text-gray-900 hover:bg-blue-50' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100' // Lighter background for non-current month
              }`}
              onClick={() => handleCellClick(day)}
            >
              {/* Day Number (Positioned in top-right corner) */}
              <div 
                className={`absolute top-1 right-1 h-7 w-7 flex items-center justify-center rounded-full text-sm font-bold transition ${
                isToday 
                  ? 'bg-red-600 text-white shadow-md' // Vibrant red for today
                  : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date()}
              </div>

              {/* Events List (Blue/Green accent color) */}
              <div className="mt-8 space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div 
                    key={event.id}
                    className="text-xs bg-blue-100 text-blue-800 rounded px-1 truncate hover:bg-blue-200 transition font-medium cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleEventClick(event);
                    }}
                    title={`${event.title} (${event.startTime} - ${event.endTime})`}
                  >
                    <span className="font-bold mr-1">{event.startTime.slice(0, 5)}</span>{event.title}
                  </div>
                ))}
                
                {/* 'More' indicator */}
                {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-600 px-1 mt-1 font-medium">
                        +{dayEvents.length - 3} more
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
        onClose={() => {setIsModalOpen(false); setModalData({});}}
        initialData={modalData}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Calendar;
