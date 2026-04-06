// =====================================================
// PÁGINA DE DETALLE DEL PRODUCTO (FUNCIONAL)
// =====================================================

let currentProduct = null;
let selectedSize = null;
let additionalImages = [];

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadProductDetail() {
    const productId = getProductIdFromUrl();
    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/products/${productId}`);
        const data = await res.json();
        if (data.success) {
            currentProduct = data.product;
            displayProductInfo();
        } else {
            throw new Error('Producto no encontrado');
        }

        const imagesRes = await fetch(`${API_URL}/products/${productId}/images`);
        const imagesData = await imagesRes.json();
        if (imagesData.success) {
            additionalImages = imagesData.images;
            displayThumbnails();
        }
    } catch (error) {
        console.error(error);
        showNotification('Error al cargar el producto', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    }
}

function displayProductInfo() {
    document.title = `${currentProduct.name} | LUXE`;
    document.getElementById('productName').textContent = currentProduct.name;
    document.getElementById('productPrice').textContent = `$${parseFloat(currentProduct.price).toFixed(2)}`;
    document.getElementById('productDescription').textContent = currentProduct.description || 'Sin descripción';
    
    const mainImg = document.getElementById('mainImage');
    mainImg.src = currentProduct.image || 'https://via.placeholder.com/600';
    mainImg.onerror = () => { mainImg.src = 'https://via.placeholder.com/600'; };

    const sizes = currentProduct.sizes ? JSON.parse(currentProduct.sizes) : {};
    const sizeSection = document.getElementById('sizeSection');
    const sizeOptions = document.getElementById('sizeOptions');
    
    if (Object.keys(sizes).length > 0) {
        sizeSection.style.display = 'block';
        sizeOptions.innerHTML = '';
        for (const [size, stock] of Object.entries(sizes)) {
            const btn = document.createElement('div');
            btn.className = 'size-option';
            btn.textContent = size;
            btn.dataset.size = size;
            btn.dataset.stock = stock;
            btn.addEventListener('click', () => selectSize(size, btn));
            sizeOptions.appendChild(btn);
        }
    } else {
        sizeSection.style.display = 'none';
    }
}

function selectSize(size, element) {
    document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    selectedSize = size;
}

function displayThumbnails() {
    const container = document.getElementById('thumbnails');
    if (!container) return;
    container.innerHTML = '';
    
    if (currentProduct.image) {
        const thumb = createThumbnail(currentProduct.image);
        container.appendChild(thumb);
    }
    
    additionalImages.forEach(img => {
        const thumb = createThumbnail(img.image_url);
        container.appendChild(thumb);
    });
}

function createThumbnail(url) {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'thumbnail';
    img.addEventListener('click', () => {
        document.getElementById('mainImage').src = url;
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        img.classList.add('active');
    });
    return img;
}

async function addToCartWithSize() {
    if (!isLoggedIn()) {
        showNotification('Inicia sesión para agregar productos', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }
    
    const sizes = currentProduct.sizes ? JSON.parse(currentProduct.sizes) : {};
    if (Object.keys(sizes).length > 0 && !selectedSize) {
        showNotification('Por favor, selecciona una talla', 'error');
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('luxe_cart') || '[]');
    const existingIndex = cart.findIndex(item => item.id === currentProduct.id && item.size === selectedSize);
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: parseFloat(currentProduct.price),
            image: currentProduct.image,
            size: selectedSize,
            quantity: 1
        });
    }
    
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
    
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    } else {
        window.location.reload();
        return;
    }
    
    showNotification(`${currentProduct.name} agregado al carrito`, 'success');
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductDetail();
    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addToCartWithSize);
    }
});