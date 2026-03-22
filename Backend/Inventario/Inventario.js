// Variables globales
let inventario = [];
let productoAEliminar = null;
const modalProducto = new bootstrap.Modal(document.getElementById('modalProducto'));
const modalConfirmacion = new bootstrap.Modal(document.getElementById('modalConfirmacion'));

// Función para formatear números como dinero
function formatoDinero(monto) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(monto);
}

// Función para generar código único
function generarCodigo() {
    return 'PROD-' + Date.now().toString().slice(-6);
}

// Función para actualizar estadísticas
function actualizarEstadisticas() {
    const totalProductos = inventario.length;
    const valorTotal = inventario.reduce((total, producto) => {
        return total + (producto.precioCompra * producto.stock);
    }, 0);
    
    const stockBajo = inventario.filter(producto => {
        return producto.stock > 0 && producto.stock <= producto.stockMinimo;
    }).length;
    
    const sinStock = inventario.filter(producto => producto.stock === 0).length;
    
    // Actualizar UI
    document.getElementById('totalProductos').textContent = totalProductos;
    document.getElementById('valorTotal').textContent = formatoDinero(valorTotal);
    document.getElementById('stockBajo').textContent = stockBajo;
    document.getElementById('sinStock').textContent = sinStock;
    document.getElementById('contadorProductos').textContent = `${totalProductos} productos`;
}

// Función para renderizar la tabla de productos
function renderizarTabla(productos = inventario) {
    const tbody = document.getElementById('listaProductos');
    const sinProductosRow = document.getElementById('sinProductosInventario');
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    if (productos.length === 0) {
        sinProductosRow.style.display = '';
        tbody.appendChild(sinProductosRow);
        return;
    }
    
    sinProductosRow.style.display = 'none';
    
    // Agregar cada producto a la tabla
    productos.forEach((producto, index) => {
        const valorTotal = producto.precioCompra * producto.stock;
        const estadoStock = producto.stock === 0 ? 'agotado' : 
                           producto.stock <= producto.stockMinimo ? 'bajo' : 'normal';
        
        const row = document.createElement('tr');
        row.className = estadoStock === 'agotado' ? 'table-danger' : 
                       estadoStock === 'bajo' ? 'table-warning' : '';
        
        row.innerHTML = `
            <td><span class="badge bg-secondary">${producto.codigo}</span></td>
            <td>
                <strong>${producto.nombre}</strong>
                ${producto.descripcion ? `<br><small class="text-muted">${producto.descripcion}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-info">${producto.categoria}</span>
            </td>
            <td>${formatoDinero(producto.precioCompra)}</td>
            <td><strong>${formatoDinero(producto.precioVenta)}</strong></td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="me-2">${producto.stock} ${producto.unidadMedida}</span>
                    ${estadoStock === 'agotado' ? 
                        '<span class="badge bg-danger">Agotado</span>' : 
                      estadoStock === 'bajo' ? 
                        '<span class="badge bg-warning">Bajo</span>' : 
                        '<span class="badge bg-success">Normal</span>'}
                </div>
                <div class="progress mt-1" style="height: 5px;">
                    <div class="progress-bar ${estadoStock === 'agotado' ? 'bg-danger' : estadoStock === 'bajo' ? 'bg-warning' : 'bg-success'}" 
                         style="width: ${Math.min(100, (producto.stock / producto.stockMaximo) * 100)}%">
                    </div>
                </div>
            </td>
            <td>${formatoDinero(valorTotal)}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary editar-producto" data-id="${producto.id}" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger eliminar-producto" data-id="${producto.id}" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="btn btn-outline-success actualizar-stock" data-id="${producto.id}" title="Actualizar Stock">
                        <i class="bi bi-arrow-repeat"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    actualizarEstadisticas();
}

// Función para agregar o actualizar producto
function guardarProducto(event) {
    event.preventDefault();
    
    const productoId = document.getElementById('productoId').value;
    
    // Crear el objeto producto con el ID correcto
    const producto = {
        id: productoId ? Number(productoId) : Date.now(), // Convertir a número
        codigo: document.getElementById('codigoProducto').value,
        nombre: document.getElementById('nombreProductoModal').value,
        categoria: document.getElementById('categoriaProducto').value,
        proveedor: document.getElementById('proveedorProducto').value,
        precioCompra: parseFloat(document.getElementById('precioCompra').value),
        precioVenta: parseFloat(document.getElementById('precioVenta').value),
        stock: parseInt(document.getElementById('stockProducto').value),
        stockMinimo: parseInt(document.getElementById('stockMinimo').value),
        stockMaximo: parseInt(document.getElementById('stockMaximo').value),
        unidadMedida: document.getElementById('unidadMedida').value,
        descripcion: document.getElementById('descripcionProducto').value,
        fechaActualizacion: new Date().toISOString()
    };
    
    if (productoId) {
        // Actualizar producto existente
        const index = inventario.findIndex(p => p.id === Number(productoId));
        if (index !== -1) {
            inventario[index] = { ...inventario[index], ...producto };
        }
    } else {
        // Agregar nuevo producto
        inventario.push(producto);
    }
    
    // Guardar en localStorage (simulación de base de datos)
    localStorage.setItem('inventario', JSON.stringify(inventario));
    
    // Cerrar modal y actualizar tabla
    modalProducto.hide();
    renderizarTabla();
    filtrarProductos();
    
    // Mostrar mensaje de éxito
    alert(`Producto ${productoId ? 'actualizado' : 'agregado'} exitosamente`);
}

// Función para editar producto
function editarProducto(id) {
    const producto = inventario.find(p => p.id === Number(id));
    if (!producto) return;
    
    document.getElementById('productoId').value = producto.id;
    document.getElementById('codigoProducto').value = producto.codigo;
    document.getElementById('nombreProductoModal').value = producto.nombre;
    document.getElementById('categoriaProducto').value = producto.categoria;
    document.getElementById('proveedorProducto').value = producto.proveedor || '';
    document.getElementById('precioCompra').value = producto.precioCompra;
    document.getElementById('precioVenta').value = producto.precioVenta;
    document.getElementById('stockProducto').value = producto.stock;
    document.getElementById('stockMinimo').value = producto.stockMinimo;
    document.getElementById('stockMaximo').value = producto.stockMaximo;
    document.getElementById('unidadMedida').value = producto.unidadMedida;
    document.getElementById('descripcionProducto').value = producto.descripcion || '';
    
    document.getElementById('modalProductoLabel').innerHTML = '<i class="bi bi-pencil me-1"></i>Editar Producto';
    modalProducto.show();
}

// Función para preparar eliminación de producto
function prepararEliminarProducto(id) {
    const producto = inventario.find(p => p.id === Number(id));
    if (!producto) return;
    
    productoAEliminar = Number(id);
    document.getElementById('productoAEliminar').textContent = `${producto.nombre} (${producto.codigo})`;
    modalConfirmacion.show();
}

// Función para eliminar producto
function eliminarProducto() {
    if (productoAEliminar === null) return;
    
    // Filtrar el producto a eliminar
    inventario = inventario.filter(p => p.id !== productoAEliminar);
    
    // Guardar en localStorage
    localStorage.setItem('inventario', JSON.stringify(inventario));
    
    // Cerrar modal y actualizar
    modalConfirmacion.hide();
    renderizarTabla();
    filtrarProductos();
    
    // Resetear variable
    productoAEliminar = null;
    
    alert('Producto eliminado exitosamente');
}

// Función para actualizar stock rápido
function actualizarStockRapido(id) {
    const producto = inventario.find(p => p.id === Number(id));
    if (!producto) return;
    
    const nuevoStock = prompt(`Actualizar stock para ${producto.nombre}\nStock actual: ${producto.stock} ${producto.unidadMedida}\nIngrese el nuevo valor:`, producto.stock);
    
    if (nuevoStock !== null && !isNaN(nuevoStock) && nuevoStock >= 0) {
        producto.stock = parseInt(nuevoStock);
        producto.fechaActualizacion = new Date().toISOString();
        
        localStorage.setItem('inventario', JSON.stringify(inventario));
        renderizarTabla();
        filtrarProductos();
        
        alert('Stock actualizado exitosamente');
    }
}

// Función para filtrar productos
function filtrarProductos() {
    const busqueda = document.getElementById('buscarProducto').value.toLowerCase();
    const categoria = document.getElementById('filtrarCategoria').value;
    const stock = document.getElementById('filtrarStock').value;
    
    let productosFiltrados = inventario;
    
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
    
    // Filtrar por estado de stock
    if (stock) {
        productosFiltrados = productosFiltrados.filter(producto => {
            if (stock === 'bajo') {
                return producto.stock > 0 && producto.stock <= producto.stockMinimo;
            } else if (stock === 'agotado') {
                return producto.stock === 0;
            } else if (stock === 'normal') {
                return producto.stock > producto.stockMinimo;
            }
            return true;
        });
    }
    
    renderizarTabla(productosFiltrados);
}

// Función para exportar a Excel
function exportarAExcel() {
    if (inventario.length === 0) {
        alert('No hay productos para exportar');
        return;
    }
    
    // Preparar datos para exportación
    const datos = inventario.map(producto => ({
        'Código': producto.codigo,
        'Producto': producto.nombre,
        'Categoría': producto.categoria,
        'Proveedor': producto.proveedor || '',
        'Precio Compra': producto.precioCompra,
        'Precio Venta': producto.precioVenta,
        'Stock': producto.stock,
        'Stock Mínimo': producto.stockMinimo,
        'Stock Máximo': producto.stockMaximo,
        'Unidad Medida': producto.unidadMedida,
        'Valor Total': producto.precioCompra * producto.stock,
        'Descripción': producto.descripcion || ''
    }));
    
    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    
    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `inventario_abarrotes_abd_${fecha}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(wb, nombreArchivo);
    
    alert(`Inventario exportado exitosamente a ${nombreArchivo}`);
}

// Función para limpiar formulario del modal
function limpiarFormularioModal() {
    document.getElementById('productoId').value = '';
    document.getElementById('codigoProducto').value = generarCodigo();
    document.getElementById('nombreProductoModal').value = '';
    document.getElementById('categoriaProducto').value = '';
    document.getElementById('proveedorProducto').value = '';
    document.getElementById('precioCompra').value = '';
    document.getElementById('precioVenta').value = '';
    document.getElementById('stockProducto').value = '0';
    document.getElementById('stockMinimo').value = '10';
    document.getElementById('stockMaximo').value = '100';
    document.getElementById('unidadMedida').value = 'pieza';
    document.getElementById('descripcionProducto').value = '';
    document.getElementById('modalProductoLabel').innerHTML = '<i class="bi bi-box me-1"></i>Nuevo Producto';
}

// Función para limpiar filtros
function limpiarFiltros() {
    document.getElementById('buscarProducto').value = '';
    document.getElementById('filtrarCategoria').value = '';
    document.getElementById('filtrarStock').value = '';
    filtrarProductos();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar inventario desde localStorage
    const inventarioGuardado = localStorage.getItem('inventario');
    if (inventarioGuardado) {
        try {
            inventario = JSON.parse(inventarioGuardado);
            // Asegurar que los IDs sean números
            inventario = inventario.map(producto => ({
                ...producto,
                id: Number(producto.id)
            }));
        } catch (error) {
            console.error('Error al cargar el inventario:', error);
            inventario = [];
        }
    }
    
    // Renderizar tabla inicial
    renderizarTabla();
    
    // Nuevo producto - Limpiar formulario antes de abrir modal
    document.getElementById('nuevoProductoBtn').addEventListener('click', function() {
        limpiarFormularioModal();
    });
    
    // Guardar producto
    document.getElementById('formProducto').addEventListener('submit', guardarProducto);
    
    // Exportar a Excel
    document.getElementById('exportarBtn').addEventListener('click', exportarAExcel);
    
    // Filtrar productos
    document.getElementById('btnBuscar').addEventListener('click', filtrarProductos);
    document.getElementById('buscarProducto').addEventListener('keyup', filtrarProductos);
    document.getElementById('filtrarCategoria').addEventListener('change', filtrarProductos);
    document.getElementById('filtrarStock').addEventListener('change', filtrarProductos);
    
    // Limpiar filtros
    document.getElementById('limpiarFiltros').addEventListener('click', limpiarFiltros);
    
    // Confirmar eliminación
    document.getElementById('confirmarEliminar').addEventListener('click', eliminarProducto);
    
    // Delegación de eventos para botones de acciones
    document.getElementById('listaProductos').addEventListener('click', function(e) {
        const target = e.target;
        
        // Encontrar el botón clickeado
        let btn = target.closest('.editar-producto') || 
                 target.closest('.eliminar-producto') || 
                 target.closest('.actualizar-stock');
        
        if (!btn) return;
        
        const id = btn.getAttribute('data-id');
        if (!id) return;
        
        if (btn.classList.contains('editar-producto')) {
            editarProducto(id);
        } else if (btn.classList.contains('eliminar-producto')) {
            prepararEliminarProducto(id);
        } else if (btn.classList.contains('actualizar-stock')) {
            actualizarStockRapido(id);
        }
    });
    
    // Manejar cierre del modal de confirmación
    document.getElementById('modalConfirmacion').addEventListener('hidden.bs.modal', function() {
        productoAEliminar = null;
    });
});