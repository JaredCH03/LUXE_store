const express = require('express');
const { createOrder, getMyOrders, getSellerOrders } = require('../controllers/orderController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/seller', protect, sellerOnly, getSellerOrders);

module.exports = router;