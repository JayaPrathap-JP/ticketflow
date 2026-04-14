const { tickets } = require('../../routes/tickets');

describe('Tickets — Unit Tests', () => {

  test('tickets array is populated', () => {
    expect(Array.isArray(tickets)).toBe(true);
    expect(tickets.length).toBeGreaterThan(0);
  });

  test('each ticket has required fields', () => {
    tickets.forEach(t => {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('event');
      expect(t).toHaveProperty('price');
      expect(t).toHaveProperty('totalSeats');
      expect(t).toHaveProperty('bookedSeats');
    });
  });

  test('price is a positive number', () => {
    tickets.forEach(t => {
      expect(typeof t.price).toBe('number');
      expect(t.price).toBeGreaterThan(0);
    });
  });

  test('bookedSeats does not exceed totalSeats', () => {
    tickets.forEach(t => {
      expect(t.bookedSeats).toBeLessThanOrEqual(t.totalSeats);
    });
  });

  test('available seats calculation is correct', () => {
    tickets.forEach(t => {
      const available = t.totalSeats - t.bookedSeats;
      expect(available).toBeGreaterThanOrEqual(0);
    });
  });

});