// Variables globales
const API_PRECIOS = "http://localhost:5000/api/precios";
let productos = [];
let productosFiltrados = [];

// Función para formatear números como dinero
function formatoDinero(monto) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(monto);
}

// Función para calcular el margen
function calcularMargen(precioCompra, precioVenta) {
    if (!precioCompra || precioCompra === 0) return 0;
    return ((precioVenta - precioCompra) / precioCompra * 100).toFixed(1);
}

// Función para actualizar contador
function actualizarContador() {
    const totalFiltrados = productosFiltrados.length;
    document.getElementById('contadorPrecios').textContent = `${totalFiltrados} productos`;
}

// Función para renderizar la tabla de precios
function renderizarTablaPrecios(productosARenderizar = productosFiltrados) {
    const tbody = document.getElementById('listaPrecios');

    tbody.innerHTML = '';

    if (productosARenderizar.length === 0) {
        tbody.innerHTML = `
            <tr id="sinProductosPrecios">
                <td colspan="7" class="text-center text-muted py-5">
                    <i class="bi bi-tag display-1 d-block mb-3"></i>
                    <h5>No hay productos para mostrar</h5>
                    <p class="mb-0">Intenta con otra búsqueda o limpia los filtros</p>
                </td>
            </tr>
        `;
        actualizarContador();
        return;
    }

    productosARenderizar.forEach((producto) => {
        const margen = calcularMargen(producto.precioCompra, producto.precioVenta);
        const estadoStock = producto.stock === 0 ? 'agotado' :
                           producto.stock <= producto.stockMinimo ? 'bajo' : 'normal';

        const claseMargen = parseFloat(margen) > 0 ? 'margen-positivo' :
                           parseFloat(margen) < 0 ? 'margen-negativo' : 'margen-neutral';

        const row = document.createElement('tr');

        row.className = estadoStock === 'agotado' ? 'table-danger' :
                       estadoStock === 'bajo' ? 'table-warning' : '';

        row.innerHTML = `
            <td><span class="badge bg-secondary">${producto.codigo || ''}</span></td>
            <td>
                <strong>${producto.nombre || ''}</strong>
                ${producto.descripcion ? `<br><small class="text-muted">${producto.descripcion}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-info">${producto.categoria || ''}</span>
            </td>
            <td class="precio-compra precio-destacado">${formatoDinero(producto.precioCompra)}</td>
            <td class="precio-venta precio-destacado">${formatoDinero(producto.precioVenta)}</td>
            <td class="${claseMargen}">${margen}%</td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="me-2">${producto.stock} ${producto.unidadMedida || ''}</span>
                    <span class="badge ${
                        estadoStock === 'agotado' ? 'badge-stock-agotado' :
                        estadoStock === 'bajo' ? 'badge-stock-bajo' :
                        'badge-stock-normal'
                    }">
                        ${
                            estadoStock === 'agotado' ? 'Agotado' :
                            estadoStock === 'bajo' ? 'Bajo' :
                            'Normal'
                        }
                    </span>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });

    actualizarContador();
}


// Función para filtrar productos
function filtrarProductosPrecios() {
    const busqueda = normalizarTexto(document.getElementById('buscarProductoPrecios').value);
    const categoria = normalizarTexto(document.getElementById('filtrarCategoriaPrecios').value);

    productosFiltrados = [...productos];

    if (busqueda) {
        productosFiltrados = productosFiltrados.filter(producto =>
            normalizarTexto(producto.nombre).includes(busqueda) ||
            normalizarTexto(producto.codigo).includes(busqueda) ||
            normalizarTexto(producto.descripcion).includes(busqueda) ||
            normalizarTexto(producto.categoria).includes(busqueda)
        );
    }

    if (categoria) {
        productosFiltrados = productosFiltrados.filter(producto =>
            normalizarTexto(producto.categoria) === categoria
        );
    }

    renderizarTablaPrecios(productosFiltrados);
}


// Función para limpiar filtros
function limpiarFiltrosPrecios() {
    document.getElementById('buscarProductoPrecios').value = '';
    document.getElementById('filtrarCategoriaPrecios').value = '';
    productosFiltrados = [...productos];
    renderizarTablaPrecios(productosFiltrados);
}

// Función para exportar a Excel
function exportarPrecios() {
    if (productos.length === 0) {
        alert('No hay productos para exportar');
        return;
    }
    
    // Preparar datos para exportación
    const datos = productos.map(producto => ({
        'Código': producto.codigo,
        'Producto': producto.nombre,
        'Categoría': producto.categoria,
        'Proveedor': producto.proveedor || '',
        'Precio Compra': producto.precioCompra,
        'Precio Venta': producto.precioVenta,
        'Margen (%)': calcularMargen(producto.precioCompra, producto.precioVenta),
        'Stock': producto.stock,
        'Unidad Medida': producto.unidadMedida,
        'Stock Mínimo': producto.stockMinimo,
        'Stock Máximo': producto.stockMaximo,
        'Descripción': producto.descripcion || ''
    }));
    
    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Precios');
    
    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `precios_abarrotes_abd_${fecha}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(wb, nombreArchivo);
    
    alert(`Lista de precios exportada exitosamente a ${nombreArchivo}`);
}

// Función para cargar productos desde inventario (localStorage, respaldo)
function cargarProductosDesdeInventario() {
    const inventarioGuardado = localStorage.getItem('inventario');
    
    if (inventarioGuardado) {
        try {
            productos = JSON.parse(inventarioGuardado);
            // Asegurar que los precios sean números
            productos = productos.map(producto => ({
                ...producto,
                precioCompra: parseFloat(producto.precioCompra) || 0,
                precioVenta: parseFloat(producto.precioVenta) || 0,
                stock: parseInt(producto.stock) || 0,
                stockMinimo: parseInt(producto.stockMinimo) || 10,
                stockMaximo: parseInt(producto.stockMaximo) || 100
            }));
            productosFiltrados = [...productos];
        } catch (error) {
            console.error('Error al cargar productos:', error);
            productos = [];
            productosFiltrados = [];
        }
    } else {
        productos = [];
        productosFiltrados = [];
    }
    
    renderizarTablaPrecios(productosFiltrados);
}

/**
 * Lista de precios desde el backend API; si falla, usa localStorage (inventario).
 */
async function cargarProductosDesdeAPI() {
    try {
        const res = await fetch(`${API_PRECIOS}/productos`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.productos)) {
            productos = data.productos.map(normalizarProductoPrecios);
            productosFiltrados = [...productos];
            renderizarTablaPrecios(productosFiltrados);
            return;
        }
    } catch (e) {
        console.warn("Precios API no disponible, usando localStorage:", e);
    }
    cargarProductosDesdeInventario();
}

function normalizarProductoPrecios(producto) {
    return {
        ...producto,
        precioCompra: parseFloat(producto.precioCompra) || 0,
        precioVenta: parseFloat(producto.precioVenta) || 0,
        stock: parseInt(producto.stock, 10) || 0,
        stockMinimo: parseInt(producto.stockMinimo, 10) || 10,
        stockMaximo: parseInt(producto.stockMaximo, 10) || 100
    };
}

// Función para normalizar texto para la búsqueda insensible a acentos, mayúsculas y minúsculas
function normalizarTexto(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}


// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar productos (API backend o respaldo inventario/localStorage)
    cargarProductosDesdeAPI();
    
    // Exportar precios
    document.getElementById('exportarPreciosBtn').addEventListener('click', exportarPrecios);
    
    // Filtrar productos
    document.getElementById('btnBuscarPrecios').addEventListener('click', filtrarProductosPrecios);
    document.getElementById('buscarProductoPrecios').addEventListener('keyup', filtrarProductosPrecios);
    document.getElementById('filtrarCategoriaPrecios').addEventListener('change', filtrarProductosPrecios);
    
    // Limpiar filtros
    document.getElementById('limpiarFiltrosPrecios').addEventListener('click', limpiarFiltrosPrecios);
    
    // Actualizar automáticamente cada 30 segundos
    setInterval(function () {
        cargarProductosDesdeAPI();
    }, 30000);
});