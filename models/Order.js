const pool = require('../config/database');

class Order {
    static async create(order) {
        const { orderNumber, userId, total, paymentMethod, shippingAddress, items } = order;
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const item of items) {
                const [rows] = await connection.execute(
                    'SELECT stock FROM products WHERE id = ? FOR UPDATE',
                    [item.id]
                );
                if (rows.length === 0) throw new Error(`Producto ${item.id} no encontrado`);
                if (rows[0].stock < item.quantity) throw new Error(`Stock insuficiente para producto ${item.id}`);
            }

            const [orderResult] = await connection.execute(
                `INSERT INTO orders 
                 (order_number, user_id, total, payment_method, shipping_address) 
                 VALUES (?, ?, ?, ?, ?)`,
                [orderNumber, userId, total, paymentMethod, JSON.stringify(shippingAddress)]
            );
            const orderId = orderResult.insertId;

            for (const item of items) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                    [orderId, item.id, item.quantity, item.price]
                );
                await connection.execute(
                    `UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?`,
                    [item.quantity, item.quantity, item.id]
                );
            }

            await connection.commit();
            return { id: orderId, orderNumber };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getUserOrders(userId) {
        // 1. Obtener órdenes del usuario
        const [orders] = await pool.execute(
            `SELECT o.* FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC`,
            [userId]
        );
        if (orders.length === 0) return [];

        // 2. Obtener IDs de órdenes
        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');

        // 3. Obtener items de esas órdenes
        const [items] = await pool.execute(
            `SELECT oi.order_id, p.name, oi.quantity, oi.price
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id IN (${placeholders})`,
            orderIds
        );

        // 4. Agrupar items por orden
        const itemsByOrder = {};
        for (const item of items) {
            if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
            itemsByOrder[item.order_id].push({
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price)
            });
        }

        // 5. Ensamblar resultado
        return orders.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
        }));
    }

    static async getSellerOrders(sellerId) {
        // 1. Obtener órdenes que contienen productos del vendedor
        const [orders] = await pool.execute(
            `SELECT o.*, u.name as customer_name, u.email as customer_email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE EXISTS (
                 SELECT 1 FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 WHERE oi.order_id = o.id AND p.seller_id = ?
             )
             ORDER BY o.created_at DESC`,
            [sellerId]
        );
        if (orders.length === 0) return [];

        // 2. Obtener IDs de órdenes
        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');

        // 3. Obtener items de esas órdenes (solo los productos del vendedor)
        const [items] = await pool.execute(
            `SELECT oi.order_id, p.name, oi.quantity, oi.price
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id IN (${placeholders}) AND p.seller_id = ?`,
            [...orderIds, sellerId]
        );

        // 4. Agrupar items por orden
        const itemsByOrder = {};
        for (const item of items) {
            if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
            itemsByOrder[item.order_id].push({
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price)
            });
        }

        // 5. Ensamblar resultado
        return orders.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
        }));
    }
}

module.exports = Order;