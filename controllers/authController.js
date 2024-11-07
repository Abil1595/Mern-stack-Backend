const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const sendToken=require('../utils/jwt')
const sendEmail = require('../utils/email');
const crypto = require('crypto');

//Register User - /api/v1/register

 // Create a function to send OTP

 // Register User - /api/v1/register
 const bcrypt = require('bcryptjs');

 



exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;
    let avatar;
    let BASE_URL = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === "production") {
        BASE_URL = `${req.protocol}://${req.get('host')}`;
    }
 
    if (req.file) {
        avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`;
    } 

    // **Hash the password** before saving to the database
    const hashedPassword = await bcrypt.hash(password, 12);

    // **Create the user** with the hashed password
    const user = await User.create({ 
        name,
        email,
        password: hashedPassword, // Save the hashed password
        avatar
    });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // **Hash the OTP** and set expiry time (valid for 10 minutes)
    const otpToken = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpire = Date.now() + 10 * 60 * 1000;

    user.otp = otpToken;
    user.otpExpire = otpExpire;
    await user.save({ validateBeforeSave: false });

    // Send OTP via email (don't expose OTP in frontend)
    const message = `Your OTP for verifying your account is: ${otp}. This OTP is valid for 10 minutes.`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Verify your account - OTP",
            message
        });

        // **Do not send password or OTP in the response**
        res.status(200).json({
            success: true,
            message: `OTP sent to ${user.email}`,
        });
    } catch (error) { 
        user.otp = undefined; 
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message, 500));
    }
});
 
 
// Verify OTP - /api/v1/verify-otp
exports.exploreOtp = catchAsyncError(async (req, res, next) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // Check if OTP has expired
    if (user.otpExpire < Date.now()) {
        return next(new ErrorHandler('OTP has expired', 400));
    }

    // Verify OTP
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== user.otp) {
        return next(new ErrorHandler('Invalid OTP', 400));
    }

    // Clear OTP and mark user as verified
    user.otp = undefined;
    user.otpExpire = undefined;
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res); // Log the user in after OTP verification
});
exports.resendOtp = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // Check if the OTP resend limit is exceeded
    if (user.resendAttempts && user.resendAttempts >= 3) {
        return next(new ErrorHandler('Resend limit exceeded', 429));
    }

    let otp; // Define otp here

    // Check if OTP has expired or if it's the first resend
    if (!user.otp || !user.otpExpire || user.otpExpire < Date.now()) {
        otp = Math.floor(100000 + Math.random() * 900000); // Generate a new OTP
        user.otp = crypto.createHash("sha256").update(String(otp)).digest("hex"); // Hash OTP
        user.otpExpire = Date.now() + 10 * 60 * 1000; // Set OTP expiration time to 10 minutes
        user.resendAttempts = 1; // Reset resend attempts
    } else {
        user.resendAttempts += 1; // Increment resend attempts if OTP hasn't expired
        otp = Math.floor(100000 + Math.random() * 900000); // Generate a new OTP for the resend case
        user.otp = crypto.createHash("sha256").update(String(otp)).digest("hex"); // Hash the new OTP
    }

    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    const message = `Your OTP is ${otp}. It will expire in 10 minutes.`;
    await sendEmail({
        email: user.email,
        subject: "Resend OTP",
        message,
    }); 

    res.status(200).json({
        success: true,  
        message: "OTP resent successfully",
        otp // Optionally include OTP for debugging/logging (avoid in production)
    });
});


// Login User - /api/v1/login
exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler('Please enter email & password', 400));
    }

    // Finding the user in the database and selecting the password explicitly for verification
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorHandler('Invalid email or password', 401));
    }

    // Check if password is valid
    const isPasswordValid = await user.isValidPassword(password);
    if (!isPasswordValid) {
        return next(new ErrorHandler('Invalid email or password', 401));
    }

    // Remove the password field before sending the response
    user.password = undefined;

    // Send token to the user without including the password field in the response
    sendToken(user, 201, res);
});
 

// Verify OTP - /api/v1/verify-otp
{/*exports.verifyOtp = catchAsyncError(async (req, res, next) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // Check if OTP has expired
    if (user.otpExpire < Date.now()) {
        return next(new ErrorHandler('OTP has expired', 400));
    }

    // Verify OTP
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== user.otp) {
        return next(new ErrorHandler('Invalid OTP', 400));
    }

    // Clear OTP and mark user as verified
    user.otp = undefined;
    user.otpExpire = undefined;
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res); // Log the user in after OTP verification
});   */}

//Login User - /api/v1/login
// Login User - /api/v1/login 


//Logout - /api/v1/logout
exports.logoutUser = (req, res, next) => {
    res.cookie('token',null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    .status(200)
    .json({
        success: true,
        message: "Loggedout"
    })

}
//Forgot Password - /api/v1/password/forgot
exports.forgotPassword = catchAsyncError( async (req, res, next)=>{
    const user =  await User.findOne({email: req.body.email});

    if(!user) {
        return next(new ErrorHandler('User not found with this email', 404))
    }

    const resetToken = user.getResetToken();
    await user.save({validateBeforeSave: false})
    
    let BASE_URL = process.env.FRONTEND_URL;
    if(process.env.NODE_ENV === "production"){
        BASE_URL = `${req.protocol}://${req.get('host')}`
    }


    //Create reset url
    require('dotenv').config(); // Load environment variables

    // Inside the function where the reset URL is created
    const resetUrl = `${BASE_URL}/password/reset/${resetToken}`;    
    
    console.log('Reset URL:', resetUrl);
    

    const message = `Your password reset url is as follows \n\n 
    ${resetUrl} \n\n If you have not requested this email, then ignore it.`;

    try{
        sendEmail({
            email: user.email,
            subject: "Toronto  Password Recovery",
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`
        })

    }catch(error){
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;
        await user.save({validateBeforeSave: false});
        return next(new ErrorHandler(error.message), 500)
    }

})  

//Reset Password - /api/v1/password/reset/:token
exports.resetPassword = catchAsyncError( async (req, res, next) => {
    const resetPasswordToken =  crypto.createHash('sha256').update(req.params.token).digest('hex'); 
 
     const user = await User.findOne( {
         resetPasswordToken,
         resetPasswordTokenExpire: {
             $gt : Date.now()
         }
     } )
 
     if(!user) {
         return next(new ErrorHandler('Password reset token is invalid or expired'));
     }
 
     if( req.body.password !== req.body.confirmPassword) {
         return next(new ErrorHandler('Password does not match'));
     }
 
     user.password = req.body.password;
     user.resetPasswordToken = undefined;
     user.resetPasswordTokenExpire = undefined;
     await user.save({validateBeforeSave: false})
     sendToken(user, 201, res)
     const message = `Your password is changed If you have not requested this email, then ignore it`
     try{
        sendEmail({
            email: user.email,
            subject: "Toronto Verify User",
            message
        })
    
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`
        })
    
    }catch(error){
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;
        await user.save({validateBeforeSave: false});
        return next(new ErrorHandler(error.message), 500)
    }
 })
 //Get User Profile - /api/v1/myprofile
exports.getUserProfile = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id)
    res.status(200).json({
         success:true,
         user
    })
 })

 
//Change Password  - api/v1/password/change
exports.changePassword = catchAsyncError(async (req, res, next) => {
    if (!req.user) {
        return next(new ErrorHandler('User not found or not authenticated', 401));
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check if the user exists
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // Check if the old password is correct
    if (!await user.isValidPassword(req.body.oldPassword)) {
        return next(new ErrorHandler('Old password is incorrect', 401));
    }

    // Assign new password (hashing should be handled in the User model)
    user.password = req.body.password;

    // Save the updated user password
    await user.save();

    const message = `Your password has been changed successfully. If this was not you, please contact support immediately.`;

    try {
        // Send confirmation email to the user
        await sendEmail({
            email: user.email,
            subject: "Password Changed Successfully",
            message,
        });

        // Send a success response to the client
        res.status(200).json({
            success: true,
            message: `Password changed successfully and confirmation email sent to ${user.email}`,
        });

    } catch (error) {
        // Handle any email sending errors
        return next(new ErrorHandler('Failed to send confirmation email. Please try again later.', 500));
    }
});

//Update Profile - /api/v1/update
exports.updateProfile = catchAsyncError(async (req, res, next) => {
    let newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    let avatar;
    let BASE_URL = process.env.BACKEND_URL;
    if(process.env.NODE_ENV === "production"){
        BASE_URL = `${req.protocol}://${req.get('host')}`
    }

    if(req.file){
        avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`
        newUserData = {...newUserData,avatar }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true,
        user
    })

})
//Admin: Get All Users - /api/v1/admin/users
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
         success: true,
         users
    })
 })
 //Admin: Get Specific User - api/v1/admin/user/:id
exports.getUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`))
    }
    res.status(200).json({
        success: true,
        user
   })
});

//Admin: Update User - api/v1/admin/user/:id
exports.updateUser = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true,
        user
    })
})
//Admin: Delete User - api/v1/admin/user/:id
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`))
    }
    await user.deleteOne();
    res.status(200).json({
        success: true,
    })
})
