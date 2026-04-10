const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/vendors',  require('./routes/vendor'));
app.use('/api/products', require('./routes/product'));
app.use('/api/rfqs',     require('./routes/rfq'));
app.use('/api/quotes',   require('./routes/quote'));
app.use('/api/ai',       require('./routes/ai'));
app.use('/api/po',       require('./routes/po'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/payments', require('./routes/payment'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '✅ ERP API is running', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ERP Backend running on http://localhost:${PORT}`);
});
