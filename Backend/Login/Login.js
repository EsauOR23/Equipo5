document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    
    // Usarios Permitidos
    const validCredentials = {
        'dueño': {
            password: 'dueño',
            redirectTo: 'MenuDueño.html'
        },
        'trabajador': {
            password: 'trabajador',
            redirectTo: 'MenuTrabajador.html'
        }
    };
    
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        errorMessage.textContent = '';
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Validar que se llenaron ambos campos
        if (!username || !password) {
            errorMessage.textContent = 'Por favor, completa ambos campos';
            return;
        }
        
        // Verificar si el usuario existe
        if (!validCredentials[username]) {
            errorMessage.textContent = 'Usuario incorrecto';
            return;
        }
        
        // Verificar la contraseña
        if (validCredentials[username].password !== password) {
            errorMessage.textContent = 'Contraseña incorrecta';
            return;
        }
        
        // Redirigir a la página correspondiente
        window.location.href = validCredentials[username].redirectTo;
    });
    
    // Limpiar mensaje de error al escribir
    usernameInput.addEventListener('input', function() {
        errorMessage.textContent = '';
    });
    
    passwordInput.addEventListener('input', function() {
        errorMessage.textContent = '';
    });
});