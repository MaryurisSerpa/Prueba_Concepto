"""
Base de datos simulada y manejo de datos
"""
from models.modelos import Curso, Malla, MallaCurso, DifficultyLevel


# Base de datos simulada de cursos
CURSOS_DB = {
    "PROG101": Curso(
        id="PROG101",
        nombre="Introducción a la Programación",
        codigo="PROG101",
        creditos=3,
        semestre=1,
        descripcion="Conceptos básicos de programación",
        prerequisitos=[],
        dificultad=DifficultyLevel.FACIL,
        horas=48
    ),
    "PROG102": Curso(
        id="PROG102",
        nombre="Programación Orientada a Objetos",
        codigo="PROG102",
        creditos=4,
        semestre=2,
        descripcion="POO y patrones de diseño",
        prerequisitos=["PROG101"],
        dificultad=DifficultyLevel.INTERMEDIO,
        horas=64
    ),
    "PROG103": Curso(
        id="PROG103",
        nombre="Estructuras de Datos",
        codigo="PROG103",
        creditos=4,
        semestre=2,
        descripcion="Listas, árboles, grafos",
        prerequisitos=["PROG101"],
        dificultad=DifficultyLevel.INTERMEDIO,
        horas=64
    ),
    "PROG104": Curso(
        id="PROG104",
        nombre="Algoritmos Avanzados",
        codigo="PROG104",
        creditos=4,
        semestre=3,
        descripcion="Análisis y optimización de algoritmos",
        prerequisitos=["PROG103"],
        dificultad=DifficultyLevel.DIFÍCIL,
        horas=64
    ),
    "BD101": Curso(
        id="BD101",
        nombre="Bases de Datos I",
        codigo="BD101",
        creditos=3,
        semestre=2,
        descripcion="Diseño relacional de bases de datos",
        prerequisitos=["PROG101"],
        dificultad=DifficultyLevel.INTERMEDIO,
        horas=48
    ),
    "BD102": Curso(
        id="BD102",
        nombre="Bases de Datos II",
        codigo="BD102",
        creditos=3,
        semestre=3,
        descripcion="Optimización y transacciones",
        prerequisitos=["BD101"],
        dificultad=DifficultyLevel.INTERMEDIO,
        horas=48
    ),
    "MATH101": Curso(
        id="MATH101",
        nombre="Cálculo I",
        codigo="MATH101",
        creditos=4,
        semestre=1,
        descripcion="Límites, derivadas e integrales",
        prerequisitos=[],
        dificultad=DifficultyLevel.FACIL,
        horas=64
    ),
    "MATH102": Curso(
        id="MATH102",
        nombre="Álgebra Lineal",
        codigo="MATH102",
        creditos=3,
        semestre=1,
        descripcion="Matrices y espacios vectoriales",
        prerequisitos=[],
        dificultad=DifficultyLevel.FACIL,
        horas=48
    ),
    "WEB101": Curso(
        id="WEB101",
        nombre="Desarrollo Web Frontend",
        codigo="WEB101",
        creditos=3,
        semestre=3,
        descripcion="HTML, CSS, JavaScript",
        prerequisitos=["PROG102"],
        dificultad=DifficultyLevel.INTERMEDIO,
        horas=48
    ),
    "WEB102": Curso(
        id="WEB102",
        nombre="Desarrollo Web Backend",
        codigo="WEB102",
        creditos=3,
        semestre=4,
        descripcion="APIs REST y frameworks backend",
        prerequisitos=["WEB101", "BD101"],
        dificultad=DifficultyLevel.INTERMEDIO,
        horas=48
    ),
}

# Mallas simuladas
MALLAS_DB = {
    "MALLA001": Malla(
        id="MALLA001",
        nombre="Ingeniería de Sistemas",
        programa="Ingeniería de Sistemas",
        cursos=[],
        descripcion="Plan de estudios para Ingeniería de Sistemas"
    )
}


class BaseDatos:
    """Gestor de base de datos en memoria"""
    
    @staticmethod
    def obtener_cursos():
        return list(CURSOS_DB.values())
    
    @staticmethod
    def obtener_curso(curso_id: str):
        return CURSOS_DB.get(curso_id)
    
    @staticmethod
    def obtener_malla(malla_id: str):
        return MALLAS_DB.get(malla_id)
    
    @staticmethod
    def agregar_curso_malla(malla_id: str, curso_id: str, posicion_x: int, posicion_y: int, semestre: int):
        """Agrega un curso a una malla"""
        if malla_id not in MALLAS_DB:
            return None, "Malla no encontrada"
        
        if curso_id not in CURSOS_DB:
            return None, "Curso no encontrado"
        
        malla = MALLAS_DB[malla_id]
        nuevo_curso = MallaCurso(
            id=f"MALLA_{curso_id}_{len(malla.cursos)}",
            curso_id=curso_id,
            posicion_x=posicion_x,
            posicion_y=posicion_y,
            semestre=semestre
        )
        malla.cursos.append(nuevo_curso)
        return nuevo_curso, None
    
    @staticmethod
    def actualizar_posicion_curso(malla_id: str, curso_malla_id: str, posicion_x: int, posicion_y: int, semestre: int = None):
        """Actualiza la posición y/o semestre de un curso en la malla"""
        if malla_id not in MALLAS_DB:
            return None, "Malla no encontrada"
        
        malla = MALLAS_DB[malla_id]
        curso = next((c for c in malla.cursos if c.id == curso_malla_id), None)
        
        if not curso:
            return None, "Curso en malla no encontrado"
        
        curso.posicion_x = posicion_x
        curso.posicion_y = posicion_y
        if semestre is not None:
            curso.semestre = semestre
        return curso, None
    
    @staticmethod
    def eliminar_curso_malla(malla_id: str, curso_malla_id: str):
        """Elimina un curso de la malla"""
        if malla_id not in MALLAS_DB:
            return False, "Malla no encontrada"
        
        malla = MALLAS_DB[malla_id]
        curso = next((c for c in malla.cursos if c.id == curso_malla_id), None)
        
        if not curso:
            return False, "Curso en malla no encontrado"
        
        malla.cursos.remove(curso)
        return True, None
