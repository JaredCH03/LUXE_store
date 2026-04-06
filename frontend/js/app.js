// =====================================================
// app.js - VERSIÓN CON SOPORTE DE TALLAS (FUNCIONAL)
// =====================================================

let cart = [];
let cartTotal = 0;
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

async function fetchProducts(page = 1) {
    if (isLoading) return [];
    isLoading = true;
    try {
        const res = await fetch(`${API_URL}/products?page=${page}&limit=12`);
        const data = await res.json();
        if (data.success) {
            currentPage = data.pagination.page;
            totalPages = data.pagination.totalPages;
            return data.products;
        }
        throw new Error('API error');
    } catch (err) {
        console.warn('Usando productos de prueba');
        return [];
    } finally {
        isLoading = false;
    }
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    const colors = { success: '#4caf50', error: '#f44336', info: '#2196f3' };
    notification.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: ${colors[type]}; color: white;
        padding: 1rem 1.5rem; border-radius: 10px;
        z-index: 2000;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
}

async function renderProducts(page = 1) {
    const products = await fetchProducts(page);
    const cadenas = products.filter(p => p.category === 'cadenas');
    const anillos = products.filter(p => p.category === 'anillos');
    const zapatos = products.filter(p => p.category === 'zapatos');
    
    const cadenasSection = document.getElementById('cadenas');
    const anillosSection = document.getElementById('anillos');
    const zapatosSection = document.getElementById('zapatos');
    
    if (cadenasSection) {
        if (cadenas.length > 0) {
            cadenasSection.style.display = 'block';
            renderCategory(cadenas, 'cadenasGrid');
        } else {
            cadenasSection.style.display = 'none';
        }
    }
    if (anillosSection) {
        if (anillos.length > 0) {
            anillosSection.style.display = 'block';
            renderCategory(anillos, 'anillosGrid');
        } else {
            anillosSection.style.display = 'none';
        }
    }
    if (zapatosSection) {
        if (zapatos.length > 0) {
            zapatosSection.style.display = 'block';
            renderCategory(zapatos, 'zapatosGrid');
        } else {
            zapatosSection.style.display = 'none';
        }
    }
    renderPaginationControls();
}

function renderCategory(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center">No hay productos</p>';
        return;
    }
    container.innerHTML = products.map(p => {
        const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='16'%3E${encodeURIComponent(p.name)}%3C/text%3E%3C/svg%3E`;
        const imgSrc = (p.image && p.image !== '') ? p.image : placeholder;
        return `
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
                <img src="${imgSrc}" alt="${p.name}" class="product-image" onerror="this.onerror=null; this.src='${placeholder}'">
                <div class="product-info">
                    <h3 class="product-name">${p.name}</h3>
                    <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id})">Agregar al carrito</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderPaginationControls() {
    let paginationContainer = document.getElementById('paginationControls');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationControls';
        paginationContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin: 2rem 0;
            flex-wrap: wrap;
        `;
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.appendChild(paginationContainer);
    }
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    let buttons = '';
    if (currentPage > 1) {
        buttons += `<button class="pagination-btn" data-page="${currentPage - 1}" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Anterior</button>`;
    }
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
        const activeStyle = i === currentPage ? 'background: #c9a03d; color: white; border-color: #c9a03d;' : '';
        buttons += `<button class="pagination-btn" data-page="${i}" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer; ${activeStyle}">${i}</button>`;
    }
    if (currentPage < totalPages) {
        buttons += `<button class="pagination-btn" data-page="${currentPage + 1}" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Siguiente</button>`;
    }
    paginationContainer.innerHTML = buttons;
    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const newPage = parseInt(btn.dataset.page);
            if (!isNaN(newPage) && newPage !== currentPage) {
                await renderProducts(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

function saveCart() { localStorage.setItem('luxe_cart', JSON.stringify(cart)); }
function loadCart() {
    const saved = localStorage.getItem('luxe_cart');
    if (saved) { cart = JSON.parse(saved); updateCartUI(); }
}

function updateCartUI() 
{
    console.log('=== CARRITO ACTUAL ===');
    console.log(JSON.parse(JSON.stringify(cart))); 
    console.log('updateCartUI ejecutándose');
    // Forzar recarga del carrito desde localStorage
    /*const savedCart = localStorage.getItem('luxe_cart');
   // if (savedCart) {
        cart = JSON.parse(savedCart);
    } else {
        cart = [];
    }*/
    console.log('Cart después de recargar:', cart);
    
    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    console.log('Count calculado:', count);
    
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        countEl.textContent = count;
        console.log('Contador actualizado a:', count);
    } else {
        console.warn('Elemento #cartCount no encontrado');
    }
    
    const total = cart.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) {
        totalEl.textContent = `$${total.toFixed(2)}`;
    }
    
    renderCartItems();
    saveCart();
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;">Carrito vacío</div>';
        return;
    }
    container.innerHTML = cart.map((item, idx) => {
        const price = parseFloat(item.price) || 0;
        const quantity = item.quantity || 1;
        const totalItemPrice = price * quantity;
        const sizeDisplay = item.size ? `<div class="cart-item-size">Talla: ${item.size}</div>` : '';
        const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 70 70'%3E%3Crect width='70' height='70' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3E${encodeURIComponent(item.name)}%3C/text%3E%3C/svg%3E`;
        const imageUrl = item.image && item.image !== '' ? item.image : placeholderSvg;
        return `
            <div class="cart-item" data-id="${item.id}" data-size="${item.size || ''}" data-index="${idx}">
                <img src="${imageUrl}" class="cart-item-image" onerror="this.onerror=null; this.src='${placeholderSvg}'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">$${price.toFixed(2)}</div>
                    ${sizeDisplay}
                    <div class="cart-item-actions">
                        <button class="qty-btn" data-action="decrease" data-index="${idx}">-</button>
                        <span class="qty-value">${quantity}</span>
                        <button class="qty-btn" data-action="increase" data-index="${idx}">+</button>
                        <button class="remove-btn" data-index="${idx}">🗑️</button>
                    </div>
                </div>
                <div>$${totalItemPrice.toFixed(2)}</div>
            </div>
        `;
    }).join('');
    
    // Agregar event listeners a los botones del carrito
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.removeEventListener('click', handleQuantityClick);
        btn.addEventListener('click', handleQuantityClick);
    });
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.removeEventListener('click', handleRemoveClick);
        btn.addEventListener('click', handleRemoveClick);
    });
}

function handleQuantityClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const index = parseInt(btn.dataset.index);
    
    if (isNaN(index) || !cart[index]) return;
    
    const change = action === 'increase' ? 1 : -1;
    const newQty = (cart[index].quantity || 1) + change;
    
    if (newQty <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].quantity = newQty;
    }
    updateCartUI();
    showNotification('Carrito actualizado', 'success');
}

function handleRemoveClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const index = parseInt(btn.dataset.index);
    
    if (isNaN(index) || !cart[index]) return;
    
    const productName = cart[index].name;
    cart.splice(index, 1);
    updateCartUI();
    showNotification(`${productName} eliminado`, 'info');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

window.addToCart = async function (id) {
    if (!isLoggedIn()) {
        showNotification('Inicia sesión primero', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }
    try {
        const res = await fetch(`${API_URL}/products/${id}`);
        const data = await res.json();
        if (data.success) {
            const p = data.product;
            const exist = cart.find(i => i.id === id && !i.size);
            if (exist) {
                exist.quantity = (exist.quantity || 1) + 1;
            } else {
                cart.push({
                    id: p.id,
                    name: p.name,
                    price: parseFloat(p.price),
                    quantity: 1,
                    image: p.image || p.imagen,
                    size: null
                });
            }
            updateCartUI();
            showNotification(`${p.name} agregado al carrito`, 'success');
        }
    } catch (err) {
        console.error(err);
        showNotification('Error al agregar producto', 'error');
    }
};

// Reemplaza tu función updateQuantity existente con esta:
/*window.updateQuantity = function (id, size, change) {
    console.log('updateQuantity llamado:', {id, size, change});
    
    // Normalizar size: undefined, null o string vacío se tratan como "sin talla"
    const normalizedSize = (size && size !== 'null' && size !== 'undefined') ? String(size) : '';
    
    const index = cart.findIndex(item => {
        const itemSize = (item.size && item.size !== 'null' && item.size !== 'undefined') ? String(item.size) : '';
        return item.id === id && itemSize === normalizedSize;
    });
    
    if (index !== -1) {
        const newQty = (cart[index].quantity || 1) + change;
        if (newQty <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = newQty;
        }
        updateCartUI();
        showNotification('Carrito actualizado', 'success');
    } else {
        console.warn('Producto no encontrado en carrito:', {id, size, normalizedSize});
        console.log('Carrito actual:', cart);
    }
};

// Reemplaza tu función removeFromCart existente con esta:
window.removeFromCart = function (id, size) {
    console.log('removeFromCart llamado:', {id, size});
    
    // Normalizar size
    const normalizedSize = (size && size !== 'null' && size !== 'undefined') ? String(size) : '';
    
    const newCart = cart.filter(item => {
        const itemSize = (item.size && item.size !== 'null' && item.size !== 'undefined') ? String(item.size) : '';
        return !(item.id === id && itemSize === normalizedSize);
    });
    
    if (newCart.length !== cart.length) {
        const removedItem = cart.find(item => {
            const itemSize = (item.size && item.size !== 'null' && item.size !== 'undefined') ? String(item.size) : '';
            return item.id === id && itemSize === normalizedSize;
        });
        cart = newCart;
        updateCartUI();
        if (removedItem) {
            showNotification(`${removedItem.name} eliminado del carrito`, 'info');
        }
    }
};*/



function goToCheckout() {
    if (!isLoggedIn()) { alert('Inicia sesión'); window.location.href = 'login.html'; return; }
    if (cart.length === 0) { alert('Carrito vacío'); return; }
    localStorage.setItem('checkout_cart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

function updateUserUI() {
    const user = getCurrentUser();
    const loggedIn = document.querySelectorAll('.logged-in-only');
    const loggedOut = document.querySelectorAll('.logged-out-only');
    if (user) {
        loggedIn.forEach(el => el.style.display = 'inline-block');
        loggedOut.forEach(el => el.style.display = 'none');
        const userName = user.name || user.nombre || 'Usuario';
        document.querySelectorAll('.user-name').forEach(el => el.textContent = userName.split(' ')[0]);
    } else {
        loggedIn.forEach(el => el.style.display = 'none');
        loggedOut.forEach(el => el.style.display = 'inline-block');
    }
}

function initUserMenu() {
    const btn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    if (btn && dropdown) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        window.addEventListener('click', () => dropdown.classList.remove('show'));
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

function initCartModal() {
    const modal = document.getElementById('cartModal');
    const cartBtn = document.getElementById('cartBtn');
    const close = document.querySelector('.close-modal');
    if (cartBtn && modal) {
        cartBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            renderCartItems();
        });
    }
    if (close && modal) {
        close.addEventListener('click', () => modal.style.display = 'none');
    }
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
}

function initCheckoutButton() {
    const btn = document.getElementById('checkoutBtn');
    if (btn) btn.addEventListener('click', goToCheckout);
}

function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            menu.classList.toggle('active');
            toggle.textContent = menu.classList.contains('active') ? '✕' : '☰';
        });
        menu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => { menu.classList.remove('active'); toggle.textContent = '☰'; });
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    loadCart();
    initCartModal();
    initCheckoutButton();
    updateUserUI();
    initUserMenu();
    initMobileMenu();
    if (document.getElementById('cadenasGrid')) {
        await renderProducts(1);
    }
});