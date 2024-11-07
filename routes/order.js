const express=require('express');
const { newOrder, getSingleOrder, myOrders, orders, updateOrder, deleteOrder } = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const router=express.Router();

router.route('/order/new').post( newOrder);
router.route('/order/:id').get( getSingleOrder);
router.route('/myorders').get(myOrders);

//Admin routes
router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles('admin'),orders);
router.route('/admin/order/:id').put(isAuthenticatedUser, authorizeRoles('admin'),updateOrder);
router.route('/admin/order/:id').delete(isAuthenticatedUser, authorizeRoles('admin'),deleteOrder);
module.exports=router;  