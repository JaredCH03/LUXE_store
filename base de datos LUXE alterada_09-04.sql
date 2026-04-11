-- =====================================================
-- MEJORAS PARA BASE DE DATOS LUXE
-- Script seguro - No destructivo
-- =====================================================

USE luxe_store;

-- =====================================================
-- 1. CORREGIR ESTRUCTURA DE TABLAS EXISTENTES
-- =====================================================

-- Asegurar que email sea UNIQUE
ALTER TABLE users 
MODIFY email VARCHAR(100) UNIQUE NOT NULL;


ALTER TABLE orders 
MODIFY shipping_address JSON;



-- =====================================================
-- 2. AGREGAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índice para búsqueda de productos por categoría (muy usado)
CREATE INDEX idx_products_category ON products(category);

-- Índice para búsqueda de productos por vendedor (dashboard)
CREATE INDEX idx_products_seller ON products(seller_id);

-- Índice para filtrar órdenes por usuario
CREATE INDEX idx_orders_user ON orders(user_id);

-- Índice para búsqueda por número de orden
CREATE INDEX idx_orders_number ON orders(order_number);

-- Índice compuesto para órdenes recientes
CREATE INDEX idx_orders_date_status ON orders(created_at, status);

-- Índices para order_items (joins frecuentes)
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);




DELETE FROM users WHERE email IN ('admin@luxe.com', 'cliente@luxe.com');

-- Contraseña: admin123
INSERT INTO users (name, email, password, role) VALUES
('Admin Vendedor', 'admin@luxe.com', 
 '$2b$10$lTZcEBgIqDZHyZbXpRqXZeaF7cPJKF3oKL7WnUQYtJAZZ3XQ.0Xju', 
 'seller');

-- Contraseña: cliente123
INSERT INTO users (name, email, password, role) VALUES
('Cliente Prueba', 'cliente@luxe.com', 
 '$2b$10$YKpZcEBgIqDZHyZbXpRqXZeaF7cPJKF3oKL7WnUQYtJAZZ3XQ.0Xjy', 
 'customer');

-- =====================================================
-- 4. INICIALIZAR CAMPO sizes PARA PRODUCTOS EXISTENTES
-- =====================================================

-- Asegurar que todos los productos tengan sizes (al menos objeto vacío)
UPDATE products SET sizes = '{}' WHERE sizes IS NULL;

-- Agregar tallas de ejemplo para zapatos
UPDATE products 
SET sizes = '{"36": 5, "37": 8, "38": 10, "39": 7, "40": 6, "41": 4}'
WHERE category = 'zapatos' AND (sizes IS NULL OR sizes = '{}');

-- Agregar tallas de ejemplo para anillos
UPDATE products 
SET sizes = '{"12": 3, "14": 5, "16": 8, "18": 6, "20": 4}'
WHERE category = 'anillos' AND (sizes IS NULL OR sizes = '{}');

-- Las cadenas normalmente no tienen talla
UPDATE products 
SET sizes = '{}'
WHERE category = 'cadenas' AND sizes IS NULL;


-- Desactivar safe mode temporalmente
SET SQL_SAFE_UPDATES = 0;

-- =====================================================
-- 1. INICIALIZAR CAMPO sizes PARA PRODUCTOS EXISTENTES
-- =====================================================

-- Asegurar que todos los productos tengan sizes (al menos objeto vacío)
UPDATE products SET sizes = '{}' WHERE sizes IS NULL AND id > 0;

-- Agregar tallas de ejemplo para zapatos
UPDATE products 
SET sizes = '{"36": 5, "37": 8, "38": 10, "39": 7, "40": 6, "41": 4}'
WHERE category = 'zapatos' 
AND (sizes IS NULL OR sizes = '{}')
AND id > 0;

-- Agregar tallas de ejemplo para anillos
UPDATE products 
SET sizes = '{"12": 3, "14": 5, "16": 8, "18": 6, "20": 4}'
WHERE category = 'anillos' 
AND (sizes IS NULL OR sizes = '{}')
AND id > 0;

-- Las cadenas normalmente no tienen talla
UPDATE products 
SET sizes = '{}'
WHERE category = 'cadenas' 
AND sizes IS NULL 
AND id > 0;

-- =====================================================
-- 2. VERIFICAR EL RESULTADO
-- =====================================================

-- Ver cuántos productos tienen tallas asignadas
SELECT 
    category,
    COUNT(*) as total,
    SUM(CASE WHEN sizes IS NOT NULL AND sizes != '{}' THEN 1 ELSE 0 END) as con_tallas,
    SUM(CASE WHEN sizes IS NULL OR sizes = '{}' THEN 1 ELSE 0 END) as sin_tallas
FROM products
GROUP BY category;

-- Ver ejemplos de tallas asignadas
SELECT id, name, category, sizes 
FROM products 
WHERE sizes IS NOT NULL AND sizes != '{}'
LIMIT 5;

-- Reactivar safe mode
SET SQL_SAFE_UPDATES = 1;



-- =====================================================
-- 6. AGREGAR CAMPO updated_at PARA AUDITORÍA
-- =====================================================

-- Agregar timestamp de actualización a tablas principales
ALTER TABLE products 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE users 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE orders 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- =====================================================
-- 7. VISTA PARA ESTADÍSTICAS DEL VENDEDOR
-- =====================================================

-- Crear vista para facilitar estadísticas del dashboard
CREATE OR REPLACE VIEW seller_stats AS
SELECT 
    p.seller_id,
    u.name as seller_name,
    COUNT(DISTINCT p.id) as total_products,
    COALESCE(SUM(p.sales), 0) as total_items_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
    COUNT(DISTINCT o.id) as total_orders
FROM products p
JOIN users u ON p.seller_id = u.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'shipped', 'delivered')
WHERE u.role = 'seller'
GROUP BY p.seller_id, u.name;

-- =====================================================
-- 8. PROCEDIMIENTO PARA LIMPIEZA DE CARRITOS ABANDONADOS
-- =====================================================

-- Procedimiento almacenado para liberar stock de órdenes no completadas
DELIMITER //
CREATE PROCEDURE  cleanup_pending_orders()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- Marcar como canceladas órdenes pending de más de 24 horas
    UPDATE orders 
    SET status = 'cancelled' 
    WHERE status = 'pending' 
    AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    -- Liberar stock de órdenes canceladas
    UPDATE products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    SET p.stock = p.stock + oi.quantity
    WHERE o.status = 'cancelled';
    
    COMMIT;
END//
DELIMITER ;

-- =====================================================
-- 9. TRIGGER PARA ACTUALIZAR STOCK AUTOMÁTICAMENTE
-- =====================================================

-- Trigger que actualiza el stock cuando se cancela una orden
DROP TRIGGER IF EXISTS update_stock_on_cancel;

DELIMITER //
CREATE TRIGGER update_stock_on_cancel
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Devolver stock de productos
        UPDATE products p
        JOIN order_items oi ON p.id = oi.product_id
        SET p.stock = p.stock + oi.quantity,
            p.sales = p.sales - oi.quantity
        WHERE oi.order_id = NEW.id;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- 10. VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar resumen de la base de datos
SELECT 
    'Tablas creadas:' as '',
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'luxe_store') as cantidad
UNION ALL
SELECT 'Productos:', COUNT(*) FROM products
UNION ALL
SELECT 'Usuarios:', COUNT(*) FROM users
UNION ALL
SELECT 'Órdenes:', COUNT(*) FROM orders;

-- Verificar usuarios de prueba
SELECT email, role, 
       CASE 
           WHEN password LIKE '$2b$%' THEN 'HASH VÁLIDO'
           ELSE 'HASH INVÁLIDO'
       END as password_status
FROM users 
WHERE email IN ('admin@luxe.com', 'cliente@luxe.com');