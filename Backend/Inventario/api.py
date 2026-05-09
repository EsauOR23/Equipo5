from flask_cors import CORS
from bd import get_connection
from flask import Blueprint, request, jsonify

inventario_bp = Blueprint('inventario', __name__)

@inventario_bp.route('/api/tipos', methods=['GET'])
def get_tipos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_tipo as id, tipo_producto as nombre FROM Tipo")
    res = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "data": res})

@inventario_bp.route('/api/proveedores', methods=['GET'])
def get_proveedores():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_proveedor as id, nombre_empresa as nombre FROM Proveedor")
    res = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "data": res})

@inventario_bp.route('/api/unidades', methods=['GET'])
def get_unidades():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_unidad as id, tipo_unidad as nombre FROM Unidades")
    res = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "data": res})

# --- CRUD DEL INVENTARIO ---

@inventario_bp.route('/api/inventario', methods=['GET'])
def get_inventario():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    # Generamos el código al vuelo y renombramos columnas para el JS
    query = """
        SELECT p.id_producto as id, 
               CONCAT('PROD-', LPAD(p.id_producto, 5, '0')) as codigo,
               p.producto as nombre, 
               p.precio_compra as precioCompra, 
               p.precio_venta as precioVenta, 
               p.stock, p.stock_min as stockMinimo, p.stock_max as stockMaximo,
               p.id_tipo, p.id_proveedor, p.Id_unidad as id_unidad,
               t.tipo_producto as categoria, 
               u.tipo_unidad as unidadMedida
        FROM Producto p
        LEFT JOIN Tipo t ON p.id_tipo = t.id_tipo
        LEFT JOIN Unidades u ON p.Id_unidad = u.id_unidad
    """
    cursor.execute(query)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "data": data})

@inventario_bp.route('/api/inventario', methods=['POST'])
def add_producto():
    d = request.json
    conn = get_connection()
    cursor = conn.cursor()
    sql = """INSERT INTO Producto 
             (id_proveedor, Id_unidad, id_tipo, producto, precio_compra, precio_venta, stock, stock_min, stock_max) 
             VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
    params = (d['id_proveedor'], d['id_unidad'], d['id_tipo'], d['nombre'], 
              d['precioCompra'], d['precioVenta'], d['stock'], d['stockMinimo'], d['stockMaximo'])
    cursor.execute(sql, params)
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@inventario_bp.route('/api/inventario/<int:id>', methods=['PUT'])
def update_producto(id):
    d = request.json
    conn = get_connection()
    cursor = conn.cursor()
    sql = """UPDATE Producto SET 
             id_proveedor=%s, Id_unidad=%s, id_tipo=%s, producto=%s, 
             precio_compra=%s, precio_venta=%s, stock=%s, stock_min=%s, stock_max=%s 
             WHERE id_producto=%s"""
    params = (d['id_proveedor'], d['id_unidad'], d['id_tipo'], d['nombre'], 
              d['precioCompra'], d['precioVenta'], d['stock'], d['stockMinimo'], d['stockMaximo'], id)
    cursor.execute(sql, params)
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@inventario_bp.route('/api/inventario/<int:id>', methods=['DELETE'])
def delete_producto(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Producto WHERE id_producto = %s", (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

# --- ACTUALIZACIÓN RÁPIDA DE STOCK (PATCH) ---

@inventario_bp.route('/api/inventario/<int:id>/stock', methods=['PATCH'])
def patch_stock(id):
    nuevo_stock = request.json.get('stock')
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Producto SET stock = %s WHERE id_producto = %s", (nuevo_stock, id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

# --- BÚSQUEDA Y FILTROS ---

@inventario_bp.route('/api/inventario/buscar', methods=['GET'])
def buscar_productos():
    q = request.args.get('q', '')
    id_tipo = request.args.get('id_tipo', '')
    stock_filtro = request.args.get('stock', '')
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT p.id_producto as id, 
               CONCAT('PROD-', LPAD(p.id_producto, 5, '0')) as codigo,
               p.producto as nombre, p.precio_compra as precioCompra, 
               p.precio_venta as precioVenta, p.stock, p.stock_min as stockMinimo,
               p.stock_max as stockMaximo, t.tipo_producto as categoria, 
               u.tipo_unidad as unidadMedida
        FROM Producto p
        LEFT JOIN Tipo t ON p.id_tipo = t.id_tipo
        LEFT JOIN Unidades u ON p.Id_unidad = u.id_unidad
        WHERE (p.producto LIKE %s OR t.tipo_producto LIKE %s)
    """
    params = [f'%{q}%', f'%{q}%']
    
    if id_tipo:
        query += " AND p.id_tipo = %s"
        params.append(id_tipo)
        
    if stock_filtro == 'bajo':
        query += " AND p.stock <= p.stock_min AND p.stock > 0"
    elif stock_filtro == 'agotado':
        query += " AND p.stock = 0"
    elif stock_filtro == 'normal':
        query += " AND p.stock > p.stock_min"

    cursor.execute(query, params)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "data": data})