const express = require ('express')
const cors = require ('cors')
const app = express ()
const dotenv = require ('dotenv')
const mongoose = require ('mongoose')
const cookieParser = require ('cookie-parser')
dotenv.config ()
const PORT = process.env.PORT
const URI = process.env.MONGODB_URI

app.use (cors( {origin:[ 'https://stock-management-app-taupe.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173']} ))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:true}));
const userRoute = require('./routes/user.route')
const adminRoute = require('./routes/adminRoute')
const categoryRoute = require('./routes/categoryRoute')
const productRoute = require('./routes/productRoute')
mongoose.connect(URI)
.then(() => console.log("Connected to MongoDB successfully"))
.catch((err) => console.error("MongoDB connection error:", err));
app.listen( PORT, () => {
    console.log(`server is running on port ${PORT}`)
});
app.use("/api",userRoute)
app.use('/api/admin', adminRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/products', productRoute);
