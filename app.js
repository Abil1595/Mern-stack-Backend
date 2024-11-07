// app.js
const express = require('express');
//const cors = require('cors');
const app = express();
const errorMiddleware = require('./middlewares/error');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');


// Load environment variables
dotenv.config({ path: path.join(__dirname, "config/config.env") });

// Middleware
//app.use(cors());
app.use(express.json()); // Make sure this is present
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route imports
const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const payment = require('./routes/payment');
const generateApiKey = require('./routes/apiKeyRoutes');
const offerproducts = require('./routes/offerProduct');
// Use routes
app.use('/api/v1/', products);
app.use('/api/v1/', auth);
app.use('/api/v1/', order);
app.use('/api/v1/', payment);
app.use('/api/v1/', generateApiKey); // Use the API key routes
app.use('/api/v1/', offerproducts);

if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, '../frontend/my-app/build')));
    app.get('*', (req, res) =>{
        res.sendFile(path.resolve(__dirname, '../frontend/my-app/build/index.html'))
    })
}
// Middleware for error handling
app.use(errorMiddleware);

module.exports = app;
