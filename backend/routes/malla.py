"""
Rutas para gestión de malla académica - Flask Blueprint
"""
from flask import Blueprint, jsonify, request
from models.base_datos import BaseDatos
import requests

malla_bp = Blueprint('malla', __name__, url_prefix='/api/mallas')


@malla_bp.route('/<malla_id>', methods=['GET'])
def obtener_malla(malla_id):
    """Obtiene una malla académica específica"""
    malla = BaseDatos.obtener_malla(malla_id)
    
    if not malla:
        return jsonify({
            'exito': False,
            'error': 'Malla no encontrada'
        }), 404
    
    return jsonify({
        'exito': True,
        'malla': malla.to_dict()
    })


@malla_bp.route('/<malla_id>/cursos', methods=['POST'])
def agregar_curso_malla(malla_id):
    """
    Agrega un curso a la malla en una posición específica
    Nivel 1: Drag & drop simple
    """
    data = request.json
    
    try:
        curso_id = data.get('curso_id')
        posicion_x = int(data.get('posicion_x', 0))
        posicion_y = int(data.get('posicion_y', 0))
        semestre = int(data.get('semestre', 1))
    except (ValueError, TypeError):
        return jsonify({
            'exito': False,
            'error': 'Datos inválidos'
        }), 400
    
    nuevo_curso, error = BaseDatos.agregar_curso_malla(
        malla_id, curso_id, posicion_x, posicion_y, semestre
    )
    
    if error:
        return jsonify({
            'exito': False,
            'error': error
        }), 404
    
    return jsonify({
        'exito': True,
        'mensaje': 'Curso agregado a la malla',
        'curso': nuevo_curso.to_dict()
    }), 201


@malla_bp.route('/<malla_id>/cursos-con-prerequisitos', methods=['POST'])
def agregar_curso_con_prerequisitos(malla_id):
    """
    Agrega un curso a la malla junto con sus prerequisitos automáticamente
    Nivel 2: Utiliza FastAPI microservicio para análisis de prerequisitos
    """
    data = request.json
    
    try:
        curso_id = data.get('curso_id')
        posicion_x = int(data.get('posicion_x', 0))
        posicion_y = int(data.get('posicion_y', 0))
        semestre = int(data.get('semestre', 1))
    except (ValueError, TypeError):
        return jsonify({
            'exito': False,
            'error': 'Datos inválidos'
        }), 400
    
    # Llamar al microservicio FastAPI para análisis de prerequisitos
    try:
        response = requests.post(
            'http://localhost:8001/analizar-prerequisitos',
            json={
                'curso_id': curso_id,
                'malla_id': malla_id,
                'posicion_x': posicion_x,
                'posicion_y': posicion_y,
                'semestre': semestre
            },
            timeout=5
        )
        
        if response.status_code != 200:
            return jsonify({
                'exito': False,
                'error': 'Error en el microservicio de análisis'
            }), 503
        
        resultado = response.json()
        
        # Agregar el curso principal
        nuevo_curso, error = BaseDatos.agregar_curso_malla(
            malla_id, curso_id, posicion_x, posicion_y, semestre
        )
        
        if error:
            return jsonify({
                'exito': False,
                'error': error
            }), 404
        
        # Agregar prerequisitos
        prerequisitos_agregados = []
        for prereq in resultado.get('prerequisitos', []):
            prereq_curso, _ = BaseDatos.agregar_curso_malla(
                malla_id,
                prereq['id'],
                posicion_x - 150,
                posicion_y + (len(prerequisitos_agregados) * 60),
                max(1, semestre - 1)
            )
            if prereq_curso:
                prerequisitos_agregados.append(prereq_curso.to_dict())
        
        return jsonify({
            'exito': True,
            'mensaje': 'Curso y sus prerequisitos agregados',
            'curso_principal': nuevo_curso.to_dict(),
            'prerequisitos_agregados': prerequisitos_agregados,
            'analisis': resultado
        }), 201
    
    except requests.exceptions.RequestException as e:
        return jsonify({
            'exito': False,
            'error': f'Error conectando con microservicio: {str(e)}'
        }), 503


@malla_bp.route('/<malla_id>/cursos/<curso_malla_id>', methods=['PUT'])
def actualizar_posicion_curso(malla_id, curso_malla_id):
    """Actualiza la posición de un curso en la malla (después del drag)"""
    data = request.json
    
    try:
        posicion_x = int(data.get('posicion_x', 0))
        posicion_y = int(data.get('posicion_y', 0))
    except (ValueError, TypeError):
        return jsonify({
            'exito': False,
            'error': 'Datos inválidos'
        }), 400
    
    curso, error = BaseDatos.actualizar_posicion_curso(
        malla_id, curso_malla_id, posicion_x, posicion_y
    )
    
    if error:
        return jsonify({
            'exito': False,
            'error': error
        }), 404
    
    return jsonify({
        'exito': True,
        'mensaje': 'Posición actualizada',
        'curso': curso.to_dict()
    })


@malla_bp.route('/<malla_id>/cursos/<curso_malla_id>', methods=['DELETE'])
def eliminar_curso_malla(malla_id, curso_malla_id):
    """Elimina un curso de la malla"""
    exito, error = BaseDatos.eliminar_curso_malla(malla_id, curso_malla_id)
    
    if not exito:
        return jsonify({
            'exito': False,
            'error': error
        }), 404
    
    return jsonify({
        'exito': True,
        'mensaje': 'Curso eliminado de la malla'
    })
