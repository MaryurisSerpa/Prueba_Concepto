"""
Rutas para gestión de malla académica - Flask Blueprint
Backend independiente con lógica de prerequisitos integrada
"""
from flask import Blueprint, jsonify, request
from models.base_datos import BaseDatos

malla_bp = Blueprint('malla', __name__, url_prefix='/api/mallas')


# ==================== FUNCIONES AUXILIARES ====================

def obtener_prerequisitos_recursivos(curso_id: str, visitados: set = None):
    """
    Obtiene todos los prerequisitos de un curso de manera recursiva.
    
    Esta función analiza un curso y encuentra todos los cursos que son prerequisito,
    incluyendo los prerequisitos de los prerequisitos (análisis en cadena).
   
    Returns:
        list: Lista de diccionarios con información de prerequisitos, cada uno con:
            - id: ID del prerequisito
            - nombre: Nombre del curso prerequisito
            - codigo: Código del curso
            - creditos: Créditos del curso
            - dificultad: Nivel de dificultad
            - horas: Horas semanales
            - profundidad: Nivel de dependencia (1 = directo, 2+ = indirecto)
    """
    if visitados is None:
        visitados = set()
    
    if curso_id in visitados:
        return []
    
    visitados.add(curso_id)
    prerequisitos_completos = []
    
    curso = BaseDatos.obtener_curso(curso_id)
    if not curso:
        return []
    
    for prereq_id in curso.prerequisitos:
        prereq_curso = BaseDatos.obtener_curso(prereq_id)
        if prereq_curso:
            prerequisitos_completos.append({
                "id": prereq_id,
                "nombre": prereq_curso.nombre,
                "codigo": prereq_curso.codigo,
                "creditos": prereq_curso.creditos,
                "dificultad": prereq_curso.dificultad,
                "horas": prereq_curso.horas,
                "profundidad": 1
            })
            
            sub_prerequisitos = obtener_prerequisitos_recursivos(prereq_id, visitados)
            for sub_prereq in sub_prerequisitos:
                sub_prereq["profundidad"] += 1
                existe = False
                for p in prerequisitos_completos:
                    if p["id"] == sub_prereq["id"]:
                        p["profundidad"] = max(p["profundidad"], sub_prereq["profundidad"])
                        existe = True
                        break
                if not existe:
                    prerequisitos_completos.append(sub_prereq)
    
    return prerequisitos_completos

def calcular_nivel_minimo(curso_id: str) -> int:
    """
    Calcula el nivel (semestre) mínimo en el que puede ubicarse un curso.
    
    El cálculo se basa en la profundidad máxima de los prerequisitos.
    Si un curso tiene prerequisitos en cadena, debe ubicarse después de todos ellos.
    
    Args:
        curso_id (str): ID del curso a evaluar
    
    Returns:
        int: Nivel mínimo sugerido (1 si no tiene prerequisitos, 2+ según cadena)
    
    """
    prerequisitos = obtener_prerequisitos_recursivos(curso_id)
    if not prerequisitos:
        return 1
    
    max_profundidad = max(p["profundidad"] for p in prerequisitos)
    return max_profundidad + 1

# ==================== RUTAS ====================


@malla_bp.route('/<malla_id>', methods=['GET'])
def obtener_malla(malla_id):
    """
    Obtiene una malla académica completa por su ID.
    
    Endpoint: GET /api/mallas/{malla_id}
    
    Args:
        malla_id (str): ID de la malla a obtener (ej: 'MALLA001')
    
    Returns:
        JSON con:
            - exito (bool): True si se encontró la malla
            - malla (dict): Objeto malla con cursos, créditos, niveles, etc.
        
        Status: 200 OK | 404 Not Found
    
    """
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


@malla_bp.route('/<malla_id>', methods=['PUT'])
def actualizar_malla(malla_id):
    """
    Actualiza los datos de la malla (nombre, créditos, etc)
    Guarda en estado borrador sin validaciones avanzadas
    """
    malla = BaseDatos.obtener_malla(malla_id)
    
    if not malla:
        return jsonify({
            'exito': False,
            'error': 'Malla no encontrada'
        }), 404
    
    data = request.json
    
    # Actualizar campos si están presentes (sin validaciones estrictas)
    if 'nombre' in data:
        malla.nombre = data['nombre']
    if 'periodo_vigencia' in data:
        malla.periodo_vigencia = data['periodo_vigencia']
    if 'creditos_programa' in data:
        malla.creditos_programa = data['creditos_programa']
    if 'numero_niveles' in data:
        malla.numero_niveles = data['numero_niveles']
    if 'estado' in data:
        # Guardar estado (borrador/publicado)
        # En borrador NO se aplican validaciones avanzadas
        malla.estado = data.get('estado', 'borrador')
    
    # Si viene con cursos, los cursos ya se guardan individualmente al arrastrarlos
    # Esto solo actualiza los metadatos de la malla
    
    return jsonify({
        'exito': True,
        'mensaje': 'Malla guardada como borrador exitosamente',
        'estado': data.get('estado', 'borrador'),
        'malla': malla.to_dict()
    })


@malla_bp.route('/<malla_id>/cursos', methods=['POST'])
def agregar_curso_malla(malla_id):
    """
    Agrega un curso individual a la malla (Nivel 1: Drag & Drop Simple).
    
    No analiza prerequisitos, solo agrega el curso en la posición especificada.
    Útil para construcción manual de la malla.
    
    Endpoint: POST /api/mallas/{malla_id}/cursos
    
    Args:
        malla_id (str): ID de la malla destino
    
    Body (JSON):
        - curso_id (str): ID del curso a agregar (ej: 'PROG101')
        - posicion_x (int): Posición horizontal en píxeles
        - posicion_y (int): Posición vertical en píxeles
        - semestre (int): Nivel/semestre donde ubicar el curso (1-12)
    
    Returns:
        JSON con:
            - exito (bool): True si se agregó correctamente
            - curso (dict): Objeto del curso agregado con ID único de malla
        
        Status: 201 Created | 400 Bad Request | 404 Not Found
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
    Backend Flask independiente - sin dependencias externas
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
    
    # Obtener malla actual
    malla_actual = BaseDatos.obtener_malla(malla_id)
    if not malla_actual:
        return jsonify({
            'exito': False,
            'error': 'Malla no encontrada'
        }), 404
    
    # Verificar si el curso existe
    curso = BaseDatos.obtener_curso(curso_id)
    if not curso:
        return jsonify({
            'exito': False,
            'error': 'Curso no encontrado'
        }), 404
    
    # Obtener cursos actuales en la malla
    cursos_en_malla = {mc.curso_id for mc in malla_actual.cursos}
    
    # Obtener prerequisitos recursivos
    prerequisitos_arbol = obtener_prerequisitos_recursivos(curso_id)
    
    # Marcar cuáles están presentes
    for prereq in prerequisitos_arbol:
        prereq["presente_en_malla"] = prereq["id"] in cursos_en_malla
    
    # Calcular nivel mínimo
    nivel_minimo = calcular_nivel_minimo(curso_id)
    
    # Validar y ajustar nivel si es necesario
    nivel_valido = semestre >= nivel_minimo
    semestre_final = semestre if nivel_valido else nivel_minimo
    
    # Agregar el curso principal
    nuevo_curso, error = BaseDatos.agregar_curso_malla(
        malla_id, curso_id, posicion_x, posicion_y, semestre_final
    )
    
    if error:
        return jsonify({
            'exito': False,
            'error': error
        }), 404
    
    # Agregar prerequisitos faltantes
    prerequisitos_agregados = []
    prerequisitos_ordenados = sorted(prerequisitos_arbol, key=lambda x: x.get('profundidad', 0), reverse=True)
    
    for prereq in prerequisitos_ordenados:
        if not prereq["presente_en_malla"]:
            nivel_prereq = semestre_final - prereq["profundidad"]
            nivel_prereq = max(1, nivel_prereq)
            
            prereq_curso, _ = BaseDatos.agregar_curso_malla(
                malla_id,
                prereq['id'],
                posicion_x - 150,
                posicion_y + (len(prerequisitos_agregados) * 60),
                nivel_prereq
            )
            if prereq_curso:
                prerequisitos_agregados.append(prereq_curso.to_dict())
                cursos_en_malla.add(prereq['id'])
    
    return jsonify({
        'exito': True,
        'curso_principal': nuevo_curso.to_dict(),
        'prerequisitos_agregados': prerequisitos_agregados,
        'info_niveles': {
            'nivel_solicitado': semestre,
            'nivel_usado': semestre_final,
            'ajustado': not nivel_valido,
            'nivel_minimo': nivel_minimo,
            'profundidad_arbol': max([p["profundidad"] for p in prerequisitos_arbol]) if prerequisitos_arbol else 0
        }
    }), 201


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
