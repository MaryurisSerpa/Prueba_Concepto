"""
Backend completo en FastAPI - Alternativa a Flask
Puerto 8002
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from dataclasses import dataclass, field, asdict
from datetime import datetime
import uuid

app = FastAPI(
    title="Malla Académica - Backend FastAPI",
    description="Backend completo en FastAPI para comparar con Flask",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MODELOS ====================

@dataclass
class Curso:
    id: str
    nombre: str
    codigo: str
    creditos: int
    semestre: int
    descripcion: str = ""
    prerequisitos: List[str] = field(default_factory=list)
    dificultad: str = "facil"
    horas: int = 48

@dataclass
class MallaCurso:
    id: str
    curso_id: str
    posicion_x: int
    posicion_y: int
    semestre: int

@dataclass
class Malla:
    id: str
    nombre: str
    programa: str
    cursos: List[MallaCurso] = field(default_factory=list)
    fecha_creacion: str = field(default_factory=lambda: datetime.now().isoformat())
    periodo_vigencia: str = "202420"
    creditos_programa: int = 48
    numero_niveles: int = 4

# ==================== BASE DE DATOS SIMULADA ====================

CURSOS_DB = {
    "PROG101": Curso(
        id="PROG101",
        nombre="Introducción a la Programación",
        codigo="PROG101",
        creditos=3,
        semestre=1,
        descripcion="Conceptos básicos de programación",
        prerequisitos=[],
        dificultad="facil",
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
        dificultad="intermedio",
        horas=64
    ),
    "PROG103": Curso(
        id="PROG103",
        nombre="Estructuras de Datos",
        codigo="PROG103",
        creditos=4,
        semestre=3,
        descripcion="Listas, árboles, grafos",
        prerequisitos=["PROG102"],
        dificultad="intermedio",
        horas=64
    ),
    "PROG104": Curso(
        id="PROG104",
        nombre="Algoritmos Avanzados",
        codigo="PROG104",
        creditos=4,
        semestre=4,
        descripcion="Complejidad y optimización",
        prerequisitos=["PROG103"],
        dificultad="dificil",
        horas=64
    ),
    "BD101": Curso(
        id="BD101",
        nombre="Bases de Datos I",
        codigo="BD101",
        creditos=3,
        semestre=3,
        descripcion="SQL y modelado relacional",
        prerequisitos=["PROG101"],
        dificultad="facil",
        horas=48
    ),
    "BD102": Curso(
        id="BD102",
        nombre="Bases de Datos II",
        codigo="BD102",
        creditos=3,
        semestre=4,
        descripcion="NoSQL y BigData",
        prerequisitos=["BD101"],
        dificultad="intermedio",
        horas=48
    ),
    "MATH101": Curso(
        id="MATH101",
        nombre="Matemáticas Discretas",
        codigo="MATH101",
        creditos=4,
        semestre=1,
        descripcion="Lógica y teoría de conjuntos",
        prerequisitos=[],
        dificultad="intermedio",
        horas=64
    ),
    "MATH102": Curso(
        id="MATH102",
        nombre="Cálculo",
        codigo="MATH102",
        creditos=3,
        semestre=2,
        descripcion="Derivadas e integrales",
        prerequisitos=["MATH101"],
        dificultad="intermedio",
        horas=48
    ),
    "WEB101": Curso(
        id="WEB101",
        nombre="Desarrollo Web I",
        codigo="WEB101",
        creditos=3,
        semestre=2,
        descripcion="HTML, CSS, JavaScript",
        prerequisitos=["PROG101"],
        dificultad="facil",
        horas=48
    ),
    "WEB102": Curso(
        id="WEB102",
        nombre="Desarrollo Web II",
        codigo="WEB102",
        creditos=3,
        semestre=3,
        descripcion="React, Node.js",
        prerequisitos=["WEB101", "PROG102"],
        dificultad="intermedio",
        horas=48
    ),
}

MALLAS_DB = {
    "MALLA001": Malla(
        id="MALLA001",
        nombre="",  # Sin nombre predeterminado, el usuario debe ingresarlo
        programa="Ingeniería de Sistemas",
        cursos=[],
        periodo_vigencia="202420",
        creditos_programa=48,
        numero_niveles=4
    )
}

# ==================== FUNCIONES AUXILIARES ====================

def obtener_prerequisitos_recursivos(curso_id: str, visitados: set = None) -> List[Dict]:
    """Obtiene todos los prerequisitos de manera recursiva"""
    if visitados is None:
        visitados = set()
    
    if curso_id in visitados or curso_id not in CURSOS_DB:
        return []
    
    visitados.add(curso_id)
    prerequisitos_completos = []
    
    curso = CURSOS_DB[curso_id]
    for prereq_id in curso.prerequisitos:
        if prereq_id in CURSOS_DB:
            prereq_curso = CURSOS_DB[prereq_id]
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

# ==================== MODELOS PYDANTIC ====================

class AgregarCursoRequest(BaseModel):
    curso_id: str
    posicion_x: int
    posicion_y: int
    semestre: int

class ActualizarCursoRequest(BaseModel):
    semestre: int
    posicion_x: int
    posicion_y: int

class ActualizarMallaRequest(BaseModel):
    nombre: Optional[str] = None
    periodo_vigencia: Optional[str] = None
    creditos_programa: Optional[int] = None
    numero_niveles: Optional[int] = None
    estado: Optional[str] = 'borrador'  # HU-S-05: borrador | publicado
    cursos: Optional[List[dict]] = None  # HU-S-05: guardar cursos completos

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    return {
        "mensaje": "Backend FastAPI - Malla Académica",
        "version": "1.0.0",
        "tecnologia": "FastAPI",
        "puerto": 8002
    }

@app.get("/health")
async def health():
    return {"status": "ok", "servicio": "Backend FastAPI"}

# ==================== CURSOS ====================

@app.get("/api/cursos")
async def obtener_cursos():
    cursos_lista = [asdict(curso) for curso in CURSOS_DB.values()]
    return {"cursos": cursos_lista}

@app.get("/api/cursos/{curso_id}")
async def obtener_curso(curso_id: str):
    if curso_id not in CURSOS_DB:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return {"curso": asdict(CURSOS_DB[curso_id])}

# ==================== MALLAS ====================

@app.get("/api/mallas/{malla_id}")
async def obtener_malla(malla_id: str):
    if malla_id not in MALLAS_DB:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    malla = MALLAS_DB[malla_id]
    return {
        "malla": {
            "id": malla.id,
            "nombre": malla.nombre,
            "programa": malla.programa,
            "cursos": [asdict(c) for c in malla.cursos],
            "fecha_creacion": malla.fecha_creacion,
            "periodo_vigencia": malla.periodo_vigencia,
            "creditos_programa": malla.creditos_programa,
            "numero_niveles": malla.numero_niveles
        }
    }

@app.put("/api/mallas/{malla_id}")
async def actualizar_malla(malla_id: str, request: ActualizarMallaRequest):
    # Guarda en estado borrador sin validaciones avanzadas (HU-S-05)
    if malla_id not in MALLAS_DB:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    malla = MALLAS_DB[malla_id]
    
    if request.nombre is not None:
        malla.nombre = request.nombre
    if request.periodo_vigencia is not None:
        malla.periodo_vigencia = request.periodo_vigencia
    if request.creditos_programa is not None:
        malla.creditos_programa = request.creditos_programa
    if request.numero_niveles is not None:
        malla.numero_niveles = request.numero_niveles
    
    # HU-S-05: Guardar estado (borrador/publicado)
    estado = getattr(request, 'estado', 'borrador')
    
    # Si hay cursos nuevos, agregarlos (guardado completo de borrador)
    cursos_data = getattr(request, 'cursos', None)
    if cursos_data is not None:
        # Actualizar los cursos existentes con la nueva lista
        malla.cursos = []
        for curso_dict in cursos_data:
            curso_existente = next((c for c in CURSOS_DB if c.id == curso_dict['id']), None)
            if curso_existente:
                nuevo_curso = CursoMalla(
                    id=curso_existente.id,
                    nombre=curso_existente.nombre,
                    creditos=curso_existente.creditos,
                    horas=curso_existente.horas,
                    nivel=curso_dict.get('nivel', 1),
                    posicion=curso_dict.get('posicion', 0),
                    codigo=curso_existente.codigo,
                    prerequisitos_ids=curso_existente.prerequisitos_ids,
                    prerequisitos_nombres=curso_existente.prerequisitos_nombres,
                    correquisitos=curso_existente.correquisitos,
                    tipo=curso_existente.tipo,
                    validado=curso_existente.validado
                )
                malla.cursos.append(nuevo_curso)
    
    mensaje = "Malla guardada como borrador exitosamente" if estado == 'borrador' else "Malla actualizada correctamente"
    
    return {
        "exito": True,
        "mensaje": mensaje,
        "estado": estado,
        "malla": {
            "id": malla.id,
            "nombre": malla.nombre,
            "programa": malla.programa,
            "cursos": [asdict(c) for c in malla.cursos],
            "fecha_creacion": malla.fecha_creacion,
            "periodo_vigencia": malla.periodo_vigencia,
            "creditos_programa": malla.creditos_programa,
            "numero_niveles": malla.numero_niveles,
            "estado": estado
        }
    }

@app.post("/api/mallas/{malla_id}/cursos-con-prerequisitos")
async def agregar_curso_con_prerequisitos(malla_id: str, request: AgregarCursoRequest):
    if malla_id not in MALLAS_DB:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    if request.curso_id not in CURSOS_DB:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    malla = MALLAS_DB[malla_id]
    
    # Verificar duplicidad
    if any(c.curso_id == request.curso_id for c in malla.cursos):
        raise HTTPException(status_code=400, detail="El curso ya está en la malla")
    
    # Obtener cursos actuales en la malla
    cursos_en_malla = {c.curso_id for c in malla.cursos}
    
    # Obtener prerequisitos recursivos
    prerequisitos_arbol = obtener_prerequisitos_recursivos(request.curso_id)
    
    # Marcar cuáles están presentes
    for prereq in prerequisitos_arbol:
        prereq["presente_en_malla"] = prereq["id"] in cursos_en_malla
    
    # Calcular nivel mínimo
    if prerequisitos_arbol:
        max_profundidad = max(p["profundidad"] for p in prerequisitos_arbol)
        nivel_minimo = max_profundidad + 1
    else:
        nivel_minimo = 1
    
    nivel_valido = request.semestre >= nivel_minimo
    semestre_final = request.semestre if nivel_valido else nivel_minimo
    
    # Agregar curso principal
    nuevo_curso = MallaCurso(
        id=str(uuid.uuid4()),
        curso_id=request.curso_id,
        posicion_x=request.posicion_x,
        posicion_y=request.posicion_y,
        semestre=semestre_final
    )
    malla.cursos.append(nuevo_curso)
    
    # Agregar prerequisitos faltantes
    prerequisitos_agregados = []
    prerequisitos_ordenados = sorted(prerequisitos_arbol, key=lambda x: x.get('profundidad', 0), reverse=True)
    
    for prereq in prerequisitos_ordenados:
        if not prereq["presente_en_malla"]:
            nivel_prereq = semestre_final - prereq["profundidad"]
            nivel_prereq = max(1, nivel_prereq)
            
            prereq_curso = MallaCurso(
                id=str(uuid.uuid4()),
                curso_id=prereq['id'],
                posicion_x=request.posicion_x - 150,
                posicion_y=request.posicion_y + (len(prerequisitos_agregados) * 60),
                semestre=nivel_prereq
            )
            malla.cursos.append(prereq_curso)
            prerequisitos_agregados.append(asdict(prereq_curso))
            cursos_en_malla.add(prereq['id'])
    
    return {
        "exito": True,
        "curso_principal": asdict(nuevo_curso),
        "prerequisitos_agregados": prerequisitos_agregados,
        "info_niveles": {
            "nivel_solicitado": request.semestre,
            "nivel_usado": semestre_final,
            "ajustado": not nivel_valido,
            "nivel_minimo": nivel_minimo,
            "profundidad_arbol": max([p["profundidad"] for p in prerequisitos_arbol]) if prerequisitos_arbol else 0
        }
    }

@app.put("/api/mallas/{malla_id}/cursos/{curso_malla_id}")
async def actualizar_curso_malla(malla_id: str, curso_malla_id: str, request: ActualizarCursoRequest):
    if malla_id not in MALLAS_DB:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    malla = MALLAS_DB[malla_id]
    curso_encontrado = None
    
    for curso in malla.cursos:
        if curso.id == curso_malla_id:
            curso.semestre = request.semestre
            curso.posicion_x = request.posicion_x
            curso.posicion_y = request.posicion_y
            curso_encontrado = curso
            break
    
    if not curso_encontrado:
        raise HTTPException(status_code=404, detail="Curso no encontrado en la malla")
    
    return {"exito": True, "curso": asdict(curso_encontrado)}

@app.delete("/api/mallas/{malla_id}/cursos/{curso_malla_id}")
async def eliminar_curso_malla(malla_id: str, curso_malla_id: str):
    if malla_id not in MALLAS_DB:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    malla = MALLAS_DB[malla_id]
    malla.cursos = [c for c in malla.cursos if c.id != curso_malla_id]
    
    return {"exito": True, "mensaje": "Curso eliminado correctamente"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
