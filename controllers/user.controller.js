 const mainUser = require ('../models/user.model')
 const bcrypt = require ('bcryptjs')
const jwt = require ('jsonwebtoken')
const dotenv = require ('dotenv')
dotenv.config()
const jwtSecret = process.env.JWT_SECRET
const crypto = require ('crypto')
const Token = require ('../models/tokenModel')
const sendEmail = require('../utils/sendEmail')


 const userSignup = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: 'All inputs are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        
        // Check if user already exists
        const userExists = await mainUser.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new mainUser({
            ...req.body,
            email: normalizedEmail,
            password: hashedPassword
        });

        await newUser.save();
        console.log('User saved to database');
        return res.status(201).json({ message: 'User signed up successfully' });
    } catch (err) {
        console.error('Error signing user up:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

 
 const userSignin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
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

        const token = jwt.sign(
            { id: foundUser._id, email: foundUser.email, role: foundUser.role },
            jwtSecret,
            { expiresIn: '1h' }
        );

        console.log("Generated Token:", token);

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
        console.error("Login Error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
  const getDashboard = (req, res) => {
    const { email, role } = req.user;
    
    mainUser.findOne({ email })
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            console.log("User found:", user);
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
                } 
            });
        })
        .catch((err) => {
            console.error("Error fetching user:", err);
            res.status(500).json({ message: "Internal server error" });
        });
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
   const updateUser = (req, res) => {
      mainUser.findById(req.user.id)
      .then((user) => {   
         if (!user) {
             return res.status(404).json({ message: 'user not found' });
         }
         user.firstName = req.body.firstName || user.firstName;
         user.lastName = req.body.lastName || user.lastName;
         user.phone = req.body.phone || user.phone;
         user.address = req.body.address || user.address;

         user.save()
         .then((updatedUser) => {
             res.json({
                 _id: updatedUser._id,
                 email: updatedUser.email, 
                 firstName: updatedUser.firstName,
                 lastName: updatedUser.lastName,
                 phone: updatedUser.phone,
                 address: updatedUser.address
             });
         })
         .catch((err) => {
             res.status(500).json({ message: 'error saving user',err });
         });
      })
      .catch((error)=> {
         res.status(500).json({ message: 'error updating user', error });
      });
   }

   const changePassword = (req, res) => {
      const {oldPassword, password} = req.body;
      if (!oldPassword || !password){
         return res.status(400).json({
            message: "add old password and new password" 
         });
      } 
      
      mainUser.findById(req.user.id)
      .then((user) => {
          if (!user){
             return res.status(404).json({
                message: 'user not found'
             });
          }
          
          const passwordIsCorrect = bcrypt.compareSync(oldPassword, user.password);
          if (passwordIsCorrect) {
             user.password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
             user.save()
             .then(() => {
                 res.status(200).send('password changed successfully');
             })
             .catch((err) => {
                 res.status(500).send('error saving new password');
             });
          }
          else{
             res.status(400).send('old password is incorrect');
          }
      })
      .catch((err) => {
          res.status(500).send('internal server error');
      });
   }
   const forgotPassword = (req, res) => {
      const {email} = req.body;
      mainUser.findOne({email})
      .then((user) => {
          if (!user){
             return res.status(400).send('user does not exist');
          }
          
          Token.findOne({userId: user._id})
          .then((token) => {
              if (token) {
                 return token.deleteOne();
              }
          })
          .then(() => {
              let resetToken = crypto.randomBytes(32).toString('hex') + user._id;
              const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
              
              new Token ({
                 userId: user._id,
                 token: hashedToken,
                 createdAt: Date.now(),
                 expiresAt: Date.now() + 30 * (60 * 1000)  // 30 minutes
              }).save()
              .then(() => {
                  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
                  const message = `
                  <h2>Hello ${user.firstName}</h2>
                  <p>please use the url below to reset your password</p>
                  <p>this reset link is valid for 30 minutes only</p>
                  <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
                  `;
                  const subject = "Password Reset Request";
                  const send_to = user.email;
                  const sent_from = process.env.EMAIL_USER;

                  try {
                      if (typeof sendEmail === 'function') {
                          sendEmail(subject, send_to, message, sent_from);
                      } else {
                          console.log("sendEmail is not defined. Email content:", message);
                      }
                      res.status(200).json({success: true, message: 'Reset email sent'});
                  }
                  catch (error) {
                      res.status(500).send("email not sent try again");
                  }
              });
          });
      })
      .catch((err) => {
          res.status(500).send('internal server error');
      });
   }


   const resetPassword = (req, res) => {
      const {password} = req.body;
      const {resetToken} = req.params;
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      Token.findOne({
         token: hashedToken,
         expiresAt: {$gt: Date.now()}
      })
      .then((userToken) => {
          if (!userToken) {
             return res.status(400).send('Invalid or expired token');
          }

          mainUser.findOne({_id: userToken.userId})
          .then((user) => {
              if (!user) {
                  return res.status(404).send('User not found');
              }
              user.password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
              user.save()
              .then(() => {
                  res.status(201).json({message: 'password reset successful'});
              });
          });
      })
      .catch((err) => {
          res.status(500).send('Internal server error');
      });
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
