// =====================================================
// LANDING PAGE - LÓGICA Y ANIMACIONES (CORREGIDO)
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    initLandingPage();
    initCategoryCards();
    initSmoothScroll();
    initPageTransition();
    initSearchPanelLanding();
});

function initLandingPage() {
    // Animaciones al hacer scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-up');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.feature-card, .category-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

function initCategoryCards() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            console.log('🎯 Categoría seleccionada:', category);
            
            if (category) {
                // Guardar categoría en sessionStorage para usarla en tienda.html
                sessionStorage.setItem('selectedCategory', category);
                
                // Animación de salida
                const transition = document.getElementById('pageTransition');
                if (transition) {
                    transition.classList.add('active');
                }
                
                setTimeout(() => {
                    // Redirigir con parámetro de categoría
                    window.location.href = `tienda.html?categoria=${category}`;
                }, 400);
            }
        });
    });
}
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#categorias') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initPageTransition() {
    // Al hacer clic en enlaces internos, mostrar animación de transición
    document.querySelectorAll('a:not([target="_blank"]):not([href^="#"]):not([href^="mailto"])').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('//')) {
                e.preventDefault();
                
                const transition = document.getElementById('pageTransition');
                if (transition) {
                    transition.classList.add('active');
                }
                
                setTimeout(() => {
                    window.location.href = href;
                }, 500);
            }
        });
    });
}

// Inicializar panel de búsqueda en landing
function initSearchPanelLanding() {
    const searchToggle = document.getElementById('searchToggleBtn');
    const searchPanel = document.getElementById('searchPanel');
    const closeSearch = document.getElementById('closeSearchBtn');
    const overlay = document.getElementById('searchOverlay');
    
    if (!searchToggle || !searchPanel) return;
    
    function openSearchPanel() {
        searchPanel.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
    
    function closeSearchPanel() {
        searchPanel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    searchToggle.addEventListener('click', openSearchPanel);
    if (closeSearch) closeSearch.addEventListener('click', closeSearchPanel);
    if (overlay) overlay.addEventListener('click', closeSearchPanel);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchPanel.classList.contains('active')) {
            closeSearchPanel();
        }
    });
}

// Efecto parallax en hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-landing');
    
    if (hero) {
        const background = hero.querySelector('.hero-background');
        if (background) {
            background.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        
        const content = hero.querySelector('.hero-content');
        if (content) {
            content.style.transform = `translateY(${scrolled * 0.2}px)`;
            content.style.opacity = 1 - (scrolled * 0.002);
        }
    }
});