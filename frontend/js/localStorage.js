// Gestión de sesión
const TOKEN_KEY = 'luxe_token';
const USER_KEY = 'luxe_user';

function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    return getToken() !== null;
}

function isSeller() {
    const user = getCurrentUser();
    return user && user.role === 'seller';
}

function logout() {
    // Limpiar todo
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('luxe_cart');
    localStorage.removeItem('checkout_cart');
    
    // Redirigir correctamente según la ubicación
    if (window.location.pathname.includes('/dashboard/')) {
        window.location.href = '../login.html';
    } else {
        window.location.href = 'login.html';
    }
}