const catchAsyncError = require("../middlewares/catchAsyncError");
const Order=require('../models/orderModel')
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/email');
//create new order
exports.newOrder =  catchAsyncError( async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice, 
        shippingPrice,
        totalPrice,
        paymentInfo
    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user.id
    })
 
    res.status(200).json({
        success: true,
        order
    })
})

//Get Single Order - api/v1/order/:id
exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if(!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    res.status(200).json({
        success: true,
        order
    })
})

//Get Loggedin User Orders - /api/v1/myorders
exports.myOrders = catchAsyncError(async (req, res, next) => {
    const orders = await Order.find({user: req.user.id});

    res.status(200).json({
        success: true,
        orders
    })
})

//Admin: Get All Orders - api/v1/orders
exports.orders = catchAsyncError(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach(order => {
        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        
        totalAmount,
        orders
    })
})

//Admin: Update Order / Order Status - api/v1/order/:id
// controllers/orderController.js
 // import your email function

exports.updateOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate("user", "email name");

    if (order.orderStatus === 'Delivered') {
        return next(new ErrorHandler('Order has already been delivered!', 400));
    }

    // Updating the product stock of each order item
    await Promise.all(order.orderItems.map(orderItem => updateStock(orderItem.product, orderItem.quantity)));

    // Update order status and delivery date
    order.orderStatus = req.body.orderStatus;
    if (req.body.orderStatus === 'Delivered') {
        order.deliveredAt = Date.now();
    }
    await order.save();

    // Send email notification if the order is delivered
    if (req.body.orderStatus === 'Delivered') {
        const message = `
            Dear ${order.user.name},
            
            Your order with ID ${order._id} has been successfully delivered.
            Thank you for shopping with us!

            Best Regards,
            Iyappaa
        `;

        try { 
            await sendEmail({
                email: order.user.email,
                subject: "Order Delivered",
                message,  
            });
        } catch (error) {
            console.error("Error sending delivery email:", error);
            // Optional: Handle email sending error here, log it or notify admin
        }
    }

    res.status(200).json({
        success: true,
    });
});


// Helper function to update product stock
async function updateStock(productId, quantity) {
    const product = await Product.findById(productId); 
    product.stock = product.stock - quantity;
    await product.save({ validateBeforeSave: false });
}


//Admin: Delete Order - api/v1/order/:id
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if(!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    await order.deleteOne();
    res.status(200).json({
        success: true
    })
})