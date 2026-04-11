const pool = require('../config/database');

class Product {
    static async getAll() {
        const [rows] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0];
    }

    static async getByCategory(category) {
        const [rows] = await pool.execute(
            'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC',
            [category]
        );
        return rows;
    }

    static async getBySeller(sellerId) {
        const [rows] = await pool.execute(
            'SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC',
            [sellerId]
        );
        return rows;
    }

    static async create(product) {
        const { name, description, price, image, category, stock, sellerId, sizes } = product;
        
        const [result] = await pool.execute(
            `INSERT INTO products 
             (name, description, price, image, category, stock, seller_id, sizes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, description, price, image, category, stock, sellerId, JSON.stringify(sizes || {})]
        );
        return { id: result.insertId, ...product };
    }

    static async update(id, data) {
        const allowedFields = ['name', 'price', 'category', 'stock', 'description', 'sizes', 'image'];
        const fields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(data)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                
                if (key === 'sizes' && typeof value === 'object') {
                    values.push(JSON.stringify(value));
                } else {
                    values.push(value);
                }
            }
        }
        
        if (fields.length === 0) {
            return false;
        }
        
        // Agregar el ID al final de los valores
        values.push(id);
        
        const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
        
        console.log('📝 SQL Update:', sql);
        console.log('📝 Valores:', values);
        
        try {
            const [result] = await pool.execute(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error en Product.update:', error);
            throw error;
        }
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async updateSales(id, quantity) {
        const [result] = await pool.execute(
            'UPDATE products SET sales = sales + ? WHERE id = ?',
            [quantity, id]
        );
        return result.affectedRows > 0;
    }

    static async getProductImages(productId) {
        const [rows] = await pool.execute(
            'SELECT id, image_url, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC',
            [productId]
        );
        return rows;
    }

    static async getAllPaginated(limit, offset) {
        const [rows] = await pool.execute(
            'SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        return rows;
    }

    static async getTotalCount() {
        const [rows] = await pool.execute('SELECT COUNT(*) as total FROM products');
        return rows[0].total;
    }

    static async addProductImage(productId, imageUrl, displayOrder = 0) {
        const [result] = await pool.execute(
            'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
            [productId, imageUrl, displayOrder]
        );
        return result.insertId;
    }

    static async deleteProductImagesByIds(imageIds) {
        if (!imageIds || imageIds.length === 0) return;
        
        const placeholders = imageIds.map(() => '?').join(',');
        await pool.execute(
            `DELETE FROM product_images WHERE id IN (${placeholders})`,
            imageIds
        );
    }

    static async deleteProductImages(productId) {
        await pool.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
    }
}

module.exports = Product;
