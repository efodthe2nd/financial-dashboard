const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

const API_KEY = 'your-secret-api-key'; // Replace with the EXACT key from your EA

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
  console.log('Received API Key:', apiKey); // Log for debugging
  if (!apiKey || apiKey !== API_KEY) {
    console.log('Authentication failed. Expected:', API_KEY);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.post('/api/trades', authenticate, (req, res) => {
  console.log('POST Received:', req.body); // Log incoming data
  const { account_number, balance, equity, profit } = req.body;

  if (!account_number || balance === undefined || equity === undefined || profit === undefined) {
    console.log('Bad Request - Invalid data:', req.body);
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  db.run(
    'INSERT INTO account_data (account_number, balance, equity, profit) VALUES (?, ?, ?, ?)',
    [account_number, parseFloat(balance), parseFloat(equity), parseFloat(profit)],
    function (err) {
      if (err) {
        console.log('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('Data saved with ID:', this.lastID);
      res.status(201).json({ message: 'Account data saved', id: this.lastID });
    }
  );
});

app.get('/api/trades', (req, res) => {
  db.all('SELECT * FROM account_data', [], (err, rows) => {
    if (err) {
      console.log('GET error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('GET response:', rows);
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});