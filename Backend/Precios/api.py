"""API REST del módulo Consultar Precios (lista de productos con precios y stock)."""

import unicodedata
from flask import Blueprint, jsonify, request

from bd import get_connection

precios_bp = Blueprint("precios", __name__, url_prefix="/api/precios")


def _sin_acentos(s: str) -> str:
    if not s:
        return ""
    norm = unicodedata.normalize("NFKD", s)
    return "".join(c for c in norm if not unicodedata.combining(c))


def tipo_a_categoria_slug(tipo_producto: str | None) -> str:
    """
    Mapea tipo_producto (BD) a los valores del <select> en Precios.html:
    abarrotes, lacteos, bebidas, limpieza, carnes, panaderia, frutas, otros.
    """
    t = _sin_acentos((tipo_producto or "").lower().strip())
    if not t:
        return "otros"
    if "abarrot" in t:
        return "abarrotes"
    if "lact" in t or "lacteo" in t or "leche" in t or "queso" in t:
        return "lacteos"
    if "bebida" in t or "refresco" in t or "jugo" in t:
        return "bebidas"
    if "limpiez" in t or "limpieza" in t:
        return "limpieza"
    if "carn" in t or "embut" in t:
        return "carnes"
    if "pan" in t or "pastel" in t or "panader" in t:
        return "panaderia"
    if "frut" in t or "verdur" in t or "hortaliz" in t:
        return "frutas"
    if t in (
        "abarrotes",
        "lacteos",
        "bebidas",
        "limpieza",
        "carnes",
        "panaderia",
        "frutas",
        "otros",
    ):
        return t
    return "otros"


def _row_to_producto(row: dict) -> dict:
    """Convierte fila BD al objeto que espera Frontend/Precios/Precios.js."""
    tipo_nombre = row.get("tipo_producto") or row.get("TIPO_PRODUCTO") or ""
    precio_compra = float(row.get("precio_compra") or row.get("PRECIO_COMPRA") or 0)
    precio_venta = float(row.get("precio_venta") or row.get("PRECIO_VENTA") or 0)
    id_prod = row.get("id_producto") or row.get("ID_PRODUCTO")

    codigo_val = row.get("codigo") if row.get("codigo") is not None else str(id_prod) if id_prod is not None else ""

    unidad_val = row.get("tipo_unidad") or row.get("TIPO_UNIDAD") or "pza"

    return {
        "id": int(id_prod) if id_prod is not None else None,
        "codigo": codigo_val,
        "nombre": row.get("producto") or row.get("PRODUCTO") or "",
        "categoria": tipo_a_categoria_slug(str(tipo_nombre)),
        "precioCompra": precio_compra,
        "precioVenta": precio_venta,
        "stock": int(row.get("stock") or row.get("STOCK") or 0),
        "stockMinimo": int(row.get("stock_min") or row.get("STOCK_MIN") or 0),
        "stockMaximo": int(row.get("stock_max") or row.get("STOCK_MAX") or 0),
        "unidadMedida": str(unidad_val).strip() or "pza",
        "descripcion": "",
        "proveedor": (row.get("nombre_proveedor") or row.get("NOMBRE_PROVEEDOR") or ""),
    }


@precios_bp.route("/productos", methods=["GET"])
def listar_productos_precios():
    """
    Lista productos con precios para el módulo Precios.

    Opcional:
      - q: texto (nombre, id, tipo)
      - categoria: mismo valor que el filtro del front (ej. lacteos, abarrotes)
    """
    q_raw = request.args.get("q", "").strip().lower()
    cat_raw = request.args.get("categoria", "").strip().lower()

    sql = """
        SELECT
            p.id_producto,
            CAST(p.id_producto AS CHAR) AS codigo,
            p.producto,
            p.precio_compra,
            p.precio_venta,
            p.stock,
            p.stock_min,
            p.stock_max,
            tp.tipo_producto,
            COALESCE(pv.nombre_proveedor, '') AS nombre_proveedor,
            COALESCE(un.tipo_unidad, 'pza') AS tipo_unidad
        FROM producto AS p
        INNER JOIN tipo AS tp ON p.id_tipo = tp.id_tipo
        LEFT JOIN proveedor AS pv ON p.id_proveedor = pv.id_proveedor
        INNER JOIN unidades AS un ON p.`Id_unidad` = un.id_unidad
        ORDER BY p.id_producto ASC
    """

    conexion = None
    cursor = None
    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute(sql)
        rows = cursor.fetchall() or []
    except Exception as e:
        return (
            jsonify({"success": False, "mensaje": str(e), "productos": []}),
            500,
        )
    finally:
        if cursor:
            cursor.close()
        if conexion:
            conexion.close()

    productos = [_row_to_producto(r) for r in rows]

    if q_raw:
        filtrados = []
        q_norm = _sin_acentos(q_raw)
        for prod in productos:
            pn = (_sin_acentos(prod["nombre"]) + " " + _sin_acentos(prod.get("codigo", ""))).lower()
            cat = prod.get("categoria", "")
            prv = _sin_acentos((prod.get("proveedor") or "")).lower()
            if (
                q_norm in pn
                or q_norm in _sin_acentos(prod.get("codigo", "")).lower()
                or q_norm in prv
                or q_norm in cat
            ):
                filtrados.append(prod)
        productos = filtrados

    if cat_raw:
        productos = [p for p in productos if (p.get("categoria") or "").lower() == cat_raw]

    return jsonify({"success": True, "productos": productos})
