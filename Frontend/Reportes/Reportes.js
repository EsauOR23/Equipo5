// ─────────────────────────────────────────────────────────────────────────────
//  Reportes.js — Módulo de reportes de Abarrotes ABD
//  Backend: Flask en http://127.0.0.1:5000
// ─────────────────────────────────────────────────────────────────────────────

const API = "http://127.0.0.1:5000/api/reportes";

// ── Estado ────────────────────────────────────────────────────────────────────
let ventasRegistradas = [];
let ventasFiltradas   = [];
let paginaActual      = 1;
const POR_PAGINA      = 10;

// ── Helpers de formato ────────────────────────────────────────────────────────
function dinero(monto) {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(monto);
}

function fechaCorta(str) {
    if (!str) return "—";
    const d = new Date(str.replace(" ", "T"));
    return isNaN(d) ? str : d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fechaHora(str) {
    if (!str) return "—";
    const d = new Date(str.replace(" ", "T"));
    if (isNaN(d)) return str;
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
        + " " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function estadoBadge(estado) {
    const mapa = {
        completado:  "bg-success",
        completada:  "bg-success",
        pendiente:   "bg-warning text-dark",
        cancelado:   "bg-danger",
        cancelada:   "bg-danger",
    };
    const cls = mapa[(estado || "").toLowerCase()] || "bg-secondary";
    return `<span class="badge ${cls}">${estado || "—"}</span>`;
}

// ── Modal de alertas ──────────────────────────────────────────────────────────
function mostrarAlerta(titulo, cuerpo, tipo = "info") {
    const colores = {
        success: "bg-success text-white",
        warning: "bg-warning text-dark",
        error:   "bg-danger text-white",
        info:    "bg-primary text-white",
    };
    const header = document.getElementById("alertModalHeader");
    header.className = `modal-header ${colores[tipo] || colores.info}`;
    document.getElementById("alertModalTitle").textContent = titulo;
    document.getElementById("alertModalBody").innerHTML    = cuerpo;

    const el = document.getElementById("alertModal");
    let modal = bootstrap.Modal.getInstance(el);
    if (!modal) modal = new bootstrap.Modal(el);
    modal.show();
}

// ── Tarjetas de resumen ───────────────────────────────────────────────────────
async function cargarResumen() {
    // Ventas de hoy
    try {
        const res  = await fetch(`${API}/resumen-diario`);
        const data = await res.json();
        if (data.success) {
            document.getElementById("resumenVentasHoy").textContent =
                data.estadisticas?.totalVentas ?? "0";const bottomHoy = document.getElementById("bottomVentasHoy");
                if (bottomHoy) bottomHoy.textContent = data.estadisticas?.totalVentas ?? "0";
        }
    } catch { /* silencioso */ }

    // Inventario
    try {
        const res  = await fetch(`${API}/inventario`);
        const data = await res.json();
        if (data.success) {
            document.getElementById("resumenProductos").textContent  = data.resumen?.total ?? "—";
            document.getElementById("resumenBajoStock").textContent  = data.resumen?.bajoStock ?? "—";
        }
    } catch { /* silencioso */ }

    // Proveedores
    try {
        const res  = await fetch(`${API}/proveedores`);
        const data = await res.json();
        if (data.success) {
            document.getElementById("resumenPagos").textContent      = data.resumen?.totalPagos ?? "—";
            document.getElementById("resumenPendientes").textContent = data.resumen?.pendientes ?? "—";
        }
    } catch { /* silencioso */ }
}

// ── Ventas ────────────────────────────────────────────────────────────────────
async function cargarVentas(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.fechaInicio) params.set("fechaInicio", filtros.fechaInicio);
    if (filtros.fechaFin)    params.set("fechaFin",    filtros.fechaFin);

    const url = params.toString() ? `${API}/ventas?${params}` : `${API}/ventas`;

    document.getElementById("tablaVentas").innerHTML =
        '<tr><td colspan="6" class="text-center text-muted py-3"><div class="spinner-border spinner-border-sm me-2"></div>Cargando...</td></tr>';

    try {
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error(data.mensaje || "Error al cargar ventas");

        ventasRegistradas = data.ventas || [];
        ventasFiltradas   = [...ventasRegistradas];
        paginaActual      = 1;

        // Actualizar tarjeta de ventas totales e ingresos
        document.getElementById("resumenTotalVentas").textContent =
            data.estadisticas?.totalVentas ?? ventasRegistradas.length;
        document.getElementById("resumenIngresos").textContent =
            dinero(data.estadisticas?.totalIngresos ?? 0);

        const bottomVentas = document.getElementById("bottomTotalVentas");
        if (bottomVentas) bottomVentas.textContent = data.estadisticas?.totalVentas ?? ventasRegistradas.length;

        renderTablaVentas();
        renderPaginacion();
    } catch (err) {
        document.getElementById("tablaVentas").innerHTML =
            `<tr><td colspan="6" class="text-center text-danger py-3">
                <i class="bi bi-exclamation-triangle me-2"></i>${err.message}
             </td></tr>`;
    }
}

function renderTablaVentas() {
    const tbody  = document.getElementById("tablaVentas");
    const inicio = (paginaActual - 1) * POR_PAGINA;
    const pagina = ventasFiltradas.slice(inicio, inicio + POR_PAGINA);

    if (pagina.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="6" class="text-center text-muted py-4">' +
            '<i class="bi bi-cart-x d-block fs-2 mb-2"></i>No se encontraron ventas</td></tr>';
        return;
    }

    tbody.innerHTML = pagina.map(v => {
        const totalProd = v.productos.reduce((s, p) => s + p.cantidad, 0);
        return `
        <tr>
            <td class="fw-bold">#${v.numero}</td>
            <td>${fechaHora(v.fecha)}</td>
            <td>${totalProd} producto${totalProd !== 1 ? "s" : ""}</td>
            <td class="fw-bold text-success">${dinero(v.total)}</td>
            <td>${v.metodoPago}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary ver-detalle" data-id="${v.id}">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>`;
    }).join("");

    tbody.querySelectorAll(".ver-detalle").forEach(btn =>
        btn.addEventListener("click", () => mostrarDetalleVenta(parseInt(btn.dataset.id)))
    );
}

function renderPaginacion() {
    const total = Math.ceil(ventasFiltradas.length / POR_PAGINA);
    const ul    = document.getElementById("paginacionVentas");
    ul.innerHTML = "";
    if (total <= 1) return;

    const crearLi = (texto, pagina, deshabilitado = false, activo = false) => {
        const li = document.createElement("li");
        li.className = `page-item ${deshabilitado ? "disabled" : ""} ${activo ? "active" : ""}`;
        li.innerHTML = `<a class="page-link" href="#">${texto}</a>`;
        if (!deshabilitado) {
            li.querySelector("a").addEventListener("click", e => {
                e.preventDefault();
                paginaActual = pagina;
                renderTablaVentas();
                renderPaginacion();
            });
        }
        return li;
    };

    ul.appendChild(crearLi("«", paginaActual - 1, paginaActual === 1));
    for (let i = 1; i <= total; i++) {
        ul.appendChild(crearLi(i, i, false, i === paginaActual));
    }
    ul.appendChild(crearLi("»", paginaActual + 1, paginaActual === total));
}

function mostrarDetalleVenta(id) {
    const venta = ventasRegistradas.find(v => v.id === id);
    if (!venta) { mostrarAlerta("Error", "Venta no encontrada.", "error"); return; }

    const filas = venta.productos.length
        ? venta.productos.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${p.nombre}</td>
                <td class="text-center">${p.cantidad}</td>
                <td class="text-end">${dinero(p.precio)}</td>
                <td class="text-end fw-bold">${dinero(p.subtotal)}</td>
            </tr>`).join("")
        : '<tr><td colspan="5" class="text-center text-muted">Sin detalle de productos</td></tr>';

    document.getElementById("detalleVentaContent").innerHTML = `
        <div class="row mb-3">
            <div class="col-6">
                <p class="mb-1"><strong>Venta #:</strong> ${venta.numero}</p>
                <p class="mb-1"><strong>Fecha:</strong> ${fechaHora(venta.fecha)}</p>
            </div>
            <div class="col-6">
                <p class="mb-1"><strong>Método de pago:</strong> ${venta.metodoPago}</p>
                <p class="mb-1"><strong>Total:</strong> <span class="text-success fw-bold">${dinero(venta.total)}</span></p>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-bordered table-sm">
                <thead class="table-light">
                    <tr><th>#</th><th>Producto</th><th class="text-center">Cant.</th>
                        <th class="text-end">Precio</th><th class="text-end">Subtotal</th></tr>
                </thead>
                <tbody>${filas}</tbody>
                <tfoot>
                    <tr><td colspan="4" class="text-end fw-bold">Total:</td>
                        <td class="text-end fw-bold text-success">${dinero(venta.total)}</td></tr>
                </tfoot>
            </table>
        </div>`;

    const el = document.getElementById("detalleVentaModal");
    let modal = bootstrap.Modal.getInstance(el);
    if (!modal) modal = new bootstrap.Modal(el);
    modal.show();
}

function mostrarEstadisticas() {
    if (!ventasFiltradas.length) {
        mostrarAlerta("Sin datos", "No hay ventas en el periodo seleccionado.", "warning");
        return;
    }
    const total    = ventasFiltradas.length;
    const ingresos = ventasFiltradas.reduce((s, v) => s + v.total, 0);
    const metodos  = {};
    ventasFiltradas.forEach(v => { metodos[v.metodoPago] = (metodos[v.metodoPago] || 0) + 1; });

    const filaMetodos = Object.entries(metodos)
        .map(([m, c]) => `<li>${m}: <strong>${c}</strong> (${((c / total) * 100).toFixed(1)}%)</li>`)
        .join("");

    mostrarAlerta("Estadísticas de Ventas", `
        <p><strong>Total de ventas:</strong> ${total}</p>
        <p><strong>Ingresos totales:</strong> ${dinero(ingresos)}</p>
        <p><strong>Promedio por venta:</strong> ${dinero(ingresos / total)}</p>
        <hr>
        <p class="mb-1"><strong>Métodos de pago:</strong></p>
        <ul class="mb-0">${filaMetodos}</ul>
    `, "info");
}

function exportarVentasExcel() {
    if (!ventasFiltradas.length) {
        mostrarAlerta("Sin datos", "No hay ventas para exportar.", "warning");
        return;
    }
    const datos = ventasFiltradas.map(v => ({
        "Venta #":      v.numero,
        "Fecha":        fechaHora(v.fecha),
        "Productos":    v.productos.reduce((s, p) => s + p.cantidad, 0),
        "Total":        v.total,
        "Método Pago":  v.metodoPago,
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `Ventas_ABD_${new Date().toISOString().split("T")[0]}.xlsx`);
    mostrarAlerta("Exportado", "El archivo Excel se descargó correctamente.", "success");
}

// ── Inventario ────────────────────────────────────────────────────────────────
async function cargarInventario() {
    const tbody = document.getElementById("tablaInventario");
    tbody.innerHTML =
        '<tr><td colspan="9" class="text-center text-muted py-3"><div class="spinner-border spinner-border-sm me-2"></div>Cargando...</td></tr>';

    try {
        const res  = await fetch(`${API}/inventario`);
        const data = await res.json();
        if (!data.success) throw new Error(data.mensaje || "Error al cargar inventario");

        const productos = data.productos || [];
        if (!productos.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">Sin productos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = productos.map(p => {
            const badgeCls = p.estado === "Bajo stock" ? "bg-warning text-dark" : "bg-success";
            return `
            <tr>
                <td>${p.id}</td>
                <td class="fw-semibold">${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>${p.proveedor}</td>
                <td class="fw-bold ${p.estado === "Bajo stock" ? "text-warning" : "text-success"}">${p.stock}</td>
                <td>${p.stockMin} / ${p.stockMax}</td>
                <td>${dinero(p.precioCompra)}</td>
                <td>${dinero(p.precioVenta)}</td>
                <td><span class="badge ${badgeCls}">${p.estado}</span></td>
            </tr>`;
        }).join("");

        // Actualizar tarjeta resumen
        document.getElementById("resumenProductos").textContent = data.resumen?.total ?? productos.length;
        document.getElementById("resumenBajoStock").textContent = data.resumen?.bajoStock ?? "—";

        const bottomInv = document.getElementById("bottomTotalInventario");
        if (bottomInv) bottomInv.textContent = data.resumen?.total ?? productos.length;
        const bottomInvF = document.getElementById("bottomFechaInventario");
        if (bottomInvF) bottomInvF.textContent = new Date().toLocaleDateString("es-MX");

    } catch (err) {
        tbody.innerHTML =
            `<tr><td colspan="9" class="text-center text-danger py-3">
                <i class="bi bi-exclamation-triangle me-2"></i>${err.message}
             </td></tr>`;
    }
}

// ── Proveedores ───────────────────────────────────────────────────────────────
async function cargarProveedores() {
    const tbody = document.getElementById("tablaProveedores");
    tbody.innerHTML =
        '<tr><td colspan="8" class="text-center text-muted py-3"><div class="spinner-border spinner-border-sm me-2"></div>Cargando...</td></tr>';

    try {
        const res  = await fetch(`${API}/proveedores`);
        const data = await res.json();
        if (!data.success) throw new Error(data.mensaje || "Error al cargar pagos");

        const pagos = data.pagos || [];
        if (!pagos.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Sin pagos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = pagos.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${fechaCorta(p.fecha)}</td>
                <td class="fw-semibold">${p.empresa}</td>
                <td>${p.contacto}</td>
                <td class="fw-bold text-success">${dinero(p.monto)}</td>
                <td>${p.metodo}</td>
                <td>${estadoBadge(p.estado)}</td>
                <td>${p.usuario}</td>
            </tr>`).join("");

        // Actualizar tarjeta resumen
        document.getElementById("resumenPagos").textContent      = data.resumen?.totalPagos ?? pagos.length;
        document.getElementById("resumenPendientes").textContent = data.resumen?.pendientes ?? "—";

        const bottomProv = document.getElementById("bottomTotalProveedores");
        if (bottomProv) bottomProv.textContent = data.resumen?.totalPagos ?? pagos.length;
        const bottomProvF = document.getElementById("bottomFechaProveedores");
        if (bottomProvF && pagos.length > 0) bottomProvF.textContent = fechaCorta(pagos[0].fecha);

    } catch (err) {
        tbody.innerHTML =
            `<tr><td colspan="8" class="text-center text-danger py-3">
                <i class="bi bi-exclamation-triangle me-2"></i>${err.message}
             </td></tr>`;
    }
}

// ── Precios ───────────────────────────────────────────────────────────────────
let preciosData = [];

async function cargarPrecios() {
    const tbody = document.getElementById("tablaPrecios");
    tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-muted py-3"><div class="spinner-border spinner-border-sm me-2"></div>Cargando...</td></tr>';

    try {
        const res  = await fetch(`${API}/precios`);
        const data = await res.json();
        if (!data.success) throw new Error(data.mensaje || "Error al cargar precios");

        preciosData = data.productos || [];
        if (!preciosData.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Sin productos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = preciosData.map(p => {
            const margenCls = p.margen >= 20 ? "text-success" : p.margen >= 10 ? "text-warning" : "text-danger";
            return `
            <tr>
                <td>${p.id}</td>
                <td class="fw-semibold">${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>${p.proveedor}</td>
                <td>${dinero(p.precioCompra)}</td>
                <td class="fw-bold">${dinero(p.precioVenta)}</td>
                <td class="fw-bold ${margenCls}">${p.margen}%</td>
            </tr>`;
        }).join("");

        const bottomPrecios = document.getElementById("bottomTotalPrecios");
        if (bottomPrecios) bottomPrecios.textContent = preciosData.length;
        const bottomPreciosF = document.getElementById("bottomFechaPrecios");
        if (bottomPreciosF) bottomPreciosF.textContent = new Date().toLocaleDateString("es-MX");
        
    } catch (err) {
        tbody.innerHTML =
            `<tr><td colspan="7" class="text-center text-danger py-3">
                <i class="bi bi-exclamation-triangle me-2"></i>${err.message}
             </td></tr>`;
    }
}

function exportarPreciosExcel() {
    if (!preciosData.length) {
        mostrarAlerta("Sin datos", "No hay precios para exportar.", "warning");
        return;
    }
    const datos = preciosData.map(p => ({
        "#":            p.id,
        "Producto":     p.nombre,
        "Categoría":    p.categoria,
        "Proveedor":    p.proveedor,
        "P. Compra":    p.precioCompra,
        "P. Venta":     p.precioVenta,
        "Margen %":     p.margen,
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Precios");
    XLSX.writeFile(wb, `Precios_ABD_${new Date().toISOString().split("T")[0]}.xlsx`);
    mostrarAlerta("Exportado", "El archivo Excel se descargó correctamente.", "success");
}

// ── Acciones Generales de Reportes ────────────────────────────────────────────

// 1. Descargar todos los reportes en un solo Excel con múltiples hojas
async function descargarTodosExcel() {
    mostrarAlerta("Generando Reporte", '<div class="text-center"><div class="spinner-border text-primary my-2"></div><br>Compilando toda la información...</div>', "info");
    
    try {
        // Hacemos las peticiones a todas las rutas al mismo tiempo
        const [rVentas, rInv, rProv, rPrecios] = await Promise.all([
            fetch(`${API}/ventas`).then(r => r.json()),
            fetch(`${API}/inventario`).then(r => r.json()),
            fetch(`${API}/proveedores`).then(r => r.json()),
            fetch(`${API}/precios`).then(r => r.json())
        ]);

        const wb = XLSX.utils.book_new();

        // Hoja 1: Ventas
        if (rVentas.success && rVentas.ventas) {
            const datosVentas = rVentas.ventas.map(v => ({
                "Venta #": v.numero,
                "Fecha": fechaHora(v.fecha),
                "Total Productos": v.productos.reduce((s, p) => s + p.cantidad, 0),
                "Total ($)": v.total,
                "Método Pago": v.metodoPago
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datosVentas), "Ventas");
        }

        // Hoja 2: Inventario
        if (rInv.success && rInv.productos) {
            const datosInv = rInv.productos.map(p => ({
                "Producto": p.nombre,
                "Categoría": p.categoria,
                "Proveedor": p.proveedor,
                "Stock Actual": p.stock,
                "Precio Compra": p.precioCompra,
                "Precio Venta": p.precioVenta,
                "Estado": p.estado
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datosInv), "Inventario");
        }

        // Hoja 3: Pagos a Proveedores
        if (rProv.success && rProv.pagos) {
            const datosProv = rProv.pagos.map(p => ({
                "Fecha": fechaCorta(p.fecha),
                "Empresa": p.empresa,
                "Monto ($)": p.monto,
                "Método": p.metodo,
                "Estado": p.estado
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datosProv), "Pagos a Proveedores");
        }

        // Guardar el archivo
        XLSX.writeFile(wb, `Reporte_Completo_ABD_${new Date().toISOString().split("T")[0]}.xlsx`);
        
        // Cerramos el modal de "Cargando" y mostramos éxito
        setTimeout(() => {
            mostrarAlerta("Éxito", "El reporte consolidado se descargó correctamente en un archivo Excel.", "success");
        }, 500);

    } catch (error) {
        mostrarAlerta("Error", "Hubo un problema de conexión al compilar los reportes.", "error");
    }
}

// 2. Resumen Diario (Llama al endpoint que ya tienes en Flask)
async function mostrarResumenDiario() {
    try {
        const res = await fetch(`${API}/resumen-diario`);
        const data = await res.json();
        
        if (data.success) {
            const est = data.estadisticas;
            let metodosHtml = "";
            
            if (est.metodosPago && Object.keys(est.metodosPago).length > 0) {
                 metodosHtml = Object.entries(est.metodosPago)
                    .map(([m, c]) => `<li>${m}: <strong>${c}</strong> transacciones</li>`).join("");
            } else {
                 metodosHtml = "<li>No hay pagos registrados hoy</li>";
            }

            mostrarAlerta("Resumen de Hoy (" + fechaCorta(data.fecha) + ")", `
                <div class="text-center mb-3 mt-2">
                    <h2 class="text-success fw-bold display-5">${dinero(est.totalIngresos)}</h2>
                    <p class="text-muted mb-0">Ingresos del día</p>
                </div>
                <ul class="list-group list-group-flush mb-3">
                    <li class="list-group-item d-flex justify-content-between align-items-center bg-light">
                        Ventas realizadas
                        <span class="badge bg-primary rounded-pill fs-6">${est.totalVentas}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center bg-light">
                        Ticket Promedio
                        <span class="badge bg-info rounded-pill fs-6">${dinero(est.promedioVenta)}</span>
                    </li>
                </ul>
                <p class="mb-1 text-secondary"><i class="bi bi-wallet2 me-1"></i><strong>Métodos de cobro:</strong></p>
                <ul class="text-muted small">${metodosHtml}</ul>
            `, "info");
        } else {
            mostrarAlerta("Error", data.mensaje, "error");
        }
    } catch (error) {
        mostrarAlerta("Error", "No se pudo conectar con el servidor para obtener el resumen.", "error");
    }
}

// 3. Programar Reporte (Mock visual)
function accionProgramarReporte() {
    mostrarAlerta(
        '<i class="bi bi-tools me-2"></i>Función en Desarrollo', 
        "Próximamente podrás configurar el envío automático de reportes a tu correo electrónico semanal o mensualmente.", 
        "info"
    );
}

// 4. Limpiar Reportes (Simulación por seguridad)
function accionLimpiarReportes() {
    mostrarAlerta(
        '<i class="bi bi-shield-lock me-2"></i>Acción Restringida', 
        "Por medidas de seguridad y auditoría, la eliminación masiva de registros históricos solo puede realizarla el administrador de la base de datos directamente en el servidor.", 
        "warning"
    );
}

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {

    // Fechas por defecto: últimos 30 días
    const hoy      = new Date();
    const hace30   = new Date();
    hace30.setDate(hoy.getDate() - 30);
    document.getElementById("fechaInicio").value = hace30.toISOString().split("T")[0];
    document.getElementById("fechaFin").value    = hoy.toISOString().split("T")[0];

    // Carga inicial de todas las secciones
    cargarVentas({
        fechaInicio: document.getElementById("fechaInicio").value,
        fechaFin:    document.getElementById("fechaFin").value,
    });
    cargarInventario();
    cargarProveedores();
    cargarPrecios();
    cargarResumen();

    // Botones de ventas
    document.getElementById("filtrarVentas").addEventListener("click", () =>
        cargarVentas({
            fechaInicio: document.getElementById("fechaInicio").value,
            fechaFin:    document.getElementById("fechaFin").value,
        })
    );
    document.getElementById("exportarVentas").addEventListener("click", exportarVentasExcel);
    document.getElementById("verEstadisticas").addEventListener("click", mostrarEstadisticas);

    // Botones de recarga
    document.getElementById("recargarInventario").addEventListener("click", cargarInventario);
    document.getElementById("recargarProveedores").addEventListener("click", cargarProveedores);

    // Exportar precios
    document.getElementById("exportarPrecios").addEventListener("click", exportarPreciosExcel);

    // Imprimir detalle de venta
    document.getElementById("imprimirDetalleVenta").addEventListener("click", () => window.print());

    // ── Eventos de Acciones Generales ──
    document.getElementById("descargarTodosReportes").addEventListener("click", descargarTodosExcel);
    document.getElementById("resumenDiario").addEventListener("click", mostrarResumenDiario);
    document.getElementById("programarReporte").addEventListener("click", accionProgramarReporte);
    document.getElementById("limpiarReportes").addEventListener("click", accionLimpiarReportes);
});


