(function () {
    const PAGINAS_SOLO_DUENO = ["Reportes.html"];
    const PERMISOS = {
        "Registrar Venta": "todos",
        "Inventario": "todos",
        "Consultar Precios": "todos",
        "Pagos a Proveedores": "todos",
        "Reportes": "dueño",
    };

    const usuario = sessionStorage.getItem("usuario");
    const rol = sessionStorage.getItem("rol");

    if (!usuario || !rol) {
        window.location.href = "../Login/Login.html";
        return;
    }

    const paginaActual = window.location.pathname.split("/").pop();
    if (PAGINAS_SOLO_DUENO.includes(paginaActual) && rol !== "dueño") {
        alert("No tienes permiso para acceder a esta seccion.");
        window.location.href = "../Menu/MenuDueño.html";
        return;
    }

    document.addEventListener("DOMContentLoaded", function () {
        const navbarText = document.querySelector(".navbar-text");
        if (navbarText) {
            const colorBadge = rol === "dueño" ? "bg-warning text-dark" : "bg-light text-primary";
            const rolTexto = rol.charAt(0).toUpperCase() + rol.slice(1);

            navbarText.innerHTML = `
                <i class="bi bi-person-circle me-1"></i>
                <span>${usuario}</span>
                <span class="badge ${colorBadge} ms-1">${rolTexto}</span>
                <button class="btn btn-outline-light btn-sm ms-3" id="cerrarSesionNavbar">
                    <i class="bi bi-box-arrow-right me-1"></i>Salir
                </button>
            `;

            document.getElementById("cerrarSesionNavbar").addEventListener("click", function () {
                sessionStorage.clear();
                window.location.href = "../Login/Login.html";
            });
        }

        const navItems = document.querySelectorAll(".navbar-nav .nav-item");
        navItems.forEach(function (item) {
            const enlace = item.querySelector("a.nav-link");
            if (!enlace) {
                return;
            }

            const textoEnlace = enlace.textContent.trim();
            for (const [nombrePestana, rolRequerido] of Object.entries(PERMISOS)) {
                if (textoEnlace.includes(nombrePestana)) {
                    if (rolRequerido !== "todos" && rol !== rolRequerido) {
                        item.style.display = "none";
                    }
                    break;
                }
            }
        });
    });
})();
