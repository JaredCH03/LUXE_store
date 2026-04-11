// =====================================================
// app.js - LUXE STORE - VERSIÓN COMPLETA Y ORDENADA
// =====================================================

// ============ VARIABLES GLOBALES ============
window.cart = [];
window.cartTotal = 0;

let cart = window.cart;
let cartTotal = 0;
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

// Variables para búsqueda y filtros
let allProducts = [];
let filteredProducts = [];
let currentFilters = {
    search: '',
    category: '',
    minPrice: null,
    maxPrice: null,
    inStockOnly: false,
    sortBy: 'default'
};

// ============ FUNCIONES DE UTILIDAD ============

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function showLoading(show) {
    const existingLoader = document.querySelector('.global-loader');
    if (show) {
        if (!existingLoader) {
            const loader = document.createElement('div');
            loader.className = 'global-loader';
            loader.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 9999;
            `;
            loader.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(loader);
        }
    } else {
        if (existingLoader) existingLoader.remove();
    }
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    const colors = { success: '#4caf50', error: '#f44336', info: '#2196f3' };
    
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 2000;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
}

// Asegurar que showNotification esté disponible globalmente
window.showNotification = showNotification;

// ============ FUNCIONES DE API ============

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
        console.warn('Error al cargar productos:', err);
        return [];
    } finally {
        isLoading = false;
    }
}

async function loadAllProducts() {
    try {
        showLoading(true);
        const res = await fetch(`${API_URL}/products?page=1&limit=100`);
        const data = await res.json();
        if (data.success) {
            allProducts = data.products || [];
            console.log(`📦 ${allProducts.length} productos cargados`);
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        allProducts = [];
    } finally {
        showLoading(false);
    }
}

// ============ FUNCIONES DE RENDERIZADO ============

function renderCategory(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:2rem;">No hay productos en esta categoría</p>';
        return;
    }
    
    container.innerHTML = products.map(p => {
        const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='16'%3E${encodeURIComponent(p.name || 'Producto')}%3C/text%3E%3C/svg%3E`;
        const imgSrc = (p.image && p.image !== '') ? p.image : placeholder;
        const outOfStock = !p.stock || p.stock <= 0;
        
        return `
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
                <div style="position: relative;">
                    <img src="${imgSrc}" alt="${p.name}" class="product-image" onerror="this.onerror=null; this.src='${placeholder}'">
                    ${outOfStock ? '<span class="out-of-stock-badge">Agotado</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${p.name}</h3>
                    <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id})" ${outOfStock ? 'disabled' : ''}>
                        ${outOfStock ? 'Agotado' : 'Agregar al carrito'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderFilteredProducts() {
    const cadenas = filteredProducts.filter(p => p.category === 'cadenas');
    const anillos = filteredProducts.filter(p => p.category === 'anillos');
    const zapatos = filteredProducts.filter(p => p.category === 'zapatos');
    
    renderCategory(cadenas, 'cadenasGrid');
    renderCategory(anillos, 'anillosGrid');
    renderCategory(zapatos, 'zapatosGrid');
    
    toggleSectionVisibility('cadenas', cadenas.length > 0);
    toggleSectionVisibility('anillos', anillos.length > 0);
    toggleSectionVisibility('zapatos', zapatos.length > 0);
}

function toggleSectionVisibility(category, hasProducts) {
    const section = document.getElementById(category);
    if (section) {
        section.style.display = hasProducts ? 'block' : 'none';
    }
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

async function renderProducts(page = 1) {
    const products = await fetchProducts(page);
    const cadenas = products.filter(p => p.category === 'cadenas');
    const anillos = products.filter(p => p.category === 'anillos');
    const zapatos = products.filter(p => p.category === 'zapatos');
    
    const cadenasSection = document.getElementById('cadenas');
    const anillosSection = document.getElementById('anillos');
    const zapatosSection = document.getElementById('zapatos');
    
    if (cadenasSection) {
        cadenasSection.style.display = cadenas.length > 0 ? 'block' : 'none';
        renderCategory(cadenas, 'cadenasGrid');
    }
    if (anillosSection) {
        anillosSection.style.display = anillos.length > 0 ? 'block' : 'none';
        renderCategory(anillos, 'anillosGrid');
    }
    if (zapatosSection) {
        zapatosSection.style.display = zapatos.length > 0 ? 'block' : 'none';
        renderCategory(zapatos, 'zapatosGrid');
    }
    renderPaginationControls();
}

// ============ FUNCIONES DE BÚSQUEDA Y FILTROS ============

function applyFilters() {
    filteredProducts = allProducts.filter(product => {
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const nameMatch = (product.name || '').toLowerCase().includes(searchTerm);
            const descMatch = (product.description || '').toLowerCase().includes(searchTerm);
            if (!nameMatch && !descMatch) return false;
        }
        
        if (currentFilters.category && product.category !== currentFilters.category) {
            return false;
        }
        
        if (currentFilters.minPrice !== null && product.price < currentFilters.minPrice) {
            return false;
        }
        
        if (currentFilters.maxPrice !== null && product.price > currentFilters.maxPrice) {
            return false;
        }
        
        if (currentFilters.inStockOnly && (!product.stock || product.stock <= 0)) {
            return false;
        }
        
        return true;
    });
    
    sortProducts();
    renderFilteredProducts();
    updateResultsCount();
}

function sortProducts() {
    switch (currentFilters.sortBy) {
        case 'price_asc':
            filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price_desc':
            filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'best_selling':
            filteredProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
            break;
        default:
            filteredProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            break;
    }
}

function updateResultsCount() {
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
        if (filteredProducts.length === 0) {
            countEl.innerHTML = '<p style="text-align: center; color: #999;">😕 No se encontraron productos</p>';
        } else {
            countEl.textContent = `${filteredProducts.length} producto(s) encontrado(s)`;
        }
    }
}

function clearAllFilters() {
    currentFilters = {
        search: '',
        category: '',
        minPrice: null,
        maxPrice: null,
        inStockOnly: false,
        sortBy: 'default'
    };
    
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const inStockOnly = document.getElementById('inStockOnly');
    const sortBy = document.getElementById('sortBy');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';
    if (inStockOnly) inStockOnly.checked = false;
    if (sortBy) sortBy.value = 'default';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    
    applyFilters();
    showNotification('Filtros limpiados', 'info');
}

// ============ FUNCIONES DEL CARRITO ============

function saveCart() {
    localStorage.setItem('luxe_cart', JSON.stringify(window.cart));
}

function loadCart() {
    const saved = localStorage.getItem('luxe_cart');
    if (saved) {
        window.cart = JSON.parse(saved);
        cart = window.cart;
        updateCartUI();
    }
}

function updateCartUI() {
    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = count;
    
    const total = cart.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    
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
    
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityClick);
    });
    document.querySelectorAll('.remove-btn').forEach(btn => {
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
    const index = parseInt(e.currentTarget.dataset.index);
    if (isNaN(index) || !cart[index]) return;
    
    const productName = cart[index].name;
    cart.splice(index, 1);
    updateCartUI();
    showNotification(`${productName} eliminado`, 'info');
}

window.addToCart = async function(id) {
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

function goToCheckout() {
    if (!isLoggedIn()) {
        alert('Inicia sesión');
        window.location.href = 'login.html';
        return;
    }
    if (cart.length === 0) {
        alert('Carrito vacío');
        return;
    }
    localStorage.setItem('checkout_cart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

// ============ FUNCIONES DE UI Y NAVEGACIÓN ============

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
    const dashboardLink = document.getElementById('dashboardLink');
    
    const user = getCurrentUser();
    if (dashboardLink && user && user.role === 'seller') {
        dashboardLink.style.display = 'block';
        dashboardLink.href = 'dashboard/index.html';
    }
    
    if (btn && dropdown) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        window.addEventListener('click', (e) => {
            if (!btn.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof logout === 'function') {
                logout();
            } else {
                localStorage.removeItem('luxe_token');
                localStorage.removeItem('luxe_user');
                localStorage.removeItem('luxe_cart');
                window.location.href = 'login.html';
            }
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
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.textContent = menu.classList.contains('active') ? '✕' : '☰';
        });
        menu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                toggle.textContent = '☰';
            });
        });
    }
}

function initSearchPanel() {
    const searchToggle = document.getElementById('searchToggleBtn');
    const searchPanel = document.getElementById('searchPanel');
    const closeSearch = document.getElementById('closeSearchBtn');
    const overlay = document.getElementById('searchOverlay');
    
    function openSearchPanel() {
        if (searchPanel) searchPanel.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
    
    function closeSearchPanel() {
        if (searchPanel) searchPanel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (searchToggle) searchToggle.addEventListener('click', openSearchPanel);
    if (closeSearch) closeSearch.addEventListener('click', closeSearchPanel);
    if (overlay) overlay.addEventListener('click', closeSearchPanel);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchPanel && searchPanel.classList.contains('active')) {
            closeSearchPanel();
        }
    });
}

function initSearchAndFilters() {
    let searchTimeout;
    
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const inStockOnly = document.getElementById('inStockOnly');
    const sortBy = document.getElementById('sortBy');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (clearSearchBtn) clearSearchBtn.style.display = value ? 'block' : 'none';
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = value;
                applyFilters();
            }, 300);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                if (clearSearchBtn) clearSearchBtn.style.display = 'none';
                currentFilters.search = '';
                applyFilters();
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            currentFilters.search = '';
            applyFilters();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            applyFilters();
        });
    }
    
    if (minPrice) {
        minPrice.addEventListener('input', (e) => {
            currentFilters.minPrice = e.target.value ? parseFloat(e.target.value) : null;
            applyFilters();
        });
    }
    
    if (maxPrice) {
        maxPrice.addEventListener('input', (e) => {
            currentFilters.maxPrice = e.target.value ? parseFloat(e.target.value) : null;
            applyFilters();
        });
    }
    
    if (inStockOnly) {
        inStockOnly.addEventListener('change', (e) => {
            currentFilters.inStockOnly = e.target.checked;
            applyFilters();
        });
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            currentFilters.sortBy = e.target.value;
            applyFilters();
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

// ============ EXPORTACIONES GLOBALES ============
window.updateCartUI = updateCartUI;
window.saveCart = saveCart;
window.loadCart = loadCart;

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', async () => {
    // No ejecutar en páginas del dashboard
    if (window.location.pathname.includes('dashboard')) {
        console.log('Dashboard detectado, app.js no se ejecuta completamente');
        return;
    }
    
    console.log('🚀 Inicializando LUXE Store...');
    
    loadCart();
    initCartModal();
    initCheckoutButton();
    updateUserUI();
    initUserMenu();
    initMobileMenu();
    initSearchPanel();
    initSearchAndFilters();
    
    if (document.getElementById('cadenasGrid')) {
        await loadAllProducts();
        filteredProducts = [...allProducts];
        applyFilters();
    }
    
    console.log('✅ LUXE Store inicializado');

    document.addEventListener('DOMContentLoaded', async () => {
    // ... código existente ...
    
    // Verificar si hay categoría en la URL
    const params = new URLSearchParams(window.location.search);
    const categoria = params.get('categoria');
    
    if (categoria) {
        console.log('🎯 Aplicando filtro por categoría:', categoria);
        
        // Esperar a que los productos carguen
        setTimeout(() => {
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = categoria;
                // Disparar evento change para aplicar el filtro
                categoryFilter.dispatchEvent(new Event('change'));
            }
        }, 500);
    }
});
});
