 const mainUser = require ('../models/user.model')
 const bcrypt = require ('bcryptjs')
const jwt = require ('jsonwebtoken')
const dotenv = require ('dotenv')
dotenv.config()
const jwtSecret = process.env.JWT_SECRET
const crypto = require ('crypto')
const Token = require ('../models/tokenModel')
const sendEmail = require('../utils/sendEmail')
const Product = require('../models/product');
const Category = require('../models/category');


 const userSignup = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body || {};
        if (
            typeof email !== 'string' || !email.trim() ||
            typeof password !== 'string' || password.length < 6 ||
            typeof firstName !== 'string' || !firstName.trim() ||
            typeof lastName !== 'string' || !lastName.trim()
        ) {
            return res.status(400).json({ message: 'Enter a valid name, email, and password of at least 6 characters' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Enter a valid email address' });
        }
        
        // Check if user already exists
        const userExists = await mainUser.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new mainUser({
            email: normalizedEmail,
            password: hashedPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim()
        });

        await newUser.save();
        console.log('User saved to database');
        return res.status(201).json({ success: true, message: 'User signed up successfully' });
    } catch (err) {
        console.error('Error signing user up:', err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'User already exists' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

 
 const userSignin = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        
        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const foundUser = await mainUser.findOne({ email: normalizedEmail });

        if (!foundUser) {
            return res.status(401).json({ message: 'Invalid password or email' });
        }

        const matchedPassword = await bcrypt.compare(password, foundUser.password);

        if (!matchedPassword) {
            return res.status(401).json({ message: 'Invalid password or email' });
        }

        if (!jwtSecret) {
            console.error("JWT_SECRET is missing from environment variables!");
            return res.status(500).json({ message: 'Server configuration error' });
        }

        const token = jwt.sign(
            { id: foundUser._id, email: foundUser.email, role: foundUser.role },
            jwtSecret,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            message: 'Login successful',
            id: foundUser._id,
            email: foundUser.email,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            role: foundUser.role,
            token
        });
    } catch (error) {
        console.error("Login Error details:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
  const getDashboard = async (req, res) => {
    try {
        const user = await mainUser.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get counts and stats
        const [productCount, categoryCount, stockSummary] = await Promise.all([
            Product.countDocuments(),
            Category.countDocuments(),
            Product.aggregate([{ $group: { _id: null, totalStock: { $sum: '$stock' } } }])
        ]);
        const totalStock = stockSummary[0]?.totalStock || 0;

        // Get low stock products (e.g., stock < 10)
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).limit(5);

        res.json({
            message: `welcome to your dashboard ${user.role}`,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
                address: user.address
            },
            stats: {
                productCount,
                categoryCount,
                totalStock,
                lowStockProducts
            }
        });
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        res.status(500).json({ message: "Internal server error" });
    }
  }

 
 const userLogout = (req, res) => {

 return res.status(200).json({message:"logout successful"})
 }

 const userProfile = async (req, res) => {
    try {
        const user = await mainUser.findById(req.user.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
                address: user.address,
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
}
   const loginStatus = (req, res) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
      
      if (!token){
         return res.json(false);
      }
      try {
         const verify = jwt.verify(token, jwtSecret);
         if (verify){
            return res.json(true);
         } else {
            return res.json(false);
         }
      } catch (err) {
         return res.json(false);
      }
   }
   const updateUser = async (req, res) => {
      try {
          const user = await mainUser.findById(req.user.id);
          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }

          const updates = req.body || {};
          if (updates.email && updates.email !== user.email) {
              if (typeof updates.email !== 'string') {
                  return res.status(400).json({ message: 'Enter a valid email address' });
              }
              const normalizedEmail = updates.email.trim().toLowerCase();
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                  return res.status(400).json({ message: 'Enter a valid email address' });
              }
              const emailExists = await mainUser.findOne({ email: normalizedEmail });
              if (emailExists) {
                  return res.status(400).json({ message: 'Email already in use' });
              }
              user.email = normalizedEmail;
          }

          if (updates.firstName !== undefined) {
              if (typeof updates.firstName !== 'string' || !updates.firstName.trim()) {
                  return res.status(400).json({ message: 'First name cannot be empty' });
              }
              user.firstName = updates.firstName.trim();
          }
          if (updates.lastName !== undefined) {
              if (typeof updates.lastName !== 'string' || !updates.lastName.trim()) {
                  return res.status(400).json({ message: 'Last name cannot be empty' });
              }
              user.lastName = updates.lastName.trim();
          }
          if (typeof updates.phone === 'string') user.phone = updates.phone.trim();
          if (typeof updates.address === 'string') user.address = updates.address.trim();

          const updatedUser = await user.save();
          res.status(200).json({
              _id: updatedUser._id,
              email: updatedUser.email,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              phone: updatedUser.phone,
              address: updatedUser.address,
              message: "Profile updated successfully"
          });
      } catch (error) {
          console.error("Update User Error:", error);
          res.status(500).json({ message: 'Error updating user profile' });
      }
   };

   const changePassword = async (req, res) => {
      try {
          const { oldPassword, password } = req.body || {};
          if (typeof oldPassword !== 'string' || !oldPassword || typeof password !== 'string' || password.length < 6) {
              return res.status(400).json({ message: "Enter your old password and a new password of at least 6 characters" });
          }

          const user = await mainUser.findById(req.user.id);
          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }

          const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);
          if (!passwordIsCorrect) {
              return res.status(400).json({ message: 'Old password is incorrect' });
          }

          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
          await user.save();

          res.status(200).json({ message: 'Password changed successfully' });
      } catch (error) {
          console.error("Change Password Error:", error);
          res.status(500).json({ message: 'Internal server error' });
      }
   };
   const forgotPassword = async (req, res) => {
      try {
          const { email } = req.body || {};
          if (typeof email !== 'string' || !email.trim()) {
              return res.status(400).json({ message: 'A valid email is required' });
          }
          const user = await mainUser.findOne({ email: email.trim().toLowerCase() });
          if (!user) {
              return res.status(200).json({ success: true, message: 'If an account exists for that email, a reset link has been sent' });
          }

          // Delete any existing token
          await Token.findOneAndDelete({ userId: user._id });

          // Create reset token
          let resetToken = crypto.randomBytes(32).toString('hex') + user._id;
          const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

          // Save token to DB
          await new Token({
              userId: user._id,
              token: hashedToken,
              createdAt: Date.now(),
              expiresAt: Date.now() + 30 * (60 * 1000)  // 30 minutes
          }).save();

          const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
          const resetUrl = `${frontendUrl}/#/reset-password/${resetToken}`;
          const escapedFirstName = String(user.firstName).replace(/[&<>"']/g, (character) => ({
              '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
          })[character]);
          const message = `
          <h2>Hello ${escapedFirstName}</h2>
          <p>please use the url below to reset your password</p>
          <p>this reset link is valid for 30 minutes only</p>
          <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
          `;

          const subject = "Password Reset Request";
          const send_to = user.email;
          const sent_from = process.env.EMAIL_USER;

          await sendEmail(subject, send_to, message, sent_from);
          res.status(200).json({ success: true, message: 'Reset email sent' });
      } catch (err) {
          console.error("Forgot Password Error:", err);
          res.status(500).send('internal server error');
      }
   }

   const resetPassword = async (req, res) => {
      try {
          const { password } = req.body || {};
          const { resetToken } = req.params;
          if (typeof password !== 'string' || password.length < 6) {
              return res.status(400).json({ message: 'Password must be at least 6 characters' });
          }
          const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

          const userToken = await Token.findOne({
              token: hashedToken,
              expiresAt: { $gt: Date.now() }
          });

          if (!userToken) {
              return res.status(400).send('Invalid or expired token');
          }

          const user = await mainUser.findOne({ _id: userToken.userId });
          if (!user) {
              return res.status(404).send('User not found');
          }

          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
          await user.save();

          // Delete the token after use
          await userToken.deleteOne();

          res.status(200).json({ message: 'password reset successful' });
      } catch (err) {
          console.error("Reset Password Error:", err);
          res.status(500).send('Internal server error');
      }
   }
   const getAllUsers = async (req, res) => {
      try {
          const users = await mainUser.find({}).select("-password");
          res.status(200).json(users);
      } catch (error) {
          console.error("Error fetching all users:", error);
          res.status(500).json({ message: "Internal server error" });
      }
   }
 module.exports = {userSignup,userSignin, userLogout, userProfile, loginStatus, updateUser, changePassword, forgotPassword, resetPassword, getDashboard, getAllUsers}
