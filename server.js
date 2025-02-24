// In server.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

const API_KEY = 'your-secret-api-key'; // Must match the EA's api_key

const db = new sqlite3.Database('./mt4_data.db', (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite');
});

db.run(`
  CREATE TABLE IF NOT EXISTS account_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_number TEXT,
    balance REAL,
    equity REAL,
    profit REAL
  )
`);

const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.post('/api/trades', authenticate, (req, res) => {
  const { account_number, balance, equity, profit } = req.body;

  if (!account_number || !balance || !equity || !profit) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO account_data (account_number, balance, equity, profit) VALUES (?, ?, ?, ?)',
    [account_number, balance, equity, profit],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Account data saved', id: this.lastID });
    }
  );
});

// Optional: Check data
app.get('/api/trades', (req, res) => {
  db.all('SELECT * FROM account_data', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});