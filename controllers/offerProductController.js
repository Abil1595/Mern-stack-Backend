const Product = require('../models/offerProductModel');
const ErrorHandler=require('../utils/errorHandler')
const catchAsyncError=require('../middlewares/catchAsyncError')
const APIFeatures=require('../utils/apiFeatures')
const mongoose = require('mongoose');


// Get products - api/v1/offerproducts
exports.getOfferProducts = catchAsyncError(async (req, res, next) => {
    const resPerPage = 4;

    // Build query using APIFeatures
    const buildQuery = () => {
        return new APIFeatures(Product.find(), req.query).search().filter();
    };

    // Get filtered products count
    const filteredProductsCount = await buildQuery().query.countDocuments();
    // Get total products count
    const totalProductsCount = await Product.countDocuments();
    let productsCount = totalProductsCount;

    if (filteredProductsCount !== totalProductsCount) {
        productsCount = filteredProductsCount;
    }

    // Fetch products with pagination
    const products = await buildQuery().paginate(resPerPage).query;

    // Respond with the products and relevant counts
    res.status(200).json({
        success: true,
        count: productsCount,
        resPerPage,
        products
    });
});


exports.newOfferProduct=async (req,res,next)=>{
   const product=await Product.create(req.body)
   res.status(201).json({
    success:true,
    product
   })

}

exports.getOfferSingleProduct = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler('Invalid product ID', 400));
    }

    try {
        const product = await Product.findById(id).populate('reviews.user', 'name email');
        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        next(new ErrorHandler('Server error while fetching product', 500));
    }
};