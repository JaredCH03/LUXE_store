const express = require('express');
const {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductImages 
} = require('../controllers/productController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);
router.get('/seller/my', protect, sellerOnly, getMyProducts);
router.post('/', protect, sellerOnly, createProduct);
router.put('/:id', protect, sellerOnly, updateProduct);
router.delete('/:id', protect, sellerOnly, deleteProduct);

router.get('/:id/images', getProductImages);

module.exports = router;