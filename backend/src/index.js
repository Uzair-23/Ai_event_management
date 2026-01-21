// backend/src/index.js
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');

const connectDB = require('./config/db');
const { initSockets } = require('./sockets');

// =======================
// CREATE APP
// =======================
const app = express();

// =======================
// MIDDLEWARE
// =======================
app.use(cors({
  origin: [
    "https://ai-event-management-delta.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));

app.use(express.json());

// =======================
// ROUTES
// =======================
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const ticketRoutes = require('./routes/tickets');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// =======================
// HEALTH CHECK
// =======================
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'AI Event Management API',
    version: '2.0.0',
    auth: 'Clerk',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// =======================
// ERROR HANDLING
// =======================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// =======================
// SERVER + SOCKETS
// =======================
const server = http.createServer(app);
initSockets(server);

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();
