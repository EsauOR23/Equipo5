// ═══════════════════════════════════════════════════════
//  navbar.js — Control de sesión y roles para todas las páginas
//  Incluir este archivo en TODOS los HTML antes de cerrar </body>
// ═══════════════════════════════════════════════════════

(function () {

    // ── Páginas exclusivas del dueño ─────────────────────────────────────────
    const PAGINAS_SOLO_DUENO = ['Reportes.html'];

    // ── Permisos por rol ─────────────────────────────────────────────────────
    //  Se identifica cada pestaña por una palabra clave que aparezca en el
    //  href del enlace (más confiable que el texto, que puede traer íconos,
    //  espacios o saltos de línea).
    //  'todos' = cualquier rol puede verla.
    const PERMISOS = [
        { match: 'Ventas',      rol: 'todos' },
        { match: 'Inventario',  rol: 'todos' },
        { match: 'Precios',     rol: 'todos' },
        { match: 'Proveedores', rol: 'todos' },
        { match: 'Reportes',    rol: 'dueño' }  // Solo dueño
    ];

    // ── 1. Verificar sesión ──────────────────────────────────────────────────
    const usuario = sessionStorage.getItem('usuario');
    const rol     = (sessionStorage.getItem('rol') || '').trim().toLowerCase();

    if (!usuario || !rol) {
        window.location.href = '../Login/Login.html';
        return;
    }

    // ── 2. Proteger página actual si es restringida ──────────────────────────
    const paginaActual = window.location.pathname.split('/').pop();
    if (PAGINAS_SOLO_DUENO.includes(paginaActual) && rol !== 'dueño') {
        alert('No tienes permiso para acceder a esta sección.');
        window.location.href = '../Ventas/Ventas.html';
        return;
    }

    // ── Función que oculta las pestañas según el rol ─────────────────────────
    function aplicarPermisos() {
        const enlaces = document.querySelectorAll('.navbar-nav a.nav-link, .navbar-nav .nav-item');

        enlaces.forEach(function (el) {
            // Tomamos href y texto para comparar
            const link = el.tagName === 'A' ? el : el.querySelector('a.nav-link');
            if (!link) return;

            const href  = (link.getAttribute('href') || '').toLowerCase();
            const texto = (link.textContent || '').toLowerCase();

            for (const permiso of PERMISOS) {
                const clave = permiso.match.toLowerCase();
                if (href.includes(clave) || texto.includes(clave)) {
                    if (permiso.rol !== 'todos' && rol !== permiso.rol) {
                        // Ocultar el <li> contenedor si existe, si no el propio enlace
                        const contenedor = link.closest('.nav-item') || link;
                        contenedor.style.display = 'none';
                        // Por seguridad: deshabilitar la navegación aunque alguien
                        // muestre el elemento desde el inspector
                        link.setAttribute('href', '#');
                        link.addEventListener('click', function (e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }, true);
                    }
                    break;
                }
            }
        });
    }

    // ── 3. Inyectar datos de usuario + botón Salir + ocultar pestañas ────────
    function init() {
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

            const btnSalir = document.getElementById('cerrarSesionNavbar');
            if (btnSalir) {
                btnSalir.addEventListener('click', function () {
                    sessionStorage.clear();
                    window.location.href = '../Login/Login.html';
                });
            }
        }

        aplicarPermisos();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
