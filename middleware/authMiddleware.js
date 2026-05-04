const mainUser = require ('../models/user.model')
const dotenv = require('dotenv')
dotenv.config()

const jwt = require ('jsonwebtoken')

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token = req.headers.authorization.split(' ')[1]
  }
    if (!token){
      return res.status(401).json({message:"No token found"})
    }
    
    try{
      const decoded = jwt.verify(token,process.env.JWT_SECRET)
      req.user = decoded
      next()

    }
    catch(error){
      return res.status(401).json({message:"invalid token"})
    }
}

module.exports = protect

