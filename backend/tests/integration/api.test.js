const request = require('supertest');
const app     = require('../../server');

describe('Integration — Health', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ticketflow-backend');
  });
});

describe('Integration — Tickets API', () => {

  test('GET /api/tickets returns ticket list', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.tickets)).toBe(true);
    expect(res.body.tickets.length).toBeGreaterThan(0);
  });

  test('GET /api/tickets returns availableSeats field', async () => {
    const res = await request(app).get('/api/tickets');
    res.body.tickets.forEach(t => {
      expect(t).toHaveProperty('availableSeats');
      expect(t).toHaveProperty('available');
    });
  });

  test('GET /api/tickets/:id returns single ticket', async () => {
    const res = await request(app).get('/api/tickets/t1');
    expect(res.statusCode).toBe(200);
    expect(res.body.ticket.id).toBe('t1');
  });

  test('GET /api/tickets/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/tickets/unknown-999');
    expect(res.statusCode).toBe(404);
  });

});

describe('Integration — Bookings API', () => {

  test('POST /api/bookings creates a booking', async () => {
    const res = await request(app).post('/api/bookings').send({
      ticketId: 't3', name: 'Alice Kumar',
      email: 'alice@example.com', quantity: 2,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.totalPrice).toBe(160);   // 80 * 2
  });

  test('POST /api/bookings returns 422 on missing fields', async () => {
    const res = await request(app).post('/api/bookings').send({ name: 'Bob' });
    expect(res.statusCode).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('POST /api/bookings returns 422 on invalid email', async () => {
    const res = await request(app).post('/api/bookings').send({
      ticketId: 't1', name: 'Bob', email: 'not-an-email', quantity: 1,
    });
    expect(res.statusCode).toBe(422);
  });

  test('POST /api/bookings returns 404 for unknown ticketId', async () => {
    const res = await request(app).post('/api/bookings').send({
      ticketId: 'doesnt-exist', name: 'Bob', email: 'b@b.com', quantity: 1,
    });
    expect(res.statusCode).toBe(404);
  });

  test('GET /api/bookings returns bookings list', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.bookings)).toBe(true);
  });

});