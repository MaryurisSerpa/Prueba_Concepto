# Malla Académica - Prueba de Concepto

Sistema interactivo de diseño de malla académica con Python (Flask + FastAPI) y Next.js. Una comparación práctica entre diferentes stacks de desarrollo.

## 🎯 Objetivos de la Prueba de Concepto

### Stack Evaluado: Flask + FastAPI + Next.js

Esta PoC compara la viabilidad de:

1. **Backend Principal**: Flask (REST API tradicional)
2. **Microservicios**: FastAPI (análisis de datos e IA)
3. **Frontend**: Next.js (interfaz moderna y reactiva)

### Por qué esta arquitectura

- ✅ **Mismo lenguaje (Python)** para Flask y FastAPI permite reutilizar modelos
- ✅ **Separación de responsabilidades** claras entre API y microservicios
- ✅ **Escalabilidad** mediante arquitectura de microservicios
- ✅ **Comparación válida** con stacks JavaScript (Nest.js + FastAPI)

## 📋 Características

### Nivel 1: Drag & Drop Simple
- ✨ Interfaz interactiva para arrastrar cursos
- 📍 Posicionamiento libre en el canvas
- 🗑️ Eliminar cursos agregados
- 📊 Vista en tiempo real de estadísticas

### Nivel 2: Detección de Prerequisitos
- 🔗 Análisis automático de prerequisitos via FastAPI
- 🚀 Agregación automática de cursos prerequisitos
- 📈 Validación de plan de estudios
- 💡 Recomendaciones basadas en análisis

## 🏗️ Arquitectura del Proyecto

```
Prueba_Malla/
├── backend/                    # Flask Backend (Puerto 5000)
│   ├── app/
│   │   └── app.py             # Aplicación Flask principal
│   ├── models/
│   │   ├── modelos.py         # Dataclasses
│   │   └── base_datos.py      # Datos simulados y operaciones
│   ├── routes/
│   │   ├── cursos.py          # Endpoints de cursos
│   │   └── malla.py           # Endpoints de malla
│   ├── requirements.txt
│   └── wsgi.py               # Entry point
│
├── microservicios/
│   └── fastapi_analytics/     # FastAPI Microservicio (Puerto 8001)
│       ├── main.py            # Análisis de prerequisitos e IA
│       └── requirements.txt
│
├── frontend/                   # Next.js Frontend (Puerto 3000)
│   ├── app/
│   │   ├── layout.tsx         # Layout raíz
│   │   └── page.tsx           # Página principal
│   ├── components/
│   │   ├── MallaDesign.tsx    # Componente principal
│   │   ├── CursoItem.tsx      # Tarjeta de curso
│   │   ├── CursosDisponibles.tsx
│   │   └── Estadisticas.tsx
│   ├── lib/
│   │   ├── api.ts             # Cliente HTTP
│   │   └── types.ts           # TypeScript types
│   └── styles/
│       └── globals.css        # Estilos globales
│
└── .github/
    └── copilot-instructions.md
```

## 🚀 Instalación y Ejecución

### Requisitos
- Python 3.8+
- Node.js 18+
- npm o yarn

### 1️⃣ Backend Flask (Puerto 5000)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python wsgi.py
```

**Endpoints disponibles:**
- `GET /` - Información del servicio
- `GET /api/cursos` - Lista de cursos
- `GET /api/cursos/{id}` - Detalles de curso
- `GET /api/mallas/{id}` - Obtener malla
- `POST /api/mallas/{id}/cursos` - Agregar curso (Nivel 1)
- `POST /api/mallas/{id}/cursos-con-prerequisitos` - Agregar con requisitos (Nivel 2)
- `DELETE /api/mallas/{id}/cursos/{curso_id}` - Eliminar curso

### 2️⃣ Microservicio FastAPI (Puerto 8001)

```bash
cd microservicios/fastapi_analytics
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

**Endpoints disponibles:**
- `GET /` - Información del servicio
- `POST /analizar-prerequisitos` - Análisis detallado (usado por Flask)
- `GET /estadisticas-malla/{malla_id}` - Estadísticas de carga
- `POST /validar-plan-estudios/{malla_id}` - Validaciones y recomendaciones

Documentación interactiva: `http://localhost:8001/docs`

### 3️⃣ Frontend Next.js (Puerto 3000)

```bash
cd frontend
npm install
npm run dev
```

Accede en: `http://localhost:3000`

## 📊 Flujo de Datos

### Nivel 1: Drag & Drop Simple
```
Frontend (Next.js)
    ↓ User drags course
    ↓ POST /api/mallas/{id}/cursos
Backend (Flask)
    ↓ Validates and stores
    ↓ Returns updated malla
Frontend (Next.js)
    ↓ Renders course in canvas
```

### Nivel 2: Con Análisis de Prerequisitos
```
Frontend (Next.js)
    ↓ User drags course with prerequisites
    ↓ POST /api/mallas/{id}/cursos-con-prerequisitos
Backend (Flask)
    ↓ Forwards to microservice
    ↓ HTTP → POST /analizar-prerequisitos
Microservice (FastAPI)
    ↓ Analyzes prerequisites
    ↓ Returns analysis + recommendations
Backend (Flask)
    ↓ Adds course + prerequisites
    ↓ Returns updated malla
Frontend (Next.js)
    ↓ Renders all courses + visualization
```

## 🔑 Conceptos Clave

### Separación de Responsabilidades

| Componente | Responsabilidad |
|-----------|----------------|
| **Flask** | API REST, gestión de malla, orquestación |
| **FastAPI** | Análisis complejo, validaciones, recomendaciones IA |
| **Next.js** | UI interactiva, visualización, experiencia usuario |

### Por qué FastAPI como Microservicio

1. **Rendimiento**: Más rápido que Flask para tareas de análisis
2. **Validación de datos**: Pydantic integrado
3. **Documentación automática**: Swagger/OpenAPI
4. **Escalabilidad**: Fácil de dockerizar
5. **Integraciones**: Ideal para ML/IA en el futuro

## 📈 Uso de la Aplicación

### Paso 1: Agregar Cursos (Nivel 1)
1. Ve al tab "Nivel 1: Drag & Drop"
2. Arrastra un curso desde el panel izquierdo
3. Suelta en el área de diseño
4. El curso aparecerá en la posición

### Paso 2: Con Prerequisitos (Nivel 2)
1. Ve al tab "Nivel 2: Con Prerequisitos"
2. Arrastra un curso con prerequisitos (⚠️ indicador)
3. El sistema automáticamente:
   - Analiza los requisitos
   - Agrega los prerequisitos necesarios
   - Calcula la carga académica

### Estadísticas en Tiempo Real
- Total de cursos y créditos
- Carga académica (Ligera/Normal/Pesada)
- Validación del plan
- Recomendaciones del sistema

## 🔬 Comparación de Stacks

### Flask + FastAPI (Esta PoC)
✅ **Ventajas:**
- Un lenguaje (Python) simplifica desarrollo
- Compartir modelos y lógica
- Fácil integración con IA/ML

❌ **Desventajas:**
- Dos procesos diferentes a mantener
- Menor rendimiento en operaciones complejas

### Nest.js + FastAPI
✅ **Ventajas:**
- TypeScript en frontend y backend
- Type safety completo

❌ **Desventajas:**
- Dos lenguajes = más complejidad
- Menos integración con ecosistema Python (IA/ML)

## 🛠️ Desarrollo y Debugging

### Verificar servicios en ejecución
```bash
# Flask
curl http://localhost:5000/health

# FastAPI
curl http://localhost:8001/

# Next.js
curl http://localhost:3000
```

### Logs útiles
```bash
# Flask con debug
flask run --debug

# FastAPI
uvicorn main:app --reload --log-level debug
```

### Datos de prueba
Se incluyen 10 cursos preconfigurados:
- **Nivel 1**: PROG101, MATH101, MATH102 (sin requisitos)
- **Nivel 2**: PROG102, PROG103, BD101, WEB101 (con requisitos)
- **Nivel 3**: PROG104, BD102, WEB102 (requisitos complejos)

## 📚 Modelos de Datos

### Curso
```json
{
  "id": "PROG101",
  "nombre": "Introducción a la Programación",
  "codigo": "PROG101",
  "creditos": 3,
  "semestre": 1,
  "prerequisitos": [],
  "dificultad": "facil"
}
```

### MallaCurso
```json
{
  "id": "MALLA_PROG101_0",
  "curso_id": "PROG101",
  "posicion_x": 150,
  "posicion_y": 100,
  "semestre": 1
}
```

## 🔮 Próximas Mejoras

- [ ] Persistencia en base de datos real
- [ ] Autenticación y autorización
- [ ] Exportar malla a PDF
- [ ] Integración con sistema de calificaciones
- [ ] Recomendaciones basadas en IA
- [ ] Análisis de carga académica predictivo
- [ ] Soporte para múltiples programas académicos

## 📝 Notas de Desarrollo

### CORS Configuration
El frontend (localhost:3000) puede comunicarse con:
- Flask: `http://localhost:5000`
- FastAPI: `http://localhost:8001`

### API Timeouts
Las llamadas entre Flask y FastAPI tienen timeout de 5 segundos.
Aumentar si es necesario en `routes/malla.py`

### Variables de Entorno
Crear `.env` en `frontend/`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🤝 Conclusiones

Esta PoC demuestra que **Flask + FastAPI es una arquitectura viable** para:
- ✅ APIs REST tradicionales (Flask)
- ✅ Servicios de análisis/IA (FastAPI)
- ✅ Frontends modernos (Next.js)

**Recomendación:** Usar este stack cuando:
- Necesites análisis de datos o ML en Python
- Quieras mantener todo en un lenguaje (backend)
- Requieras escalabilidad mediante microservicios

---

**Versión:** 1.0.0  
**Fecha:** Enero 2026  
**Propósito:** Prueba de Concepto Educativa
