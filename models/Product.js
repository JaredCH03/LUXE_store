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
      console.log('🏷️ Guardando producto con tallas:', sizes); // ← log
    const [result] = await pool.execute(
        `INSERT INTO products 
         (name, description, price, image, category, stock, seller_id, sizes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, price, image, category, stock, sellerId, JSON.stringify(sizes || {})]
    );
    return { id: result.insertId, ...product };
}

    static async update(id, data) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }
        if (fields.length === 0) return false;
        values.push(id);
        const [result] = await pool.execute(
            `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
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


    // Obtener imágenes adicionales de un producto
static async getProductImages(productId) {
    const [rows] = await pool.execute(
        'SELECT id, image_url, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC',
        [productId]
    );
    return rows;
}

// Obtener productos paginados
static async getAllPaginated(limit, offset) {
    const [rows] = await pool.execute(
        'SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
    );
    return rows;
}

// Obtener el número total de productos (sin paginación)
static async getTotalCount() {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM products');
    return rows[0].total;
}

// Agregar una imagen adicional
static async addProductImage(productId, imageUrl, displayOrder = 0) {
    const [result] = await pool.execute(
        'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
        [productId, imageUrl, displayOrder]
    );
    return result.insertId;
}

// Eliminar todas las imágenes de un producto (útil al actualizar)
static async deleteProductImages(productId) {
    await pool.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
}
}

module.exports = Product;