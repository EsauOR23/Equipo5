// ─────────────────────────────────────────────
//  MenuDueño.js — Lógica de la pantalla de ventas
//  La sesión, roles y navbar son manejados por navbar.js
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {

    const rol = sessionStorage.getItem('rol');

    // ── Lógica original del menú (Cerrar Caja, etc.) ────────────────────────
    const cerrarCajaBtn    = document.getElementById('cerrarCajaBtn');
    const cajaCerradaAlert = document.getElementById('cajaCerradaAlert');
    const agregarProductoBtn = document.getElementById('agregarProductoBtn');
    const nombreProductoInput = document.getElementById('nombreProducto');
    const cantidadProductoInput = document.getElementById('cantidadProducto');
    const metodoPagoSelect = document.getElementById('metodoPago');
    const guardarVentaBtn  = document.getElementById('guardarVentaBtn');
    const limpiarVentaBtn  = document.getElementById('limpiarVentaBtn');
    const imprimirComprobanteBtn = document.getElementById('imprimirComprobanteBtn');

    let cajaCerrada = false;

    function habilitarFormulario(habilitar) {
        if (nombreProductoInput)    nombreProductoInput.disabled    = !habilitar;
        if (cantidadProductoInput)  cantidadProductoInput.disabled  = !habilitar;
        if (agregarProductoBtn)     agregarProductoBtn.disabled     = !habilitar;
        if (metodoPagoSelect)       metodoPagoSelect.disabled       = !habilitar;
        if (guardarVentaBtn)        guardarVentaBtn.disabled        = !habilitar;
        if (limpiarVentaBtn)        limpiarVentaBtn.disabled        = !habilitar;
        if (imprimirComprobanteBtn) imprimirComprobanteBtn.disabled = !habilitar;
    }

    if (cerrarCajaBtn) {
        cerrarCajaBtn.addEventListener('click', function () {
            if (!cajaCerrada) {
                cajaCerrada = true;
                cajaCerradaAlert && cajaCerradaAlert.classList.remove('d-none');
                habilitarFormulario(false);
                cerrarCajaBtn.textContent = 'Caja Cerrada';
                cerrarCajaBtn.disabled = true;
            }
        });
    }
});
