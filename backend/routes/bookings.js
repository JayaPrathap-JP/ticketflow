const express = require('express');
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const { tickets } = require('./tickets');
const router   = express.Router();

const bookings = [];

// Validation rules
const bookingRules = [
  body('ticketId').notEmpty().withMessage('ticketId is required'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email required'),
  body('quantity').isInt({ min:1, max:10 }).withMessage('quantity must be 1–10'),
];

// POST /api/bookings — create a booking
router.post('/', bookingRules, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { ticketId, name, email, quantity = 1 } = req.body;
  const ticket = tickets.find(t => t.id === ticketId);

  if (!ticket)  return res.status(404).json({ error: 'Ticket not found' });
  if (ticket.bookedSeats + quantity > ticket.totalSeats)
    return res.status(409).json({ error: 'Not enough seats available' });

  ticket.bookedSeats += quantity;

  const booking = {
    id:         uuid(),
    ticketId,
    eventName:  ticket.event,
    name,
    email,
    quantity,
    totalPrice: ticket.price * quantity,
    status:     'confirmed',
    createdAt:  new Date().toISOString(),
  };
  bookings.push(booking);

  res.status(201).json({ success: true, booking });
});

// GET /api/bookings — list all bookings
router.get('/', (_req, res) => {
  res.json({ success: true, count: bookings.length, bookings });
});

// GET /api/bookings/:id — single booking
router.get('/:id', (req, res) => {
  const b = bookings.find(b => b.id === req.params.id);
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  res.json({ success: true, booking: b });
});

module.exports = { router, bookings };