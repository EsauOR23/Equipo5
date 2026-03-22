// Datos de ejemplo para pagos a proveedores
const pagosEjemplo = [
    {
        proveedor: "Distribuidora La Esperanza",
        dia: "25/03/2024",
        hora: "10:30 AM",
        cantidad: 12500.00,
        metodo: "Transferencia",
        estado: "pagado"
    },
    {
        proveedor: "Lácteos San Antonio",
        dia: "24/03/2024",
        hora: "09:15 AM",
        cantidad: 8500.00,
        metodo: "Efectivo",
        estado: "pagado"
    },
    {
        proveedor: "Cárnicos El Rancho",
        dia: "20/03/2024",
        hora: "02:45 PM",
        cantidad: 18000.00,
        metodo: "Cheque",
        estado: "pagado"
    },
    {
        proveedor: "Bebidas Refrescantes S.A.",
        dia: "15/03/2024",
        hora: "11:00 AM",
        cantidad: 7500.00,
        metodo: "Transferencia",
        estado: "pagado"
    },
    {
        proveedor: "Limpieza Total",
        dia: "10/03/2024",
        hora: "03:30 PM",
        cantidad: 6200.00,
        metodo: "Tarjeta",
        estado: "pagado"
    },
    {
        proveedor: "Panadería La Esperanza",
        dia: "05/03/2024",
        hora: "08:45 AM",
        cantidad: 3200.00,
        metodo: "Efectivo",
        estado: "pagado"
    },
    {
        proveedor: "Distribuidora La Esperanza",
        dia: "05/04/2024",
        hora: "",
        cantidad: 13500.00,
        metodo: "Transferencia",
        estado: "pendiente"
    },
    {
        proveedor: "Frutas y Verduras Frescas",
        dia: "03/04/2024",
        hora: "",
        cantidad: 4800.00,
        metodo: "Efectivo",
        estado: "pendiente"
    },
    {
        proveedor: "Lácteos San Antonio",
        dia: "28/03/2024",
        hora: "",
        cantidad: 9200.00,
        metodo: "Transferencia",
        estado: "vencido"
    }
];

// Datos de ejemplo para proveedores
const proveedoresEjemplo = [
    {
        nombre: "Distribuidora La Esperanza",
        contacto: "Juan Pérez - 555-1234",
        productos: "Abarrotes en general",
        saldo: 13500.00,
        estado: "pendiente"
    },
    {
        nombre: "Lácteos San Antonio",
        contacto: "María García - 555-5678",
        productos: "Leche, queso, yogurth",
        saldo: 9200.00,
        estado: "vencido"
    },
    {
        nombre: "Cárnicos El Rancho",
        contacto: "Carlos López - 555-9012",
        productos: "Carnes frías y embutidos",
        saldo: 0.00,
        estado: "al-dia"
    },
    {
        nombre: "Bebidas Refrescantes S.A.",
        contacto: "Roberto Martínez - 555-3456",
        productos: "Refrescos y jugos",
        saldo: 0.00,
        estado: "al-dia"
    },
    {
        nombre: "Limpieza Total",
        contacto: "Ana Rodríguez - 555-7890",
        productos: "Productos de limpieza",
        saldo: 0.00,
        estado: "al-dia"
    },
    {
        nombre: "Panadería La Esperanza",
        contacto: "Pedro Sánchez - 555-2345",
        productos: "Pan y pasteles",
        saldo: 0.00,
        estado: "al-dia"
    },
    {
        nombre: "Frutas y Verduras Frescas",
        contacto: "Luisa Fernández - 555-6789",
        productos: "Frutas y verduras",
        saldo: 4800.00,
        estado: "pendiente"
    }
];

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const listaPagos = document.getElementById('listaPagos');
    const listaProveedores = document.getElementById('listaProveedores');
    const contadorPagos = document.getElementById('contadorPagos');
    const buscarProveedor = document.getElementById('buscarProveedor');
    const btnBuscarProveedor = document.getElementById('btnBuscarProveedor');
    const filtrarMes = document.getElementById('filtrarMes');
    const filtrarEstado = document.getElementById('filtrarEstado');
    const limpiarFiltrosPagos = document.getElementById('limpiarFiltrosPagos');
    const exportarPagosBtn = document.getElementById('exportarPagosBtn');
    const nuevoPagoBtn = document.getElementById('nuevoPagoBtn');
    const modalNuevoPago = new bootstrap.Modal(document.getElementById('modalNuevoPago'));
    const confirmarPago = document.getElementById('confirmarPago');
    const filtrarPendientes = document.getElementById('filtrarPendientes');
    const filtrarPagados = document.getElementById('filtrarPagados');

    // Variables
    let pagos = [...pagosEjemplo];
    let proveedores = [...proveedoresEjemplo];
    let filtroActual = {
        proveedor: '',
        mes: '',
        estado: ''
    };

    // Inicializar la página
    function inicializar() {
        cargarPagos();
        cargarProveedores();
        configurarEventos();
        
        // Establecer fecha actual en el modal
        const fechaActual = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPago').value = fechaActual;
    }

    // Cargar pagos en la tabla
    function cargarPagos(filtros = filtroActual) {
        let pagosFiltrados = [...pagos];
        
        // Aplicar filtros
        if (filtros.proveedor) {
            pagosFiltrados = pagosFiltrados.filter(pago => 
                pago.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())
            );
        }
        
        if (filtros.mes) {
            pagosFiltrados = pagosFiltrados.filter(pago => {
                const dia = pago.dia.split('/')[1]; // Obtener mes del formato dd/mm/aaaa
                return dia === filtros.mes;
            });
        }
        
        if (filtros.estado) {
            pagosFiltrados = pagosFiltrados.filter(pago => 
                pago.estado === filtros.estado
            );
        }
        
        // Limpiar tabla
        listaPagos.innerHTML = '';
        
        if (pagosFiltrados.length === 0) {
            const tr = document.createElement('tr');
            tr.id = 'sinPagos';
            tr.innerHTML = `
                <td colspan="7" class="text-center text-muted py-5">
                    <i class="bi bi-search display-1 d-block mb-3"></i>
                    <h5>No se encontraron pagos</h5>
                    <p class="mb-0">Intenta con otros filtros o registra un nuevo pago</p>
                </td>
            `;
            listaPagos.appendChild(tr);
        } else {
            // Agregar pagos a la tabla
            pagosFiltrados.forEach((pago, index) => {
                const tr = document.createElement('tr');
                tr.className = 'fade-in';
                
                // Determinar clase de estado
                let estadoClass = '';
                let estadoIcon = '';
                let estadoText = '';
                
                switch(pago.estado) {
                    case 'pagado':
                        estadoClass = 'badge bg-success';
                        estadoIcon = '<i class="bi bi-check-circle me-1"></i>';
                        estadoText = 'Pagado';
                        break;
                    case 'pendiente':
                        estadoClass = 'badge bg-warning';
                        estadoIcon = '<i class="bi bi-clock me-1"></i>';
                        estadoText = 'Pendiente';
                        break;
                    case 'vencido':
                        estadoClass = 'badge bg-danger';
                        estadoIcon = '<i class="bi bi-exclamation-triangle me-1"></i>';
                        estadoText = 'Vencido';
                        break;
                }
                
                tr.innerHTML = `
                    <td>
                        <i class="bi bi-building me-2 text-primary"></i>
                        <strong>${pago.proveedor}</strong>
                    </td>
                    <td>${pago.dia}</td>
                    <td>${pago.hora || '-'}</td>
                    <td>
                        <span class="fw-bold precio-destacado">$${pago.cantidad.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td>
                        <span class="badge bg-secondary">${pago.metodo}</span>
                    </td>
                    <td>
                        <span class="${estadoClass}">${estadoIcon}${estadoText}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetallePago(${index})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${pago.estado === 'pendiente' ? `
                        <button class="btn btn-sm btn-outline-success" onclick="marcarComoPagado(${index})" title="Marcar como pagado">
                            <i class="bi bi-check-lg"></i>
                        </button>
                        ` : ''}
                    </td>
                `;
                listaPagos.appendChild(tr);
            });
        }
        
        // Actualizar contador
        contadorPagos.textContent = `${pagosFiltrados.length} pagos registrados`;
    }

    // Cargar proveedores en la sección
    function cargarProveedores() {
        listaProveedores.innerHTML = '';
        
        proveedores.forEach(proveedor => {
            let estadoClass = '';
            let estadoText = '';
            
            switch(proveedor.estado) {
                case 'al-dia':
                    estadoClass = 'badge bg-success';
                    estadoText = 'Al día';
                    break;
                case 'pendiente':
                    estadoClass = 'badge bg-warning';
                    estadoText = 'Pendiente';
                    break;
                case 'vencido':
                    estadoClass = 'badge bg-danger';
                    estadoText = 'Vencido';
                    break;
            }
            
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-3 fade-in';
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
                            <span class="fw-bold ${proveedor.saldo > 0 ? 'text-danger' : 'text-success'}">
                                $${proveedor.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span class="${estadoClass}">${estadoText}</span>
                        </div>
                    </div>
                </div>
            `;
            listaProveedores.appendChild(col);
        });
    }

    // Configurar eventos
    function configurarEventos() {
        // Buscar proveedor
        btnBuscarProveedor.addEventListener('click', function() {
            filtroActual.proveedor = buscarProveedor.value;
            cargarPagos();
        });

        buscarProveedor.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filtroActual.proveedor = buscarProveedor.value;
                cargarPagos();
            }
        });

        // Filtrar por mes
        filtrarMes.addEventListener('change', function() {
            filtroActual.mes = this.value;
            cargarPagos();
        });

        // Filtrar por estado
        filtrarEstado.addEventListener('change', function() {
            filtroActual.estado = this.value;
            cargarPagos();
        });

        // Limpiar filtros
        limpiarFiltrosPagos.addEventListener('click', function() {
            buscarProveedor.value = '';
            filtrarMes.value = '';
            filtrarEstado.value = '';
            filtroActual = { proveedor: '', mes: '', estado: '' };
            cargarPagos();
        });

        // Botones de filtro rápido
        filtrarPendientes.addEventListener('click', function() {
            filtrarEstado.value = 'pendiente';
            filtroActual.estado = 'pendiente';
            cargarPagos();
        });

        filtrarPagados.addEventListener('click', function() {
            filtrarEstado.value = 'pagado';
            filtroActual.estado = 'pagado';
            cargarPagos();
        });

        // Exportar pagos a Excel
        exportarPagosBtn.addEventListener('click', function() {
            exportarPagos();
        });

        // Nuevo pago
        nuevoPagoBtn.addEventListener('click', function() {
            modalNuevoPago.show();
        });

        // Confirmar nuevo pago
        confirmarPago.addEventListener('click', function() {
            registrarNuevoPago();
        });
    }

    // Registrar nuevo pago
    function registrarNuevoPago() {
        const proveedorSelect = document.getElementById('proveedorSelect');
        const cantidadPago = document.getElementById('cantidadPago');
        const metodoPago = document.getElementById('metodoPago');
        const fechaPago = document.getElementById('fechaPago');
        const descripcionPago = document.getElementById('descripcionPago');

        // Validar formulario
        if (!proveedorSelect.value || !cantidadPago.value || !metodoPago.value || !fechaPago.value) {
            alert('Por favor complete todos los campos obligatorios');
            return;
        }

        // Obtener nombre del proveedor
        const proveedorNombre = proveedorSelect.options[proveedorSelect.selectedIndex].text;
        
        // Formatear fecha
        const fecha = new Date(fechaPago.value);
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getFullYear();
        const fechaFormateada = `${dia}/${mes}/${año}`;
        
        // Obtener hora actual
        const ahora = new Date();
        const hora = ahora.getHours().toString().padStart(2, '0');
        const minutos = ahora.getMinutes().toString().padStart(2, '0');
        const horaFormateada = `${hora}:${minutos}`;

        // Crear nuevo pago
        const nuevoPago = {
            proveedor: proveedorNombre,
            dia: fechaFormateada,
            hora: horaFormateada,
            cantidad: parseFloat(cantidadPago.value),
            metodo: metodoPago.value,
            estado: 'pagado',
            descripcion: descripcionPago.value || ''
        };

        // Agregar pago a la lista
        pagos.unshift(nuevoPago); // Agregar al inicio
        
        // Actualizar saldo del proveedor si existe
        const proveedorIndex = proveedores.findIndex(p => p.nombre === proveedorNombre);
        if (proveedorIndex !== -1) {
            proveedores[proveedorIndex].saldo = Math.max(0, proveedores[proveedorIndex].saldo - parseFloat(cantidadPago.value));
            if (proveedores[proveedorIndex].saldo === 0) {
                proveedores[proveedorIndex].estado = 'al-dia';
            }
        }

        // Cerrar modal y limpiar formulario
        modalNuevoPago.hide();
        document.getElementById('formNuevoPago').reset();
        
        // Restaurar fecha actual
        const fechaActual = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPago').value = fechaActual;
        
        // Actualizar la vista
        cargarPagos();
        cargarProveedores();
        
        // Mostrar mensaje de éxito
        alert('¡Pago registrado exitosamente!');
    }

    // Exportar pagos a Excel
    function exportarPagos() {
        try {
            // Crear hoja de trabajo
            const ws = XLSX.utils.json_to_sheet(pagos.map(pago => ({
                Proveedor: pago.proveedor,
                Fecha: pago.dia,
                Hora: pago.hora,
                Cantidad: pago.cantidad,
                'Método de Pago': pago.metodo,
                Estado: pago.estado.toUpperCase()
            })));
            
            // Crear libro de trabajo
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pagos a Proveedores");
            
            // Generar nombre de archivo con fecha
            const fecha = new Date();
            const fechaStr = `${fecha.getDate()}-${fecha.getMonth()+1}-${fecha.getFullYear()}`;
            const filename = `Pagos_Proveedores_${fechaStr}.xlsx`;
            
            // Descargar archivo
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error('Error al exportar pagos:', error);
            alert('Error al exportar el archivo. Por favor intente nuevamente.');
        }
    }

    // Funciones globales para los botones de acción
    window.verDetallePago = function(index) {
        const pago = pagos[index];
        alert(`Detalles del pago:\n\nProveedor: ${pago.proveedor}\nFecha: ${pago.dia}\nHora: ${pago.hora}\nCantidad: $${pago.cantidad.toLocaleString('es-MX')}\nMétodo: ${pago.metodo}\nEstado: ${pago.estado}`);
    };

    window.marcarComoPagado = function(index) {
        if (confirm('¿Marcar este pago como pagado?')) {
            pagos[index].estado = 'pagado';
            pagos[index].hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            
            // Actualizar saldo del proveedor
            const proveedorNombre = pagos[index].proveedor;
            const proveedorIndex = proveedores.findIndex(p => p.nombre === proveedorNombre);
            if (proveedorIndex !== -1) {
                proveedores[proveedorIndex].saldo = Math.max(0, proveedores[proveedorIndex].saldo - pagos[index].cantidad);
                if (proveedores[proveedorIndex].saldo === 0) {
                    proveedores[proveedorIndex].estado = 'al-dia';
                }
            }
            
            cargarPagos();
            cargarProveedores();
            alert('¡Pago marcado como completado!');
        }
    };

    // Inicializar la página
    inicializar();
});