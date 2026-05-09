// ─────────────────────────────────────────────────────────────────────────────
//  MenuDueño.js — Registro de ventas
//  Backend: Flask en http://127.0.0.1:5000  (Live Server en 5500)
//  Sesión y navbar manejados por Navbar.js
// ─────────────────────────────────────────────────────────────────────────────

const API = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", function () {

    // ── Referencias al DOM ───────────────────────────────────────────────────
    const tbodyVenta             = document.getElementById("productosVenta");
    const sinProductosRow        = document.getElementById("sinProductos");
    const cantidadTotalEl        = document.getElementById("cantidadProductosTotal");
    const totalPagarEl           = document.getElementById("totalPagar");
    const numeroVentaEl          = document.getElementById("numeroVenta");
    const metodoPagoSelect       = document.getElementById("metodoPago");
    const guardarVentaBtn        = document.getElementById("guardarVentaBtn");
    const limpiarVentaBtn        = document.getElementById("limpiarVentaBtn");
    const imprimirComprobanteBtn = document.getElementById("imprimirComprobanteBtn");
    const cajaCerradaAlert       = document.getElementById("cajaCerradaAlert");
    const comprobanteSection     = document.getElementById("comprobanteSection");
    const comprobanteContent     = document.getElementById("comprobanteContent");
    const busquedaInput          = document.getElementById("busquedaProducto");
    const resultadosBusqueda     = document.getElementById("resultadosBusqueda");
    const cantidadInput          = document.getElementById("cantidadProducto");
    const agregarProductoBtn     = document.getElementById("agregarProductoBtn");
    const cerrarComprobanteBtn   = document.getElementById("cerrarComprobante");
    const imprimirDirectoBtn     = document.getElementById("imprimirComprobanteDirecto");

    // ── Estado ───────────────────────────────────────────────────────────────
    let productosEnVenta     = [];   // [{ id, codigo, nombre, precio, cantidad, stock }]
    let productoSeleccionado = null;
    let cajaCerrada          = false;
    let ultimaVenta          = null;

    // ── 1. Número de la próxima venta ────────────────────────────────────────
    async function cargarNumeroVenta() {
        try {
            const res  = await fetch(`${API}/api/ventas/numero-siguiente`);
            const data = await res.json();
            if (data.success && numeroVentaEl) {
                numeroVentaEl.textContent = String(data.numero).padStart(3, "0");
            }
        } catch {
            if (numeroVentaEl) numeroVentaEl.textContent = "---";
        }
    }

    // ── 2. Buscador de productos ─────────────────────────────────────────────
    let timeoutBusqueda = null;

    if (busquedaInput) {
        busquedaInput.addEventListener("input", function () {
            clearTimeout(timeoutBusqueda);
            const q = this.value.trim();
            if (q.length < 2) { ocultarResultados(); return; }
            timeoutBusqueda = setTimeout(() => buscarProductos(q), 300);
        });

        busquedaInput.addEventListener("keydown", function (e) {
            if (e.key === "Escape") ocultarResultados();
        });

        document.addEventListener("click", function (e) {
            if (
                !busquedaInput.contains(e.target) &&
                resultadosBusqueda && !resultadosBusqueda.contains(e.target)
            ) {
                ocultarResultados();
            }
        });
    }

    async function buscarProductos(q) {
        try {
            const res  = await fetch(`${API}/api/ventas/buscar-productos?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (!data.success) { ocultarResultados(); return; }
            mostrarResultados(data.productos);
        } catch {
            ocultarResultados();
        }
    }

    function mostrarResultados(productos) {
        if (!resultadosBusqueda) return;
        resultadosBusqueda.innerHTML = "";

        if (!productos || productos.length === 0) {
            resultadosBusqueda.innerHTML =
                '<div class="dropdown-item text-muted py-2">No se encontraron productos con stock disponible.</div>';
            resultadosBusqueda.classList.remove("d-none");
            return;
        }

        productos.forEach(function (p) {
            const btn = document.createElement("button");
            btn.type      = "button";
            btn.className = "dropdown-item d-flex justify-content-between align-items-center py-2";

            const stockBadge =
                p.stock <= p.stockMinimo
                    ? `<span class="badge bg-warning text-dark ms-2">Stock bajo: ${p.stock}</span>`
                    : `<span class="badge bg-success ms-2">Stock: ${p.stock}</span>`;

            btn.innerHTML = `
                <span>
                    <small class="text-muted">#${p.codigo}</small><br>
                    <strong>${p.nombre}</strong>
                    <small class="text-muted ms-1">${p.categoria}</small>
                    ${stockBadge}
                </span>
                <span class="text-success fw-bold ms-3">$${parseFloat(p.precioVenta).toFixed(2)}</span>
            `;
            btn.addEventListener("click", () => seleccionarProducto(p));
            resultadosBusqueda.appendChild(btn);
        });

        resultadosBusqueda.classList.remove("d-none");
    }

    function ocultarResultados() {
        if (resultadosBusqueda) resultadosBusqueda.classList.add("d-none");
    }

    function seleccionarProducto(p) {
        productoSeleccionado = p;
        if (busquedaInput)      busquedaInput.value      = `${p.nombre}`;
        if (cantidadInput)      cantidadInput.value      = 1;
        if (agregarProductoBtn) agregarProductoBtn.disabled = false;
        ocultarResultados();
        if (cantidadInput) cantidadInput.focus();
    }

    // ── 3. Agregar producto al carrito ───────────────────────────────────────
    if (agregarProductoBtn) {
        agregarProductoBtn.addEventListener("click", agregarProducto);
    }
    if (cantidadInput) {
        cantidadInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") agregarProducto();
        });
    }

    function agregarProducto() {
        if (!productoSeleccionado) return;

        const cantidad = parseInt(cantidadInput ? cantidadInput.value : 1, 10);
        if (isNaN(cantidad) || cantidad < 1) {
            mostrarAlerta("Cantidad inválida", "Ingresa una cantidad mayor a 0.");
            return;
        }

        const existente     = productosEnVenta.find(p => p.id === productoSeleccionado.id);
        const cantidadActual = existente ? existente.cantidad : 0;

        if (cantidadActual + cantidad > productoSeleccionado.stock) {
            mostrarAlerta(
                "Stock insuficiente",
                `Solo hay ${productoSeleccionado.stock} unidades de "${productoSeleccionado.nombre}". ` +
                `Ya tienes ${cantidadActual} en la venta.`
            );
            return;
        }

        if (existente) {
            existente.cantidad += cantidad;
        } else {
            productosEnVenta.push({
                id:       productoSeleccionado.id,
                codigo:   productoSeleccionado.codigo,
                nombre:   productoSeleccionado.nombre,
                precio:   parseFloat(productoSeleccionado.precioVenta),
                cantidad: cantidad,
                stock:    productoSeleccionado.stock,
            });
        }

        actualizarTablaVenta();
        limpiarBuscador();
    }

    // ── 4. Tabla de productos en la venta ────────────────────────────────────
    function actualizarTablaVenta() {
        if (!tbodyVenta) return;

        tbodyVenta.querySelectorAll("tr.fila-producto").forEach(r => r.remove());

        if (productosEnVenta.length === 0) {
            sinProductosRow && sinProductosRow.classList.remove("d-none");
            actualizarResumen();
            actualizarBotones();
            return;
        }

        sinProductosRow && sinProductosRow.classList.add("d-none");

        productosEnVenta.forEach(function (p, idx) {
            const subtotal = p.precio * p.cantidad;
            const tr       = document.createElement("tr");
            tr.className   = "fila-producto fade-in";
            tr.innerHTML   = `
                <td>
                    <div class="fw-semibold">${p.nombre}</div>
                    <small class="text-muted">#${p.codigo}</small>
                </td>
                <td>
                    <div class="input-group input-group-sm" style="width:120px">
                        <button class="btn btn-outline-secondary btn-delta" data-idx="${idx}" data-delta="-1">−</button>
                        <input type="number" class="form-control text-center inp-cant"
                               data-idx="${idx}" value="${p.cantidad}" min="1" max="${p.stock}">
                        <button class="btn btn-outline-secondary btn-delta" data-idx="${idx}" data-delta="1">+</button>
                    </div>
                </td>
                <td>$${p.precio.toFixed(2)}</td>
                <td class="fw-bold text-success">$${subtotal.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-idx="${idx}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbodyVenta.appendChild(tr);
        });

        tbodyVenta.querySelectorAll(".btn-delta").forEach(btn =>
            btn.addEventListener("click", function () {
                const idx = parseInt(this.dataset.idx, 10);
                cambiarCantidad(idx, productosEnVenta[idx].cantidad + parseInt(this.dataset.delta, 10));
            })
        );

        tbodyVenta.querySelectorAll(".inp-cant").forEach(inp =>
            inp.addEventListener("change", function () {
                cambiarCantidad(parseInt(this.dataset.idx, 10), parseInt(this.value, 10));
            })
        );

        tbodyVenta.querySelectorAll(".btn-eliminar").forEach(btn =>
            btn.addEventListener("click", function () {
                productosEnVenta.splice(parseInt(this.dataset.idx, 10), 1);
                actualizarTablaVenta();
            })
        );

        actualizarResumen();
        actualizarBotones();
    }

    function cambiarCantidad(idx, nuevaCantidad) {
        const p = productosEnVenta[idx];
        if (!p) return;
        if (nuevaCantidad < 1) {
            productosEnVenta.splice(idx, 1);
        } else if (nuevaCantidad > p.stock) {
            mostrarAlerta("Stock insuficiente", `Máximo disponible: ${p.stock} unidades.`);
            return;
        } else {
            p.cantidad = nuevaCantidad;
        }
        actualizarTablaVenta();
    }

    // ── 5. Resumen y botones ─────────────────────────────────────────────────
    function actualizarResumen() {
        const totalItems = productosEnVenta.reduce((s, p) => s + p.cantidad, 0);
        const total      = productosEnVenta.reduce((s, p) => s + p.precio * p.cantidad, 0);
        if (cantidadTotalEl) cantidadTotalEl.textContent = totalItems;
        if (totalPagarEl)    totalPagarEl.textContent    = `$${total.toFixed(2)}`;
    }

    function actualizarBotones() {
        const hay = productosEnVenta.length > 0;
        if (metodoPagoSelect)       metodoPagoSelect.disabled       = !hay || cajaCerrada;
        if (guardarVentaBtn)        guardarVentaBtn.disabled        = !hay || cajaCerrada;
        if (limpiarVentaBtn)        limpiarVentaBtn.disabled        = !hay;
        if (imprimirComprobanteBtn) imprimirComprobanteBtn.disabled = !ultimaVenta;
    }

    // ── 6. Guardar venta ─────────────────────────────────────────────────────
    if (guardarVentaBtn) {
        guardarVentaBtn.addEventListener("click", guardarVenta);
    }

    async function guardarVenta() {
        if (productosEnVenta.length === 0 || cajaCerrada) return;

        // id_usuario viene del sessionStorage (guardado en login)
        const id_usuario = parseInt(sessionStorage.getItem("id_usuario") || "1", 10);
        const metodoIdx  = metodoPagoSelect ? parseInt(metodoPagoSelect.value, 10) : 1;
        const total      = productosEnVenta.reduce((s, p) => s + p.precio * p.cantidad, 0);

        const payload = {
            id_usuario,
            metodo:   metodoIdx,
            total:    Math.round(total),
            productos: productosEnVenta.map(p => ({
                id_producto:  p.id,
                cantidad:     p.cantidad,
                precio_venta: p.precio,
            })),
        };

        guardarVentaBtn.disabled  = true;
        guardarVentaBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

        try {
            const res  = await fetch(`${API}/api/ventas/registrar`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                ultimaVenta = {
                    numero:    data.numero,
                    fecha:     new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }),
                    hora:      new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
                    metodoPago: metodoPagoSelect
                        ? metodoPagoSelect.options[metodoPagoSelect.selectedIndex].text
                        : "Efectivo",
                    productos: [...productosEnVenta],
                    total,
                };

                mostrarComprobante(ultimaVenta);
                limpiarVenta(false);
                await cargarNumeroVenta();
                if (imprimirComprobanteBtn) imprimirComprobanteBtn.disabled = false;
            } else {
                mostrarAlerta("Error al guardar", data.mensaje || "No se pudo registrar la venta.");
            }
        } catch {
            mostrarAlerta("Error de conexión", "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 5000.");
        } finally {
            guardarVentaBtn.disabled  = false;
            guardarVentaBtn.innerHTML = '<i class="bi bi-save me-2"></i>Guardar Venta';
            actualizarBotones();
        }
    }

    // ── 7. Comprobante ───────────────────────────────────────────────────────
    function mostrarComprobante(venta) {
        if (!comprobanteSection || !comprobanteContent) return;

        const filas = venta.productos.map(p => `
            <tr>
                <td>${p.nombre}</td>
                <td class="text-center">${p.cantidad}</td>
                <td class="text-end">$${p.precio.toFixed(2)}</td>
                <td class="text-end fw-bold">$${(p.precio * p.cantidad).toFixed(2)}</td>
            </tr>
        `).join("");

        comprobanteContent.innerHTML = `
            <div class="comprobante">
                <div class="comprobante-header">
                    <h2><i class="bi bi-shop me-2"></i>Abarrotes ABD</h2>
                    <p class="mb-0 text-muted">Comprobante de Venta</p>
                </div>
                <div class="comprobante-body">
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted">Ticket</small><br>
                            <strong>#${venta.numero}</strong>
                        </div>
                        <div class="col-6 text-end">
                            <small class="text-muted">Fecha y hora</small><br>
                            <strong>${venta.fecha} ${venta.hora}</strong>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="text-center">Cant.</th>
                                <th class="text-end">Precio</th>
                                <th class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${filas}</tbody>
                    </table>
                    <div class="comprobante-total">
                        <span class="text-muted">Método de pago: ${venta.metodoPago}</span><br>
                        <span class="fs-4 fw-bold text-success">TOTAL: $${venta.total.toFixed(2)}</span>
                    </div>
                </div>
                <div class="comprobante-footer">
                    <p class="mb-1">¡Gracias por su compra!</p>
                    <small>Conserve este comprobante para cualquier aclaración.</small>
                </div>
            </div>
        `;

        comprobanteSection.classList.remove("d-none");
        comprobanteSection.scrollIntoView({ behavior: "smooth" });
    }

    if (cerrarComprobanteBtn) {
        cerrarComprobanteBtn.addEventListener("click", () =>
            comprobanteSection && comprobanteSection.classList.add("d-none")
        );
    }

    if (imprimirDirectoBtn) {
        imprimirDirectoBtn.addEventListener("click", () => window.print());
    }

    if (imprimirComprobanteBtn) {
        imprimirComprobanteBtn.addEventListener("click", function () {
            if (ultimaVenta) {
                mostrarComprobante(ultimaVenta);
                setTimeout(() => window.print(), 400);
            }
        });
    }

    // ── 8. Limpiar venta ─────────────────────────────────────────────────────
    if (limpiarVentaBtn) {
        limpiarVentaBtn.addEventListener("click", function () {
            if (productosEnVenta.length === 0) return;
            if (confirm("¿Estás seguro de que deseas limpiar la venta actual?")) {
                limpiarVenta(true);
            }
        });
    }

    function limpiarVenta(limpiarUltima = true) {
        productosEnVenta = [];
        if (limpiarUltima) ultimaVenta = null;
        limpiarBuscador();
        actualizarTablaVenta();
        if (comprobanteSection && limpiarUltima) {
            comprobanteSection.classList.add("d-none");
        }
    }

    function limpiarBuscador() {
        productoSeleccionado = null;
        if (busquedaInput)      busquedaInput.value         = "";
        if (cantidadInput)      cantidadInput.value         = 1;
        if (agregarProductoBtn) agregarProductoBtn.disabled = true;
        ocultarResultados();
    }

    // ── 9. Alerta modal ──────────────────────────────────────────────────────
    function mostrarAlerta(titulo, mensaje) {
        const modalEl = document.getElementById("alertModal");
        if (!modalEl) { alert(`${titulo}: ${mensaje}`); return; }
        document.getElementById("alertModalTitle").textContent = titulo;
        document.getElementById("alertModalBody").textContent  = mensaje;
        let modal = bootstrap.Modal.getInstance(modalEl);
        if (!modal) modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    // ── 10. Inicialización ───────────────────────────────────────────────────
    cargarNumeroVenta();
    actualizarTablaVenta();
});
