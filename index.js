const express = require ('express')
const cors = require ('cors')
const app = express ()
const dotenv = require ('dotenv')
const mongoose = require ('mongoose')
const cookieParser = require ('cookie-parser')
dotenv.config ()
const PORT = process.env.PORT || 5000
const URI = process.env.MONGODB_URI

const allowedOrigins = [
    'https://stock-manager-cs.vercel.app',
    'http://localhost:5173',
    process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:true}));
const userRoute = require('./routes/user.route')
const adminRoute = require('./routes/adminRoute')
const categoryRoute = require('./routes/categoryRoute')
const productRoute = require('./routes/productRoute')
const salesRoute = require('./routes/salesRoute')
app.use("/api",userRoute)
app.use('/api/admin', adminRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/products', productRoute);
app.use('/api/sales', salesRoute);

mongoose.connect(URI)
    .then(() => {
        console.log("Connected to MongoDB successfully")
        app.listen(PORT, () => {
            console.log(`server is running on port ${PORT}`)
        })
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err)
        process.exitCode = 1
    })