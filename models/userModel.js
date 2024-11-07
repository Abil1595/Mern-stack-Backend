const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Define the User schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    },
    email: {
        type: String,
        required: [true, 'Please enter email'],
        unique: true,
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    password: { 
        type: String,
        required: [true, "Please add a password"],
        minLength: [6, "Password must be at least 6 characters long"],
        select: false // Password won't be returned by default in queries
    },
    avatar: {
        type: String,
        default: "https://i.ibb.co/4pDNDk1/avatar.png",
    },
    otp: {
        type: String,
        required: false,
    },
    otpExpire: {
        type: Date,
        required: false,
    },
    isVerified: {
        type: Boolean,
        default: false // New users are unverified by default
    },
    role: {
        type: String,
        default: 'user'
    },
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to validate password (for clarity and reuse)
userSchema.methods.isValidPassword = async function (password) {
    return await this.comparePassword(password);
};

// Generate JWT Token
userSchema.methods.getJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
};

// Generate password reset token
userSchema.methods.getResetToken = function() {
    // Generate token
    const token = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // Set token expire time (30 minutes from now)
    this.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000;

    return token;
};

// Export the User model
module.exports = mongoose.model('User', userSchema);
