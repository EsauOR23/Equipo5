// Variables globales
let productosVenta = [];
let totalVenta = 0;
let cantidadProductos = 0;
let numeroVenta = 1;
let cajaCerrada = false;
let ultimoCierre = null;

// Base de datos simulada de productos con precios
const productosDB = [
    { nombre: "Leche LALA 1L", precio: 25.50 },
    { nombre: "Huevo San Juan 30 piezas", precio: 85.00 },
    { nombre: "Pan Bimbo Blanco", precio: 45.00 },
    { nombre: "Arroz Morelos 1kg", precio: 32.00 },
    { nombre: "Frijol Bayo 1kg", precio: 40.00 },
    { nombre: "Aceite 123 1L", precio: 38.50 },
    { nombre: "Atún Dolores 140g", precio: 22.00 },
    { nombre: "Sopa Maruchan", precio: 15.00 },
    { nombre: "Coca-Cola 600ml", precio: 20.00 },
    { nombre: "Galletas Emperador", precio: 28.00 },
    { nombre: "Jabón Zote", precio: 18.00 },
    { nombre: "Detergente Ariel 1kg", precio: 65.00 },
    { nombre: "Papel Higiénico Regio 12 rollos", precio: 120.00 },
    { nombre: "Aceite de Oliva Carbonell 500ml", precio: 95.00 },
    { nombre: "Café Nescafé Clásico 200g", precio: 110.00 }
];

// Referencias a elementos del DOM
const productosVentaContainer = document.getElementById('productosVenta');
const sinProductosRow = document.getElementById('sinProductos');
const cantidadProductosTotal = document.getElementById('cantidadProductosTotal');
const totalPagar = document.getElementById('totalPagar');
const agregarProductoBtn = document.getElementById('agregarProductoBtn');
const guardarVentaBtn = document.getElementById('guardarVentaBtn');
const limpiarVentaBtn = document.getElementById('limpiarVentaBtn');
const imprimirComprobanteBtn = document.getElementById('imprimirComprobanteBtn');
const imprimirComprobanteDirecto = document.getElementById('imprimirComprobanteDirecto');
const cerrarComprobante = document.getElementById('cerrarComprobante');
const comprobanteSection = document.getElementById('comprobanteSection');
const comprobanteContent = document.getElementById('comprobanteContent');
const numeroVentaSpan = document.getElementById('numeroVenta');
const metodoPagoSelect = document.getElementById('metodoPago');
const cerrarCajaBtn = document.getElementById('cerrarCajaBtn');
const cajaCerradaAlert = document.getElementById('cajaCerradaAlert');
const nombreProductoInput = document.getElementById('nombreProducto');
const cantidadProductoInput = document.getElementById('cantidadProducto');

// Modal para alertas
const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));

// Función para mostrar alertas en modal
function mostrarAlerta(titulo, mensaje) {
    document.getElementById('alertModalTitle').textContent = titulo;
    document.getElementById('alertModalBody').textContent = mensaje;
    alertModal.show();
}

// Función para formatear números como dinero
function formatoDinero(monto) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(monto);
}

// Función para formatear fecha
function formatoFecha(fecha) {
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(fecha);
}

// Función para verificar si la caja está cerrada
function verificarEstadoCaja() {
    const hoy = new Date().toDateString();
    
    // Si hay un registro de cierre y es de hoy, mantener cerrada
    if (ultimoCierre && ultimoCierre === hoy) {
        cajaCerrada = true;
    }
    
    // Si es un nuevo día, abrir la caja automáticamente
    if (ultimoCierre !== hoy) {
        cajaCerrada = false;
        ultimoCierre = null;
    }
    
    actualizarEstadoCaja();
}

// Función para actualizar el estado de la caja en la UI
function actualizarEstadoCaja() {
    if (cajaCerrada) {
        // Mostrar alerta
        cajaCerradaAlert.classList.remove('d-none');
        
        // Deshabilitar controles
        nombreProductoInput.disabled = true;
        cantidadProductoInput.disabled = true;
        agregarProductoBtn.disabled = true;
        guardarVentaBtn.disabled = true;
        limpiarVentaBtn.disabled = true;
        metodoPagoSelect.disabled = true;
        
        // Actualizar texto del botón
        cerrarCajaBtn.innerHTML = '<i class="bi bi-cash me-1"></i>Caja Cerrada';
        cerrarCajaBtn.classList.remove('btn-outline-light');
        cerrarCajaBtn.classList.add('btn-warning');
    } else {
        // Ocultar alerta
        cajaCerradaAlert.classList.add('d-none');
        
        // Habilitar controles
        nombreProductoInput.disabled = false;
        cantidadProductoInput.disabled = false;
        agregarProductoBtn.disabled = false;
        metodoPagoSelect.disabled = false;
        
        // Actualizar texto del botón
        cerrarCajaBtn.innerHTML = '<i class="bi bi-cash-stack me-1"></i>Cerrar Caja';
        cerrarCajaBtn.classList.remove('btn-warning');
        cerrarCajaBtn.classList.add('btn-outline-light');
    }
}

// Función para cerrar la caja
function cerrarCaja() {
    if (cajaCerrada) {
        mostrarAlerta('Caja ya cerrada', 'La caja ya se encuentra cerrada. Se abrirá automáticamente mañana.');
        return;
    }
    
    if (productosVenta.length > 0) {
        mostrarAlerta('Venta pendiente', 'Tiene productos en la venta actual. Por favor, guarde o limpie la venta antes de cerrar caja.');
        return;
    }
    
    mostrarAlerta(
        'Confirmar cierre de caja',
        '¿Está seguro de cerrar la caja? No podrá registrar más ventas hasta el siguiente día.'
    );
    
    // Cambiar el botón de Aceptar para que cierre la caja
    document.querySelector('#alertModal .btn-primary').onclick = function() {
        cajaCerrada = true;
        ultimoCierre = new Date().toDateString();
        actualizarEstadoCaja();
        mostrarAlerta('Caja cerrada', 'La caja ha sido cerrada exitosamente. No se podrán registrar más ventas hasta mañana.');
        alertModal.hide();
    };
}

// Función para buscar producto en la base de datos simulada
function buscarProducto(nombre) {
    return productosDB.find(producto => 
        producto.nombre.toLowerCase().includes(nombre.toLowerCase())
    );
}

// Función para actualizar el resumen de la venta
function actualizarResumen() {
    cantidadProductos = productosVenta.reduce((total, producto) => total + producto.cantidad, 0);
    totalVenta = productosVenta.reduce((total, producto) => total + producto.subtotal, 0);
    
    cantidadProductosTotal.textContent = cantidadProductos;
    totalPagar.textContent = formatoDinero(totalVenta);
    
    // Habilitar o deshabilitar botones según haya productos
    const hayProductos = productosVenta.length > 0;
    guardarVentaBtn.disabled = !hayProductos || cajaCerrada;
    limpiarVentaBtn.disabled = !hayProductos || cajaCerrada;
    imprimirComprobanteBtn.disabled = !hayProductos;
}

// Función para agregar un producto a la venta
function agregarProducto() {
    if (cajaCerrada) {
        mostrarAlerta('Caja cerrada', 'No se pueden agregar productos porque la caja está cerrada.');
        return;
    }
    
    const nombre = nombreProductoInput.value.trim();
    const cantidad = parseInt(cantidadProductoInput.value);
    
    // Validación básica
    if (!nombre || !cantidad || cantidad <= 0) {
        mostrarAlerta('Error', 'Por favor, ingrese un nombre de producto y una cantidad válida.');
        return;
    }
    
    // Buscar el producto en la base de datos simulada
    const productoDB = buscarProducto(nombre);
    
    if (!productoDB) {
        mostrarAlerta('Producto no encontrado', 'El producto no se encuentra en la base de datos. Intente con otro nombre.');
        return;
    }
    
    const subtotal = cantidad * productoDB.precio;
    const producto = {
        id: Date.now(), // ID único basado en timestamp
        nombre: productoDB.nombre,
        cantidad,
        precio: productoDB.precio,
        subtotal
    };
    
    // Agregar producto al array
    productosVenta.push(producto);
    
    // Actualizar la tabla
    actualizarTablaProductos();
    
    // Actualizar resumen
    actualizarResumen();
    
    // Limpiar campos
    nombreProductoInput.value = '';
    cantidadProductoInput.value = '1';
    nombreProductoInput.focus();
    
    // Mostrar confirmación
    mostrarAlerta('Producto agregado', `Se agregó ${cantidad} unidad(es) de ${productoDB.nombre} a la venta.`);
}

// Función para actualizar la tabla de productos
function actualizarTablaProductos() {
    // Ocultar mensaje de "sin productos"
    if (productosVenta.length > 0 && sinProductosRow) {
        sinProductosRow.style.display = 'none';
    }
    
    // Limpiar tabla (excepto la fila de "sin productos")
    const filasExistentes = productosVentaContainer.querySelectorAll('.producto-fila');
    filasExistentes.forEach(fila => fila.remove());
    
    // Agregar cada producto a la tabla
    productosVenta.forEach(producto => {
        const fila = document.createElement('tr');
        fila.className = 'producto-fila fade-in';
        fila.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.cantidad}</td>
            <td>${formatoDinero(producto.precio)}</td>
            <td>${formatoDinero(producto.subtotal)}</td>
            <td>
                <button class="btn btn-sm btn-danger eliminar-producto" data-id="${producto.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        productosVentaContainer.appendChild(fila);
    });
    
    // Restaurar mensaje si no hay productos
    if (productosVenta.length === 0 && sinProductosRow) {
        sinProductosRow.style.display = '';
    }
}

// Función para eliminar un producto
function eliminarProducto(id) {
    const producto = productosVenta.find(p => p.id === id);
    productosVenta = productosVenta.filter(producto => producto.id !== id);
    actualizarTablaProductos();
    actualizarResumen();
    
    if (producto) {
        mostrarAlerta('Producto eliminado', `Se eliminó ${producto.nombre} de la venta.`);
    }
}

// Función para generar el comprobante de venta
function generarComprobante() {
    const fecha = new Date();
    const metodoPago = metodoPagoSelect.value;
    const metodoPagoTexto = {
        'efectivo': 'Efectivo',
        'tarjeta': 'Tarjeta de Crédito/Débito',
        'transferencia': 'Transferencia Bancaria'
    }[metodoPago];
    
    // Generar HTML del comprobante
    const comprobanteHTML = `
        <div class="comprobante">
            <div class="comprobante-header">
                <h2 class="mb-2">Abarrotes ABD</h2>
                <p class="mb-1">Calle Utacas Sur 564 #123, Col. Colinas de San Lorenzo</p>
                <p class="mb-1">Tel: 555-123-4567</p>
                <p class="mb-1">RFC: ABD123456XYZ</p>
                <hr>
                <h3 class="mb-3">COMPROBANTE DE VENTA</h3>
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>Venta #:</strong> ${String(numeroVenta).padStart(3, '0')}
                    </div>
                    <div>
                        <strong>Fecha:</strong> ${formatoFecha(fecha)}
                    </div>
                </div>
            </div>
            
            <div class="comprobante-body">
                <div class="mb-3">
                    <strong>Cliente:</strong> Cliente General<br>
                    <strong>Atendido por:</strong> Dueño<br>
                    <strong>Método de Pago:</strong> ${metodoPagoTexto}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Cantidad</th>
                            <th>Descripción</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productosVenta.map(producto => `
                            <tr>
                                <td>${producto.cantidad}</td>
                                <td>${producto.nombre}</td>
                                <td>${formatoDinero(producto.precio)}</td>
                                <td>${formatoDinero(producto.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="comprobante-total">
                    <h4 class="mb-2">Total: ${formatoDinero(totalVenta)}</h4>
                    <p class="text-muted mb-0">IVA incluido</p>
                </div>
            </div>
            
            <div class="comprobante-footer">
                <p class="mb-2">¡Gracias por su compra!</p>
                <p class="mb-0">Este documento es un comprobante de venta generado electrónicamente</p>
                <p class="mb-0">Para aclaraciones: ventas@abarrotesabd.com.mx</p>
            </div>
        </div>
    `;
    
    // Insertar el comprobante en el DOM
    comprobanteContent.innerHTML = comprobanteHTML;
    
    // Mostrar la sección del comprobante
    comprobanteSection.classList.remove('d-none');
    comprobanteSection.classList.add('fade-in');
    
    // Desplazarse al comprobante
    comprobanteSection.scrollIntoView({ behavior: 'smooth' });
}

// Función para imprimir el comprobante
function imprimirComprobante() {
    // Generar el comprobante primero
    generarComprobante();
    
    // Esperar un momento para que se renderice y luego imprimir
    setTimeout(() => {
        window.print();
    }, 500);
}

// Función para guardar la venta
function guardarVenta() {
    if (cajaCerrada) {
        mostrarAlerta('Caja cerrada', 'No se puede guardar la venta porque la caja está cerrada.');
        return;
    }
    
    if (productosVenta.length === 0) {
        mostrarAlerta('Venta vacía', 'No hay productos en la venta. Agregue al menos un producto.');
        return;
    }
    
    // Simular guardado en base de datos
    console.log('Venta guardada en base de datos:', {
        numeroVenta: numeroVenta,
        productos: productosVenta,
        total: totalVenta,
        metodoPago: metodoPagoSelect.value,
        fecha: new Date().toISOString()
    });
    
    // Generar y mostrar el comprobante
    generarComprobante();
    
    // Incrementar número de venta para la próxima
    numeroVenta++;
    numeroVentaSpan.textContent = String(numeroVenta).padStart(3, '0');
    
    // Mostrar mensaje de éxito
    mostrarAlerta(
        'Venta guardada',
        `Venta #${String(numeroVenta-1).padStart(3, '0')} guardada exitosamente. Se ha generado el comprobante.`
    );
}

// Función para limpiar toda la venta
function limpiarVenta() {
    if (cajaCerrada) {
        mostrarAlerta('Caja cerrada', 'No se puede limpiar la venta porque la caja está cerrada.');
        return;
    }
    
    if (productosVenta.length === 0) return;
    
    mostrarAlerta(
        'Confirmar limpieza',
        '¿Está seguro de que desea limpiar toda la venta? Se perderán todos los productos agregados.'
    );
    
    // Cambiar el botón de Aceptar para que limpie la venta
    document.querySelector('#alertModal .btn-primary').onclick = function() {
        productosVenta = [];
        actualizarTablaProductos();
        actualizarResumen();
        
        // Ocultar comprobante si está visible
        comprobanteSection.classList.add('d-none');
        
        mostrarAlerta('Venta limpiada', 'La venta ha sido limpiada exitosamente.');
        alertModal.hide();
    };
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Verificar estado de la caja al cargar la página
    verificarEstadoCaja();
    
    // Actualizar número de venta inicial
    numeroVentaSpan.textContent = String(numeroVenta).padStart(3, '0');
    
    // Agregar producto al hacer clic en el botón
    agregarProductoBtn.addEventListener('click', agregarProducto);
    
    // Agregar producto con Enter en cualquier campo
    document.querySelectorAll('#nombreProducto, #cantidadProducto').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                agregarProducto();
            }
        });
    });
    
    // Guardar venta y generar comprobante
    guardarVentaBtn.addEventListener('click', guardarVenta);
    
    // Limpiar venta
    limpiarVentaBtn.addEventListener('click', limpiarVenta);
    
    // Imprimir comprobante
    imprimirComprobanteBtn.addEventListener('click', imprimirComprobante);
    imprimirComprobanteDirecto.addEventListener('click', imprimirComprobante);
    
    // Cerrar comprobante
    cerrarComprobante.addEventListener('click', function() {
        comprobanteSection.classList.add('d-none');
    });
    
    // Cerrar caja
    cerrarCajaBtn.addEventListener('click', cerrarCaja);
    
    // Delegación de eventos para eliminar productos
    productosVentaContainer.addEventListener('click', function(e) {
        if (e.target.closest('.eliminar-producto')) {
            const btn = e.target.closest('.eliminar-producto');
            const id = parseInt(btn.getAttribute('data-id'));
            eliminarProducto(id);
        }
    });
    
    // Autocompletar producto al escribir
    nombreProductoInput.addEventListener('input', function() {
        if (this.value.length > 2) {
            const producto = buscarProducto(this.value);
            if (producto) {
                // Se podría implementar un autocompletado aquí
                console.log('Producto encontrado:', producto);
            }
        }
    });
});