"""
Aplicación principal Flask
"""
from flask import Flask, jsonify
from flask_cors import CORS
from routes.cursos import cursos_bp
from routes.malla import malla_bp

app = Flask(__name__)
CORS(app)

# Registrar blueprints
app.register_blueprint(cursos_bp)
app.register_blueprint(malla_bp)


@app.route('/')
def index():
    """
    Endpoint raíz del API - Información del servicio.
    Muestra mensaje de bienvenida y lista de endpoints disponibles.
    Útil para verificar que el servidor está activo.
    Endpoint: GET /
    
    """
    return jsonify({
        'mensaje': 'Bienvenido a Malla Académica Backend (Flask)',
        'version': '1.0.0',
        'endpoints': {
            'cursos': '/api/cursos',
            'mallas': '/api/mallas/{malla_id}',
            'health': '/health'
        }
    })


@app.route('/health')
def health():
    """
    Health check - Verifica que el servidor Flask está funcionando.
    
    Usado por monitoring, balanceadores de carga o para debugging.
    Responde rápidamente sin realizar operaciones costosas.
    Endpoint: GET /health
    """
    return jsonify({
        'status': 'healthy',
        'service': 'malla-academica-backend'
    })


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'exito': False,
        'error': 'Endpoint no encontrado'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'exito': False,
        'error': 'Error interno del servidor'
    }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
