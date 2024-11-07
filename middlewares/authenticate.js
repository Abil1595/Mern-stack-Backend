const ErrorHandler = require("../utils/errorHandler");
const User = require('../models/userModel')
const catchAsyncError = require("./catchAsyncError");
const jwt = require('jsonwebtoken');

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
    // Get token from cookies
    const { token } = req.cookies;
    
    // If no token is found, return an error response
    if (!token) {
        return res.status(401).json({ success: false, message: "Login first to handle this resource" });
    }

    try {
        // Verify the token and get the decoded data
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user in the database using the decoded token ID
        req.user = await User.findById(decoded.id);
        
        // If no user is found, return an error response
        if (!req.user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        // If the token is invalid or expired, return an error response
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
});
 
exports.authorizeRoles = (...roles) => {
   return  (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new ErrorHandler(`Role ${req.user.role} is not allowed`, 401))
        }
        next()
    }
}   