"""
Microservicio FastAPI para análisis de prerequisitos y datos
INDEPENDIENTE - No depende del backend Flask
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict

app = FastAPI(
    title="Malla Académica - Microservicio de Análisis",
    description="Microservicio FastAPI para análisis de prerequisitos e integración con IA/Datos",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000", "http://localhost:8001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== DATOS LOCALES ====================
# Copia de los datos para que el microservicio sea independiente

CURSOS_DB = {
    "PROG101": {
        "id": "PROG101",
        "nombre": "Introducción a la Programación",
        "codigo": "PROG101",
        "creditos": 3,
        "semestre": 1,
        "descripcion": "Conceptos básicos de programación",
        "prerequisitos": [],
        "dificultad": "facil"
    },
    "PROG102": {
        "id": "PROG102",
        "nombre": "Programación Orientada a Objetos",
        "codigo": "PROG102",
        "creditos": 4,
        "semestre": 2,
        "descripcion": "POO y patrones de diseño",
        "prerequisitos": ["PROG101"],
        "dificultad": "intermedio"
    },
    "PROG103": {
        "id": "PROG103",
        "nombre": "Estructuras de Datos",
        "codigo": "PROG103",
        "creditos": 4,
        "semestre": 2,
        "descripcion": "Listas, árboles, grafos",
        "prerequisitos": ["PROG101"],
        "dificultad": "intermedio"
    },
    "PROG104": {
        "id": "PROG104",
        "nombre": "Algoritmos Avanzados",
        "codigo": "PROG104",
        "creditos": 4,
        "semestre": 3,
        "descripcion": "Análisis y optimización de algoritmos",
        "prerequisitos": ["PROG103"],
        "dificultad": "difícil"
    },
    "BD101": {
        "id": "BD101",
        "nombre": "Bases de Datos I",
        "codigo": "BD101",
        "creditos": 3,
        "semestre": 2,
        "descripcion": "Diseño relacional de bases de datos",
        "prerequisitos": ["PROG101"],
        "dificultad": "intermedio"
    },
    "BD102": {
        "id": "BD102",
        "nombre": "Bases de Datos II",
        "codigo": "BD102",
        "creditos": 3,
        "semestre": 3,
        "descripcion": "Optimización y transacciones",
        "prerequisitos": ["BD101"],
        "dificultad": "intermedio"
    },
    "MATH101": {
        "id": "MATH101",
        "nombre": "Cálculo I",
        "codigo": "MATH101",
        "creditos": 4,
        "semestre": 1,
        "descripcion": "Límites, derivadas e integrales",
        "prerequisitos": [],
        "dificultad": "facil"
    },
    "MATH102": {
        "id": "MATH102",
        "nombre": "Álgebra Lineal",
        "codigo": "MATH102",
        "creditos": 3,
        "semestre": 1,
        "descripcion": "Matrices y espacios vectoriales",
        "prerequisitos": [],
        "dificultad": "facil"
    },
    "WEB101": {
        "id": "WEB101",
        "nombre": "Desarrollo Web Frontend",
        "codigo": "WEB101",
        "creditos": 3,
        "semestre": 3,
        "descripcion": "HTML, CSS, JavaScript",
        "prerequisitos": ["PROG102"],
        "dificultad": "intermedio"
    },
    "WEB102": {
        "id": "WEB102",
        "nombre": "Desarrollo Web Backend",
        "codigo": "WEB102",
        "creditos": 3,
        "semestre": 4,
        "descripcion": "APIs REST y frameworks backend",
        "prerequisitos": ["WEB101", "BD101"],
        "dificultad": "intermedio"
    },
}

# Mallas simuladas (estado compartido simple)
MALLAS_DB: Dict[str, dict] = {
    "MALLA001": {
        "id": "MALLA001",
        "nombre": "Ingeniería de Sistemas",
        "programa": "Ingeniería de Sistemas",
        "cursos": [],
        "descripcion": "Plan de estudios para Ingeniería de Sistemas"
    }
}


# ==================== MODELOS ====================

class AnalizarPrerequisitosRequest(BaseModel):
    curso_id: str
    malla_id: str
    posicion_x: int
    posicion_y: int
    semestre: int


class PrerequisitosResponse(BaseModel):
    curso_id: str
    curso_nombre: str
    tiene_prerequisitos: bool
    prerequisitos: List[dict]
    analisis_complejidad: dict


class EstadisticasResponse(BaseModel):
    total_cursos_malla: int
    total_creditos: int
    promedio_creditos_semestre: float
    cursos_por_dificultad: dict
    carga_academica: str


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "mensaje": "Microservicio de Análisis - Malla Académica",
        "version": "1.0.0",
        "proposito": "Análisis de prerequisitos e integración con IA/Datos"
    }


@app.post("/analizar-prerequisitos")
async def analizar_prerequisitos(request: AnalizarPrerequisitosRequest):
    """
    Analiza los prerequisitos de un curso
    Determina qué prerequisites faltan en la malla actual
    """
    if request.curso_id not in CURSOS_DB:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if request.malla_id not in MALLAS_DB:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    curso = CURSOS_DB[request.curso_id]
    malla = MALLAS_DB[request.malla_id]
    
    # Obtener cursos en la malla (ahora son diccionarios)
    cursos_en_malla = {mc.get("curso_id") for mc in malla.get("cursos", [])}
    
    # Analizar prerequisitos
    prerequisitos = []
    for prereq_id in curso.get("prerequisitos", []):
        if prereq_id in CURSOS_DB:
            prereq_curso = CURSOS_DB[prereq_id]
            prerequisitos.append({
                "id": prereq_id,
                "nombre": prereq_curso["nombre"],
                "codigo": prereq_curso["codigo"],
                "creditos": prereq_curso["creditos"],
                "dificultad": prereq_curso["dificultad"],
                "presente_en_malla": prereq_id in cursos_en_malla
            })
    
    # Análisis de complejidad
    analisis_complejidad = {
        "nivel_prerequisitos": len(prerequisitos),
        "prerequisitos_faltantes": sum(1 for p in prerequisitos if not p["presente_en_malla"]),
        "creditos_requeridos": sum(p["creditos"] for p in prerequisitos),
        "puede_agregarse": sum(1 for p in prerequisitos if not p["presente_en_malla"]) == 0
    }
    
    return {
        "curso_id": request.curso_id,
        "curso_nombre": curso["nombre"],
        "tiene_prerequisitos": len(curso.get("prerequisitos", [])) > 0,
        "prerequisitos": prerequisitos,
        "analisis_complejidad": analisis_complejidad
    }


@app.get("/estadisticas-malla/{malla_id}")
async def estadisticas_malla(malla_id: str):
    """
    Genera estadísticas de una malla académica
    Útil para análisis de carga académica e IA
    """
    if malla_id not in MALLAS_DB:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    malla = MALLAS_DB[malla_id]
    cursos_malla = malla.get("cursos", [])
    
    if not cursos_malla:
        return {
            "total_cursos_malla": 0,
            "total_creditos": 0,
            "promedio_creditos_semestre": 0,
            "cursos_por_dificultad": {"facil": 0, "intermedio": 0, "difícil": 0},
            "carga_academica": "Sin cursos"
        }
    
    # Calcular estadísticas
    total_creditos = 0
    cursos_por_dificultad = {"facil": 0, "intermedio": 0, "difícil": 0}
    creditos_por_semestre = {}
    
    for malla_curso in cursos_malla:
        curso_id = malla_curso.get("curso_id")
        curso = CURSOS_DB.get(curso_id)
        if curso:
            total_creditos += curso["creditos"]
            dificultad = curso.get("dificultad", "facil")
            cursos_por_dificultad[dificultad] = cursos_por_dificultad.get(dificultad, 0) + 1
            
            semestre = malla_curso.get("semestre", 1)
            creditos_por_semestre[semestre] = creditos_por_semestre.get(semestre, 0) + curso["creditos"]
    
    promedio_creditos = total_creditos / len(creditos_por_semestre) if creditos_por_semestre else 0
    
    # Determinar carga académica
    if promedio_creditos < 12:
        carga = "Ligera"
    elif promedio_creditos < 16:
        carga = "Normal"
    elif promedio_creditos < 20:
        carga = "Pesada"
    else:
        carga = "Muy pesada"
    
    return {
        "total_cursos_malla": len(cursos_malla),
        "total_creditos": total_creditos,
        "promedio_creditos_semestre": round(promedio_creditos, 2),
        "cursos_por_dificultad": cursos_por_dificultad,
        "carga_academica": carga
    }


@app.post("/validar-plan-estudios/{malla_id}")
async def validar_plan_estudios(malla_id: str):
    """
    Valida si un plan de estudios cumple con requisitos básicos
    Útil para recomendaciones basadas en IA
    """
    if malla_id not in MALLAS_DB:
        raise HTTPException(status_code=404, detail="Malla no encontrada")
    
    malla = MALLAS_DB[malla_id]
    cursos_malla = malla.get("cursos", [])
    cursos_en_malla = {mc.get("curso_id") for mc in cursos_malla}
    
    # Validaciones
    total_creditos = sum(CURSOS_DB[c]["creditos"] for c in cursos_en_malla if c in CURSOS_DB)
    total_semestres = len(set(mc.get("semestre", 1) for mc in cursos_malla)) if cursos_malla else 0
    
    validaciones = {
        "tiene_cursos_basicos": any(c in cursos_en_malla for c in ["PROG101", "MATH101"]),
        "tiene_cursos_intermedios": sum(1 for c in cursos_en_malla if c in ["PROG102", "PROG103", "BD101"]) >= 2,
        "tiene_especializacion": any(c in cursos_en_malla for c in ["WEB101", "WEB102", "PROG104"]),
        "prerequisitos_validos": validar_prerequisitos_globales(cursos_malla),
        "total_creditos": total_creditos,
        "total_semestres": total_semestres
    }
    
    recomendaciones = generar_recomendaciones(validaciones, cursos_en_malla)
    
    return {
        "malla_id": malla_id,
        "validaciones": validaciones,
        "es_plan_valido": all([
            validaciones["tiene_cursos_basicos"],
            validaciones["prerequisitos_validos"]
        ]) if cursos_malla else False,
        "recomendaciones": recomendaciones
    }


def validar_prerequisitos_globales(cursos_malla: list) -> bool:
    """Valida que todos los cursos cumplan con sus prerequisitos"""
    cursos_en_malla = {mc.get("curso_id") for mc in cursos_malla}
    
    for malla_curso in cursos_malla:
        curso_id = malla_curso.get("curso_id")
        curso = CURSOS_DB.get(curso_id)
        if curso:
            for prereq_id in curso.get("prerequisitos", []):
                if prereq_id not in cursos_en_malla:
                    return False
    return True


def generar_recomendaciones(validaciones: dict, cursos_en_malla: set) -> List[str]:
    """Genera recomendaciones basadas en validaciones"""
    recomendaciones = []
    
    if not validaciones.get("tiene_cursos_basicos"):
        recomendaciones.append("Agregue cursos básicos como Introducción a la Programación o Cálculo I")
    
    if not validaciones.get("tiene_cursos_intermedios"):
        recomendaciones.append("Considere agregar más cursos intermedios para profundizar conocimientos")
    
    if not validaciones.get("tiene_especializacion"):
        recomendaciones.append("Agregue cursos de especialización como Desarrollo Web o Algoritmos Avanzados")
    
    if not validaciones.get("prerequisitos_validos"):
        recomendaciones.append("Revise los prerequisitos: algunos cursos no tienen sus dependencias agregadas")
    
    if validaciones.get("total_creditos", 0) < 30:
        recomendaciones.append("El plan tiene pocos créditos. Considere agregar más cursos.")
    
    if validaciones.get("total_semestres", 0) < 2:
        recomendaciones.append("El plan está muy concentrado. Distribuya los cursos en más semestres.")
    
    if not recomendaciones:
        recomendaciones.append("¡El plan de estudios se ve bien! Sigue agregando cursos según tus intereses.")
    
    return recomendaciones


# Endpoint para sincronizar malla (llamado desde Flask)
@app.post("/sync-malla/{malla_id}")
async def sync_malla(malla_id: str, malla_data: dict):
    """Sincroniza los datos de la malla desde Flask"""
    MALLAS_DB[malla_id] = malla_data
    return {"mensaje": "Malla sincronizada", "malla_id": malla_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
