const express = require('express');
const router  = express.Router();

const categories = [
  { id: 'c1', name: 'Concert',    icon: '🎵', count: 2 },
  { id: 'c2', name: 'Sports',     icon: '🏏', count: 2 },
  { id: 'c3', name: 'Conference', icon: '💻', count: 1 },
];

router.get('/categories', (_req, res) => {
  res.json({ success: true, categories });
});

module.exports = router;