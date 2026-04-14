const express  = require('express');
const morgan   = require('morgan');
const cors     = require('cors');

const { router: ticketRoutes } = require('./routes/tickets');
const bookingRoutes = require('./routes/bookings');
const eventRoutes   = require('./routes/events');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined'));

// Health check — used by Kubernetes readiness & liveness probes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ticketflow-backend', version: '2.0.0' });
});

// Routes
app.use('/api/tickets',  ticketRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/events',   eventRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`TicketFlow API running on port ${PORT}`));
}

module.exports = app;