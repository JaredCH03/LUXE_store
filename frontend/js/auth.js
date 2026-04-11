// Autenticación
const API_BASE = 'http://localhost:5000/api';

function showAlert(message, type) {
    // Eliminar alerta existente si la hay
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) existingAlert.remove();

    // Crear elemento
    const alertDiv = document.createElement('div');
    alertDiv.className = 'custom-alert';
    alertDiv.textContent = message;

    // Colores según tipo
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        info: '#2196f3'
    };

    // Estilos (igual que antes: arriba derecha)
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.error};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(alertDiv);

    // Eliminar después de 3 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.remove();
    }, 3000);
}
async function register(name, email, password, confirmPassword, role) {
    if (!name || !email || ! password || !confirmPassword) {
        showAlert('Por favor, completa todos los campos', 'error');
        return false;
    }
    if (password.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }
    if (password !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return false;
    }
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        console.log('Respuesta completa:', data); // 👈 Ver en consola

        if (res.ok && data.success) {
            saveSession(data.token, data.user);
            showAlert('Registro exitoso. Redirigiendo...', 'success');
            setTimeout(() => {
                if (role === 'seller') window.location.href = 'dashboard/index.html';
                else window.location.href = 'tienda.html';
            }, 1500);
            return true;
        } else {
            // Mostrar errores detallados
            if (data.errors && Array.isArray(data.errors)) {
                const errorMsg = data.errors.map(e => e.msg).join(', ');
                showAlert(errorMsg, 'error');
            } else {
                showAlert(data.message || 'Error en registro', 'error');
            }
            return false;
        }
    } catch (err) {
        console.error(err);
        showAlert('Error de conexión', 'error');
        return false;
    }
}

async function login(email, password) {
    if (!email || !password) {
        showAlert('Por favor, ingresa email y contraseña', 'error');
        return false;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Respuesta login:', data); // Depuración

        if (response.ok && data.success) {
            saveSession(data.token, data.user);
            const userName = data.user.name || 'Usuario';
            showAlert(`¡Bienvenido ${userName}!`, 'success');


            console.log('Usuario completo:', data.user);
            console.log('Rol detectado:', data.user.role );


            // Dentro del if (response.ok && data.success)
            setTimeout(() => {
                const userRole = data.user.role; 
                if (userRole === 'seller') {
                    window.location.href = 'dashboard/index.html';
                } else {
                    window.location.href = 'tienda.html';
                }
            }, 1500);
            return true;
        } else {
            // Mostrar el mensaje de error que viene del backend
            const errorMsg = data.message || 'Credenciales incorrectas';
            showAlert(errorMsg, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error en login:', error);
        showAlert('Error de conexión con el servidor', 'error');
        return false;
    }
}
