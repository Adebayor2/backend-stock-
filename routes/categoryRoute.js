const express = require('express');
const router = express.Router();
const { addCategory, getCategories, deleteCategory } = require('../controllers/categoryController');
const protect = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/roleMiddleware');

router.post('/', protect, isAdmin, addCategory);
router.get('/', protect, getCategories);
router.delete('/:id', protect, isAdmin, deleteCategory);

module.exports = router;
