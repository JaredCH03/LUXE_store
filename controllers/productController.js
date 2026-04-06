const Product = require('../models/Product');

// Obtener todos los productos con paginación
exports.getAllProducts = async (req, res) => {
    try {
        // Obtener parámetros de consulta: ?page=1&limit=12
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        // Obtener productos paginados
        const products = await Product.getAllPaginated(limit, offset);
        // Obtener total de productos (para calcular número de páginas)
        const total = await Product.getTotalCount();

        res.json({
            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.getById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener producto' });
    }
};

exports.getProductsByCategory = async (req, res) => {
    try {
        const products = await Product.getByCategory(req.params.category);
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener productos' });
    }
};

exports.getMyProducts = async (req, res) => {
    try {
        if (req.user.role !== 'seller') return res.status(403).json({ success: false, message: 'Solo vendedores' });
        const products = await Product.getBySeller(req.user.id);
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener productos' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        if (req.user.role !== 'seller') {
            return res.status(403).json({ success: false, message: 'Solo vendedores pueden crear productos' });
        }
        const { name, price, category, image, stock, description, sizes, additionalImages } = req.body;
        // Guardar producto principal
        const product = await Product.create({
            name, price, category, image, stock, description,
            sizes: sizes || {},
            sellerId: req.user.id
        });
        // Guardar imágenes adicionales
        if (additionalImages && additionalImages.length) {
            for (let i = 0; i < additionalImages.length; i++) {
                await Product.addProductImage(product.id, additionalImages[i], i);
            }
        }
        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
    console.log('Body recibido:', req.body);
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.getById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        if (product.seller_id !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'No tienes permiso' });
        const updated = await Product.update(req.params.id, req.body);
        updated ? res.json({ success: true, message: 'Producto actualizado' }) : res.status(400).json({ success: false, message: 'Error al actualizar' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.getById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        if (product.seller_id !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'No tienes permiso' });
        const deleted = await Product.delete(req.params.id);
        deleted ? res.json({ success: true, message: 'Producto eliminado' }) : res.status(400).json({ success: false, message: 'Error al eliminar' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
};

// Obtener imágenes adicionales de un producto
exports.getProductImages = async (req, res) => {
    try {
        const images = await Product.getProductImages(req.params.id);
        res.json({ success: true, images });
    } catch (error) {
        console.error('Error al obtener imágenes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener imágenes del producto' });
    }
};