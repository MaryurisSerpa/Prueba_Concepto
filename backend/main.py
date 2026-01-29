from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

app = FastAPI(
    title="Malla Académica API",
    description="API para gestión de malla académica con prerequisitos",
    version="1.0.0"
)

# Configurar CORS para permitir solicitudes desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MODELOS ====================

class DifficultyLevel(str, Enum):
    FACIL = "facil"
    INTERMEDIO = "intermedio"
    DIFÍCIL = "difícil"


class Curso(BaseModel):
    id: str
    nombre: str
    codigo: str
    creditos: int
    semestre: int
    descripcion: Optional[str] = None
    prerequisitos: List[str] = []  # IDs de cursos prerequisitos
    dificultad: DifficultyLevel = DifficultyLevel.FACIL


class MallaCurso(BaseModel):
    id: str
    curso_id: str
    posicion_x: int
    posicion_y: int
    semestre: int


class Malla(BaseModel):
    id: str
    nombre: str
    programa: str
    cursos: List[MallaCurso] = []
    descripcion: Optional[str] = None


class CursoArrastrado(BaseModel):
    curso_id: str
    posicion_x: int
    posicion_y: int
    semestre: int


# ==================== DATOS SIMULADOS ====================

# Base de datos simulada de cursos
cursos_db = {
    "PROG101": Curso(
        id="PROG101",
        nombre="Introducción a la Programación",
        codigo="PROG101",
        creditos=3,
        semestre=1,
        descripcion="Conceptos básicos de programación",
        prerequisitos=[],
        dificultad=DifficultyLevel.FACIL
    ),
    "PROG102": Curso(
        id="PROG102",
        nombre="Programación Orientada a Objetos",
        codigo="PROG102",
        creditos=4,
        semestre=2,
        descripcion="POO y patrones de diseño",
        prerequisitos=["PROG101"],
        dificultad=DifficultyLevel.INTERMEDIO
    ),
    "PROG103": Curso(
        id="PROG103",
        nombre="Estructuras de Datos",
        codigo="PROG103",
        creditos=4,
        semestre=2,
        descripcion="Listas, árboles, grafos",
        prerequisitos=["PROG101"],
        dificultad=DifficultyLevel.INTERMEDIO
    ),
    "PROG104": Curso(
        id="PROG104",
        nombre="Algoritmos Avanzados",
        codigo="PROG104",
        creditos=4,
        semestre=3,
        descripcion="Análisis y optimización de algoritmos",
        prerequisitos=["PROG103"],
        dificultad=DifficultyLevel.DIFÍCIL
    ),
    "BD101": Curso(
        id="BD101",
        nombre="Bases de Datos I",
        codigo="BD101",
        creditos=3,
        semestre=2,
        descripcion="Diseño relacional de bases de datos",
        prerequisitos=["PROG101"],
        dificultad=DifficultyLevel.INTERMEDIO
    ),
    "BD102": Curso(
        id="BD102",
        nombre="Bases de Datos II",
        codigo="BD102",
        creditos=3,
        semestre=3,
        descripcion="Optimización y transacciones",
        prerequisitos=["BD101"],
        dificultad=DifficultyLevel.INTERMEDIO
    ),
    "MATH101": Curso(
        id="MATH101",
        nombre="Cálculo I",
        codigo="MATH101",
        creditos=4,
        semestre=1,
        descripcion="Límites, derivadas e integrales",
        prerequisitos=[],
        dificultad=DifficultyLevel.FACIL
    ),
    "MATH102": Curso(
        id="MATH102",
        nombre="Álgebra Lineal",
        codigo="MATH102",
        creditos=3,
        semestre=1,
        descripcion="Matrices y espacios vectoriales",
        prerequisitos=[],
        dificultad=DifficultyLevel.FACIL
    ),
    "WEB101": Curso(
        id="WEB101",
        nombre="Desarrollo Web Frontend",
        codigo="WEB101",
        creditos=3,
        semestre=3,
        descripcion="HTML, CSS, JavaScript",
        prerequisitos=["PROG102"],
        dificultad=DifficultyLevel.INTERMEDIO
    ),
    "WEB102": Curso(
        id="WEB102",
        nombre="Desarrollo Web Backend",
        codigo="WEB102",
        creditos=3,
        semestre=4,
        descripcion="APIs REST y frameworks backend",
        prerequisitos=["WEB101", "BD101"],
        dificultad=DifficultyLevel.INTERMEDIO
    ),
}

# Malla simulada
mallas_db = {
    "MALLA001": Malla(
        id="MALLA001",
        nombre="Ingeniería de Sistemas",
        programa="Ingeniería de Sistemas",
        cursos=[],
        descripcion="Plan de estudios para Ingeniería de Sistemas"
    )
}

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Endpoint raíz para verificar que la API está en funcionamiento"""
    return {
        "mensaje": "Bienvenido a Malla Académica API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/cursos", response_model=List[Curso])
async def obtener_cursos():
    """Obtiene la lista de todos los cursos disponibles"""
    return list(cursos_db.values())


@app.get("/cursos/{curso_id}", response_model=Curso)
async def obtener_curso(curso_id: str):
    """Obtiene un curso específico por su ID"""
    if curso_id not in cursos_db:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return cursos_db[curso_id]


@app.get("/mallas/{malla_id}", response_model=Malla)
async def obtener_malla(malla_id: str):
    """Obtiene una malla académica específica"""
    if malla_id not in mallas_db:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    return mallas_db[malla_id]


@app.post("/mallas/{malla_id}/cursos")
async def agregar_curso_malla(malla_id: str, curso_arrastrado: CursoArrastrado):
    """Agrega un curso a la malla en una posición específica"""
    if malla_id not in mallas_db:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    if curso_arrastrado.curso_id not in cursos_db:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    malla = mallas_db[malla_id]
    nuevo_curso = MallaCurso(
        id=f"MALLA_{curso_arrastrado.curso_id}_{len(malla.cursos)}",
        curso_id=curso_arrastrado.curso_id,
        posicion_x=curso_arrastrado.posicion_x,
        posicion_y=curso_arrastrado.posicion_y,
        semestre=curso_arrastrado.semestre
    )
    malla.cursos.append(nuevo_curso)
    
    return {
        "mensaje": "Curso agregado a la malla",
        "curso": nuevo_curso,
        "total_cursos": len(malla.cursos)
    }


@app.post("/validar-prerequisitos")
async def validar_prerequisitos(curso_id: str, malla_id: str):
    """
    Valida si un curso tiene prerequisitos y retorna los que falta
    Nivel 2: Detección automática de prerequisitos
    """
    if curso_id not in cursos_db:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if malla_id not in mallas_db:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    curso = cursos_db[curso_id]
    malla = mallas_db[malla_id]
    
    # Obtener IDs de cursos ya en la malla
    cursos_en_malla = {mc.curso_id for mc in malla.cursos}
    
    # Identificar prerequisitos faltantes
    prerequisitos_faltantes = []
    for prereq_id in curso.prerequisitos:
        if prereq_id not in cursos_en_malla:
            prerequisitos_faltantes.append({
                "id": prereq_id,
                "nombre": cursos_db[prereq_id].nombre,
                "codigo": cursos_db[prereq_id].codigo,
                "creditos": cursos_db[prereq_id].creditos,
                "dificultad": cursos_db[prereq_id].dificultad
            })
    
    return {
        "curso_id": curso_id,
        "curso_nombre": curso.nombre,
        "tiene_prerequisitos": len(curso.prerequisitos) > 0,
        "prerequisitos_totales": len(curso.prerequisitos),
        "prerequisitos_faltantes": prerequisitos_faltantes,
        "puede_agregarse": len(prerequisitos_faltantes) == 0
    }


@app.post("/agregar-con-prerequisitos")
async def agregar_curso_con_prerequisitos(malla_id: str, curso_arrastrado: CursoArrastrado):
    """
    Agrega un curso a la malla junto con sus prerequisitos automáticamente
    Nivel 2: Detección e inserción automática de prerequisitos
    """
    if malla_id not in mallas_db:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    if curso_arrastrado.curso_id not in cursos_db:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    malla = mallas_db[malla_id]
    curso_principal = cursos_db[curso_arrastrado.curso_id]
    cursos_en_malla = {mc.curso_id for mc in malla.cursos}
    
    # Función recursiva para agregar prerequisitos
    def agregar_prerequisitos_recursivos(curso_id: str, posicion_y_base: int):
        cursos_agregados = []
        curso = cursos_db[curso_id]
        
        for prereq_id in curso.prerequisitos:
            if prereq_id not in cursos_en_malla and prereq_id not in [c["curso_id"] for c in cursos_agregados]:
                # Agregar el prerequisito
                nuevo_curso = MallaCurso(
                    id=f"MALLA_{prereq_id}_{len(malla.cursos)}",
                    curso_id=prereq_id,
                    posicion_x=curso_arrastrado.posicion_x - 150,
                    posicion_y=posicion_y_base,
                    semestre=max(1, curso_arrastrado.semestre - 1)
                )
                malla.cursos.append(nuevo_curso)
                cursos_en_malla.add(prereq_id)
                cursos_agregados.append({
                    "id": nuevo_curso.id,
                    "curso_id": prereq_id,
                    "nombre": cursos_db[prereq_id].nombre,
                    "tipo": "prerequisito"
                })
                
                # Recursivamente agregar los prerequisitos del prerequisito
                sub_cursos = agregar_prerequisitos_recursivos(prereq_id, posicion_y_base + 60)
                cursos_agregados.extend(sub_cursos)
                posicion_y_base += 60
        
        return cursos_agregados
    
    # Agregar prerequisitos primero
    prerequisitos_agregados = agregar_prerequisitos_recursivos(curso_arrastrado.curso_id, curso_arrastrado.posicion_y)
    
    # Agregar el curso principal
    nuevo_curso_principal = MallaCurso(
        id=f"MALLA_{curso_arrastrado.curso_id}_{len(malla.cursos)}",
        curso_id=curso_arrastrado.curso_id,
        posicion_x=curso_arrastrado.posicion_x,
        posicion_y=curso_arrastrado.posicion_y,
        semestre=curso_arrastrado.semestre
    )
    malla.cursos.append(nuevo_curso_principal)
    
    return {
        "mensaje": "Curso y sus prerequisitos agregados a la malla",
        "curso_principal": {
            "id": nuevo_curso_principal.id,
            "curso_id": curso_arrastrado.curso_id,
            "nombre": curso_principal.nombre
        },
        "prerequisitos_agregados": prerequisitos_agregados,
        "total_cursos_agregados": 1 + len(prerequisitos_agregados),
        "total_cursos_malla": len(malla.cursos)
    }


@app.put("/mallas/{malla_id}/cursos/{curso_malla_id}")
async def actualizar_posicion_curso(malla_id: str, curso_malla_id: str, posicion_x: int, posicion_y: int):
    """Actualiza la posición de un curso en la malla (después del drag)"""
    if malla_id not in mallas_db:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    malla = mallas_db[malla_id]
    curso = next((c for c in malla.cursos if c.id == curso_malla_id), None)
    
    if not curso:
        raise HTTPException(status_code=404, detail="Curso en malla no encontrado")
    
    curso.posicion_x = posicion_x
    curso.posicion_y = posicion_y
    
    return {
        "mensaje": "Posición actualizada",
        "curso": curso
    }


@app.delete("/mallas/{malla_id}/cursos/{curso_malla_id}")
async def eliminar_curso_malla(malla_id: str, curso_malla_id: str):
    """Elimina un curso de la malla"""
    if malla_id not in mallas_db:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    malla = mallas_db[malla_id]
    curso = next((c for c in malla.cursos if c.id == curso_malla_id), None)
    
    if not curso:
        raise HTTPException(status_code=404, detail="Curso en malla no encontrado")
    
    malla.cursos.remove(curso)
    
    return {"mensaje": "Curso eliminado de la malla"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
