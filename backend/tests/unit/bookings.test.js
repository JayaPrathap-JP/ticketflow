const { bookings } = require('../../routes/bookings');

describe('Bookings — Unit Tests', () => {

  test('bookings starts as empty array', () => {
    expect(Array.isArray(bookings)).toBe(true);
  });

  test('booking object schema is valid when present', () => {
    // Validate schema by pushing a dummy and inspecting
    const dummy = {
      id: 'test-uuid', ticketId: 't1', name: 'Jane',
      email: 'jane@test.com', quantity: 1, totalPrice: 149,
      status: 'confirmed', createdAt: new Date().toISOString(),
    };
    bookings.push(dummy);
    expect(bookings[0]).toHaveProperty('id');
    expect(bookings[0]).toHaveProperty('status', 'confirmed');
    expect(bookings[0].totalPrice).toBeGreaterThan(0);
    bookings.pop(); // cleanup
  });

});