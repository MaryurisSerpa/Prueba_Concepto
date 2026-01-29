# Backend - Malla Académica API

API REST construida con FastAPI para gestionar mallas académicas interactivas.

## Características

- **Nivel 1**: CRUD de cursos y malla
- **Nivel 2**: Detección automática y agregación de prerequisitos
- **CORS habilitado** para comunicación con frontend
- **Documentación automática** con Swagger/OpenAPI

## Requisitos

- Python 3.8+
- pip

## Instalación

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

## Ejecutar

```bash
# En desarrollo con hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# En producción
uvicorn main:app --host 0.0.0.0 --port 8000
```

La API estará disponible en `http://localhost:8000`
La documentación Swagger en `http://localhost:8000/docs`

## Endpoints Principales

### Cursos
- `GET /cursos` - Obtener lista de cursos disponibles
- `GET /cursos/{curso_id}` - Obtener detalles de un curso

### Malla Académica
- `GET /mallas/{malla_id}` - Obtener una malla
- `POST /mallas/{malla_id}/cursos` - Agregar curso a malla (sin prerequisitos)
- `POST /agregar-con-prerequisitos` - Agregar curso con prerequisitos automáticos
- `PUT /mallas/{malla_id}/cursos/{curso_malla_id}` - Actualizar posición
- `DELETE /mallas/{malla_id}/cursos/{curso_malla_id}` - Eliminar curso
- `POST /validar-prerequisitos` - Validar prerequisitos

## Estructura de Datos

### Curso
```json
{
  "id": "PROG101",
  "nombre": "Introducción a la Programación",
  "codigo": "PROG101",
  "creditos": 3,
  "semestre": 1,
  "descripcion": "Conceptos básicos",
  "prerequisitos": [],
  "dificultad": "facil"
}
```

### Malla Académica
```json
{
  "id": "MALLA001",
  "nombre": "Ingeniería de Sistemas",
  "programa": "Ingeniería de Sistemas",
  "cursos": [
    {
      "id": "malla_curso_1",
      "curso_id": "PROG101",
      "posicion_x": 100,
      "posicion_y": 50,
      "semestre": 1
    }
  ]
}
```

## Desarrollo

Para desarrollo, el backend ejecuta con auto-recarga habilitada. Los cambios en `main.py` se reflejan automáticamente.

## CORS Configuration

El backend permite solicitudes desde:
- `http://localhost:3000` (Frontend Next.js)
- `http://localhost:8000` (Swagger/Testing)
