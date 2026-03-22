// Variables globales
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
    const sinProductosRow = document.getElementById('sinProductosPrecios');
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    if (productosARenderizar.length === 0) {
        sinProductosRow.style.display = '';
        tbody.appendChild(sinProductosRow);
        actualizarContador();
        return;
    }
    
    sinProductosRow.style.display = 'none';
    
    // Agregar cada producto a la tabla
    productosARenderizar.forEach((producto, index) => {
        const margen = calcularMargen(producto.precioCompra, producto.precioVenta);
        const estadoStock = producto.stock === 0 ? 'agotado' : 
                           producto.stock <= producto.stockMinimo ? 'bajo' : 'normal';
        
        const row = document.createElement('tr');
        row.className = estadoStock === 'agotado' ? 'table-danger' : 
                       estadoStock === 'bajo' ? 'table-warning' : '';
        
        // Clase para margen
        const claseMargen = parseFloat(margen) > 0 ? 'margen-positivo' : 
                           parseFloat(margen) < 0 ? 'margen-negativo' : 'margen-neutral';
        
        row.innerHTML = `
            <td><span class="badge bg-secondary">${producto.codigo}</span></td>
            <td>
                <strong>${producto.nombre}</strong>
                ${producto.descripcion ? `<br><small class="text-muted">${producto.descripcion}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-info">${producto.categoria}</span>
            </td>
            <td class="precio-compra precio-destacado">${formatoDinero(producto.precioCompra)}</td>
            <td class="precio-venta precio-destacado">${formatoDinero(producto.precioVenta)}</td>
            <td class="${claseMargen}">${margen}%</td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="me-2">${producto.stock} ${producto.unidadMedida}</span>
                    <span class="badge ${estadoStock === 'agotado' ? 'badge-stock-agotado' : 
                                      estadoStock === 'bajo' ? 'badge-stock-bajo' : 'badge-stock-normal'}">
                        ${estadoStock === 'agotado' ? 'Agotado' : 
                         estadoStock === 'bajo' ? 'Bajo' : 'Normal'}
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
    const busqueda = document.getElementById('buscarProductoPrecios').value.toLowerCase();
    const categoria = document.getElementById('filtrarCategoriaPrecios').value;
    
    productosFiltrados = productos;
    
    // Filtrar por búsqueda
    if (busqueda) {
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.nombre.toLowerCase().includes(busqueda) ||
            producto.codigo.toLowerCase().includes(busqueda) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda)) ||
            producto.categoria.toLowerCase().includes(busqueda)
        );
    }
    
    // Filtrar por categoría
    if (categoria) {
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.categoria === categoria
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

// Función para cargar productos desde inventario
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

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar productos desde inventario
    cargarProductosDesdeInventario();
    
    // Exportar precios
    document.getElementById('exportarPreciosBtn').addEventListener('click', exportarPrecios);
    
    // Filtrar productos
    document.getElementById('btnBuscarPrecios').addEventListener('click', filtrarProductosPrecios);
    document.getElementById('buscarProductoPrecios').addEventListener('keyup', filtrarProductosPrecios);
    document.getElementById('filtrarCategoriaPrecios').addEventListener('change', filtrarProductosPrecios);
    
    // Limpiar filtros
    document.getElementById('limpiarFiltrosPrecios').addEventListener('click', limpiarFiltrosPrecios);
    
    // Actualizar automáticamente cada 30 segundos
    setInterval(cargarProductosDesdeInventario, 30000);
});