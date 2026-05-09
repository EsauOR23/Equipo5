"""API REST para el módulo de Reportes."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any

from flask import Blueprint, jsonify, request

from bd import get_connection

reportes_bp = Blueprint("reportes", __name__, url_prefix="/api/reportes")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _float(value: Any) -> float:
    if isinstance(value, Decimal):
        return float(value)
    return float(value or 0)


def _fecha_iso(value: Any) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, date):
        return value.strftime("%Y-%m-%d 00:00:00")
    return str(value or "")


def _metodo_texto(value: Any) -> str:
    metodos = {
        1: "Efectivo", 2: "Tarjeta", 3: "Transferencia",
        "1": "Efectivo", "2": "Tarjeta", "3": "Transferencia",
    }
    return metodos.get(value, str(value or "Efectivo"))


# ── Ventas ────────────────────────────────────────────────────────────────────

def _query_ventas(fecha_inicio=None, fecha_fin=None):
    """
    Devuelve lista de tickets con sus productos asociados.
    Ajustado a la estructura real: 
    'venta' (principal) -> 'Ticket' (intermedia) -> 'Producto' (catálogo)
    """
    filtros, params = [], []
    if fecha_inicio:
        filtros.append("v.dia_compra >= %s")
        params.append(fecha_inicio)
    if fecha_fin:
        filtros.append("v.dia_compra <= %s")
        params.append(fecha_fin)

    where = f"WHERE {' AND '.join(filtros)}" if filtros else ""

    # Ajustamos el JOIN para que pase por la tabla intermedia 'Ticket'
    sql = f"""
        SELECT
            v.id_ticket,
            v.dia_compra,
            v.id_metodopago   AS metodo,
            v.total,
            p.id_producto,
            p.producto        AS nombre_producto,
            p.precio_venta    AS precio_unitario
        FROM venta AS v
        LEFT JOIN Ticket AS t ON v.id_ticket = t.Venta_id_ticket
        LEFT JOIN Producto AS p ON t.Producto_id_producto = p.id_producto
        {where}
        ORDER BY v.dia_compra DESC, v.id_ticket DESC
    """

    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall() or []
    finally:
        cursor.close()
        conexion.close()

    ventas: dict[int, dict] = {}
    for row in rows:
        tid = int(row["id_ticket"])
        if tid not in ventas:
            ventas[tid] = {
                "id":         tid,
                "numero":     str(tid).zfill(3),
                "fecha":      _fecha_iso(row["dia_compra"]),
                "total":      _float(row["total"]),
                "metodoPago": _metodo_texto(row["metodo"]),
                "estado":     "completada",
                "productos":  [],
            }
        # Si la venta tiene productos registrados, los agregamos a la lista
        if row.get("nombre_producto"):
            ventas[tid]["productos"].append({
                "nombre":   row["nombre_producto"],
                "cantidad": 1, # Aquí asumimos 1 porque en el esquema original no hay columna de cantidad en Ticket
                "precio":   _float(row["precio_unitario"]),
                "subtotal": _float(row["precio_unitario"]),
            })

    return list(ventas.values())


def _estadisticas(ventas: list) -> dict:
    total = len(ventas)
    ingresos = sum(v["total"] for v in ventas)
    metodos: dict[str, int] = {}
    for v in ventas:
        m = v["metodoPago"]
        metodos[m] = metodos.get(m, 0) + 1
    return {
        "totalVentas":   total,
        "totalIngresos": ingresos,
        "promedioVenta": ingresos / total if total else 0,
        "metodosPago":   metodos,
    }


@reportes_bp.route("/ventas", methods=["GET"])
def listar_ventas():
    fecha_inicio = request.args.get("fechaInicio") or None
    fecha_fin    = request.args.get("fechaFin") or None
    try:
        ventas = _query_ventas(fecha_inicio, fecha_fin)
        return jsonify({"success": True, "ventas": ventas, "estadisticas": _estadisticas(ventas)})
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc), "ventas": []}), 500


@reportes_bp.route("/resumen-diario", methods=["GET"])
def resumen_diario():
    hoy = date.today().isoformat()
    try:
        ventas = _query_ventas(hoy, hoy)
        return jsonify({"success": True, "fecha": hoy, "estadisticas": _estadisticas(ventas)})
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc)}), 500


# ── Inventario ────────────────────────────────────────────────────────────────

@reportes_bp.route("/inventario", methods=["GET"])
def reporte_inventario():
    """Devuelve todos los productos con su stock actual."""
    sql = """
        SELECT
            p.id_producto,
            p.producto,
            p.stock,
            p.stock_min,
            p.stock_max,
            p.precio_compra,
            p.precio_venta,
            tp.tipo_producto  AS categoria,
            un.tipo_unidad    AS unidad,
            pr.nombre_empresa AS proveedor  -- CORREGIDO: nombre_empresa
        FROM Producto AS p
        INNER JOIN Tipo      AS tp ON p.id_tipo      = tp.id_tipo
        INNER JOIN Unidades  AS un ON p.Id_unidad    = un.id_unidad
        INNER JOIN Proveedor AS pr ON p.id_proveedor = pr.id_proveedor
        ORDER BY p.producto ASC
    """
    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute(sql)
        rows = cursor.fetchall() or []
        cursor.close()
        conexion.close()

        productos = []
        bajo_stock = 0
        for r in rows:
            stock     = int(r["stock"] or 0)
            stock_min = int(r["stock_min"] or 0)
            estado    = "Bajo stock" if stock <= stock_min else "Normal"
            if stock <= stock_min:
                bajo_stock += 1
            productos.append({
                "id":           int(r["id_producto"]),
                "nombre":       r["producto"] or "",
                "categoria":    r["categoria"] or "",
                "unidad":       r["unidad"] or "",
                "proveedor":    r["proveedor"] or "",
                "stock":        stock,
                "stockMin":     stock_min,
                "stockMax":     int(r["stock_max"] or 0),
                "precioCompra": _float(r["precio_compra"]),
                "precioVenta":  _float(r["precio_venta"]),
                "estado":       estado,
            })

        return jsonify({
            "success":   True,
            "productos": productos,
            "resumen": {
                "total":      len(productos),
                "bajoStock":  bajo_stock,
                "normal":     len(productos) - bajo_stock,
            },
        })
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc), "productos": []}), 500

# ── Proveedores / Pagos ───────────────────────────────────────────────────────

@reportes_bp.route("/proveedores", methods=["GET"])
def reporte_proveedores():
    """Devuelve el historial de pagos a proveedores."""
    # CORREGIDO: Uso de JOINs para obtener el texto de estado y metodo, y nombre_empresa
    sql = """
        SELECT
            pg.id_pago,
            pg.dia,
            pg.hora,
            pg.monto,
            mp.metodopago      AS metodo,
            ep.estado          AS estado,
            pr.nombre_empresa  AS empresa,
            pr.nombre_proveedor AS contacto,
            u.usuario
        FROM Pagos AS pg
        INNER JOIN Proveedor  AS pr ON pg.id_proveedor  = pr.id_proveedor
        INNER JOIN Usuario    AS u  ON pg.id_usuario    = u.id_usuario
        INNER JOIN MetodoPago AS mp ON pg.id_metodopago = mp.id_metodopago
        INNER JOIN EstadoPago AS ep ON pg.id_estadopago = ep.id_estadopago
        ORDER BY pg.dia DESC, pg.hora DESC
    """
    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute(sql)
        rows = cursor.fetchall() or []
        cursor.close()
        conexion.close()

        pagos = []
        total_monto = 0
        for r in rows:
            monto = int(r["monto"] or 0)
            total_monto += monto
            pagos.append({
                "id":       int(r["id_pago"]),
                "fecha":    r["dia"].isoformat() if r["dia"] else "",
                "hora":     str(r["hora"]) if r["hora"] else "",
                "monto":    monto,
                "metodo":   r["metodo"] or "",
                "estado":   r["estado"] or "",
                "empresa":  r["empresa"] or "",
                "contacto": r["contacto"] or "",
                "usuario":  r["usuario"] or "",
            })

        return jsonify({
            "success": True,
            "pagos":   pagos,
            "resumen": {
                "totalPagos":  len(pagos),
                "totalMonto":  total_monto,
                "pendientes":  sum(1 for p in pagos if p["estado"].lower() == "pendiente"),
                "completados": sum(1 for p in pagos if p["estado"].lower() == "pagado"),
            },
        })
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc), "pagos": []}), 500

# ── Precios ───────────────────────────────────────────────────────────────────

@reportes_bp.route("/precios", methods=["GET"])
def reporte_precios():
    """Devuelve la lista de productos con precios de compra y venta."""
    sql = """
        SELECT
            p.id_producto,
            p.producto,
            p.precio_compra,
            p.precio_venta,
            tp.tipo_producto AS categoria,
            pr.nombre_empresa AS proveedor -- CORREGIDO: nombre_empresa
        FROM Producto AS p
        INNER JOIN Tipo      AS tp ON p.id_tipo      = tp.id_tipo
        INNER JOIN Proveedor AS pr ON p.id_proveedor = pr.id_proveedor
        ORDER BY tp.tipo_producto ASC, p.producto ASC
    """
    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute(sql)
        rows = cursor.fetchall() or []
        cursor.close()
        conexion.close()

        productos = []
        for r in rows:
            compra  = _float(r["precio_compra"])
            venta   = _float(r["precio_venta"])
            margen  = ((venta - compra) / compra * 100) if compra > 0 else 0
            productos.append({
                "id":           int(r["id_producto"]),
                "nombre":       r["producto"] or "",
                "categoria":    r["categoria"] or "",
                "proveedor":    r["proveedor"] or "",
                "precioCompra": compra,
                "precioVenta":  venta,
                "margen":       round(margen, 1),
            })

        return jsonify({"success": True, "productos": productos, "total": len(productos)})
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc), "productos": []}), 500