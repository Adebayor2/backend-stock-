 const mainUser = require ('../models/user.model')
 const bcrypt = require ('bcryptjs')
const jwt = require ('jsonwebtoken')
const dotenv = require ('dotenv')
dotenv.config()
const jwtSecret = process.env.JWT_SECRET
const crypto = require ('crypto')
const Token = require ('../models/tokenModel')


 const userSignup = (req, res) => {
    if (!req.body) {
        return res.status(400).send('all inputs are required');
    }

    let userRole = "user";
    if (req.body.role    === "admin") {
      if (req.body.adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).send("Invalid admin secret");
      }
      userRole = "admin";
    }





    let salt = bcrypt.genSaltSync(10);
    let hashedPassword = bcrypt.hashSync(req.body.password, salt);
    req.body.password = hashedPassword;
    const user = req.body;
    const newUser = new mainUser(user);
    newUser.save()
    .then(() => {
        console.log('user saved to database');
        return res.status(201).send('user signedup successfully');
      
    })
    .catch((err) => {
        console.log('error signing user in', err);

        res.status(500).send('Internal server error');
    });
 }

 
 const userSignin = (req,res ) =>{
    const {email, password} =req.body
    if (!email || !password){
    return  res.status(400).send('all inputs are required')
};

 mainUser.findOne({email}) 
 .then((foundUser) =>{
    if (!foundUser){
        return res.status(409).send('Invalid password or email')
    }
   const  matchedPassword = bcrypt.compareSync(password,foundUser.password)

   if (!matchedPassword){
    return res.status(409).send('Invalid password or email')
   }
   else {
          const token = jwt.sign({ id: foundUser._id, email: foundUser.email, role: foundUser.role }, jwtSecret, { expiresIn: '1h' });
            console.log("Generated Token:", token);
    res.status(200).json({ message:
       'Login successful',
       id: foundUser._id,
       email: foundUser.email,
       firstName: foundUser.firstName,
       lastName: foundUser.lastName,
       role:foundUser.role,
        token });
   }
 })
 .catch((error)=> {
    console.log(error)
    res.status(500).send('Internal server error')

 })

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
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
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

 const userProfile = (req, res) => {
   mainUser.findOne({ email: req.user.email })
   .then(user => {
    if (!user){
     return res.status(404).send('User not found')
    }
    res.status(200).json({
     _id: user._id,
     email: user.email,
     firstName: user.firstName,
     lastName: user.lastName,
    })
   })
   .catch(error => {
    console.log(error)
    res.status(500).send('Internal server error')
   })
 }
   const loginStatus = (req, res) => {
      const token = req.token;
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
      mainUser.findById(req.user._id)
      .then((user) => {   
         if (!user) {
             return res.status(404).json({ message: 'user not found' });
         }
         user.firstName = req.body.firstName || user.firstName;
         user.lastName = req.body.lastName || user.lastName;

         user.save()
         .then((updatedUser) => {
             res.json({
                 _id: updatedUser._id,
                 email: updatedUser.email, 
                 firstName: updatedUser.firstName,
                 lastName: updatedUser.lastName,
             });
         })
         .catch((err) => {
             res.status(500).json({ message: 'error saving user' });
         });
      })
      .catch((error)=> {
         res.status(500).json({ message: 'error updating user' });
      });
   }

   const changePassword = (req, res) => {
      const {oldPassword, password} = req.body;
      if (!oldPassword || !password){
         return res.status(400).json({
            message: "add old password and new password" 
         });
      } 
      
      mainUser.findById(req.user._id)
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
                          sendEmail(subject, message, send_to, sent_from);
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
 module.exports = {userSignup,userSignin, userLogout, userProfile, loginStatus, updateUser, changePassword, forgotPassword, resetPassword, getDashboard}
