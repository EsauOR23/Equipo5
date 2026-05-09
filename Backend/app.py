from flask import Flask
from routes.usuarios import usuarios_bp
from precios.api import precios_bp
from Pagos_proveedores.pagos_prov import pagos_proveedores_bp
from Reportes.api import reportes_bp
from Inventario.api import inventario_bp 
from Ventas.api import ventas_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5500", "http://127.0.0.1:5500"])

# Blueprints
app.register_blueprint(usuarios_bp)
app.register_blueprint(precios_bp)
app.register_blueprint(pagos_proveedores_bp)
app.register_blueprint(reportes_bp)
app.register_blueprint(inventario_bp)
app.register_blueprint(ventas_bp)

if __name__ == "__main__":
    app.run(debug=True)
