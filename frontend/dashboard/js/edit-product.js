// =====================================================
// EDITAR PRODUCTO - LÓGICA COMPLETA (CORREGIDA)
// =====================================================

// Función global para escapar HTML
function escapeHtml(str) {
    if (!str) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
}
window.escapeHtml = escapeHtml;

let currentProduct = null;
let productId = null;
let newMainImage = null;
let existingAdditionalImages = [];
let removedImageIds = [];
let newAdditionalImages = [];
let currentSizes = {};
let formModified = false;

// Obtener ID del producto de la URL
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Cargar datos del producto
async function loadProductData() {
    productId = getProductIdFromUrl();
    if (!productId) {
        showNotification('ID de producto no encontrado', 'error');
        setTimeout(() => window.location.href = 'products.html', 1500);
        return;
    }

    showLoading(true);

    try {
        const token = getToken();
        const response = await fetch(`${API_URL}/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            currentProduct = data.product;

            try {
                const imagesResponse = await fetch(`${API_URL}/products/${productId}/images`);
                const imagesData = await imagesResponse.json();
                if (imagesData.success) {
                    existingAdditionalImages = imagesData.images || [];
                }
            } catch (imgError) {
                console.warn('⚠️ No se pudieron cargar imágenes adicionales:', imgError);
                existingAdditionalImages = [];
            }

            if (currentProduct.sizes) {
                try {
                    currentSizes = typeof currentProduct.sizes === 'string'
                        ? JSON.parse(currentProduct.sizes)
                        : currentProduct.sizes;
                } catch (e) {
                    console.warn('⚠️ Error al parsear sizes:', e);
                    currentSizes = {};
                }
            } else {
                currentSizes = {};
            }

            populateForm();
        } else {
            throw new Error(data.message || 'Producto no encontrado');
        }
    } catch (error) {
        console.error('Error al cargar producto:', error);
        showNotification('Error al cargar el producto', 'error');
        setTimeout(() => window.location.href = 'products.html', 1500);
    } finally {
        showLoading(false);
    }
}

// Poblar el formulario con los datos actuales
function populateForm() {
    document.getElementById('productName').value = currentProduct.name || '';
    document.getElementById('productPrice').value = currentProduct.price || '';
    document.getElementById('productCategory').value = currentProduct.category || 'cadenas';
    document.getElementById('productStock').value = currentProduct.stock || 0;
    document.getElementById('productDescription').value = currentProduct.description || '';

    const mainImage = document.getElementById('currentMainImage');
    const imageUrl = currentProduct.image || currentProduct.imagen || currentProduct.image_url;

    console.log('📸 URL de imagen principal:', imageUrl);

    if (imageUrl && imageUrl !== '' && imageUrl !== 'null' && imageUrl !== 'undefined') {
        mainImage.src = imageUrl;
        mainImage.style.display = 'block';
    } else {
        mainImage.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23c9a03d' font-size='16' font-family='Inter'%3E${encodeURIComponent(currentProduct.name || 'LUXE')}%3C/text%3E%3C/svg%3E`;
    }

    mainImage.onerror = function () {
        this.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='14' font-family='Inter'%3ESin%20imagen%3C/text%3E%3C/svg%3E`;
    };

    displayExistingAdditionalImages();
    displaySizes();
}

// Mostrar imágenes adicionales existentes
function displayExistingAdditionalImages() {
    const container = document.getElementById('currentAdditionalImages');
    if (!container) return;

    if (!existingAdditionalImages || existingAdditionalImages.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">No hay imágenes adicionales</p>';
        return;
    }

    container.innerHTML = existingAdditionalImages.map(img => `
        <div class="additional-image-item" data-image-id="${img.id}">
            <img src="${img.image_url}" alt="Imagen adicional" onerror="this.src='https://via.placeholder.com/100'">
            <button type="button" class="remove-image-btn" onclick="markImageForRemoval(${img.id})">×</button>
        </div>
    `).join('');
}

// Marcar imagen para eliminar
window.markImageForRemoval = function (imageId) {
    if (!removedImageIds.includes(imageId)) {
        removedImageIds.push(imageId);
    }
    formModified = true;

    const element = document.querySelector(`[data-image-id="${imageId}"]`);
    if (element) {
        element.style.opacity = '0.3';
        element.querySelector('.remove-image-btn').textContent = '↩️';
        element.querySelector('.remove-image-btn').onclick = () => unmarkImageForRemoval(imageId);
    }
};

// Desmarcar imagen para eliminar
window.unmarkImageForRemoval = function (imageId) {
    removedImageIds = removedImageIds.filter(id => id !== imageId);
    formModified = true;

    const element = document.querySelector(`[data-image-id="${imageId}"]`);
    if (element) {
        element.style.opacity = '1';
        element.querySelector('.remove-image-btn').textContent = '×';
        element.querySelector('.remove-image-btn').onclick = () => markImageForRemoval(imageId);
    }
};


// Mostrar tallas
function displaySizes() {
    const container = document.getElementById('sizesSection');
    if (!container) {
        console.error('❌ Container sizesSection no encontrado');
        return;
    }
    
    // Parsear sizes correctamente
    let sizes = {};
    if (currentProduct && currentProduct.sizes) {
        try {
            sizes = typeof currentProduct.sizes === 'string' 
                ? JSON.parse(currentProduct.sizes) 
                : currentProduct.sizes;
        } catch (e) {
            console.error('Error al parsear sizes:', e);
            sizes = {};
        }
    }
    
    // Asegurar que sizes sea un objeto
    if (!sizes || typeof sizes !== 'object' || Array.isArray(sizes)) {
        sizes = {};
    }
    
    const sizeEntries = Object.entries(sizes);
    console.log('📏 Tallas cargadas:', sizeEntries);
    
    let html = '';
    
    if (sizeEntries.length === 0) {
        html = `
            <div style="text-align:center; padding:1.5rem; color:#999;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">📏</div>
                <p>Sin tallas definidas</p>
            </div>
            <div id="sizesContainer"></div>
            <button type="button" class="btn-add-size" onclick="addSizeRow()">
                + Agregar Primera Talla
            </button>
        `;
    } else {
        html = '<div id="sizesContainer">';
        
        sizeEntries.forEach(([size, stock]) => {
            html += `
                <div class="size-row">
                    <input type="text" class="size-name" value="${escapeHtml(String(size))}" placeholder="Talla (ej: 38, M)">
                    <input type="number" class="size-stock" value="${Number(stock) || 0}" min="0" placeholder="Stock">
                    <button type="button" class="btn-remove-size" onclick="removeSizeRow(this)">✕</button>
                </div>
            `;
        });
        
        html += '</div>';
        html += '<button type="button" class="btn-add-size" onclick="addSizeRow()">+ Agregar Otra Talla</button>';
    }
    
    container.innerHTML = html;
    console.log('✅ Sección de tallas renderizada');
}
// Agregar fila de talla
window.addSizeRow = function() {
    let container = document.getElementById('sizesContainer');
    
    // Si no existe el container, crearlo
    if (!container) {
        console.warn('⚠️ Container sizesContainer no encontrado, buscando sizesSection...');
        const section = document.getElementById('sizesSection');
        
        if (!section) {
            console.error('❌ No se encontró sizesSection');
            return;
        }
        
        // Buscar si hay un mensaje de "Sin tallas" y limpiar
        const existingContainer = section.querySelector('#sizesContainer');
        if (existingContainer) {
            container = existingContainer;
        } else {
            // Crear el container
            container = document.createElement('div');
            container.id = 'sizesContainer';
            
            // Insertar antes del botón de agregar
            const addButton = section.querySelector('.btn-add-size');
            if (addButton) {
                section.insertBefore(container, addButton);
            } else {
                section.appendChild(container);
            }
        }
    }
    
    const newRow = document.createElement('div');
    newRow.className = 'size-row';
    newRow.innerHTML = `
        <input type="text" class="size-name" placeholder="Talla (ej: 38, M, Única)" value="">
        <input type="number" class="size-stock" value="1" min="0" placeholder="Stock">
        <button type="button" class="btn-remove-size" onclick="removeSizeRow(this)">✕</button>
    `;
    
    container.appendChild(newRow);
    formModified = true;
    console.log('✅ Nueva fila de talla agregada');
};
// Eliminar fila de talla
window.removeSizeRow = function (button) {
    const row = button.closest('.size-row');
    if (row) {
        row.remove();
        formModified = true;
        console.log('✅ Fila de talla eliminada');
    }
};

// Obtener tallas del formulario

// Obtener tallas del formulario - VERSIÓN ULTRA-SEGURA
function getSizesFromForm() {
    const sizes = {};
    
    try {
        // Intentar obtener el contenedor
        const container = document.getElementById('sizesContainer');
        
        // Si no hay contenedor, intentar buscar dentro de sizesSection
        if (!container) {
            console.warn('⚠️ Container sizesContainer no encontrado directamente');
            const section = document.getElementById('sizesSection');
            if (section) {
                const nestedContainer = section.querySelector('#sizesContainer');
                if (nestedContainer) {
                    console.log('✅ Container encontrado dentro de sizesSection');
                    return getSizesFromContainer(nestedContainer);
                }
            }
            return {};
        }
        
        return getSizesFromContainer(container);
        
    } catch (error) {
        console.error('❌ Error en getSizesFromForm:', error);
        return {};
    }
}

// Función auxiliar para extraer tallas de un contenedor
function getSizesFromContainer(container) {
    const sizes = {};
    
    // Obtener todas las filas de tallas
    const rows = container.querySelectorAll('.size-row');
    
    // Si no hay filas, retornar objeto vacío
    if (!rows || rows.length === 0) {
        console.log('📏 No hay filas de tallas en el contenedor');
        return {};
    }
    
    console.log(`📏 Procesando ${rows.length} filas de tallas`);
    
    // Usar un bucle for tradicional para máxima compatibilidad
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        const sizeNameInput = row.querySelector('.size-name');
        const sizeStockInput = row.querySelector('.size-stock');
        
        if (!sizeNameInput || !sizeStockInput) {
            console.warn(`⚠️ Fila ${i} no tiene los inputs correctos`);
            continue;
        }
        
        const sizeName = sizeNameInput.value?.trim();
        const sizeStock = parseInt(sizeStockInput.value) || 0;
        
        if (sizeName && sizeName !== '') {
            sizes[sizeName] = sizeStock;
            console.log(`  Talla ${i + 1}: ${sizeName} = ${sizeStock}`);
        }
    }
    
    console.log('📦 Objeto sizes final:', sizes);
    return sizes;
}

// Manejar imagen principal
function initMainImageUpload() {
    const uploadArea = document.getElementById('mainImageUploadArea');
    const fileInput = document.getElementById('mainImageFile');
    const previewContainer = document.getElementById('newMainImagePreview');
    const previewImg = document.getElementById('newMainImageImg');
    const cancelBtn = document.getElementById('cancelMainImageBtn');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                newMainImage = ev.target.result;
                previewImg.src = ev.target.result;
                previewContainer.style.display = 'block';
                uploadArea.style.display = 'none';
                formModified = true;
            };
            reader.readAsDataURL(file);
        }
    });

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            newMainImage = null;
            fileInput.value = '';
            previewContainer.style.display = 'none';
            uploadArea.style.display = 'block';
        });
    }

    uploadArea.addEventListener('dragover', (e) => e.preventDefault());
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                newMainImage = ev.target.result;
                previewImg.src = ev.target.result;
                previewContainer.style.display = 'block';
                uploadArea.style.display = 'none';
                formModified = true;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Manejar imágenes adicionales nuevas
function initAdditionalImagesUpload() {
    const addBtn = document.getElementById('addMoreImagesBtn');
    const fileInput = document.getElementById('additionalImagesInput');

    if (!addBtn || !fileInput) return;

    addBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            if (file.size > 2 * 1024 * 1024) {
                showNotification(`${file.name} excede 2MB`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                newAdditionalImages.push(ev.target.result);
                displayNewImagesPreview();
                formModified = true;
            };
            reader.readAsDataURL(file);
        });

        fileInput.value = '';
    });
}

// Mostrar preview de nuevas imágenes
function displayNewImagesPreview() {
    const container = document.getElementById('newImagesPreview');
    if (!container) return;

    container.innerHTML = newAdditionalImages.map((img, index) => `
        <div class="additional-image-item">
            <img src="${img}" alt="Nueva imagen">
            <button type="button" class="remove-image-btn" onclick="removeNewImage(${index})">×</button>
        </div>
    `).join('');
}

window.removeNewImage = function (index) {
    newAdditionalImages.splice(index, 1);
    displayNewImagesPreview();
    formModified = true;
};

// Guardar cambios
async function saveProductChanges(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';
    showLoading(true);

    try {
        // Obtener tallas de forma segura
        let sizes = {};
        try {
            sizes = getSizesFromForm();
        } catch (sizeError) {
            console.error('Error al obtener tallas:', sizeError);
            sizes = {};
        }
        
        const updatedData = {
            name: document.getElementById('productName').value?.trim() || '',
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            category: document.getElementById('productCategory').value || 'cadenas',
            stock: parseInt(document.getElementById('productStock').value) || 0,
            description: document.getElementById('productDescription').value?.trim() || '',
            sizes: sizes
        };

        // Validaciones básicas
        if (!updatedData.name) {
            throw new Error('El nombre del producto es requerido');
        }
        
        if (updatedData.price <= 0) {
            throw new Error('El precio debe ser mayor a 0');
        }

        console.log('📤 Datos a enviar:', JSON.stringify(updatedData, null, 2));
        console.log('📤 Tipo de sizes:', typeof updatedData.sizes);
        console.log('📤 Es array?', Array.isArray(updatedData.sizes));

        if (newMainImage) {
            updatedData.image = newMainImage;
        }

        if (removedImageIds.length > 0) {
            updatedData.removeImages = removedImageIds;
        }

        if (newAdditionalImages.length > 0) {
            updatedData.additionalImages = newAdditionalImages;
        }

        const token = getToken();
        if (!token) {
            throw new Error('No hay sesión activa');
        }

        const response = await fetch(`${API_URL}/products/${productId}`,{
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();

        if (data.success) {
            formModified = false;
            showNotification('✅ Producto actualizado correctamente', 'success');
            setTimeout(() => {
                window.location.href = 'products.html';
            }, 1500);
        } else {
            throw new Error(data.message || 'Error al actualizar');
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        showNotification('❌ ' + error.message, 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar Cambios';
    } finally {
        showLoading(false);
    }
}

// Utilidades
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type) {
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
        z-index: 10000;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// Navegación segura
window.goBack = function () {
    if (formModified) {
        if (confirm('Tienes cambios sin guardar. ¿Estás seguro de salir?')) {
            window.location.href = 'products.html';
        }
    } else {
        window.location.href = 'products.html';
    }
};

// Detección de cambios
function setupFormChangeDetection() {
    const form = document.getElementById('editProductForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => { formModified = true; });
        input.addEventListener('input', () => { formModified = true; });
    });

    const sizesContainer = document.getElementById('sizesSection');
    if (sizesContainer) {
        const observer = new MutationObserver(() => { formModified = true; });
        observer.observe(sizesContainer, { childList: true, subtree: true });
    }

    window.addEventListener('beforeunload', (e) => {
        if (formModified) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn() || !isSeller()) {
        window.location.href = '../login.html';
        return;
    }

    const user = getCurrentUser();
    document.querySelectorAll('#userNameDisplay').forEach(el => {
        if (el) el.textContent = user?.name?.split(' ')[0] || 'Vendedor';
    });

    initMainImageUpload();
    initAdditionalImagesUpload();

    await loadProductData();

    const form = document.getElementById('editProductForm');
    if (form) {
        form.addEventListener('submit', saveProductChanges);
    }

    setupFormChangeDetection();

    if (typeof initDashboardMobileMenu === 'function') initDashboardMobileMenu();
    if (typeof initDashboardUserMenu === 'function') initDashboardUserMenu();
});