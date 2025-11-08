// File: server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./calendar.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
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
      console.log('✅ Events table is ready.');
    }
  });
}

// --- API Endpoints ---

// GET events within a date range
app.get('/api/events', (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Missing start_date or end_date query parameters.' });
  }
  
  db.all(
    'SELECT id, title, date, start_time AS startTime, end_time AS endTime, description FROM events WHERE date BETWEEN ? AND ? ORDER BY date, start_time',
    [start_date, end_date],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        const data = rows.map(row => ({
            ...row,
            id: String(row.id), // Ensure ID is a string
        }));
        res.json({ success: true, data });
      }
    }
  );
});

// POST (CREATE) a new event
app.post('/api/events', (req, res) => {
  const { title, date, startTime, endTime, description } = req.body;

  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields: title, date, startTime, or endTime' });
  }

  db.run(
    'INSERT INTO events (title, date, start_time, end_time, description) VALUES (?, ?, ?, ?, ?)',
    [title, date, startTime, endTime, description || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({
          success: true,
          data: {
            id: String(this.lastID),
            title,
            date,
            startTime,
            endTime,
            description: description || '',
          }
        });
      }
    }
  );
});

// PUT (UPDATE) an existing event
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { title, date, startTime, endTime, description } = req.body;

  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields: title, date, startTime, or endTime' });
  }

  db.run(
    'UPDATE events SET title = ?, date = ?, start_time = ?, end_time = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, date, startTime, endTime, description || '', id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Event not found' });
      } else {
        res.json({
          success: true,
          data: {
            id: String(id),
            title,
            date,
            startTime,
            endTime,
            description: description || '',
          }
        });
      }
    }
  );
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
      res.json({ success: true, message: `Event with id ${id} deleted` });
    }
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
