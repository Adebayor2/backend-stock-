const mongoose = require('mongoose')

let userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: [true, 'error, email already exist, pleaseuse another email '] },
    password: { type: String, required: true },
    role: { type: String,default: 'user', enum: ['user', 'admin'] }
}, 
{ timestamps: true })
const mainUser = mongoose.model('mainUser', userSchema)
module.exports = mainUser 
