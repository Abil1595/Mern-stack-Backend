const express=require('express');
const { isAuthenticatedUser } = require('../middlewares/authenticate');
const { processPayment, sendRazorpayApi, createOrder, verifyPayment, handleWebhook, verifyPaymentAndSendEmail } = require('../controllers/paymentController');
const router=express.Router();
const {isvalidateApiKeyFromQuery, isvalidateApiKeyFromHeader} =require('../middlewares/validateApiKeyFromQuery')
router.route('/payment/process').post(isAuthenticatedUser,processPayment)
router.get('/razorpayapi', isvalidateApiKeyFromQuery, (req, res) => {
    const apiKey = process.env.RAZORPAY_KEY_ID;
    if (!apiKey) {
        return res.status(500).send({ error: 'API Key not found' });
    }
    // Send the Razorpay key
    res.send({ key: apiKey });
});

router.route('/payment/orders').post(isAuthenticatedUser,createOrder)
router.route('/payment/verify').post(isAuthenticatedUser,verifyPaymentAndSendEmail)


module.exports = router;     