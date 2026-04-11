// =====================================================
// DASHBOARD VENDEDOR - VERSIÓN CORREGIDA
// =====================================================

const API_URL = 'http://localhost:5000/api';
console.log('API_URL en dashboard.js:', typeof API_URL !== 'undefined' ? API_URL : 'NO DEFINIDA');
let selectedImage = null;
let additionalImagesFiles = [];
let sizes = [];
let pendingDeleteProductId = null;

// ============ AUTENTICACIÓN ============

async function checkSellerAuth() {
    console.log('Verificando autenticación...');
    if (!isLoggedIn()) {
        window.location.href = '../login.html';
        return false;
    }
    if (!isSeller()) {
        alert('Acceso denegado. Solo vendedores pueden acceder.');
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// ============ API ============

async function fetchMyProducts() {
    const token = getToken();
    if (!token) return [];
    try {
        const response = await fetch(`${API_URL}/products/seller/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.success ? data.products : [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

// =====================================================
// DASHBOARD VENDEDOR - VERSIÓN CORREGIDA (ROBUSTA)
// =====================================================

// Reemplaza la función fetchSellerStats() completa con esta versión mejorada:

async function fetchSellerStats() {
    const token = getToken();
    if (!token) return { totalProducts: 0, totalSales: 0, totalRevenue: 0, totalItemsSold: 0 };
    
    try {
        const products = await fetchMyProducts();
        let orders = [];
        
        try {
            const ordersResponse = await fetch(`${API_URL}/orders/seller`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!ordersResponse.ok) {
                console.warn('Error al obtener órdenes:', ordersResponse.status);
                orders = [];
            } else {
                const ordersData = await ordersResponse.json();
                orders = ordersData.success ? ordersData.orders : [];
            }
        } catch (e) {
            console.warn('Error en fetch de órdenes:', e);
            orders = [];
        }
        
        // Calcular estadísticas con validaciones
        const totalProducts = Array.isArray(products) ? products.length : 0;
        const totalSales = Array.isArray(orders) ? orders.length : 0;
        
        // Calcular ingresos totales (con validación)
        const totalRevenue = Array.isArray(orders) 
            ? orders.reduce((sum, order) => {
                const orderTotal = parseFloat(order.total) || 0;
                return sum + orderTotal;
            }, 0)
            : 0;
        
        // Calcular items vendidos (con validación)
        const totalItemsSold = Array.isArray(orders)
            ? orders.reduce((sum, order) => {
                if (order.items && Array.isArray(order.items)) {
                    return sum + order.items.reduce((s, item) => {
                        // Aceptar tanto 'quantity' como 'cantidad'
                        const qty = item.quantity || item.cantidad || 0;
                        return s + qty;
                    }, 0);
                }
                return sum;
            }, 0)
            : 0;
        
        console.log('📊 Estadísticas calculadas:', {
            totalProducts,
            totalSales,
            totalRevenue,
            totalItemsSold
        });
        
        return { totalProducts, totalSales, totalRevenue, totalItemsSold };
        
    } catch (error) {
        console.error('Error en fetchSellerStats:', error);
        return { totalProducts: 0, totalSales: 0, totalRevenue: 0, totalItemsSold: 0 };
    }
}



async function loadDashboardContent() {
    const user = getCurrentUser();
    if (!user) {
        console.error('No hay usuario autenticado');
        return;
    }
    
    console.log('👤 Usuario:', user);
    
    const mainContent = document.getElementById('dynamicContent') || document.querySelector('.dashboard-main');
    if (!mainContent) {
        console.error('No se encontró el contenedor principal');
        return;
    }
    
    // Mostrar loading
    mainContent.innerHTML = '<div style="text-align:center; padding:3rem;">Cargando dashboard...</div>';
    
    try {
        const stats = await fetchSellerStats();
        const products = await fetchMyProducts();
        
        console.log('📦 Productos obtenidos:', products?.length || 0);
        console.log('📊 Stats:', stats);
        
        // Asegurar que los valores son números válidos
        const totalProducts = stats.totalProducts || 0;
        const totalSales = stats.totalSales || 0;
        const totalRevenue = parseFloat(stats.totalRevenue) || 0;
        const totalItemsSold = stats.totalItemsSold || 0;
        
        // Limitar productos mostrados
        const recentProducts = Array.isArray(products) ? products.slice(0, 5) : [];
        
        mainContent.innerHTML = `
            <h1>Bienvenido, ${user.name || 'Vendedor'}</h1>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Productos</h3>
                    <div class="stat-value">${totalProducts}</div>
                </div>
                <div class="stat-card">
                    <h3>Ventas Totales</h3>
                    <div class="stat-value">${totalSales}</div>
                </div>
                <div class="stat-card">
                    <h3>Ingresos</h3>
                    <div class="stat-value">$${totalRevenue.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <h3>Productos Vendidos</h3>
                    <div class="stat-value">${totalItemsSold}</div>
                </div>
            </div>
            
            <h3>Últimos Productos Agregados</h3>
            ${recentProducts.length > 0 ? `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Ventas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentProducts.map(p => `
                            <tr>
                                <td>${p.name || 'Sin nombre'}</td>
                                <td>$${parseFloat(p.price || 0).toFixed(2)}</td>
                                <td>${p.stock || 0}</td>
                                <td>${p.sales || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No hay productos aún. ¡Agrega tu primer producto!</p>'}
        `;
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        mainContent.innerHTML = `
            <h1>Error al cargar el dashboard</h1>
            <p>Por favor, recarga la página o contacta al soporte.</p>
            <p style="color: #666; font-size: 0.9rem;">${error.message}</p>
        `;
    }
}
async function fetchSellerOrders() {
    const token = getToken();
    if (!token) return [];
    try {
        const response = await fetch(`${API_URL}/orders/seller`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.success ? data.orders : [];
    } catch (error) {
        return [];
    }
}

async function createProductAPI(product) {
    const token = getToken();
    if (!token) return null;
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(product)
        });
        const data = await response.json();
        return data.success ? data.product : null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function deleteProductAPI(productId) {
    const token = getToken();
    if (!token) return false;
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        return false;
    }
}

async function performDeleteProduct(productId) {
    const deleted = await deleteProductAPI(productId);
    if (deleted) {
        showDashboardNotification('Producto eliminado correctamente', 'success');
        await renderProductsList();
        if (document.getElementById('dynamicContent')) await loadDashboardContent();
    } else {
        showDashboardNotification('Error al eliminar producto', 'error');
    }
}

// ============ IMAGEN PRINCIPAL ============

function handleImageFile(file) {
    if (file.size > 2 * 1024 * 1024) {
        showDashboardNotification('La imagen no puede exceder los 2MB', 'error');
        return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = function () {
        let width = img.width;
        let height = img.height;
        const maxSize = 800;
        if (width > maxSize || height > maxSize) {
            if (width > height) {
                height = (height * maxSize) / width;
                width = maxSize;
            } else {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        selectedImage = compressedDataUrl;
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const uploadArea = document.getElementById('imageUploadArea');
        if (previewImg) previewImg.src = compressedDataUrl;
        if (previewContainer) previewContainer.style.display = 'block';
        if (uploadArea) uploadArea.style.display = 'none';
        showDashboardNotification(`Imagen cargada`, 'success');
        URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
}

function removeSelectedImage() {
    selectedImage = null;
    const fileInput = document.getElementById('productImageFile');
    const previewContainer = document.getElementById('imagePreview');
    const uploadArea = document.getElementById('imageUploadArea');
    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
    showDashboardNotification('Imagen eliminada', 'info');
}

function initImageUpload() {
    const fileInput = document.getElementById('productImageFile');
    const uploadArea = document.getElementById('imageUploadArea');
    const removeBtn = document.getElementById('removeImageBtn');
    if (!fileInput || !uploadArea) return;
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
    });
    uploadArea.addEventListener('dragover', (e) => e.preventDefault());
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleImageFile(file);
    });
    if (removeBtn) removeBtn.addEventListener('click', () => removeSelectedImage());
}

// ============ IMÁGENES ADICIONALES ============

function initMultiImageUpload() {
    const input = document.getElementById('additionalImages');
    const previewContainer = document.getElementById('additionalImagesPreview');
    if (!input || !previewContainer) return;
    input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.size > 2 * 1024 * 1024) {
                showDashboardNotification('Imagen excede 2MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                additionalImagesFiles.push({ file, dataUrl: ev.target.result });
                renderAdditionalImagesPreview();
            };
            reader.readAsDataURL(file);
        });
        input.value = '';
    });
}

function renderAdditionalImagesPreview() {
    const container = document.getElementById('additionalImagesPreview');
    if (!container) return;
    container.innerHTML = additionalImagesFiles.map((img, idx) => `
        <div class="preview-image-item">
            <img src="${img.dataUrl}" style="width:80px; height:80px; object-fit:cover; border-radius:5px;">
            <button onclick="removeAdditionalImage(${idx})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">×</button>
        </div>
    `).join('');
}

window.removeAdditionalImage = function(idx) {
    additionalImagesFiles.splice(idx, 1);
    renderAdditionalImagesPreview();
};


// ============ TALLAS ============


function addSizeRow() {
    sizes.push({ size: '', stock: 0 });
    renderSizesRows();
}

function renderSizesRows() {
    const container = document.getElementById('sizesContainer');
    if (!container) return;
    
    if (sizes.length === 0) {
        container.innerHTML = '<button type="button" class="btn-add-size">+ Añadir talla</button>';
        const addBtn = container.querySelector('.btn-add-size');
        if (addBtn) addBtn.addEventListener('click', addSizeRow);
        return;
    }
    
    let html = '';
    sizes.forEach((s, idx) => {
        html += `
            <div class="size-row" data-idx="${idx}">
                <input type="text" placeholder="Talla" class="size-name" value="${escapeHtml(s.size)}">
                <input type="number" placeholder="Stock" class="size-stock" value="${s.stock}" min="0">
                <button type="button" class="btn-remove-size" data-idx="${idx}">✖</button>
            </div>
        `;
    });
    html += '<button type="button" class="btn-add-size">+ Añadir talla</button>';
    container.innerHTML = html;
    
    // Eventos para inputs
    container.querySelectorAll('.size-name').forEach(input => {
        const idx = parseInt(input.closest('.size-row').dataset.idx);
        input.addEventListener('change', () => {
            sizes[idx].size = input.value;
            console.log('Talla actualizada:', sizes);
        });
    });
    container.querySelectorAll('.size-stock').forEach(input => {
        const idx = parseInt(input.closest('.size-row').dataset.idx);
        input.addEventListener('change', () => {
            sizes[idx].stock = parseInt(input.value) || 0;
            console.log('Stock actualizado:', sizes);
        });
    });
    // Eventos para botones eliminar
    container.querySelectorAll('.btn-remove-size').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            sizes.splice(idx, 1);
            renderSizesRows();
        });
    });
    // Evento para el botón añadir (el que se acaba de crear)
    const addBtn = container.querySelector('.btn-add-size:last-child');
    if (addBtn) addBtn.addEventListener('click', addSizeRow);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============ PRODUCTOS UI ============

// Redirigir a la página de edición
window.editProduct = function(productId) {
    window.location.href = `edit-product.html?id=${productId}`;
};

async function addNewProduct() {
    const name = document.getElementById('productName')?.value;
    const price = document.getElementById('productPrice')?.value;
    const category = document.getElementById('productCategory')?.value;
    const stock = document.getElementById('productStock')?.value;
    const description = document.getElementById('productDescription')?.value;

    if (!name || !price) {
        showDashboardNotification('Nombre y precio son requeridos', 'error');
        return;
    }
    if (!selectedImage) {
        showDashboardNotification('Por favor, selecciona una imagen principal', 'error');
        return;
    }

   const sizesObject = {};
sizes.forEach(s => {
    if (s.size && s.size.trim() !== '') {
        // Si no hay stock o es 0, asignar 1 por defecto (puedes cambiar el valor por defecto)
        const stockValue = (s.stock && s.stock > 0) ? s.stock : 1;
        sizesObject[s.size] = stockValue;
    }
});

    const newProduct = {
        name: name,
        price: parseFloat(price),
        category: category,
        image: selectedImage,
        stock: parseInt(stock) || 10,
        description: description || '',
        sizes: sizesObject,
        additionalImages: additionalImagesFiles.map(img => img.dataUrl)
    };

    console.log('Producto enviado al backend:', JSON.stringify(newProduct, null, 2));

    console.log('📦 Producto a enviar:', {
    name, price, category, stock, description,
    sizes: sizesObject,
    additionalImagesCount: additionalImagesFiles.length
});
   /*alert('Revisa la consola (F12). ¿El objeto sizes tiene datos?');*/
    const created = await createProductAPI(newProduct);
    if (created) {
        showDashboardNotification('Producto agregado correctamente', 'success');
        document.getElementById('addProductForm')?.reset();
        removeSelectedImage();
        additionalImagesFiles = [];
        sizes = [];
        renderAdditionalImagesPreview();
        renderSizesRows();
        await renderProductsList();
        if (document.getElementById('dynamicContent') && window.location.pathname.includes ('dashboard')){
            await loadDashboardContent();
        }
    } else {
        showDashboardNotification('Error al agregar producto', 'error');
    }
}



window.deleteProductItem = function(productId) {
    pendingDeleteProductId = productId;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.style.display = 'flex';
};

// ============ FUNCIONES UI ============

async function renderProductsList() {
    const products = await fetchMyProducts();
    const tbody = document.getElementById('productsList');
    
    if (!tbody) {
        console.warn('Elemento productsList no encontrado');
        return;
    }
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:3rem; background:#fafaf8;">
                    <div style="font-size:3rem; margin-bottom:1rem;">📦</div>
                    <h3 style="color:#666; margin-bottom:0.5rem;">No tienes productos aún</h3>
                    <p style="color:#999;">¡Agrega tu primer producto usando el formulario de arriba!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>
                <img src="${p.image || 'https://via.placeholder.com/50'}" 
                     alt="${p.name}" 
                     style="width:50px; height:50px; object-fit:cover; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.1);"
                     onerror="this.src='https://via.placeholder.com/50/1a1a1a/c9a03d?text=LUXE'">
            </td>
            <td style="font-weight:500;">${p.name || 'Sin nombre'}</td>
            <td style="color:#c9a03d; font-weight:600;">$${parseFloat(p.price || 0).toFixed(2)}</td>
            <td>${p.stock || 0}</td>
            <td>${p.sales || 0}</td>
            <td>
                <button class="btn-edit" onclick="window.location.href='edit-product.html?id=${p.id}'">✎ Editar</button>
                <button class="btn-danger" onclick="deleteProductItem(${p.id})">🗑 Eliminar</button>
            </td>
        </tr>
    `).join('');
    
    console.log(`✅ ${products.length} productos cargados`);
}
// ============ MODAL ELIMINAR ============

function showDeleteConfirmModal(productId) {
    pendingDeleteProductId = productId;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.style.display = 'flex';
}

function closeDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.style.display = 'none';
    pendingDeleteProductId = null;
}

function confirmDelete() {
    if (pendingDeleteProductId) {
        performDeleteProduct(pendingDeleteProductId);
    }
    closeDeleteConfirmModal();
}

function initDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.custom-modal-close');
    const cancelBtn = modal.querySelector('.custom-modal-btn.cancel');
    const confirmBtn = modal.querySelector('.custom-modal-btn.confirm');
    if (closeBtn) closeBtn.addEventListener('click', closeDeleteConfirmModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeDeleteConfirmModal);
    if (confirmBtn) confirmBtn.addEventListener('click', confirmDelete);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeDeleteConfirmModal(); });
}

// ============ DASHBOARD CONTENT ============

async function loadDashboardContent() {
    const user = getCurrentUser();
    if (!user) return;
    const stats = await fetchSellerStats();
    const products = await fetchMyProducts();
    const mainContent = document.getElementById('dynamicContent') || document.querySelector('.dashboard-main');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <h1>Bienvenido, ${user.name}</h1>
        <div class="stats-grid">
            <div class="stat-card"><h3>Productos</h3><div class="stat-value">${stats.totalProducts}</div></div>
            <div class="stat-card"><h3>Ventas Totales</h3><div class="stat-value">${stats.totalSales}</div></div>
            <div class="stat-card"><h3>Ingresos</h3><div class="stat-value">$${stats.totalRevenue.toFixed(2)}</div></div>
            <div class="stat-card"><h3>Productos Vendidos</h3><div class="stat-value">${stats.totalItemsSold}</div></div>
        </div>
        <h3>Últimos Productos Agregados</h3>
        <table class="data-table"><thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Ventas</th></tr></thead>
        <tbody>${products.slice(0,5).map(p => `<tr><td>${p.name}</td><td>$${parseFloat(p.price).toFixed(2)}</td><td>${p.stock||0}</td><td>${p.sales||0}</td></tr>`).join('')}</tbody></table>
    `;
}

async function loadOrdersContent() {
    const orders = await fetchSellerOrders();
    const mainContent = document.querySelector('.dashboard-main');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <h1>Pedidos Recibidos</h1>
        <table class="data-table"><thead><tr><th>ID Pedido</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody id="ordersList"></tbody></table>
    `;
    const tbody = document.getElementById('ordersList');
    if (tbody) {
        tbody.innerHTML = orders.map(order => `
            <tr><td>${order.order_number || order.id}</td><td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>${order.customer_name || 'Cliente'}</td>
            <td>${order.items ? order.items.map(i => `${i.name} x${i.quantity}`).join(', ') : '-'}</td>
            <td>$${parseFloat(order.total).toFixed(2)}</td>
            <td><span style="background:#4caf50;color:white;padding:0.2rem 0.5rem;border-radius:5px;">${order.status || 'Completado'}</span></td></tr>
        `).join('');
        if (orders.length === 0) tbody.innerHTML = '<tr><td colspan="6">No hay pedidos aún</td></tr>';
    }
}

async function loadSalesContent() {
    const stats = await fetchSellerStats();
    const products = await fetchMyProducts();
    const productSales = products.map(p => ({ name: p.name, sold: p.sales || 0, revenue: (p.sales||0) * parseFloat(p.price) })).sort((a,b)=>b.sold-a.sold);
    const mainContent = document.querySelector('.dashboard-main');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <h1>Estadísticas de Ventas</h1>
        <div class="stats-grid">
            <div class="stat-card"><h3>Total Ventas</h3><div class="stat-value">${stats.totalSales}</div></div>
            <div class="stat-card"><h3>Ingresos Totales</h3><div class="stat-value">$${stats.totalRevenue.toFixed(2)}</div></div>
            <div class="stat-card"><h3>Productos Vendidos</h3><div class="stat-value">${stats.totalItemsSold}</div></div>
        </div>
        <h3>Productos Más Vendidos</h3>
        <table class="data-table"><thead><tr><th>Producto</th><th>Unidades Vendidas</th><th>Ingresos Generados</th></tr></thead>
        <tbody id="topProductsList"></tbody></table>
    `;
    const tbody = document.getElementById('topProductsList');
    if (tbody) {
        tbody.innerHTML = productSales.filter(p => p.sold > 0).map(p => `<tr><td>${p.name}</td><td>${p.sold}</td><td>$${p.revenue.toFixed(2)}</td></tr>`).join('');
        if (productSales.filter(p => p.sold > 0).length === 0) tbody.innerHTML = '<tr><td colspan="3">Aún no hay ventas</td></tr>';
    }
}

// ============ INICIALIZACIÓN DE PÁGINAS ============

async function initProductsPage() {
    await renderProductsList();
    initImageUpload();
    initMultiImageUpload();
    initDeleteModal();
    renderSizesRows();   // <-- Ahora sí está definida globalmente
    const form = document.getElementById('addProductForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addNewProduct();
        });
    }
}

// ============ MENÚS ============

function initDashboardMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('dashboardSidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            toggle.textContent = sidebar.classList.contains('active') ? '✕' : '☰';
        });
    }
}

function initDashboardUserMenu() {
    const userBtn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    if (userBtn && dropdown) {
        userBtn.addEventListener('click', (e) => {
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

function showDashboardNotification(message, type) {
    const existing = document.querySelector('.dashboard-notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    const colors = { success: '#4caf50', error: '#f44336', info: '#2196f3' };
    notification.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: ${colors[type]}; color: white;
        padding: 1rem 1.5rem; border-radius: 10px;
        z-index: 2000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
}

// ============ INICIALIZACIÓN PRINCIPAL ============

async function initDashboard() {
    if (!await checkSellerAuth()) return;
    const user = getCurrentUser();
    document.querySelectorAll('#userNameDisplay, .user-name').forEach(el => {
        if (el) el.textContent = (user.name || user.nombre || 'Vendedor').split(' ')[0];
    });
    const storeNameElement = document.getElementById('storeName');
    if (storeNameElement) storeNameElement.textContent = (user.name || user.nombre || 'Mi') + "'s Store";
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'index.html' || currentPage === '') await loadDashboardContent();
    else if (currentPage === 'products.html') await initProductsPage();
    else if (currentPage === 'orders.html') await loadOrdersContent();
    else if (currentPage === 'sales.html') await loadSalesContent();
    initDashboardMobileMenu();
    initDashboardUserMenu();
}

document.addEventListener('DOMContentLoaded', initDashboard);