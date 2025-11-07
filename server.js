// Backend API for Google Calendar Clone
// File: backend/server.js

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
// This creates the 'calendar.db' file in the backend directory
const db = new sqlite3.Database('./calendar.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  // Use a single, clean template literal (backticks) for the SQL command
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Events table ready');
    }
  });
}

// API Routes

// GET all events (with optional date range filtering)
app.get('/api/events', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = 'SELECT * FROM events';
  let params = [];
  
  // Logic to filter events visible in the current calendar view (month, week, day)
  if (start_date && end_date) {
    query += ' WHERE date BETWEEN ? AND ?';
    params = [start_date, end_date];
  }
  
  query += ' ORDER BY date, start_time';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        success: true,
        data: rows.map(row => ({
          id: row.id,
          title: row.title,
          date: row.date,
          startTime: row.start_time,
          endTime: row.end_time,
          description: row.description,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))
      });
    }
  });
});

// GET single event
app.get('/api/events/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.json({
        success: true,
        data: {
          id: row.id,
          title: row.title,
          date: row.date,
          startTime: row.start_time,
          endTime: row.end_time,
          description: row.description,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      });
    }
  });
});

// POST create new event
app.post('/api/events', (req, res) => {
  const { title, date, startTime, endTime, description } = req.body;
  
  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ 
      error: 'Missing required fields: title, date, startTime, endTime' 
    });
  }
  
  const query = `
    INSERT INTO events (title, date, start_time, end_time, description)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [title, date, startTime, endTime, description || ''], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({
        success: true,
        data: {
          id: this.lastID,
          title,
          date,
          startTime,
          endTime,
          description
        }
      });
    }
  });
});

// PUT update event
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { title, date, startTime, endTime, description } = req.body;
  
  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ 
      error: 'Missing required fields: title, date, startTime, endTime' 
    });
  }
  
  const query = `
    UPDATE events 
    SET title = ?, date = ?, start_time = ?, end_time = ?, 
        description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [title, date, startTime, endTime, description || '', id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.json({
        success: true,
        data: {
          id: parseInt(id),
          title,
          date,
          startTime,
          endTime,
          description
        }
      });
    }
  });
});

// DELETE event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});