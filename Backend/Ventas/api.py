"""API REST para el módulo de Registro de Ventas (MenuDueño)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from flask import Blueprint, jsonify, request

from bd import get_connection

ventas_bp = Blueprint("ventas", __name__, url_prefix="/api/ventas")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _decimal_a_float(value: Any) -> float:
    if isinstance(value, Decimal):
        return float(value)
    return float(value or 0)


def _metodo_texto(value: Any) -> str:
    """Convierte el entero de metodo a texto legible para el comprobante."""
    metodos = {
        1: "Efectivo",
        2: "Tarjeta",
        3: "Transferencia",
        "1": "Efectivo",
        "2": "Tarjeta",
        "3": "Transferencia",
        "efectivo": "Efectivo",
        "tarjeta": "Tarjeta",
        "transferencia": "Transferencia",
    }
    return metodos.get(value, str(value or "Efectivo"))


# ── Endpoints ─────────────────────────────────────────────────────────────────

@ventas_bp.route("/numero-siguiente", methods=["GET"])
def numero_siguiente():
    """Devuelve el id_ticket que tendrá la próxima venta."""
    try:
        conexion = get_connection()
        cursor = conexion.cursor()
        cursor.execute("SELECT COALESCE(MAX(id_ticket), 0) + 1 FROM Ticket")
        row = cursor.fetchone()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "numero": int(row[0])})
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc)}), 500


@ventas_bp.route("/buscar-productos", methods=["GET"])
def buscar_productos():
    """
    Busca productos disponibles para agregar a una venta.
    Parámetro: q (nombre, categoría o id)
    Solo devuelve productos con stock > 0.
    """
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify({"success": True, "productos": []})

    like = f"%{q}%"
    sql = """
        SELECT
            p.id_producto,
            p.producto,
            p.precio_venta,
            p.stock,
            p.stock_min,
            tp.tipo_producto AS categoria,
            un.tipo_unidad   AS unidad
        FROM producto AS p
        INNER JOIN tipo     AS tp ON p.id_tipo    = tp.id_tipo
        INNER JOIN unidades AS un ON p.Id_unidad  = un.id_unidad
        WHERE p.stock > 0
          AND (
              p.producto        LIKE %s
              OR tp.tipo_producto LIKE %s
              OR CAST(p.id_producto AS CHAR) LIKE %s
          )
        ORDER BY p.producto ASC
        LIMIT 20
    """
    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute(sql, (like, like, like))
        rows = cursor.fetchall() or []
        cursor.close()
        conexion.close()

        productos = [
            {
                "id":          int(r["id_producto"]),
                "codigo":      str(r["id_producto"]).zfill(4),
                "nombre":      r["producto"] or "",
                "precioVenta": _decimal_a_float(r["precio_venta"]),
                "stock":       int(r["stock"] or 0),
                "stockMinimo": int(r["stock_min"] or 0),
                "categoria":   r["categoria"] or "",
                "unidad":      r["unidad"] or "pza",
            }
            for r in rows
        ]
        return jsonify({"success": True, "productos": productos})
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc), "productos": []}), 500


@ventas_bp.route("/registrar", methods=["POST"])
def registrar_venta():
    """
    Registra una venta completa.

    Body esperado:
    {
        "id_usuario":  1,
        "metodo":      1,          -- entero: 1=efectivo, 2=tarjeta, 3=transferencia
        "total":       150,
        "productos": [
            { "id_producto": 3, "cantidad": 2, "precio_venta": 25.00 }
        ]
    }

    Flujo:
      1. Valida stock de cada producto.
      2. Inserta el primer producto en Ticket (por restricción de la BD, id_ticket
         va en Producto; se crea el ticket con el primer producto y luego se
         actualizan los demás con ese id_ticket).
      3. Descuenta stock de cada producto.
    """
    data = request.get_json(silent=True) or {}

    id_usuario = data.get("id_usuario")
    metodo     = data.get("metodo", 1)
    total      = data.get("total")
    productos  = data.get("productos", [])

    # ── Validaciones básicas ─────────────────────────────────────────────────
    if not id_usuario:
        return jsonify({"success": False, "mensaje": "id_usuario obligatorio"}), 400
    if total is None:
        return jsonify({"success": False, "mensaje": "total obligatorio"}), 400
    if not productos:
        return jsonify({"success": False, "mensaje": "La venta debe tener al menos un producto"}), 400

    try:
        conexion = get_connection()
        cursor   = conexion.cursor(dictionary=True)

        # ── 1. Validar stock ────────────────────────────────────────────────
        for item in productos:
            cursor.execute(
                "SELECT producto, stock FROM Producto WHERE id_producto = %s",
                (item["id_producto"],)
            )
            prod = cursor.fetchone()
            if not prod:
                cursor.close(); conexion.close()
                return jsonify({
                    "success": False,
                    "mensaje": f'Producto ID {item["id_producto"]} no encontrado'
                }), 404
            if int(prod["stock"]) < int(item["cantidad"]):
                cursor.close(); conexion.close()
                return jsonify({
                    "success": False,
                    "mensaje": (
                        f'Stock insuficiente para "{prod["producto"]}". '
                        f'Disponible: {prod["stock"]}, solicitado: {item["cantidad"]}'
                    )
                }), 409

        # ── 2. Insertar Ticket ──────────────────────────────────────────────
        hoy = date.today().isoformat()
        cursor.execute(
            "INSERT INTO venta (id_metodopago, id_usuario, dia_compra, total) VALUES (%s, %s, %s, %s)",
            (metodo, id_usuario, hoy, int(total))
        )
        id_ticket = cursor.lastrowid

        # ── 3. Vincular productos al ticket y descontar stock ───────────────
        for item in productos:
            # Primero: Insertamos la relación en la tabla intermedia 'Ticket'
            # Usamos los nombres de columnas de tu captura: Producto_id_producto y Venta_id_ticket
            cursor.execute(
                "INSERT INTO Ticket (Producto_id_producto, Venta_id_ticket) VALUES (%s, %s)",
                (item["id_producto"], id_ticket)
            )

            # Segundo: Actualizamos el stock en la tabla 'Producto'
            # Eliminamos el intento de actualizar 'id_ticket' que no existe en esta tabla
            cursor.execute(
                "UPDATE Producto SET stock = stock - %s WHERE id_producto = %s",
                (int(item["cantidad"]), item["id_producto"])
            )

        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({
            "success":   True,
            "mensaje":   "Venta registrada correctamente",
            "id_ticket": id_ticket,
            "numero":    str(id_ticket).zfill(3),
        }), 201

    except Exception as exc:
        # Es vital hacer rollback si algo falla para no dejar datos inconsistentes
        if 'conexion' in locals() and conexion.is_connected():
            conexion.rollback()
            cursor.close()
            conexion.close()
        import traceback; traceback.print_exc()
        return jsonify({"success": False, "mensaje": str(exc)}), 500


@ventas_bp.route("/<int:id_ticket>", methods=["GET"])
def detalle_venta(id_ticket: int):
    """Devuelve el detalle de un ticket con sus productos."""
    try:
        conexion = get_connection()
        cursor   = conexion.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT t.id_ticket, t.dia_compra, t.metodo, t.total, u.usuario
            FROM ticket AS t
            JOIN usuario AS u ON t.id_usuario = u.id_usuario
            WHERE t.id_ticket = %s
            """,
            (id_ticket,)
        )
        ticket = cursor.fetchone()
        if not ticket:
            cursor.close(); conexion.close()
            return jsonify({"success": False, "mensaje": "Venta no encontrada"}), 404

        cursor.execute(
            """
            SELECT p.id_producto, p.producto AS nombre, p.precio_venta
            FROM producto AS p
            WHERE p.id_ticket = %s
            """,
            (id_ticket,)
        )
        productos = cursor.fetchall() or []
        cursor.close()
        conexion.close()

        ticket["dia_compra"] = (
            ticket["dia_compra"].strftime("%d/%m/%Y")
            if ticket["dia_compra"] else ""
        )
        ticket["metodoPago"] = _metodo_texto(ticket.get("metodo"))
        ticket["productos"]  = [
            {**p, "precio_venta": _decimal_a_float(p["precio_venta"])}
            for p in productos
        ]
        return jsonify({"success": True, "venta": ticket})

    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc)}), 500
