// ═══════════════════════════════════════════════════════
//  navbar.js — Control de sesión y roles para todas las páginas
//  Incluir este archivo en TODOS los HTML antes de cerrar </body>
// ═══════════════════════════════════════════════════════

(function () {

    // ── Páginas exclusivas del dueño ─────────────────────────────────────────
    const PAGINAS_SOLO_DUENO = ['Reportes.html'];

    // ── Permisos por rol ─────────────────────────────────────────────────────
    //  Define qué pestañas puede ver cada rol.
    //  'todos' = cualquier rol puede verla.
    //  Si agregas más roles en el futuro, solo edita este objeto.
    const PERMISOS = {
        'Registrar Venta':     'todos',
        'Inventario':          'todos',
        'Consultar Precios':   'todos',
        'Pagos a Proveedores': 'todos',
        'Reportes':            'dueño'   // Solo dueño
    };

    // ── 1. Verificar sesión ──────────────────────────────────────────────────
    const usuario = sessionStorage.getItem('usuario');
    const rol     = sessionStorage.getItem('rol');

    if (!usuario || !rol) {
        window.location.href = 'Login.html';
        return;
    }

    // ── 2. Proteger página actual si es restringida ──────────────────────────
    const paginaActual = window.location.pathname.split('/').pop();
    if (PAGINAS_SOLO_DUENO.includes(paginaActual) && rol !== 'dueño') {
        alert('No tienes permiso para acceder a esta sección.');
        window.location.href = 'MenuDueño.html';
        return;
    }

    // ── 3. Inyectar navbar con datos de sesión y botón Salir ─────────────────
    //  Espera a que el DOM esté listo para modificar la navbar existente
    document.addEventListener('DOMContentLoaded', function () {

        // Reemplazar el texto de usuario estático por el nombre real + badge de rol
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
                window.location.href = 'Login.html';
            });
        }

        // ── 4. Ocultar pestañas según rol ────────────────────────────────────
        //  Recorre todos los <li class="nav-item"> de la navbar y oculta
        //  los que el rol actual no tiene permiso de ver.
        const navItems = document.querySelectorAll('.navbar-nav .nav-item');

        navItems.forEach(function (item) {
            const enlace = item.querySelector('a.nav-link');
            if (!enlace) return;

            const textoEnlace = enlace.textContent.trim();

            // Buscar si este texto coincide con alguna clave de permisos
            for (const [nombrePestana, rolRequerido] of Object.entries(PERMISOS)) {
                if (textoEnlace.includes(nombrePestana)) {
                    if (rolRequerido !== 'todos' && rol !== rolRequerido) {
                        item.style.display = 'none';
                    }
                    break;
                }
            }
        });

    });

})();