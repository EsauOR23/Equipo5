const API_PAGOS = "http://localhost:5000/api/pagos-proveedores";

let pagos = [];
let proveedores = [];
let filtroActual = { proveedor: "", mes: "", estado: "" };
let modalNuevoPago = null;
let modalDetallePago = null;
let toastPago = null;

function formatoDinero(valor) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(Number(valor || 0));
}

function normalizarTexto(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function formatearFechaVisual(fechaIso) {
    if (!fechaIso) {
        return "-";
    }
    const [year, month, day] = fechaIso.split("-");
    if (!year || !month || !day) {
        return fechaIso;
    }
    return `${day}/${month}/${year}`;
}

function formatearHoraVisual(hora) {
    if (!hora) {
        return "-";
    }
    return String(hora).slice(0, 5);
}

function obtenerMetodoVisual(metodo) {
    const metodos = {
        "1": "Efectivo",
        "2": "Tarjeta de débito",
        "3": "Tarjeta de crédito",
        "4": "Transferencia",
        "5": "Cheque",
        "6": "Vale / Voucher",
        "7": "Pago móvil",
        // Mantenemos los nombres en minúsculas por si acaso
        "efectivo": "Efectivo",
        "transferencia": "Transferencia"
    };
    // Si el valor de 'metodo' es un ID numérico o un texto, buscará su pareja
    return metodos[String(metodo).toLowerCase()] || metodo || "-";
}

function obtenerEstadoBadge(estado) {
    if (estado === "pagado") {
        return {
            clase: "badge bg-success",
            icono: '<i class="bi bi-check-circle me-1"></i>',
            texto: "Pagado",
        };
    }
    if (estado === "vencido") {
        return {
            clase: "badge bg-danger",
            icono: '<i class="bi bi-exclamation-triangle me-1"></i>',
            texto: "Vencido",
        };
    }
    return {
        clase: "badge bg-warning text-dark",
        icono: '<i class="bi bi-clock me-1"></i>',
        texto: "Pendiente",
    };
}

function mostrarToast(mensaje, tipo = "success") {
    const toastElement = document.getElementById("toastPago");
    const toastMensaje = document.getElementById("toastPagoMensaje");
    const icono = tipo === "error" ? "bi-exclamation-circle-fill" : "bi-check-circle-fill";

    toastElement.classList.toggle("toast-error", tipo === "error");
    toastMensaje.innerHTML = `
        <i class="bi ${icono}"></i>
        <span>${mensaje}</span>
    `;
    toastPago.show();
}

function normalizarProveedor(proveedor) {
    return {
        id: Number(proveedor.id),
        nombre: proveedor.nombre || "Proveedor sin nombre",
        contacto: proveedor.contacto || "Sin contacto",
        productos: proveedor.productos || "Sin descripcion",
        saldoPendiente: Number(proveedor.saldoPendiente || 0),
        estado: proveedor.estado || (Number(proveedor.saldoPendiente || 0) > 0 ? "pendiente" : "al-dia"),
    };
}

function normalizarPago(pago) {
    return {
        id: Number(pago.id),
        proveedorId: Number(pago.proveedorId),
        proveedor: pago.proveedor || "Proveedor sin nombre",
        fecha: pago.fecha || "",
        hora: pago.hora || "",
        monto: Number(pago.monto || 0),
        metodo: String(pago.metodo || "").trim(),
        estado: (pago.estado || "pagado").toLowerCase(),
        descripcion: pago.descripcion || "",
    };
}

function recalcularEstadoProveedores() {
    const saldoPorProveedor = {};

    pagos.forEach((pago) => {
        if (pago.estado === "pendiente" || pago.estado === "vencido") {
            saldoPorProveedor[pago.proveedorId] = (saldoPorProveedor[pago.proveedorId] || 0) + pago.monto;
        }
    });

    proveedores = proveedores.map((proveedor) => {
        const saldoPendiente = Number((saldoPorProveedor[proveedor.id] || 0).toFixed(2));
        let estado = "al-dia";

        if (pagos.some((pago) => pago.proveedorId === proveedor.id && pago.estado === "vencido")) {
            estado = "vencido";
        } else if (saldoPendiente > 0) {
            estado = "pendiente";
        }

        return {
            ...proveedor,
            saldoPendiente,
            estado,
        };
    });
}

function obtenerPagosFiltrados() {
    return pagos.filter((pago) => {
        const coincideProveedor = !filtroActual.proveedor ||
            normalizarTexto(pago.proveedor).includes(normalizarTexto(filtroActual.proveedor));
        const coincideMes = !filtroActual.mes || String(pago.fecha || "").slice(5, 7) === filtroActual.mes;
        const coincideEstado = !filtroActual.estado || pago.estado === filtroActual.estado;
        return coincideProveedor && coincideMes && coincideEstado;
    });
}

function actualizarContador() {
    const total = obtenerPagosFiltrados().length;
    document.getElementById("contadorPagos").textContent = `${total} pagos registrados`;
}

function renderizarTablaPagos() {
    const listaPagos = document.getElementById("listaPagos");
    const pagosFiltrados = obtenerPagosFiltrados();
    listaPagos.innerHTML = "";

    if (pagosFiltrados.length === 0) {
        listaPagos.innerHTML = `
            <tr id="sinPagos">
                <td colspan="7" class="text-center text-muted py-5">
                    <i class="bi bi-search display-1 d-block mb-3"></i>
                    <h5>No se encontraron pagos</h5>
                    <p class="mb-0">No hay pagos disponibles en la base de datos para estos filtros</p>
                </td>
            </tr>
        `;
        actualizarContador();
        return;
    }

    pagosFiltrados.forEach((pago) => {
        const estadoBadge = obtenerEstadoBadge(pago.estado);
        const row = document.createElement("tr");
        row.className = "fade-in";
        row.innerHTML = `
            <td>
                <i class="bi bi-building me-2 text-primary"></i>
                <strong>${pago.proveedor}</strong>
            </td>
            <td>${formatearFechaVisual(pago.fecha)}</td>
            <td>${formatearHoraVisual(pago.hora)}</td>
            <td><span class="fw-bold precio-destacado">${formatoDinero(pago.monto)}</span></td>
            <td><span class="badge bg-secondary">${obtenerMetodoVisual(pago.metodo)}</span></td>
            <td><span class="${estadoBadge.clase}">${estadoBadge.icono}${estadoBadge.texto}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary ver-detalle-pago" data-id="${pago.id}" title="Ver detalles">
                    <i class="bi bi-eye"></i>
                </button>
                ${pago.estado !== "pagado" ? `
                <button class="btn btn-sm btn-outline-success marcar-pagado" data-id="${pago.id}" title="Marcar como pagado">
                    <i class="bi bi-check-lg"></i>
                </button>` : ""}
            </td>
        `;
        listaPagos.appendChild(row);
    });

    actualizarContador();
}

function renderizarProveedores() {
    const listaProveedores = document.getElementById("listaProveedores");
    listaProveedores.innerHTML = "";
    const textoBusqueda = normalizarTexto(filtroActual.proveedor);
    const proveedoresFiltrados = proveedores.filter((proveedor) => {
        if (!textoBusqueda) {
            return true;
        }
        return (
            normalizarTexto(proveedor.nombre).includes(textoBusqueda) ||
            normalizarTexto(proveedor.contacto).includes(textoBusqueda) ||
            normalizarTexto(proveedor.productos).includes(textoBusqueda)
        );
    });

    if (proveedoresFiltrados.length === 0) {
        listaProveedores.innerHTML = `
            <div class="col-12 text-center text-muted py-3">
                <i class="bi bi-person-plus display-4 d-block mb-2"></i>
                <p class="mb-0">No se encontraron proveedores con ese criterio</p>
            </div>
        `;
        return;
    }

    proveedoresFiltrados.forEach((proveedor) => {
        const estadoBadge = proveedor.estado === "al-dia"
            ? { clase: "badge bg-success", texto: "Al dia" }
            : proveedor.estado === "vencido"
                ? { clase: "badge bg-danger", texto: "Vencido" }
                : { clase: "badge bg-warning text-dark", texto: "Pendiente" };

        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4 mb-3 fade-in";
        col.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h6 class="card-title">
                        <i class="bi bi-building me-2 text-primary"></i>
                        ${proveedor.nombre}
                    </h6>
                    <p class="card-text small mb-2">
                        <i class="bi bi-telephone me-1"></i>${proveedor.contacto}
                    </p>
                    <p class="card-text small mb-2">
                        <i class="bi bi-box me-1"></i>${proveedor.productos}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="fw-bold ${proveedor.saldoPendiente > 0 ? "text-danger" : "text-success"}">
                            ${formatoDinero(proveedor.saldoPendiente)}
                        </span>
                        <span class="${estadoBadge.clase}">${estadoBadge.texto}</span>
                    </div>
                </div>
            </div>
        `;
        listaProveedores.appendChild(col);
    });
}

function renderizarOpcionesProveedores() {
    const proveedorSelect = document.getElementById("proveedorSelect");
    proveedorSelect.innerHTML = '<option value="">Seleccionar proveedor...</option>';

    proveedores.forEach((proveedor) => {
        const option = document.createElement("option");
        option.value = String(proveedor.id);
        option.textContent = proveedor.nombre;
        proveedorSelect.appendChild(option);
    });
}

function renderizarTodo() {
    recalcularEstadoProveedores();
    renderizarTablaPagos();
    renderizarProveedores();
    renderizarOpcionesProveedores();
}

function limpiarDatosPantalla() {
    pagos = [];
    proveedores = [];
    renderizarTodo();
}

async function cargarDatosDesdeAPI() {
    const response = await fetch(`${API_PAGOS}/pagos`);
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.mensaje || "No se pudieron cargar los pagos");
    }

    if (data.origen && data.origen !== "mysql") {
        throw new Error("El backend no esta devolviendo pagos desde la base de datos");
    }

    pagos = Array.isArray(data.pagos) ? data.pagos.map(normalizarPago) : [];
    proveedores = Array.isArray(data.proveedores) ? data.proveedores.map(normalizarProveedor) : [];
    renderizarTodo();
}

async function cargarDatosIniciales() {
    try {
        await cargarDatosDesdeAPI();
    } catch (error) {
        console.error("Error al cargar pagos desde BD:", error);
        limpiarDatosPantalla();
        mostrarToast(error.message || "No se pudieron cargar los pagos desde la base de datos", "error");
    }
}

async function registrarNuevoPago() {
    const proveedorSelect = document.getElementById("proveedorSelect");
    const cantidadPago = document.getElementById("cantidadPago");
    const metodoPago = document.getElementById("metodoPago");
    const fechaPago = document.getElementById("fechaPago");
    const descripcionPago = document.getElementById("descripcionPago");

    if (!proveedorSelect.value || !cantidadPago.value || !metodoPago.value || !fechaPago.value) {
        alert("Por favor complete todos los campos obligatorios");
        return;
    }

    const proveedorId = Number(proveedorSelect.value);
    const proveedor = proveedores.find((item) => item.id === proveedorId);
    if (!proveedor) {
        alert("Proveedor invalido");
        return;
    }

    const payload = {
        proveedorId: proveedorId, 
        monto: Number(cantidadPago.value), // Flask busca 'monto'
        id_metodopago: metodoPago.value,   // Flask busca 'id_metodopago'
        fecha: fechaPago.value,
        descripcion: descripcionPago.value.trim(),
        estado: "pagado"
    };

    try {
        const response = await fetch(`${API_PAGOS}/pagos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.mensaje || "No se pudo registrar el pago");
        }

        await cargarDatosDesdeAPI();
        bootstrap.Modal.getInstance(document.getElementById("modalNuevoPago")).hide();
        document.getElementById("formNuevoPago").reset();
        document.getElementById("fechaPago").value = new Date().toISOString().split("T")[0];
        mostrarToast(`Pago registrado exitosamente para ${proveedor.nombre}`);
    } catch (error) {
        console.error("Error al registrar pago:", error);
        mostrarToast(error.message || "No se pudo registrar el pago", "error");
    }
}

async function marcarPagoComoPagado(pagoId) {
    const pago = pagos.find((item) => item.id === pagoId);
    if (!pago) {
        return;
    }

    if (!window.confirm("Marcar este pago como pagado?")) {
        return;
    }

    try {
        const response = await fetch(`${API_PAGOS}/pagos/${pagoId}/marcar-pagado`, {
            method: "PATCH",
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.mensaje || "No se pudo actualizar el pago");
        }

        await cargarDatosDesdeAPI();
        mostrarToast("Pago marcado como completado");
    } catch (error) {
        console.error("Error al actualizar pago:", error);
        mostrarToast(error.message || "No se pudo actualizar el pago", "error");
    }
}

function mostrarDetallePago(pagoId) {
    const pago = pagos.find((item) => item.id === pagoId);
    if (!pago) {
        return;
    }

    const estadoBadge = obtenerEstadoBadge(pago.estado);
    document.getElementById("detallePagoMonto").textContent = formatoDinero(pago.monto);
    document.getElementById("detallePagoProveedor").textContent = pago.proveedor;
    document.getElementById("detallePagoMetodo").textContent = obtenerMetodoVisual(pago.metodo);
    document.getElementById("detallePagoFecha").textContent = formatearFechaVisual(pago.fecha);
    document.getElementById("detallePagoHora").textContent = formatearHoraVisual(pago.hora);
    document.getElementById("detallePagoDescripcion").textContent = pago.descripcion || "Sin descripcion";
    document.getElementById("detallePagoEstado").innerHTML = `
        <span class="${estadoBadge.clase} px-3 py-2">${estadoBadge.icono}${estadoBadge.texto}</span>
    `;
    modalDetallePago.show();
}

function exportarPagos() {
    if (pagos.length === 0) {
        alert("No hay pagos para exportar");
        return;
    }

    const datos = obtenerPagosFiltrados().map((pago) => ({
        Proveedor: pago.proveedor,
        Fecha: formatearFechaVisual(pago.fecha),
        Hora: formatearHoraVisual(pago.hora),
        Cantidad: pago.monto,
        Metodo: obtenerMetodoVisual(pago.metodo),
        Estado: obtenerEstadoBadge(pago.estado).texto,
        Descripcion: pago.descripcion || "",
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagos");
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `pagos_proveedores_${fecha}.xlsx`);
}

function configurarEventos() {
    document.getElementById("nuevoPagoBtn").addEventListener("click", function () {
        if (!proveedores.length) {
            mostrarToast("No hay proveedores cargados desde la base de datos", "error");
            return;
        }
        modalNuevoPago.show();
    });

    document.getElementById("btnBuscarProveedor").addEventListener("click", function () {
        filtroActual.proveedor = document.getElementById("buscarProveedor").value;
        renderizarTablaPagos();
        renderizarProveedores();
    });

    document.getElementById("buscarProveedor").addEventListener("keyup", function (event) {
        filtroActual.proveedor = event.target.value;
        renderizarTablaPagos();
        renderizarProveedores();
    });

    document.getElementById("filtrarMes").addEventListener("change", function (event) {
        filtroActual.mes = event.target.value;
        renderizarTablaPagos();
    });

    document.getElementById("filtrarEstado").addEventListener("change", function (event) {
        filtroActual.estado = event.target.value;
        renderizarTablaPagos();
    });

    document.getElementById("limpiarFiltrosPagos").addEventListener("click", function () {
        filtroActual = { proveedor: "", mes: "", estado: "" };
        document.getElementById("buscarProveedor").value = "";
        document.getElementById("filtrarMes").value = "";
        document.getElementById("filtrarEstado").value = "";
        renderizarTablaPagos();
        renderizarProveedores();
    });

    document.getElementById("filtrarPendientes").addEventListener("click", function () {
        filtroActual.estado = "pendiente";
        document.getElementById("filtrarEstado").value = "pendiente";
        renderizarTablaPagos();
    });

    document.getElementById("filtrarPagados").addEventListener("click", function () {
        filtroActual.estado = "pagado";
        document.getElementById("filtrarEstado").value = "pagado";
        renderizarTablaPagos();
    });

    document.getElementById("exportarPagosBtn").addEventListener("click", exportarPagos);
    document.getElementById("confirmarPago").addEventListener("click", registrarNuevoPago);

    document.getElementById("listaPagos").addEventListener("click", function (event) {
        const btnDetalle = event.target.closest(".ver-detalle-pago");
        const btnMarcar = event.target.closest(".marcar-pagado");

        if (btnDetalle) {
            mostrarDetallePago(Number(btnDetalle.dataset.id));
        }
        if (btnMarcar) {
            marcarPagoComoPagado(Number(btnMarcar.dataset.id));
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    modalNuevoPago = new bootstrap.Modal(document.getElementById("modalNuevoPago"));
    modalDetallePago = new bootstrap.Modal(document.getElementById("modalDetallePago"));
    toastPago = new bootstrap.Toast(document.getElementById("toastPago"), {
        delay: 3200,
    });
    document.getElementById("fechaPago").value = new Date().toISOString().split("T")[0];
    configurarEventos();
    cargarDatosIniciales();
    setInterval(cargarDatosIniciales, 30000);
});
