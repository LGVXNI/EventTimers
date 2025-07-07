const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve your frontend files from 'public' folder (optional)
app.use(express.static(path.join(__dirname, 'public')));

// Root route - show a friendly message or serve index.html if exists
app.get('/', (req, res) => {
  res.send('Timer API is running. Use /api/timers endpoints.');
});

// --- Your existing API routes below ---

// Open or create the database
const db = new sqlite3.Database('./timers.db', (err) => {
  if (err) {
    console.error("Failed to connect to DB:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Create timers table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS timers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server INTEGER NOT NULL,
    event TEXT NOT NULL,
    start_time INTEGER,
    duration INTEGER,
    status TEXT
  )
`);

// Helper function for remaining time
function calculateRemaining(row) {
  if (!row) return 0;

  if (row.status === 'running') {
    const elapsed = Date.now() - row.start_time;
    const remaining = row.duration - elapsed;
    return remaining > 0 ? remaining : 0;
  } else if (row.status === 'paused') {
    return row.duration;
  }
  return 0;
}

// Get all timers
app.get('/api/timers', (req, res) => {
  db.all(`SELECT * FROM timers`, [], (err, rows) => {
    if (err) {
      console.error("DB error on GET /api/timers:", err);
      return res.status(500).json({ error: 'Database error' });
    }
    const timers = rows.map(row => ({
      server: row.server,
      event: row.event,
      status: row.status,
      remaining: calculateRemaining(row)
    }));
    res.json(timers);
  });
});

// Create or update/start timer
app.post('/api/timers', (req, res) => {
  const { server, event, duration } = req.body;

  if (
    typeof server !== 'number' ||
    typeof event !== 'string' ||
    typeof duration !== 'number' ||
    duration <= 0
  ) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  const start_time = Date.now();
  const status = 'running';

  db.get(
    `SELECT id FROM timers WHERE server = ? AND event = ?`,
    [server, event],
    (err, row) => {
      if (err) {
        console.error("DB error on POST /api/timers:", err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        db.run(
          `UPDATE timers SET start_time = ?, duration = ?, status = ? WHERE id = ?`,
          [start_time, duration, status, row.id],
          (err) => {
            if (err) {
              console.error("DB update error:", err);
              return res.status(500).json({ error: 'Database update error' });
            }
            res.json({ message: "Timer updated" });
          }
        );
      } else {
        db.run(
          `INSERT INTO timers (server, event, start_time, duration, status) VALUES (?, ?, ?, ?, ?)`,
          [server, event, start_time, duration, status],
          (err) => {
            if (err) {
              console.error("DB insert error:", err);
              return res.status(500).json({ error: 'Database insert error' });
            }
            res.json({ message: "Timer created" });
          }
        );
      }
    }
  );
});

// Pause timer
app.put('/api/timers/:server/:event/pause', (req, res) => {
  const { server, event } = req.params;
  db.get(
    `SELECT * FROM timers WHERE server = ? AND event = ?`,
    [server, event],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: "Timer not found" });
      }

      if (row.status !== 'running') {
        return res.status(400).json({ error: "Timer is not running" });
      }

      const elapsed = Date.now() - row.start_time;
      let remaining = row.duration - elapsed;
      if (remaining < 0) remaining = 0;

      db.run(
        `UPDATE timers SET duration = ?, status = ? WHERE id = ?`,
        [remaining, 'paused', row.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database update error' });
          }
          res.json({ message: "Timer paused", remaining });
        }
      );
    }
  );
});

// Reset timer
app.put('/api/timers/:server/:event/reset', (req, res) => {
  const { server, event } = req.params;
  db.get(
    `SELECT * FROM timers WHERE server = ? AND event = ?`,
    [server, event],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: "Timer not found" });
      }
      db.run(
        `UPDATE timers SET start_time = ?, status = ?, duration = ? WHERE id = ?`,
        [Date.now(), 'running', row.duration, row.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database update error' });
          }
          res.json({ message: "Timer reset" });
        }
      );
    }
  );
});

// Start/resume paused timer
app.put('/api/timers/:server/:event/start', (req, res) => {
  const { server, event } = req.params;
  db.get(
    `SELECT * FROM timers WHERE server = ? AND event = ?`,
    [server, event],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: "Timer not found" });
      }
      if (row.status !== 'paused') {
        return res.status(400).json({ error: "Timer is not paused" });
      }
      const start_time = Date.now();
      db.run(
        `UPDATE timers SET start_time = ?, status = ? WHERE id = ?`,
        [start_time, 'running', row.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database update error' });
          }
          res.json({ message: "Timer started" });
        }
      );
    }
  );
});

// Delete timer
app.delete('/api/timers/:server/:event', (req, res) => {
  const { server, event } = req.params;
  db.run(
    `DELETE FROM timers WHERE server = ? AND event = ?`,
    [server, event],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database delete error' });
      }
      res.status(204).send();
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
