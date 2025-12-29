require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSockets } = require('./sockets');

// routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const ticketRoutes = require('./routes/tickets');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

// init sockets (passes server)
initSockets(server);

// middlewares
app.use(cors());
app.use(express.json());

// api routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', require('./routes/analytics'));


app.get('/', (req, res) => res.json({ ok: true, message: 'AI Event Management API' }));

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
