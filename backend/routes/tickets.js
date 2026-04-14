const express = require('express');
const { v4: uuid } = require('uuid');
const router  = express.Router();

// In-memory store (replace with DB in production)
const tickets = [
  { id: 't1', event: 'The Weeknd — After Hours Tour', venue: 'Madison Square Garden',
    date: '2026-06-15', time: '20:00', price: 149, totalSeats: 200, bookedSeats: 42, category: 'Concert' },
  { id: 't2', event: 'IPL Final 2026',                venue: 'Narendra Modi Stadium',
    date: '2026-05-28', time: '19:30', price: 250, totalSeats: 500, bookedSeats: 310, category: 'Sports' },
  { id: 't3', event: 'Tech Summit India 2026',        venue: 'BIEC Bangalore',
    date: '2026-07-10', time: '09:00', price: 80,  totalSeats: 1000,bookedSeats: 230, category: 'Conference'},
  { id: 't4', event: 'Coldplay Music of the Spheres', venue: 'DY Patil Stadium',
    date: '2026-08-03', time: '19:00', price: 200, totalSeats: 300, bookedSeats: 5,   category: 'Concert' },
  { id: 't5', event: 'Formula E — Mumbai ePrix',      venue: 'Bandra Kurla Circuit',
    date: '2026-09-12', time: '14:00', price: 120, totalSeats: 400, bookedSeats: 120, category: 'Sports' },
];

// GET /api/tickets — list all with availability
router.get('/', (_req, res) => {
  const list = tickets.map(t => ({
    ...t,
    availableSeats: t.totalSeats - t.bookedSeats,
    available: t.bookedSeats < t.totalSeats,
  }));
  res.json({ success: true, count: list.length, tickets: list });
});

// GET /api/tickets/:id — single ticket
router.get('/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json({ success: true, ticket: {
    ...ticket, availableSeats: ticket.totalSeats - ticket.bookedSeats,
  }});
});

module.exports = { router, tickets };   // export tickets for tests