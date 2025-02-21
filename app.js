const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

// Connect to database
mongoose.connect('mongodb://localhost/mt4dashboard');

// Create schema for MT4 account data
const accountDataSchema = new mongoose.Schema({
  account_number: String,
  balance: Number,
  equity: Number,
  profit: Number,
  timestamp: { type: Date, default: Date.now }
});
const AccountData = mongoose.model('AccountData', accountDataSchema);

// Middleware
app.use(bodyParser.json());

// API endpoint to receive MT4 data
app.post('/mt4data', async (req, res) => {
  try {
    // Create new record with data from MT4
    const newData = new AccountData({
      account_number: req.body.account_number,
      balance: req.body.balance,
      equity: req.body.equity,
      profit: req.body.profit
    });
    
    // Save to database
    await newData.save();
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving MT4 data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});