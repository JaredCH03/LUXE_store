const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
    try {
        const { items, total, paymentMethod, shippingAddress } = req.body;
        const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const order = await Order.create({ orderNumber, userId: req.user.id, total, paymentMethod, shippingAddress, items });
        res.status(201).json({ success: true, order });
    } catch (error) {
        console.error('Error al crear orden:', error);
        res.status(500).json({ success: false, message: error.message.includes('Stock') ? error.message : 'Error interno del servidor' });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.getUserOrders(req.user.id);
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error al obtener órdenes:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.getSellerOrders = async (req, res) => {
    try {
        if (req.user.role !== 'seller') return res.status(403).json({ success: false, message: 'Solo vendedores' });
        const orders = await Order.getSellerOrders(req.user.id);
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error al obtener órdenes de vendedor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};