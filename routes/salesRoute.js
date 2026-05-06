const express = require('express');
const router = express.Router();
const { createSale, getSales, getRevenueStats, adminGetRevenueStats } = require('../controllers/saleController');
const protect = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/roleMiddleware');

router.post('/', protect, createSale);
router.get('/', protect, getSales);
router.get('/stats', protect, getRevenueStats);
router.get('/admin/stats', protect, isAdmin, adminGetRevenueStats);

module.exports = router;
