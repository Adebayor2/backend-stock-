const express = require ('express')
const router = express.Router();
const protect = require ('../middleware/authMiddleware')
const isAdmin = require('../middleware/roleMiddleware')
const {getDashboard, getAllUsers}= require ('../controllers/user.controller')

router.get('/dashboard', protect, isAdmin,getDashboard) 
router.get('/allusers', protect, isAdmin, getAllUsers) 



module.exports = router


