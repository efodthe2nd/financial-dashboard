const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;

const API_KEY = 'your-secret-api-key';

// Middleware to parse JSON
app.use(bodyParser.json());

// Middleware for API key authentication
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Set up SQLite database
const db = new sqlite3.Database('./mt4_data.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create a table for MT4 data
db.run(`
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    symbol TEXT,
    type TEXT,
    volume REAL,
    price REAL
  )
`);

// Basic API endpoint to receive MT4 data
app.post('/api/trades', authenticate, (req, res) => {
  const { timestamp, symbol, type, volume, price } = req.body;

  if (!timestamp || !symbol || !type || !volume || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO trades (timestamp, symbol, type, volume, price) VALUES (?, ?, ?, ?, ?)',
    [timestamp, symbol, type, volume, price],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Trade data saved', id: this.lastID });
    }
  );
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});