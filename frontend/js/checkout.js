// Checkout
//const API_URL = 'http://localhost:5000/api';
let cart = [];

function getCart() {
    const saved = localStorage.getItem('checkout_cart');
    return saved ? JSON.parse(saved) : [];
}

function displaySummary() {
    cart = getCart();
    const container = document.getElementById('orderItems');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<p>Carrito vacío</p>';
        return;
    }
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const total = subtotal + 10;

    /*funcion para mostrar la talla*/ 
    container.innerHTML = cart.map(i => {
        // Placeholder SVG con el nombre del producto
        const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3E${encodeURIComponent(i.name)}%3C/text%3E%3C/svg%3E`;
        const imgSrc = (i.image && i.image !== '') ? i.image : placeholderSvg;
        return `
            <div class="order-item">
                <img src="${imgSrc}" class="order-item-image" onerror="this.onerror=null; this.src='${placeholderSvg}'">
                <div class="order-item-info">
                    <div class="order-item-name">${i.name}</div>
                    <div class="order-item-price">$${i.price.toFixed(2)}</div>
                    <div class="order-item-quantity">x${i.quantity}</div>
                </div>
                <div>$${(i.price * i.quantity).toFixed(2)}</div>
            </div>
        `;
    }).join('');
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
    container.innerHTML = cart.map(i => {
    const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3E${encodeURIComponent(i.name)}%3C/text%3E%3C/svg%3E`;
    const imgSrc = (i.image && i.image !== '') ? i.image : placeholderSvg;
    return `
        <div class="order-item">
            <img src="${imgSrc}" class="order-item-image" onerror="this.onerror=null; this.src='${placeholderSvg}'">
            <div class="order-item-info">
                <div class="order-item-name">${i.name}</div>
                <div class="order-item-price">$${i.price.toFixed(2)}</div>
                <div class="order-item-quantity">x${i.quantity}</div>
                ${i.size ? `<div class="order-item-size">Talla: ${i.size}</div>` : ''}
            </div>
            <div>$${(i.price * i.quantity).toFixed(2)}</div>
        </div>
    `;
}).join('');
}

function toggleCardFields() {
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const cardFields = document.getElementById('cardFields');
    if (cardFields) cardFields.style.display = method === 'credit_card' ? 'block' : 'none';
}

function validateForm() {
    const email = document.getElementById('email')?.value;
    const fullName = document.getElementById('fullName')?.value;
    const address = document.getElementById('address')?.value;
    if (!email || !fullName || !address) {
        alert('Completa todos los campos');
        return false;
    }
    return true;
}

async function processPayment() {
    const payBtn = document.getElementById('payBtn');
    payBtn.disabled = true;
    payBtn.textContent = 'Procesando...';
    try {
        const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        cart = getCart();
        if (cart.length === 0) throw new Error('Carrito vacío');
        const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        const total = subtotal + 10;
        const orderData = {
            items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
            total: total,
            paymentMethod: method,
            shippingAddress: {
                fullName: document.getElementById('fullName').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city')?.value || '',
                phone: document.getElementById('phone')?.value || '',
                email: document.getElementById('email').value
            }
        };
        const token = getToken();
        if (!token) throw new Error('No estás logueado');
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();
        if (data.success) {
            localStorage.removeItem('checkout_cart');
            localStorage.removeItem('luxe_cart');
            // Notificación eliminada
            window.location.href = 'payment-success.html?orderId=' + data.order.orderNumber;
        } else {
            throw new Error(data.message || 'Error en pago');
        }
    } catch (err) {
        alert(err.message);
        payBtn.disabled = false;
        payBtn.textContent = 'Pagar ahora';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        alert('Debes iniciar sesión');
        window.location.href = 'login.html';
        return;
    }
    displaySummary();
    toggleCardFields();
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', toggleCardFields);
    });
    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (validateForm()) await processPayment();
    });
});