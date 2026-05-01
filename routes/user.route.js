const express = require ('express')
const router = express.Router();
const {userSignup, userSignin, userLogout, userProfile, loginStatus, updateUser, changePassword, forgotPassword, resetPassword, getDashboard} = require ('../controllers/user.controller')
const protect = require ('../middleware/authMiddleware')
router.post('/register', userSignup)
router.post('/login', userSignin)
router.get('/logout', userLogout )
router.get ('/dashboard', protect, getDashboard)
router.get('/profile',protect,   userProfile  )
router.get('/loggedin', loginStatus)
router.patch('/updateuser', protect, updateUser)
router.patch('/changepassword', protect, changePassword)
router.post('/forgotpassword', forgotPassword)
router.put("/resetpassword/:resetToken", resetPassword)




module.exports = router
