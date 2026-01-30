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
    Agrega un curso a la malla junto con sus prerequisitos RECURSIVAMENTE
    Nivel 2: Utiliza FastAPI microservicio para análisis recursivo de prerequisitos
    Ajusta automáticamente el nivel si no es válido
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
    
    # Llamar al microservicio FastAPI para análisis recursivo de prerequisitos
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
        analisis = resultado.get('analisis_complejidad', {})
        
        # Ajustar automáticamente el nivel si no es válido
        nivel_original = semestre
        if not analisis.get('nivel_valido', True):
            semestre = analisis.get('nivel_minimo_permitido', semestre)
        
        # Agregar el curso principal en el nivel correcto
        nuevo_curso, error = BaseDatos.agregar_curso_malla(
            malla_id, curso_id, posicion_x, posicion_y, semestre
        )
        
        if error:
            return jsonify({
                'exito': False,
                'error': error
            }), 404
        
        # Agregar prerequisitos recursivamente ordenados por profundidad
        prerequisitos_agregados = []
        prerequisitos = resultado.get('prerequisitos', [])
        
        # Ordenar por profundidad (mayor a menor) para agregar desde la raíz del árbol
        prerequisitos_ordenados = sorted(prerequisitos, key=lambda x: x.get('profundidad', 0), reverse=True)
        
        for prereq in prerequisitos_ordenados:
            if not prereq.get('presente_en_malla', False):
                # Calcular nivel según profundidad
                nivel_prereq = semestre - prereq.get('profundidad', 1)
                nivel_prereq = max(1, nivel_prereq)  # No puede ser menor que 1
                
                prereq_curso, _ = BaseDatos.agregar_curso_malla(
                    malla_id,
                    prereq['id'],
                    posicion_x - 150,
                    posicion_y + (len(prerequisitos_agregados) * 60),
                    nivel_prereq
                )
                if prereq_curso:
                    prerequisitos_agregados.append(prereq_curso.to_dict())
        
        mensaje = f'Curso agregado con {len(prerequisitos_agregados)} prerequisito(s) en el árbol completo'
        if nivel_original != semestre:
            mensaje = f'Curso ajustado al nivel {semestre} (mínimo requerido) con {len(prerequisitos_agregados)} prerequisito(s)'
        
        return jsonify({
            'exito': True,
            'mensaje': mensaje,
            'curso_principal': nuevo_curso.to_dict(),
            'prerequisitos_agregados': prerequisitos_agregados,
            'analisis': resultado,
            'info_niveles': {
                'nivel_minimo': analisis.get('nivel_minimo_permitido'),
                'nivel_solicitado': nivel_original,
                'nivel_usado': semestre,
                'ajustado': nivel_original != semestre,
                'profundidad_arbol': analisis.get('profundidad_maxima')
            }
        }), 201
    
    except requests.exceptions.RequestException as e:
        return jsonify({
            'exito': False,
            'error': f'Error conectando con microservicio: {str(e)}'
        }), 503


@malla_bp.route('/<malla_id>/cursos/<curso_malla_id>', methods=['PUT'])
def actualizar_posicion_curso(malla_id, curso_malla_id):
    """Actualiza la posición y/o semestre de un curso en la malla"""
    data = request.json
    
    try:
        posicion_x = int(data.get('posicion_x', 0))
        posicion_y = int(data.get('posicion_y', 0))
        semestre = int(data.get('semestre')) if 'semestre' in data else None
    except (ValueError, TypeError):
        return jsonify({
            'exito': False,
            'error': 'Datos inválidos'
        }), 400
    
    curso, error = BaseDatos.actualizar_posicion_curso(
        malla_id, curso_malla_id, posicion_x, posicion_y, semestre
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
