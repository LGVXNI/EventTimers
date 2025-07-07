const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // Serve frontend files

// Create DB connection with error handling
const db = new sqlite3.Database('timers.db', (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

// Create table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS timers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    start_time INTEGER,
    duration INTEGER
  )
`);

// Save a new timer
app.post('/api/timers', (req, res) => {
  const { name, duration } = req.body;
  const startTime = Date.now();

  db.run(
    `INSERT INTO timers (name, start_time, duration) VALUES (?, ?, ?)`,
    [name, startTime, duration * 60 * 1000], // convert minutes to ms
    function (err) {
      if (err) return res.status(500).send("Error saving timer");
      res.json({ id: this.lastID });
    }
  );
});

// Get all timers
app.get('/api/timers', (req, res) => {
  db.all(`SELECT * FROM timers`, [], (err, rows) => {
    if (err) return res.status(500).send("Error reading timers");

    const timers = rows.map(row => {
      const timeLeft = row.start_time + row.duration - Date.now();
      return {
        id: row.id,
        name: row.name,
        timeLeft: Math.max(0, timeLeft)
      };
    });

    res.json(timers);
  });
});

// Delete a timer
app.delete('/api/timers/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM timers WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).send("Error deleting timer");
    res.sendStatus(204);
  });
});

// Reset a timer (restart from now)
app.put('/api/timers/:id/reset', (req, res) => {
  const id = req.params.id;
  const newStart = Date.now();

  db.run(`UPDATE timers SET start_time = ? WHERE id = ?`, [newStart, id], function (err) {
    if (err) return res.status(500).send("Error resetting timer");
    res.sendStatus(200);
  });
});

// Start the server after all routes defined
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
