"""
Modelos para Malla Académica
Usando Pydantic para validación de datos
"""
from enum import Enum
from typing import List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime


class DifficultyLevel(str, Enum):
    FACIL = "facil"
    INTERMEDIO = "intermedio"
    DIFÍCIL = "difícil"


@dataclass
class Curso:
    id: str
    nombre: str
    codigo: str
    creditos: int
    semestre: int
    descripcion: Optional[str] = None
    prerequisitos: List[str] = None
    dificultad: str = DifficultyLevel.FACIL
    
    def __post_init__(self):
        if self.prerequisitos is None:
            self.prerequisitos = []
    
    def to_dict(self):
        return asdict(self)


@dataclass
class MallaCurso:
    id: str
    curso_id: str
    posicion_x: int
    posicion_y: int
    semestre: int
    
    def to_dict(self):
        return asdict(self)


@dataclass
class Malla:
    id: str
    nombre: str
    programa: str
    cursos: List[MallaCurso] = None
    descripcion: Optional[str] = None
    fecha_creacion: Optional[str] = None
    
    def __post_init__(self):
        if self.cursos is None:
            self.cursos = []
        if self.fecha_creacion is None:
            self.fecha_creacion = datetime.now().isoformat()
    
    def to_dict(self):
        data = asdict(self)
        data['cursos'] = [c.to_dict() if hasattr(c, 'to_dict') else c for c in self.cursos]
        return data


@dataclass
class CursoArrastrado:
    curso_id: str
    posicion_x: int
    posicion_y: int
    semestre: int
    
    def to_dict(self):
        return asdict(self)
