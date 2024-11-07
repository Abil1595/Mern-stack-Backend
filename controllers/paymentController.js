const catchAsyncError = require('../middlewares/catchAsyncError');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const supportedCurrencies = ["INR", "USD", "EUR", "GBP", "SGD", "AUD"];

async function sendPaymentDetailsEmail(paymentOrder, userEmail, orderDetails = []) {
    if (!userEmail) {
        console.error("Recipient email is undefined!");
        throw new Error("Recipient email is required for sending payment details.");
    }

    const { id, amount, currency, notes, created_at, status } = paymentOrder;
    const { description, shipping } = notes || {}; // Ensure notes is defined
    const shippingInfo = shipping ? JSON.parse(shipping) : {};

    // Validate orderDetails to ensure it's an array
    const orderContent = Array.isArray(orderDetails) ? orderDetails.map(item => `
        <tr>
           
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>${item.price / 100}</td>
        </tr>
    `).join('') : '<tr><td colspan="4">No order details available</td></tr>';

    const emailContent = `
        <h2>Payment Details</h2>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;" background="skyblue;">
            <tr><th>Order ID</th><td>${id}</td></tr>
            <tr><th>Amount</th><td>${amount / 100} ${currency}</td></tr>
            <tr><th>Status</th><td>${status}</td></tr> 
            <tr><th>Description</th><td>${description}</td></tr>
            <tr><th>Shipping Name</th><td>${shippingInfo.name || 'N/A'}</td></tr>
            <tr><th>Shipping Address</th><td>
                ${shippingInfo.address ? `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state}, ${shippingInfo.postal_code}, ${shippingInfo.country}` : 'N/A'}
            </td></tr>
            <tr><th>Phone</th><td>${shippingInfo.phone || 'N/A'}</td></tr>
            <tr><th>Created At</th><td>${new Date(created_at * 1000).toLocaleString()}</td></tr>
        </table>
        <h2>Order Details</h2>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;" background="skyblue;">
            <tr>
               
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Price</th>
            </tr>
            ${orderContent}
        </table>
    `;

    await sendEmail({
        email: userEmail,
        subject: 'Payment and Order Details',
        message: 'Order details',
        html: emailContent
    }); 
}

// Step 1: Process Payment and create order
exports.processPayment = catchAsyncError(async (req, res, next) => {
    const { amount, currency = "INR", shipping, email, orderDetails } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "User email is required to process payment."
        });
    }

    if (!supportedCurrencies.includes(currency.toUpperCase())) {
        return res.status(400).json({
            success: false,
            message: `Currency ${currency} is not supported.`
        });
    }

    const paymentOptions = {
        amount: amount,
        currency: currency.toUpperCase(),
        receipt: "receipt_" + Math.floor(Math.random() * 10000),
        notes: { description: "TEST PAYMENT", shipping: JSON.stringify(shipping) }
    };

    try {
        const paymentOrder = await razorpay.orders.create(paymentOptions);
        console.log("Payment Order Created:", paymentOrder);

        // Send payment and order details email
        await sendPaymentDetailsEmail(paymentOrder, email, orderDetails || []); // Provide default value

        res.status(200).json({
            success: true,
            order_id: paymentOrder.id,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency
        });
    } catch (error) {
        console.error("Error during Razorpay order creation:", error.message || error);
        res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
    }
});

// Step 2: Verify Payment and Send Email
exports.verifyPaymentAndSendEmail = catchAsyncError(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email,orderDetails } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "User email is required for verification and email sending." });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    // Log the generated and received signature
    console.log("Generated Signature:", expectedSignature);
    console.log("Received Signature:", razorpay_signature);

    if (expectedSignature === razorpay_signature) {
        // Get the order details from Razorpay to include in the email
        const paymentOrder = await razorpay.orders.fetch(razorpay_order_id);
        
        // Log success if signature matches
        console.log("Signature Verified Successfully. Sending Email...");

        // Get order details if not already included
        const orderDetails = []; // Make sure to populate this with actual order details if needed

        // Send the email with payment and order details
        await sendPaymentDetailsEmail(paymentOrder, email ); // Provide default value

        res.status(200).json({ success: true, message: "Payment verified and email sent successfully" });
    } else {
        console.error("Signature Mismatch! Verification Failed.");
        res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
});

// Other functions remain unchanged...

/**
 * @desc Send Razorpay API key to the frontend
 * @route GET /api/v1/payment/getRazorpayApiKey
 * @access Public
 */
exports.sendRazorpayApi = catchAsyncError(async (req, res, next) => {
    res.status(200).json({
        razorpayApiKey: process.env.RAZORPAY_KEY_ID
    });
});

exports.createOrder = async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100,
            currency: "INR",
        };
        const order = await razorpay.orders.create(options);
        console.log("Order Created:", order);
        res.status(200).json({ data: order });
    } catch (error) {
        console.log("Error creating order:", error.message || error);
        res.status(500).json({ message: "Something went wrong!" });
    }
};

exports.verifyPayment = catchAsyncError(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    console.log("Verifying Payment Signature...");

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    console.log("Generated Signature for Verification:", expectedSignature);
    console.log("Received Signature for Verification:", razorpay_signature);

    if (expectedSignature === razorpay_signature) {
        res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
        console.error("Signature Mismatch! Payment Verification Failed.");
        res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
});
