const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
};

const sellerOnly = (req, res, next) => {
    if (req.user.role !== 'seller') {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Solo vendedores.' });
    }
    next();
};

module.exports = { protect, sellerOnly };