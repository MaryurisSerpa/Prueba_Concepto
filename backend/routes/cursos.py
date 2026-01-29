"""
Rutas para gestión de cursos - Flask Blueprint
"""
from flask import Blueprint, jsonify, request
from models.base_datos import BaseDatos

cursos_bp = Blueprint('cursos', __name__, url_prefix='/api/cursos')


@cursos_bp.route('', methods=['GET'])
def obtener_cursos():
    """Obtiene la lista de todos los cursos disponibles"""
    cursos = BaseDatos.obtener_cursos()
    return jsonify({
        'exito': True,
        'total': len(cursos),
        'cursos': [c.to_dict() for c in cursos]
    })


@cursos_bp.route('/<curso_id>', methods=['GET'])
def obtener_curso(curso_id):
    """Obtiene un curso específico por su ID"""
    curso = BaseDatos.obtener_curso(curso_id)
    
    if not curso:
        return jsonify({
            'exito': False,
            'error': 'Curso no encontrado'
        }), 404
    
    return jsonify({
        'exito': True,
        'curso': curso.to_dict()
    })
