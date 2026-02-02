"""
Rutas para gestión de cursos - Flask Blueprint
"""
from flask import Blueprint, jsonify, request
from models.base_datos import BaseDatos

cursos_bp = Blueprint('cursos', __name__, url_prefix='/api/cursos')


@cursos_bp.route('', methods=['GET'])
def obtener_cursos():
    """
    Obtiene la lista completa de cursos disponibles en el sistema.
    Endpoint: GET /api/cursos
    Returns:
        JSON con:
            - exito (bool): Siempre True
            - total (int): Cantidad de cursos disponibles
            - cursos (list): Array de objetos curso con toda su información
    """
    cursos = BaseDatos.obtener_cursos()
    return jsonify({
        'exito': True,
        'total': len(cursos),
        'cursos': [c.to_dict() for c in cursos]
    })


@cursos_bp.route('/<curso_id>', methods=['GET'])
def obtener_curso(curso_id):
    """
    Obtiene los detalles completos de un curso específico.
    Endpoint: GET /api/cursos/{curso_id}
    Args:
        curso_id (str): ID del curso a buscar (ej: 'PROG101', 'MATH101')
    Returns:
        JSON con:
            - exito (bool): True si se encontró el curso
            - curso (dict): Objeto con nombre, código, créditos, prerequisitos, etc.
    """
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
