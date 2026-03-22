// Variables globales
let ventasRegistradas = [];
let ventasFiltradas = [];
let paginaActual = 1;
const ventasPorPagina = 10;

// Referencias a elementos del DOM
const tablaVentas = document.getElementById('tablaVentas');
const paginacionVentas = document.getElementById('paginacionVentas');
const totalVentasElement = document.getElementById('totalVentas');
const ventasHoyElement = document.getElementById('ventasHoy');
const fechaInicioInput = document.getElementById('fechaInicio');
const fechaFinInput = document.getElementById('fechaFin');
const filtrarVentasBtn = document.getElementById('filtrarVentas');
const exportarVentasBtn = document.getElementById('exportarVentas');
const generarReporteVentasBtn = document.getElementById('generarReporteVentas');
const verEstadisticasBtn = document.getElementById('verEstadisticas');
const generarReporteInventarioBtn = document.getElementById('generarReporteInventario');
const generarReporteProveedoresBtn = document.getElementById('generarReporteProveedores');
const generarReportePreciosBtn = document.getElementById('generarReportePrecios');
const descargarTodosReportesBtn = document.getElementById('descargarTodosReportes');
const programarReporteBtn = document.getElementById('programarReporte');
const limpiarReportesBtn = document.getElementById('limpiarReportes');
const resumenDiarioBtn = document.getElementById('resumenDiario');
const imprimirDetalleVentaBtn = document.getElementById('imprimirDetalleVenta');

// Modal para alertas
const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
const detalleVentaModal = new bootstrap.Modal(document.getElementById('detalleVentaModal'));

// Base de datos simulada de ventas
const ventasSimuladas = [
    {
        id: 1,
        numero: '001',
        fecha: '2024-03-15 10:30:25',
        productos: [
            { nombre: 'Leche LALA 1L', cantidad: 2, precio: 25.50, subtotal: 51.00 },
            { nombre: 'Huevo San Juan 30 piezas', cantidad: 1, precio: 85.00, subtotal: 85.00 }
        ],
        total: 136.00,
        metodoPago: 'efectivo',
        estado: 'completada',
        cajaCerrada: false
    },
    {
        id: 2,
        numero: '002',
        fecha: '2024-03-15 11:45:12',
        productos: [
            { nombre: 'Pan Bimbo Blanco', cantidad: 1, precio: 45.00, subtotal: 45.00 },
            { nombre: 'Arroz Morelos 1kg', cantidad: 2, precio: 32.00, subtotal: 64.00 },
            { nombre: 'Coca-Cola 600ml', cantidad: 3, precio: 20.00, subtotal: 60.00 }
        ],
        total: 169.00,
        metodoPago: 'tarjeta',
        estado: 'completada',
        cajaCerrada: false
    },
    {
        id: 3,
        numero: '003',
        fecha: '2024-03-15 14:20:35',
        productos: [
            { nombre: 'Aceite 123 1L', cantidad: 1, precio: 38.50, subtotal: 38.50 },
            { nombre: 'Atún Dolores 140g', cantidad: 4, precio: 22.00, subtotal: 88.00 },
            { nombre: 'Sopa Maruchan', cantidad: 5, precio: 15.00, subtotal: 75.00 }
        ],
        total: 201.50,
        metodoPago: 'efectivo',
        estado: 'completada',
        cajaCerrada: true
    },
    {
        id: 4,
        numero: '004',
        fecha: '2024-03-16 09:15:42',
        productos: [
            { nombre: 'Galletas Emperador', cantidad: 3, precio: 28.00, subtotal: 84.00 },
            { nombre: 'Jabón Zote', cantidad: 2, precio: 18.00, subtotal: 36.00 },
            { nombre: 'Detergente Ariel 1kg', cantidad: 1, precio: 65.00, subtotal: 65.00 }
        ],
        total: 185.00,
        metodoPago: 'transferencia',
        estado: 'completada',
        cajaCerrada: false
    },
    {
        id: 5,
        numero: '005',
        fecha: '2024-03-16 12:30:18',
        productos: [
            { nombre: 'Papel Higiénico Regio 12 rollos', cantidad: 1, precio: 120.00, subtotal: 120.00 },
            { nombre: 'Aceite de Oliva Carbonell 500ml', cantidad: 1, precio: 95.00, subtotal: 95.00 },
            { nombre: 'Café Nescafé Clásico 200g', cantidad: 1, precio: 110.00, subtotal: 110.00 }
        ],
        total: 325.00,
        metodoPago: 'tarjeta',
        estado: 'completada',
        cajaCerrada: false
    },
    {
        id: 6,
        numero: '006',
        fecha: '2024-03-16 16:45:33',
        productos: [
            { nombre: 'Leche LALA 1L', cantidad: 3, precio: 25.50, subtotal: 76.50 },
            { nombre: 'Huevo San Juan 30 piezas', cantidad: 2, precio: 85.00, subtotal: 170.00 }
        ],
        total: 246.50,
        metodoPago: 'efectivo',
        estado: 'completada',
        cajaCerrada: true
    },
    {
        id: 7,
        numero: '007',
        fecha: '2024-03-17 08:20:15',
        productos: [
            { nombre: 'Arroz Morelos 1kg', cantidad: 1, precio: 32.00, subtotal: 32.00 },
            { nombre: 'Frijol Bayo 1kg', cantidad: 1, precio: 40.00, subtotal: 40.00 },
            { nombre: 'Aceite 123 1L', cantidad: 1, precio: 38.50, subtotal: 38.50 }
        ],
        total: 110.50,
        metodoPago: 'efectivo',
        estado: 'pendiente',
        cajaCerrada: false
    },
    {
        id: 8,
        numero: '008',
        fecha: '2024-03-17 10:10:45',
        productos: [
            { nombre: 'Coca-Cola 600ml', cantidad: 6, precio: 20.00, subtotal: 120.00 },
            { nombre: 'Sopa Maruchan', cantidad: 10, precio: 15.00, subtotal: 150.00 }
        ],
        total: 270.00,
        metodoPago: 'tarjeta',
        estado: 'completada',
        cajaCerrada: false
    }
];

// Función para mostrar alertas en modal
function mostrarAlerta(titulo, mensaje, tipo = 'info') {
    document.getElementById('alertModalTitle').textContent = titulo;
    document.getElementById('alertModalBody').textContent = mensaje;
    
    // Cambiar color del header según el tipo
    const modalHeader = document.querySelector('#alertModal .modal-header');
    modalHeader.className = 'modal-header';
    
    switch(tipo) {
        case 'success':
            modalHeader.classList.add('bg-success', 'text-white');
            break;
        case 'warning':
            modalHeader.classList.add('bg-warning', 'text-dark');
            break;
        case 'error':
            modalHeader.classList.add('bg-danger', 'text-white');
            break;
        default:
            modalHeader.classList.add('bg-primary', 'text-white');
    }
    
    alertModal.show();
}

// Función para formatear fecha
function formatoFecha(fechaString) {
    const fecha = new Date(fechaString.replace(' ', 'T'));
    return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para formatear dinero
function formatoDinero(monto) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(monto);
}

// Función para obtener el texto del método de pago
function getMetodoPagoTexto(metodo) {
    const metodos = {
        'efectivo': 'Efectivo',
        'tarjeta': 'Tarjeta',
        'transferencia': 'Transferencia'
    };
    return metodos[metodo] || 'Desconocido';
}

// Función para obtener el badge del estado
function getEstadoBadge(estado) {
    const badges = {
        'completada': '<span class="badge bg-success">Completada</span>',
        'pendiente': '<span class="badge bg-warning">Pendiente</span>',
        'cancelada': '<span class="badge bg-danger">Cancelada</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
}

// Función para cargar ventas
function cargarVentas() {
    // Simular carga de ventas desde localStorage o base de datos
    ventasRegistradas = [...ventasSimuladas];
    ventasFiltradas = [...ventasRegistradas];
    
    actualizarEstadisticas();
    actualizarTablaVentas();
    actualizarPaginacion();
}

// Función para actualizar estadísticas
function actualizarEstadisticas() {
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = ventasRegistradas.filter(v => 
        v.fecha.startsWith(hoy)
    ).length;
    
    totalVentasElement.textContent = ventasRegistradas.length;
    ventasHoyElement.textContent = ventasHoy;
}

// Función para filtrar ventas
function filtrarVentas() {
    const fechaInicio = fechaInicioInput.value;
    const fechaFin = fechaFinInput.value;
    
    ventasFiltradas = ventasRegistradas.filter(venta => {
        const ventaFecha = venta.fecha.split(' ')[0];
        
        if (fechaInicio && ventaFecha < fechaInicio) return false;
        if (fechaFin && ventaFecha > fechaFin) return false;
        
        return true;
    });
    
    paginaActual = 1;
    actualizarTablaVentas();
    actualizarPaginacion();
    
    mostrarAlerta('Filtro aplicado', `Se encontraron ${ventasFiltradas.length} ventas con los filtros aplicados.`, 'success');
}

// Función para actualizar la tabla de ventas
function actualizarTablaVentas() {
    const inicio = (paginaActual - 1) * ventasPorPagina;
    const fin = inicio + ventasPorPagina;
    const ventasPagina = ventasFiltradas.slice(inicio, fin);
    
    tablaVentas.innerHTML = '';
    
    if (ventasPagina.length === 0) {
        tablaVentas.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-cart-x display-6 d-block mb-2"></i>
                    No se encontraron ventas
                </td>
            </tr>
        `;
        return;
    }
    
    ventasPagina.forEach(venta => {
        const fila = document.createElement('tr');
        const totalProductos = venta.productos.reduce((sum, p) => sum + p.cantidad, 0);
        
        fila.innerHTML = `
            <td class="fw-bold">${venta.numero}</td>
            <td>${formatoFecha(venta.fecha)}</td>
            <td>${totalProductos} productos</td>
            <td class="fw-bold text-success">${formatoDinero(venta.total)}</td>
            <td>${getMetodoPagoTexto(venta.metodoPago)}</td>
            <td>${getEstadoBadge(venta.estado)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary ver-detalle" data-id="${venta.id}">
                    <i class="bi bi-eye"></i>
                </button>
                ${venta.cajaCerrada ? '<span class="badge bg-info ms-1">Caja Cerrada</span>' : ''}
            </td>
        `;
        
        tablaVentas.appendChild(fila);
    });
    
    // Agregar event listeners a los botones de detalle
    document.querySelectorAll('.ver-detalle').forEach(btn => {
        btn.addEventListener('click', function() {
            const ventaId = parseInt(this.getAttribute('data-id'));
            mostrarDetalleVenta(ventaId);
        });
    });
}

// Función para actualizar la paginación
function actualizarPaginacion() {
    const totalPaginas = Math.ceil(ventasFiltradas.length / ventasPorPagina);
    
    paginacionVentas.innerHTML = '';
    
    if (totalPaginas <= 1) return;
    
    // Botón anterior
    const liAnterior = document.createElement('li');
    liAnterior.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
    liAnterior.innerHTML = `
        <a class="page-link" href="#" aria-label="Anterior" id="paginaAnterior">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    paginacionVentas.appendChild(liAnterior);
    
    // Números de página
    for (let i = 1; i <= totalPaginas; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${paginaActual === i ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-pagina="${i}">${i}</a>`;
        paginacionVentas.appendChild(li);
    }
    
    // Botón siguiente
    const liSiguiente = document.createElement('li');
    liSiguiente.className = `page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`;
    liSiguiente.innerHTML = `
        <a class="page-link" href="#" aria-label="Siguiente" id="paginaSiguiente">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    paginacionVentas.appendChild(liSiguiente);
    
    // Event listeners para paginación
    document.querySelectorAll('.page-link[data-pagina]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            paginaActual = parseInt(this.getAttribute('data-pagina'));
            actualizarTablaVentas();
            actualizarPaginacion();
        });
    });
    
    document.getElementById('paginaAnterior')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (paginaActual > 1) {
            paginaActual--;
            actualizarTablaVentas();
            actualizarPaginacion();
        }
    });
    
    document.getElementById('paginaSiguiente')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (paginaActual < totalPaginas) {
            paginaActual++;
            actualizarTablaVentas();
            actualizarPaginacion();
        }
    });
}

// Función para mostrar detalles de una venta
function mostrarDetalleVenta(ventaId) {
    const venta = ventasRegistradas.find(v => v.id === ventaId);
    
    if (!venta) {
        mostrarAlerta('Error', 'No se encontró la venta solicitada.', 'error');
        return;
    }
    
    let productosHTML = '';
    venta.productos.forEach((producto, index) => {
        productosHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>${formatoDinero(producto.precio)}</td>
                <td class="text-end">${formatoDinero(producto.subtotal)}</td>
            </tr>
        `;
    });
    
    const detalleHTML = `
        <div class="comprobante">
            <div class="comprobante-header">
                <h2 class="mb-2">Abarrotes ABD</h2>
                <p class="mb-1">Calle Utacas Sur 564 #123, Col. Colinas de San Lorenzo</p>
                <p class="mb-1">Tel: 555-123-4567 | RFC: ABD123456XYZ</p>
                <hr>
                <h3 class="mb-3">DETALLE DE VENTA</h3>
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Venta #:</strong> ${venta.numero}</p>
                        <p class="mb-1"><strong>Fecha:</strong> ${formatoFecha(venta.fecha)}</p>
                    </div>
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Método de Pago:</strong> ${getMetodoPagoTexto(venta.metodoPago)}</p>
                        <p class="mb-1"><strong>Estado:</strong> ${getEstadoBadge(venta.estado)}</p>
                        ${venta.cajaCerrada ? '<p class="mb-1"><strong>Caja:</strong> <span class="badge bg-info">Cerrada</span></p>' : ''}
                    </div>
                </div>
            </div>
            
            <div class="comprobante-body mt-4">
                <h5 class="mb-3">Productos Vendidos</h5>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th width="5%">#</th>
                                <th width="45%">Producto</th>
                                <th width="15%">Cantidad</th>
                                <th width="15%">Precio Unitario</th>
                                <th width="20%" class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productosHTML}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" class="text-end fw-bold">Total:</td>
                                <td class="text-end fw-bold text-success">${formatoDinero(venta.total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="mt-4">
                    <h5 class="mb-2">Resumen</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Total de productos:</strong> ${venta.productos.reduce((sum, p) => sum + p.cantidad, 0)}</p>
                            <p class="mb-1"><strong>Cantidad de items:</strong> ${venta.productos.length}</p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Promedio por producto:</strong> ${formatoDinero(venta.total / venta.productos.length)}</p>
                            <p class="mb-1"><strong>IVA incluido:</strong> ${formatoDinero(venta.total * 0.16)}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="comprobante-footer mt-4">
                <p class="mb-2">Venta registrada en el sistema de Abarrotes ABD</p>
                <p class="mb-0">Para aclaraciones: ventas@abarrotesabd.com.mx</p>
            </div>
        </div>
    `;
    
    document.getElementById('detalleVentaContent').innerHTML = detalleHTML;
    detalleVentaModal.show();
}

// Función para exportar ventas a Excel
function exportarVentasExcel() {
    if (ventasFiltradas.length === 0) {
        mostrarAlerta('Sin datos', 'No hay ventas para exportar.', 'warning');
        return;
    }
    
    // Crear datos para Excel
    const datos = ventasFiltradas.map(venta => ({
        'Venta #': venta.numero,
        'Fecha': formatoFecha(venta.fecha),
        'Productos': venta.productos.reduce((sum, p) => sum + p.cantidad, 0),
        'Total': venta.total,
        'Método Pago': getMetodoPagoTexto(venta.metodoPago),
        'Estado': venta.estado,
        'Caja Cerrada': venta.cajaCerrada ? 'Sí' : 'No'
    }));
    
    // Crear hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    
    // Generar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Ventas_Abarrotes_ABD_${fecha}.xlsx`);
    
    mostrarAlerta('Exportación exitosa', 'Las ventas se han exportado correctamente a Excel.', 'success');
}

// Función para generar reporte de ventas
function generarReporteVentas() {
    if (ventasFiltradas.length === 0) {
        mostrarAlerta('Sin datos', 'No hay ventas para generar reporte.', 'warning');
        return;
    }
    
    mostrarAlerta(
        'Generar Reporte PDF',
        '¿Desea generar un reporte PDF con las ventas filtradas?',
        'info'
    );
    
    // Aquí iría la lógica para generar PDF
    // Por ahora solo mostramos mensaje de simulación
    document.querySelector('#alertModal .btn-primary').onclick = function() {
        mostrarAlerta('Reporte generado', 'El reporte PDF se ha generado exitosamente. Se descargará automáticamente.', 'success');
        alertModal.hide();
    };
}

// Función para mostrar estadísticas
function mostrarEstadisticas() {
    if (ventasFiltradas.length === 0) {
        mostrarAlerta('Sin datos', 'No hay ventas para mostrar estadísticas.', 'warning');
        return;
    }
    
    const totalVentas = ventasFiltradas.length;
    const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
    const promedioVenta = totalIngresos / totalVentas;
    
    const metodoPagoStats = {};
    ventasFiltradas.forEach(v => {
        metodoPagoStats[v.metodoPago] = (metodoPagoStats[v.metodoPago] || 0) + 1;
    });
    
    const estadisticasHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">Resumen General</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Total de ventas:</strong> ${totalVentas}</p>
                        <p><strong>Ingresos totales:</strong> ${formatoDinero(totalIngresos)}</p>
                        <p><strong>Promedio por venta:</strong> ${formatoDinero(promedioVenta)}</p>
                        <p><strong>Periodo:</strong> ${fechaInicioInput.value || 'Inicio'} - ${fechaFinInput.value || 'Fin'}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0">Métodos de Pago</h6>
                    </div>
                    <div class="card-body">
                        ${Object.entries(metodoPagoStats).map(([metodo, count]) => `
                            <p><strong>${getMetodoPagoTexto(metodo)}:</strong> ${count} ventas (${((count / totalVentas) * 100).toFixed(1)}%)</p>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Estas estadísticas se basan en las ventas actualmente filtradas.
        </div>
    `;
    
    mostrarAlerta('Estadísticas de Ventas', estadisticasHTML, 'info');
}

// Función para generar reporte de inventario
function generarReporteInventario() {
    mostrarAlerta(
        'Generar Reporte de Inventario',
        '¿Desea generar un nuevo reporte de inventario?',
        'info'
    );
    
    document.querySelector('#alertModal .btn-primary').onclick = function() {
        mostrarAlerta('Reporte programado', 'El reporte de inventario se generará en breve. Será notificado cuando esté listo.', 'success');
        alertModal.hide();
    };
}

// Función para limpiar reportes antiguos
function limpiarReportesAntiguos() {
    mostrarAlerta(
        'Limpiar Reportes Antiguos',
        '¿Está seguro de eliminar los reportes con más de 6 meses de antigüedad? Esta acción no se puede deshacer.',
        'warning'
    );
    
    document.querySelector('#alertModal .btn-primary').onclick = function() {
        mostrarAlerta('Reportes limpiados', 'Los reportes antiguos han sido eliminados correctamente.', 'success');
        alertModal.hide();
    };
}

// Función para mostrar resumen diario
function mostrarResumenDiario() {
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = ventasRegistradas.filter(v => v.fecha.startsWith(hoy));
    
    if (ventasHoy.length === 0) {
        mostrarAlerta('Sin ventas hoy', 'No se han registrado ventas hoy.', 'info');
        return;
    }
    
    const totalHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
    
    mostrarAlerta(
        'Resumen Diario',
        `Hoy se han registrado ${ventasHoy.length} ventas por un total de ${formatoDinero(totalHoy)}.`,
        'success'
    );
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar ventas al iniciar
    cargarVentas();
    
    // Configurar fechas por defecto (últimos 7 días)
    const hoy = new Date();
    const hace7Dias = new Date();
    hace7Dias.setDate(hoy.getDate() - 7);
    
    fechaInicioInput.value = hace7Dias.toISOString().split('T')[0];
    fechaFinInput.value = hoy.toISOString().split('T')[0];
    
    // Event Listeners
    filtrarVentasBtn.addEventListener('click', filtrarVentas);
    
    exportarVentasBtn.addEventListener('click', exportarVentasExcel);
    
    generarReporteVentasBtn.addEventListener('click', generarReporteVentas);
    
    verEstadisticasBtn.addEventListener('click', mostrarEstadisticas);
    
    generarReporteInventarioBtn.addEventListener('click', generarReporteInventario);
    
    generarReporteProveedoresBtn.addEventListener('click', function() {
        mostrarAlerta('Reporte de Proveedores', 'El reporte de pagos a proveedores se generará en formato PDF.', 'info');
    });
    
    generarReportePreciosBtn.addEventListener('click', function() {
        mostrarAlerta('Reporte de Precios', 'El reporte de precios comparativos se generará en formato Excel.', 'info');
    });
    
    descargarTodosReportesBtn.addEventListener('click', function() {
        mostrarAlerta('Descargar Reportes', 'Todos los reportes disponibles se descargarán en un archivo ZIP.', 'info');
    });
    
    programarReporteBtn.addEventListener('click', function() {
        mostrarAlerta('Programar Reporte', 'Puede programar reportes automáticos diarios, semanales o mensuales.', 'info');
    });
    
    limpiarReportesBtn.addEventListener('click', limpiarReportesAntiguos);
    
    resumenDiarioBtn.addEventListener('click', mostrarResumenDiario);
    
    imprimirDetalleVentaBtn.addEventListener('click', function() {
        window.print();
    });
    
    // Permitir filtrar con Enter en los campos de fecha
    fechaInicioInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') filtrarVentas();
    });
    
    fechaFinInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') filtrarVentas();
    });
});