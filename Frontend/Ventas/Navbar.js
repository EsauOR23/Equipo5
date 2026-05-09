// ═══════════════════════════════════════════════════════
//  Navbar.js — Control de sesión y roles (Ventas)
// ═══════════════════════════════════════════════════════

(function () {

    const PAGINAS_SOLO_DUENO = ['Reportes.html'];

    const PERMISOS = {
        'Registrar Venta':     'todos',
        'Inventario':          'todos',
        'Consultar Precios':   'todos',
        'Pagos a Proveedores': 'todos',
        'Reportes':            'dueño'
    };

    // ── 1. Verificar sesión ──────────────────────────────────────────────────
    const usuario = sessionStorage.getItem('usuario');
    const rol     = sessionStorage.getItem('rol');

    if (!usuario || !rol) {
        window.location.href = '../Login/Login.html';
        return;
    }

    // ── 2. Proteger página restringida ───────────────────────────────────────
    const paginaActual = window.location.pathname.split('/').pop();
    if (PAGINAS_SOLO_DUENO.includes(paginaActual) && rol !== 'dueño') {
        alert('No tienes permiso para acceder a esta sección.');
        window.location.href = '../Login/Login.html';
        return;
    }

    // ── 3. Inicializar navbar (compatible con DOM ya cargado o no) ───────────
    function initNavbar() {
        const navbarText = document.querySelector('.navbar-text');
        if (navbarText) {
            const colorBadge = rol === 'dueño' ? 'bg-warning text-dark' : 'bg-light text-primary';
            const rolTexto   = rol.charAt(0).toUpperCase() + rol.slice(1);

            navbarText.innerHTML = `
                <i class="bi bi-person-circle me-1"></i>
                <span>${usuario}</span>
                <span class="badge ${colorBadge} ms-1">${rolTexto}</span>
                <button class="btn btn-outline-light btn-sm ms-3" id="cerrarSesionNavbar">
                    <i class="bi bi-box-arrow-right me-1"></i>Salir
                </button>
            `;

            document.getElementById('cerrarSesionNavbar').addEventListener('click', function () {
                sessionStorage.clear();
                window.location.href = '../Login/Login.html';
            });
        }

        // Ocultar pestañas según rol
        document.querySelectorAll('.navbar-nav .nav-item').forEach(function (item) {
            const enlace = item.querySelector('a.nav-link');
            if (!enlace) return;
            const textoEnlace = enlace.textContent.trim();
            for (const [nombre, rolRequerido] of Object.entries(PERMISOS)) {
                if (textoEnlace.includes(nombre)) {
                    if (rolRequerido !== 'todos' && rol !== rolRequerido) {
                        item.style.display = 'none';
                    }
                    break;
                }
            }
        });
    }

    // Ejecutar cuando el DOM esté listo, sin importar si ya cargó o no
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbar);
    } else {
        initNavbar();
    }

})();
