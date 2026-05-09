// Inventario.js — Ajustado para Flask y DB EQUIPO5
const API = 'http://localhost:5000/api'; // Cambiado a puerto 5000 de Flask

let inventario         = [];
let productoAEliminar = null;
let filtrosActivos = { q: '', id_tipo: '', stock: '' };

const LIMITES = {
    nombre:      20,
    precioMax:   9999.99,
    stockMax:    4294967295
};

const modalProducto     = new bootstrap.Modal(document.getElementById('modalProducto'));
const modalConfirmacion = new bootstrap.Modal(document.getElementById('modalConfirmacion'));

let modalStock;

// Helpers
function formatoDinero(n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function toast(msg, tipo = 'success') {
    const c = document.getElementById('toastContenedor');
    if (!c) return;
    const id   = 'toast-' + Date.now();
    const icon = tipo === 'success' ? 'check-circle-fill'
               : tipo === 'warning' ? 'exclamation-triangle-fill'
               : 'x-circle-fill';
    c.insertAdjacentHTML('beforeend', `
        <div id="${id}" class="alert alert-${tipo} alert-dismissible fade show shadow" role="alert" style="min-width:300px">
            <i class="bi bi-${icon} me-2"></i>${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`);
    setTimeout(() => document.getElementById(id)?.remove(), 4000);
}

// Catálogos (Carga inicial de selects)
async function cargarCatalogos() {
    try {
        const [rTipos, rProvs, rUnis] = await Promise.all([
            fetch(`${API}/tipos`).then(r => r.json()),
            fetch(`${API}/proveedores`).then(r => r.json()),
            fetch(`${API}/unidades`).then(r => r.json())
        ]);

        const selTipo = document.getElementById('categoriaProducto');
        if (rTipos.success && selTipo) {
            selTipo.innerHTML = '<option value="">Seleccionar categoría</option>';
            rTipos.data.forEach(t => selTipo.insertAdjacentHTML('beforeend', `<option value="${t.id}">${t.nombre}</option>`));
        }

        const filtroCat = document.getElementById('filtrarCategoria');
        if (rTipos.success && filtroCat) {
            filtroCat.innerHTML = '<option value="">Todas las categorías</option>';
            rTipos.data.forEach(t => filtroCat.insertAdjacentHTML('beforeend', `<option value="${t.id}">${t.nombre}</option>`));
        }

        const selProv = document.getElementById('proveedorProducto');
        if (rProvs.success && selProv) {
            selProv.innerHTML = '<option value="">Seleccionar proveedor</option>';
            rProvs.data.forEach(p => selProv.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.nombre}</option>`));
        }

        const selUni = document.getElementById('unidadMedida');
        if (rUnis.success && selUni) {
            selUni.innerHTML = '<option value="">Seleccionar unidad</option>';
            rUnis.data.forEach(u => selUni.insertAdjacentHTML('beforeend', `<option value="${u.id}">${u.nombre}</option>`));
        }
    } catch (error) {
        console.error(error);
        toast('Error al cargar catálogos. ¿Flask está corriendo en el puerto 5000?', 'danger');
    }
}

// Cargar inventario completo
async function cargarInventario() {
    try {
        const res  = await fetch(`${API}/inventario`); 
        const data = await res.json();
        if (data.success) { 
            inventario = data.data; 
            renderizarTabla(); 
        }
        else toast('Error al cargar inventario: ' + data.error, 'danger');
    } catch (error) {
        console.error(error);
        toast('Sin conexión con Flask (puerto 5000).', 'danger');
    }
}

// Renderizar tabla (Dinamismo con Bootstrap)
function renderizarTabla(lista = inventario) {
    const tbody = document.getElementById('listaProductos');
    if (!tbody) return;

    let sinRow = document.getElementById('sinProductosInventario');
    tbody.innerHTML = '';

    if (!lista.length) {
        if (sinRow) tbody.appendChild(sinRow);
        actualizarEstadisticas();
        return;
    }

    lista.forEach(p => {
        const estado   = p.stock === 0 ? 'agotado' : p.stock <= p.stockMinimo ? 'bajo' : 'normal';
        const badge    = estado === 'agotado' ? '<span class="badge bg-danger">Agotado</span>'
                       : estado === 'bajo'    ? '<span class="badge bg-warning text-dark">Bajo</span>'
                                              : '<span class="badge bg-success">Normal</span>';
        
        const barColor = estado === 'agotado' ? 'bg-danger' : estado === 'bajo' ? 'bg-warning' : 'bg-success';
        const pct      = Math.min(100, ((p.stock / (p.stockMaximo || 100)) * 100)).toFixed(0);
        const rowClass = estado === 'agotado' ? 'table-danger' : estado === 'bajo' ? 'table-warning' : '';

        const tr = document.createElement('tr');
        tr.className = rowClass;
        tr.innerHTML = `
            <td><span class="badge bg-secondary">${p.codigo}</span></td>
            <td><strong>${p.nombre}</strong></td>
            <td><span class="badge bg-info text-dark">${p.categoria ?? '—'}</span></td>
            <td>${formatoDinero(p.precioCompra)}</td>
            <td><strong>${formatoDinero(p.precioVenta)}</strong></td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <span>${p.stock} ${p.unidadMedida ?? ''}</span>${badge}
                </div>
                <div class="progress mt-1" style="height:5px">
                    <div class="progress-bar ${barColor}" style="width:${pct}%"></div>
                </div>
            </td>
            <td>${formatoDinero(p.precioCompra * p.stock)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary editar-producto" data-id="${p.id}" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-outline-success actualizar-stock" data-id="${p.id}" title="Actualizar Stock"><i class="bi bi-arrow-repeat"></i></button>
                    <button class="btn btn-outline-danger eliminar-producto" data-id="${p.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });

    actualizarEstadisticas();
}

// Guardar producto (Insert / Update)
async function guardarProducto(e) {
    e.preventDefault();
    const id = document.getElementById('productoId').value;
    
    const payload = {
        nombre:       document.getElementById('nombreProductoModal').value.trim(),
        id_tipo:      parseInt(document.getElementById('categoriaProducto').value),
        id_proveedor: parseInt(document.getElementById('proveedorProducto').value),
        id_unidad:    parseInt(document.getElementById('unidadMedida').value),
        precioCompra: parseFloat(document.getElementById('precioCompra').value),
        precioVenta:  parseFloat(document.getElementById('precioVenta').value),
        stock:        parseInt(document.getElementById('stockProducto').value),
        stockMinimo:  parseInt(document.getElementById('stockMinimo').value),
        stockMaximo:  parseInt(document.getElementById('stockMaximo').value)
    };

    try {
        const res  = await fetch(id ? `${API}/inventario/${id}` : `${API}/inventario`, {
            method:  id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            modalProducto.hide();
            toast(`Producto ${id ? 'actualizado' : 'creado'} exitosamente ✓`);
            await cargarInventario();
        } else {
            toast('Error: ' + data.error, 'danger');
        }
    } catch (error) {
        toast('Error de conexión al guardar.', 'danger');
    }
}

// Actualizar Stock Rápido (PATCH)
async function confirmarActualizarStock() {
    const id    = parseInt(document.getElementById('stockProductoId').value);
    const nuevo = parseInt(document.getElementById('stockNuevoValor').value);
    
    try {
        const res  = await fetch(`${API}/inventario/${id}/stock`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ stock: nuevo })
        });
        const data = await res.json();
        modalStock.hide();
        if (data.success) {
            toast('Stock actualizado ✓');
            await cargarInventario();
        } else {
            toast('Error: ' + data.error, 'danger');
        }
    } catch (error) {
        toast('Error de conexión.', 'danger');
    }
}

// Búsqueda y Filtros
async function filtrarProductos() {
    // Asegúrate de que los IDs coincidan con tu HTML
    filtrosActivos = {
        q: document.getElementById('buscarProducto').value.trim(),
        id_tipo: document.getElementById('filtrarCategoria').value,
        stock: document.getElementById('filtrarStock').value
    };
    
    const { q, id_tipo, stock } = filtrosActivos;
    
    // Si todos están vacíos, cargar todo el inventario
    if (!q && !id_tipo && !stock) {
        await cargarInventario(); // Cambiar cargarInventario() por await cargarInventario()
        return;
    }
    // ... resto de la función igual

    try {
        const params = new URLSearchParams({ q, id_tipo, stock });
        const res    = await fetch(`${API}/inventario/buscar?${params}`);
        const data   = await res.json();
        if (data.success) renderizarTabla(data.data);
    } catch (error) {
        toast('Error al buscar.', 'danger');
    }
}

// Exportar Excel (usando SheetJS)
function exportarAExcel() {
    if (!inventario.length) { toast('No hay nada que exportar.', 'warning'); return; }
    const datos = inventario.map(p => ({
        'Código': p.codigo,
        'Producto': p.nombre,
        'Categoría': p.categoria,
        'Stock': p.stock,
        'P. Venta': p.precioVenta
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `inventario_equipo5.xlsx`);
}

// Estadísticas de las Cards superiores
function actualizarEstadisticas() {
    document.getElementById('totalProductos').textContent    = inventario.length;
    document.getElementById('valorTotal').textContent        = formatoDinero(inventario.reduce((s, p) => s + p.precioCompra * p.stock, 0));
    document.getElementById('stockBajo').textContent         = inventario.filter(p => p.stock > 0 && p.stock <= p.stockMinimo).length;
    document.getElementById('sinStock').textContent          = inventario.filter(p => p.stock === 0).length;
    document.getElementById('contadorProductos').textContent = `${inventario.length} productos`;
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    modalStock = new bootstrap.Modal(document.getElementById('modalStock'));
    
    await cargarCatalogos();
    await cargarInventario();

    // A) Hacer que funcione con la tecla "Enter"
document.getElementById('buscarProducto').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        filtrarProductos();
    }
});

// B) Hacer que los filtros de Categoría y Stock funcionen al cambiar la opción
document.getElementById('filtrarCategoria').addEventListener('change', filtrarProductos);
document.getElementById('filtrarStock').addEventListener('change', filtrarProductos);

    // Eventos de botones
    document.getElementById('formProducto').addEventListener('submit', guardarProducto);
    document.getElementById('btnConfirmarStock').addEventListener('click', confirmarActualizarStock);
    document.getElementById('exportarBtn').addEventListener('click', exportarAExcel);
    document.getElementById('btnBuscar').addEventListener('click', filtrarProductos);
    document.getElementById('limpiarFiltros').addEventListener('click', () => {
        document.getElementById('buscarProducto').value = '';
        document.getElementById('filtrarCategoria').value = '';
        document.getElementById('filtrarStock').value = '';
        // AGREGAR ESTA LÍNEA:
        filtrosActivos = { q: '', id_tipo: '', stock: '' }; 
        cargarInventario();
    });

    // Delegación de eventos para la tabla
    document.getElementById('listaProductos').addEventListener('click', e => {
        const btn = e.target.closest('.editar-producto, .eliminar-producto, .actualizar-stock');
        if (!btn) return;
        const id = btn.dataset.id;
        
        if (btn.classList.contains('editar-producto')) {
            const p = inventario.find(x => x.id == id);
            if (p) {
                document.getElementById('productoId').value = p.id;
                document.getElementById('nombreProductoModal').value = p.nombre;
                document.getElementById('categoriaProducto').value = p.id_tipo;
                document.getElementById('proveedorProducto').value = p.id_proveedor;
                document.getElementById('unidadMedida').value = p.id_unidad;
                document.getElementById('precioCompra').value = p.precioCompra;
                document.getElementById('precioVenta').value = p.precioVenta;
                document.getElementById('stockProducto').value = p.stock;
                document.getElementById('stockMinimo').value = p.stockMinimo;
                document.getElementById('stockMaximo').value = p.stockMaximo;
                modalProducto.show();
            }
        }
        
        if (btn.classList.contains('actualizar-stock')) {
            const p = inventario.find(x => x.id == id);
            if (p) {
                document.getElementById('stockProductoId').value = p.id;
                document.getElementById('stockNombreInfo').textContent = p.nombre;
                document.getElementById('stockActualInfo').textContent = p.stock;
                document.getElementById('stockNuevoValor').value = p.stock;
                modalStock.show();
            }
        }

        if (btn.classList.contains('eliminar-producto')) {
            productoAEliminar = id;
            modalConfirmacion.show();
        }
    });

    document.getElementById('confirmarEliminar').addEventListener('click', async () => {
        if (!productoAEliminar) return;
        const res = await fetch(`${API}/inventario/${productoAEliminar}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            modalConfirmacion.hide();
            toast('Eliminado correctamente');
            cargarInventario();
        }
    });
});