const pool = require('../backend/config/database');


async function cleanupAbondoneOrders() {
    try {
        await pool.execute('CALL cleanup_pending_orders()');
        console.log('Limpieza de ordenes completada');
    } catch (error) {
        console.error('Error en limpieza:', error);

    }
}

//EJECUTAR CADA 6 HORAS
setInterval(cleanupAbondoneOrders,6*60*60*1000);