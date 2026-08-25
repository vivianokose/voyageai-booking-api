'use strict';

const http = require('http');

const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || '1.0.0';

const routes = {
  '/health': () => ({ status: 'healthy', service: 'voyageai-booking-api', version: VERSION }),
  '/bookings': () => ({
    bookings: [
      { id: 'BK001', destination: 'Lagos', departure: '2026-03-01', status: 'confirmed' },
      { id: 'BK002', destination: 'Accra', departure: '2026-03-15', status: 'pending' }
    ]
  }),
  '/destinations': () => ({
    destinations: ['Lagos', 'Accra', 'Nairobi', 'Cairo', 'Cape Town']
  })
};

const server = http.createServer((req, res) => {
  const handler = routes[req.url];
  if (handler) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(handler()));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`VoyageAI Booking API v${VERSION} running on port ${PORT}`);
});

module.exports = server;
