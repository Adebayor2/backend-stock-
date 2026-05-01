const express = require ('express')
const router = express.Router();
const protect = require ('../middleware/authMiddleware')
const isAdmin = require('../middleware/roleMiddleware')
const {getDashboard}= require ('../controllers/user.controller')

router.get('/dashboard', protect, isAdmin,getDashboard) 



module.exports = router


