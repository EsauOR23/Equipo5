from flask import Blueprint, request, jsonify
from bd import get_connection

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    usuario = data.get("usuario")
    contrasena = data.get("contrasena")

    conexion = get_connection()
    cursor = conexion.cursor(dictionary=True)

    query = "SELECT * FROM usuario WHERE usuario=%s AND contrasena=%s"
    cursor.execute(query, (usuario, contrasena))
    resultado = cursor.fetchone()

    cursor.close()
    conexion.close()

    if resultado:
        return jsonify({
            "success":    True,
            "usuario":    resultado["usuario"],
            "rol":        resultado["rol"],
            "id_usuario": resultado["id_usuario"]
        })
    else:
        return jsonify({"success": False, "mensaje": "Usuario o contraseña incorrectos"})
