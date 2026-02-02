# Malla Académica - Prueba de Concepto

Sistema interactivo de diseño de malla académica con **backends independientes** en Flask y FastAPI, compartiendo el mismo frontend Next.js para comparación directa de tecnologías.

## 🎯 Objetivos de la Prueba de Concepto

### Comparación: Flask vs FastAPI

Esta PoC implementa **DOS backends completamente independientes** con las mismas rutas:

1. **Backend Flask** (Puerto 5000): Python tradicional, síncrono
2. **Backend FastAPI** (Puerto 8002): Python moderno, asíncrono  
3. **Frontend Next.js** (Puerto 3000): Selector para cambiar entre backends

### Por qué esta arquitectura

- ✅ **Comparación real** de dos tecnologías Python populares
- ✅ **Backends autónomos** sin dependencias entre ellos
- ✅ **Mismo frontend** permite evaluación objetiva
- ✅ **Cambio dinámico** entre backends sin recargar página
- ✅ **Lógica completa** en cada backend (prerequisitos integrados)

## ✨ Características

### Drag & Drop con Validación
- 👋 Interfaz interactiva para arrastrar cursos
- 📊 Cálculo automático de créditos y horas por nivel
- ❌ Validación de duplicidad de cursos
- 🗑️ Eliminar cursos de la malla
- 🔄 Mover cursos entre niveles con validación

### Análisis de Prerequisitos (Integrado en cada backend)
- 🌳 Análisis recursivo de prerequisitos (árbol completo)
- ➕ Agregación automática de cursos prerequisitos faltantes
- 📏 Auto-ajuste de niveles según profundidad de prerequisitos
- 🚫 Validación al mover cursos (no pueden ir antes de sus prerequisitos)

### Configuración
- ✏️ Nombre de malla editable (auto-guardado)
- 🎚️ Créditos del programa (36/48/60/72)
- 📊 Número de niveles (4/6/8/10)
- 📅 Periodo de vigencia

## 🏛️ Arquitectura del Proyecto

```
Prueba_Malla/
├── backend/                    # Flask Backend (Puerto 5000)
│   ├── app/
│   │   └── app.py             # Aplicación Flask principal
│   ├── models/
│   │   ├── modelos.py         # Dataclasses
│   │   └── base_datos.py      # Datos simulados
│   ├── routes/
│   │   ├── cursos.py          # Endpoints de cursos
│   │   └── malla.py           # Endpoints malla + prerequisitos
│   ├── requirements.txt
│   └── wsgi.py                # Entry point
│
├── backend_fastapi/            # FastAPI Backend (Puerto 8002)
│   ├── main.py                # Backend completo con prerequisitos
│   └── requirements.txt
│
├── frontend/                   # Next.js Frontend (Puerto 3000)
│   ├── app/
│   │   ├── layout.tsx         # Layout raíz
│   │   └── page.tsx           # Página principal con selector
│   ├── components/
│   │   ├── MallaDesign.tsx    # Componente principal
│   │   ├── CursoItem.tsx      # Tarjeta de curso
│   │   ├── CursosDisponibles.tsx
│   │   └── Estadisticas.tsx
│   ├── lib/
│   │   ├── api.ts             # Cliente HTTP dinámico
│   │   └── types.ts           # TypeScript types
│   └── styles/
│       └── globals.css        # Estilos globales (paleta gris-azul)
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
- `GET /health` - Health check
- `GET /api/cursos` - Lista de cursos
- `GET /api/cursos/{id}` - Detalles de curso
- `GET /api/mallas/{id}` - Obtener malla
- `PUT /api/mallas/{id}` - Actualizar malla (nombre, créditos, etc)
- `POST /api/mallas/{id}/cursos-con-prerequisitos` - Agregar con análisis recursivo
- `PUT /api/mallas/{id}/cursos/{curso_id}` - Actualizar posición
- `DELETE /api/mallas/{id}/cursos/{curso_id}` - Eliminar curso

### 2️⃣ Backend FastAPI (Puerto 8002)

```bash
cd backend_fastapi
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8002
```

**Endpoints disponibles:** (Mismas rutas que Flask)
- `GET /` - Información del servicio
- `GET /health` - Health check
- `GET /api/cursos` - Lista de cursos
- `GET /api/cursos/{id}` - Detalles de curso
- `GET /api/mallas/{id}` - Obtener malla
- `PUT /api/mallas/{id}` - Actualizar malla
- `POST /api/mallas/{id}/cursos-con-prerequisitos` - Agregar con análisis recursivo
- `PUT /api/mallas/{id}/cursos/{curso_id}` - Actualizar posición
- `DELETE /api/mallas/{id}/cursos/{curso_id}` - Eliminar curso

Documentación interactiva: `http://localhost:8002/docs`

### 3️⃣ Frontend Next.js (Puerto 3000)

```bash
cd frontend
npm install
npm run dev
```

Accede en: `http://localhost:3000`

**Selector de Backend:** En el header encontrarás botones para cambiar entre Flask y FastAPI.

## 📊 Flujo de Datos

### Con Análisis de Prerequisitos
```
Frontend (Next.js)
    ↓ User drags course with prerequisites
    ↓ POST /api/mallas/{id}/cursos-con-prerequisitos
Backend (Flask o FastAPI) - Seleccionado por el usuario
    ↓ Analiza prerequisitos recursivamente
    ↓ Calcula nivel mínimo
    ↓ Agrega prerequisitos faltantes
    ↓ Valida y ajusta niveles
    ↓ Returns updated malla
Frontend (Next.js)
    ↓ Renders all courses in correct levels
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
