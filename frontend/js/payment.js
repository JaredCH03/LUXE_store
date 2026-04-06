// Configuración de pasarelas de pago (simuladas)
const PAYMENT_GATEWAYS = {
    credit_card: {
        name: 'Tarjeta de Crédito',
        processPayment: processCreditCardPayment
    },
    paypal: {
        name: 'PayPal',
        processPayment: processPayPalPayment
    },
    transfer: {
        name: 'Transferencia Bancaria',
        processPayment: processBankTransfer
    }
};

// Procesar pago con tarjeta de crédito
async function processCreditCardPayment(paymentData) {
    // Validar datos de tarjeta
    const cardNumber = paymentData.cardNumber.replace(/\s/g, '');
    const expiryDate = paymentData.expiryDate;
    const cvv = paymentData.cvv;
    const cardName = paymentData.cardName;
    
    // Validaciones básicas
    if (!isValidCardNumber(cardNumber)) {
        throw new Error('Número de tarjeta inválido');
    }
    
    if (!isValidExpiryDate(expiryDate)) {
        throw new Error('Fecha de expiración inválida');
    }
    
    if (!isValidCVV(cvv)) {
        throw new Error('CVV inválido');
    }
    
    if (!cardName || cardName.trim().length < 3) {
        throw new Error('Nombre del titular inválido');
    }
    
    // Simular procesamiento de pago (en producción esto iría a un backend)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simular éxito aleatorio (95% de éxito)
            const isSuccess = Math.random() < 0.95;
            
            if (isSuccess) {
                resolve({
                    success: true,
                    transactionId: 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    message: 'Pago procesado exitosamente'
                });
            } else {
                reject(new Error('Error al procesar el pago. Por favor, intenta nuevamente.'));
            }
        }, 1500);
    });
}

// Procesar pago con PayPal (simulado)
async function processPayPalPayment(paymentData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const isSuccess = Math.random() < 0.95;
            
            if (isSuccess) {
                resolve({
                    success: true,
                    transactionId: 'PP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    message: 'Pago con PayPal procesado exitosamente'
                });
            } else {
                reject(new Error('Error con PayPal. Por favor, intenta nuevamente.'));
            }
        }, 1500);
    });
}

// Procesar transferencia bancaria
async function processBankTransfer(paymentData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                transactionId: 'TRF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                message: 'Transferencia registrada. Pendiente de confirmación.',
                bankInfo: {
                    bank: 'Banco de la Nación',
                    account: '0011-0245-0201234567',
                    accountName: 'LUXE TIENDA SAC',
                    reference: 'LUXE_' + Date.now()
                }
            });
        }, 1000);
    });
}

// Validar número de tarjeta (Luhn algorithm)
function isValidCardNumber(cardNumber) {
    const regex = /^[0-9]{16}$/;
    if (!regex.test(cardNumber)) return false;
    
    // Algoritmo de Luhn
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Validar fecha de expiración
function isValidExpiryDate(expiryDate) {
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!regex.test(expiryDate)) return false;
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year);
    const expMonth = parseInt(month);
    
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
}

// Validar CVV
function isValidCVV(cvv) {
    const regex = /^[0-9]{3,4}$/;
    return regex.test(cvv);
}

// Formatear número de tarjeta con espacios
function formatCardNumber(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
        return parts.join(' ');
    } else {
        return value;
    }
}

// Formatear fecha de expiración
function formatExpiryDate(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
        return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
}

// Obtener tipo de tarjeta por número
function getCardType(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    
    return 'unknown';
}

// Mostrar resultado del pago
function showPaymentResult(success, message, transactionId = null) {
    const resultDiv = document.createElement('div');
    resultDiv.className = `payment-result ${success ? 'success' : 'error'}`;
    resultDiv.innerHTML = `
        <div class="result-icon">${success ? '✓' : '✗'}</div>
        <div class="result-message">${message}</div>
        ${transactionId ? `<div class="transaction-id">ID Transacción: ${transactionId}</div>` : ''}
    `;
    
    const container = document.querySelector('.payment-form-container');
    container.insertBefore(resultDiv, container.firstChild);
    
    setTimeout(() => {
        resultDiv.remove();
    }, 5000);
}

// Guardar orden completada
function saveOrder(orderData) {
    const user = getCurrentUser();
    if (user) {
        const orders = JSON.parse(localStorage.getItem(`orders_${user.id}`) || '[]');
        orders.push({
            ...orderData,
            orderId: 'ORD_' + Date.now(),
            date: new Date().toISOString(),
            status: 'completed'
        });
        localStorage.setItem(`orders_${user.id}`, JSON.stringify(orders));
    }
}

// Exportar funciones para uso global
window.PaymentSystem = {
    processPayment: async (paymentMethod, paymentData, cart, total) => {
        try {
            // Validar que el carrito no esté vacío
            if (!cart || cart.length === 0) {
                throw new Error('El carrito está vacío');
            }
            
            // Procesar según método de pago
            let result;
            switch (paymentMethod) {
                case 'credit_card':
                    result = await processCreditCardPayment(paymentData);
                    break;
                case 'paypal':
                    result = await processPayPalPayment(paymentData);
                    break;
                case 'transfer':
                    result = await processBankTransfer(paymentData);
                    break;
                default:
                    throw new Error('Método de pago no válido');
            }
            
            if (result.success) {
                // Guardar orden
                const orderData = {
                    cart: cart,
                    total: total,
                    paymentMethod: paymentMethod,
                    transactionId: result.transactionId,
                    shippingAddress: paymentData.shippingAddress
                };
                saveOrder(orderData);
                
                // Limpiar carrito
                localStorage.removeItem('luxe_cart');
                
                return result;
            }
        } catch (error) {
            throw error;
        }
    }
};

// Formateadores para inputs
window.formatCardNumber = formatCardNumber;
window.formatExpiryDate = formatExpiryDate;
window.getCardType = getCardType;