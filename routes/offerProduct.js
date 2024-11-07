const express=require('express');
const { getOfferProducts, getOfferSingleProduct, newOfferProduct } = require('../controllers/offerProductController');
const router=express.Router();

router.route('/offerproducts').get(getOfferProducts);
router.route('/offerproduct/new').post(newOfferProduct);
router.route('/offerproducts/:id').get(getOfferSingleProduct); 
module.exports=router         