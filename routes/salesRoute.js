const express = require('express');
const router = express.Router();
const { createSale, getSales, getRevenueStats } = require('../controllers/saleController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, createSale);
router.get('/', protect, getSales);
router.get('/stats', protect, getRevenueStats);

module.exports = router;
