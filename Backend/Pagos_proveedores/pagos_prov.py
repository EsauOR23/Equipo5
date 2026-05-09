"""API REST para el modulo de pagos a proveedores."""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal
from typing import Any

from flask import Blueprint, jsonify, request

from bd import get_connection

pagos_proveedores_bp = Blueprint(
    "pagos_proveedores", __name__, url_prefix="/api/pagos-proveedores"
)


def _decimal_a_float(value: Any) -> float:
    if isinstance(value, Decimal):
        return float(value)
    return float(value or 0)


def _fecha_iso(value: Any) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, date):
        return value.isoformat()
    return str(value or "")


def _hora_iso(value: Any) -> str:
    if isinstance(value, datetime):
        return value.strftime("%H:%M:%S")
    if isinstance(value, time):
        return value.strftime("%H:%M:%S")
    return str(value or "")


def _normalizar_estado(saldo: float) -> str:
    if saldo <= 0:
        return "al-dia"
    return "pendiente"


def _consulta_proveedores() -> str:
    return """
        SELECT
            p.id_proveedor,
            COALESCE(p.nombre_proveedor, p.nombre_empresa, CONCAT('Proveedor ', p.id_proveedor)) AS nombre,
            COALESCE(CAST(p.contacto AS CHAR), '') AS contacto,
            COALESCE(p.descripcion, '') AS descripcion,
            COALESCE(SUM(
                CASE
                    WHEN pp.id_estadopago IN ('pendiente', 'vencido') THEN pp.monto
                    ELSE 0
                END
            ), 0) AS saldo_pendiente_
        FROM proveedor AS p
        LEFT JOIN pagos AS pp ON pp.id_proveedor = p.id_proveedor
        GROUP BY p.id_proveedor, p.nombre_proveedor, p.nombre_empresa, p.contacto, p.descripcion, pp.id_estadopago
        ORDER BY nombre ASC
    """


def _consulta_pagos() -> str:
    return """
        SELECT
            id_pago,
            id_estadopago,
            id_metodopago,
            id_usuario,
            id_proveedor,
            monto,
            dia,
            hora
        FROM pagos
        ORDER BY dia DESC, hora DESC, id_pago DESC
    """


def _fila_proveedor_a_dict(row: dict[str, Any]) -> dict[str, Any]:
    saldo = _decimal_a_float(row.get("saldo_pendiente"))
    estado = row.get("id_estadopago")
    if not estado:
        estado = _normalizar_estado(saldo)
    return {
        "id": int(row.get("id_proveedor")),
        "nombre": row.get("nombre") or "Proveedor sin nombre",
        "contacto": row.get("contacto") or "Sin contacto",
        "productos": row.get("descripcion") or "Sin descripcion",
        "saldoPendiente": saldo,
        "id_estadopago": estado,
    }


def _fila_pago_a_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": int(row.get("id_pago")),
        "proveedor": row.get("proveedor"),
        "fecha": _fecha_iso(row.get("dia")),
        "hora": _hora_iso(row.get("hora")),
        "monto": _decimal_a_float(row.get("monto")),
        # Ahora usamos el nombre que viene del JOIN
        "metodo": row.get("nombre_metodo") or "No especificado", 
        "id_estadopago": str(row.get("id_estadopago")),
        "origen": "mysql"
    }


def _filtros_pagos_desde_request(pagos: list[dict[str, Any]]) -> list[dict[str, Any]]:
    proveedor = (request.args.get("proveedor") or "").strip().lower()
    mes = (request.args.get("mes") or "").strip()
    estado = (request.args.get("id_estadopago") or "").strip().lower()

    filtrados = list(pagos)
    if proveedor:
        filtrados = [
            pago
            for pago in filtrados
            if proveedor in (pago.get("proveedor") or "").lower()
        ]
    if mes:
        filtrados = [
            pago
            for pago in filtrados
            if str(pago.get("fecha") or "")[5:7] == mes
        ]
    if estado:
        filtrados = [
            pago for pago in filtrados if (pago.get("estado") or "").lower() == estado
        ]
    return filtrados


def _obtener_datos_mysql() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    conexion = None
    cursor = None
    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute(_consulta_proveedores())
        proveedores_rows = cursor.fetchall() or []

        cursor.execute(
            """
            SELECT 
                pg.id_pago,
                pg.id_proveedor,
                pg.monto,
                pg.id_metodopago,
                mp.metodopago AS nombre_metodo,  -- Aquí traemos el nombre real
                pg.id_estadopago,
                pg.dia,
                pg.hora,
                COALESCE(pr.nombre_proveedor, pr.nombre_empresa) AS proveedor
            FROM pagos AS pg
            INNER JOIN proveedor AS pr ON pr.id_proveedor = pg.id_proveedor
            LEFT JOIN metodopago AS mp ON pg.id_metodopago = mp.id_metodopago -- Hacemos el JOIN
            ORDER BY pg.dia DESC, pg.hora DESC
            """
        )
        pagos_rows = cursor.fetchall() or []

        proveedores = [_fila_proveedor_a_dict(row) for row in proveedores_rows]
        pagos = [_fila_pago_a_dict(row) for row in pagos_rows]
        return proveedores, pagos
    finally:
        if cursor:
            cursor.close()
        if conexion:
            conexion.close()


def _validar_payload_pago(data: dict[str, Any]) -> tuple[bool, str]:
    proveedor_id = data.get("proveedorId")
    monto = data.get("monto")
    # Cambiamos 'metodo' por 'id_metodopago' para ser consistentes con el JSON
    id_metodo = data.get("id_metodopago")
    fecha = data.get("fecha")

    if not proveedor_id:
        return False, "Proveedor obligatorio"
    if monto in (None, ""):
        return False, "Monto obligatorio"
    if not id_metodo: # Si llega vacío o None
        return False, "Metodo de pago obligatorio"
    
    # ... resto de tus validaciones de monto y fecha ...
    return True, ""


@pagos_proveedores_bp.route("/proveedores", methods=["GET"])
def listar_proveedores():
    try:
        proveedores, _ = _obtener_datos_mysql()
        return jsonify({"success": True, "proveedores": proveedores, "origen": "mysql"})
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc), "proveedores": []}), 500


@pagos_proveedores_bp.route("/pagos", methods=["GET"])
def listar_pagos():
    try:
        proveedores, pagos = _obtener_datos_mysql()
        pagos_filtrados = _filtros_pagos_desde_request(pagos)
        return jsonify(
            {
                "success": True,
                "pagos": pagos_filtrados,
                "proveedores": proveedores,
                "origen": "mysql",
            }
        )
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc), "pagos": [], "proveedores": []}), 500


@pagos_proveedores_bp.route("/pagos", methods=["POST"])
def registrar_pago():
    data = request.get_json(silent=True) or {}
    valido, mensaje = _validar_payload_pago(data)
    if not valido:
        return jsonify({"success": False, "mensaje": mensaje}), 400

    proveedor_id = int(data["proveedorId"])
    monto = round(float(data["monto"]), 2)
    metodo = str(data["id_metodopago"]).strip().lower()
    fecha = str(data["fecha"])
    descripcion = str(data.get("descripcion") or "").strip()
    estado = str(data.get("id_estadopago") or "pagado").strip().lower()
    hora = str(data.get("hora") or datetime.now().strftime("%H:%M:%S"))

    try:
        proveedores, _ = _obtener_datos_mysql()
        proveedor = next((item for item in proveedores if int(item["id"]) == proveedor_id), None)
        if not proveedor:
            return jsonify({"success": False, "mensaje": "Proveedor no encontrado"}), 404

        conexion = None
        cursor = None
        try:
            conexion = get_connection()
            cursor = conexion.cursor(dictionary=True)
            cursor.execute(
                """
                INSERT INTO pagos (
                    id_estadopago,
                    id_metodopago,
                    id_usuario,
                    id_proveedor,
                    monto,
                    dia,
                    hora
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    2 if estado == "pagado" else 1,    # id_estadopago (INT)
                    int(metodo),        # id_metodopago (INT) - viene del select
                    int(1),                  # id_usuario (INT) - ID del usuario logueado
                    int(proveedor_id),       # id_proveedor (INT)
                    monto,              # monto (DECIMAL)
                    fecha,              # dia (DATE)
                    hora              # hora (TIME)
                ),
            )
            conexion.commit()
            nuevo_id = cursor.lastrowid
        finally:
            if cursor:
                cursor.close()
            if conexion:
                conexion.close()

        pago = {
            "id": int(nuevo_id),
            "proveedorId": proveedor_id,
            "proveedor": proveedor["nombre"],
            "fecha": fecha,
            "hora": hora,
            "monto": monto,
            "id_metodopago": metodo,
            "id_estadopago": estado,
            "descripcion": descripcion,
            "origen": "mysql",
        }
        return jsonify({"success": True, "mensaje": "Pago registrado", "pago": pago}), 201
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc)}), 500


@pagos_proveedores_bp.route("/pagos/<int:pago_id>/marcar-pagado", methods=["PATCH"])
def marcar_como_pagado(pago_id: int):
    hora_actual = datetime.now().strftime("%H:%M:%S")

    try:
        proveedores, _ = _obtener_datos_mysql()
        conexion = None
        cursor = None
        try:
            conexion = get_connection()
            cursor = conexion.cursor(dictionary=True)
            cursor.execute(
                """
                UPDATE pagos
                SET id_estadopago = 'pagado', hora = %s
                WHERE id_pago = %s
                """,
                (hora_actual, pago_id),
            )
            conexion.commit()
            if cursor.rowcount == 0:
                return jsonify({"success": False, "mensaje": "Pago no encontrado"}), 404
            cursor.execute(
                """
                SELECT
                    pg.id_pago,
                    pg.id_estadopago,
                    pg.id_metodopago,
                    pg.id_usuario,
                    pg.id_proveedor,
                    pg.monto,
                    pg.dia,
                    pg.hora,
                    COALESCE(pr.nombre_proveedor, pr.nombre_empresa, CONCAT('Proveedor ', pg.id_proveedor)) AS proveedor
                FROM pagos AS pg
                INNER JOIN proveedor AS pr ON pr.id_proveedor = pg.id_proveedor
                ORDER BY pg.dia DESC, pg.hora DESC, pg.id_pago DESC
                """
            )
            pagos = [_fila_pago_a_dict(row) for row in (cursor.fetchall() or [])]
            pago = next((item for item in pagos if item["id"] == pago_id), None)
        finally:
            if cursor:
                cursor.close()
            if conexion:
                conexion.close()

        return jsonify(
            {
                "success": True,
                "mensaje": "Pago marcado como pagado",
                "pago": pago,
                "proveedores": proveedores,
            }
        )
    except Exception as exc:
        return jsonify({"success": False, "mensaje": str(exc)}), 500
