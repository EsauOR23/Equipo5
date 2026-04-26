document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.querySelector('.login-button');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        errorMessage.textContent = '';

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Validar que se llenaron ambos campos
        if (!username || !password) {
            errorMessage.textContent = 'Por favor, completa ambos campos';
            return;
        }

        // Mostrar estado de carga
        loginButton.textContent = 'Verificando...';
        loginButton.disabled = true;

        try {
            // Enviar credenciales al servidor backend
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usuario: username,
                    contrasena: password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Guardar datos de sesión para que el menú los pueda leer
                sessionStorage.setItem('usuario', data.usuario);
                sessionStorage.setItem('rol', data.rol);

                // Todos van al mismo menú; el menú decide qué mostrar según el rol
                window.location.href = 'MenuDueño.html';
            } else {
                // Credenciales incorrectas u otro error del servidor
                errorMessage.textContent = data.mensaje || 'Error al iniciar sesión';
            }

        } catch (error) {
            // Error de red (el servidor no está corriendo, etc.)
            errorMessage.textContent = 'No se pudo conectar al servidor. Verifica que esté corriendo.';
            console.error('Error de conexión:', error);
        } finally {
            // Restaurar el botón
            loginButton.textContent = 'Ingresar';
            loginButton.disabled = false;
        }
    });

    // Limpiar mensaje de error al escribir
    usernameInput.addEventListener('input', function() {
        errorMessage.textContent = '';
    });

    passwordInput.addEventListener('input', function() {
        errorMessage.textContent = '';
    });
});
