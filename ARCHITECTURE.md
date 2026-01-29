# 🏗️ Arquitectura del Proyecto

## Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                    MALLA ACADÉMICA PoC                          │
│              Flask + FastAPI + Next.js                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                   CAPA DE PRESENTACIÓN                           │
│                     NEXT.JS (Puerto 3000)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────┐           │
│  │  MallaDesign.tsx    │      │  Estadísticas.tsx   │           │
│  │  - Drag & Drop      │      │  - Análisis         │           │
│  │  - Canvas           │      │  - Validación       │           │
│  │  - Nivel 1 & 2      │      │  - Recomendaciones  │           │
│  └─────────────────────┘      └─────────────────────┘           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                                 ↑ axios/fetch
                         ┌───────┴────────┐
                         │                │
                    HTTP POST        HTTP GET
                         │                │
      ┌──────────────────┴─────────────────┴──────────────┐
      │                                                   │
      ↓                                                   ↓

┌────────────────────────────────────────────────────────────────┐
│                 CAPA DE LÓGICA DE NEGOCIO                      │
│                  FLASK (Puerto 5000)                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  cursos.py   │  │  malla.py    │  │   app.py     │        │
│  │  (Routes)    │  │  (Routes)    │  │  (Blueprint) │        │
│  │              │  │              │  │              │        │
│  │ GET /cursos  │  │ GET /mallas  │  │ register()   │        │
│  │ GET /cursos/ │  │ POST /cursos │  │              │        │
│  │   {id}       │  │ DELETE /...  │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│          ↑                   ↑                                 │
│          └─────────┬─────────┘                                │
│                    │                                          │
│            ┌───────▼────────┐                                 │
│            │  base_datos.py │                                 │
│            │  (DB Simulada) │                                 │
│            │                │                                 │
│            │ - CURSOS_DB    │                                 │
│            │ - MALLAS_DB    │                                 │
│            └────────────────┘                                 │
│                                                               │
└────────────────────────────────────────────────────────────────┘
         │               │
         │ HTTP POST     │
         │ /analizar-    │
         │ prerequisitos │
         │               │
         │               ↓

┌────────────────────────────────────────────────────────────────┐
│         CAPA DE MICROSERVICIOS (ANÁLISIS & IA)                │
│            FASTAPI (Puerto 8001)                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────┐    ┌──────────────────────┐         │
│  │ analizar-            │    │ estadisticas-malla   │         │
│  │ prerequisitos        │    │                      │         │
│  │                      │    │ - Calcula créditos   │         │
│  │ - Busca prerequisitos│    │ - Carga académica    │         │
│  │ - Identifica faltantes│   │ - Análisis de datos  │         │
│  │ - Calcula complejidad│    │                      │         │
│  └──────────────────────┘    └──────────────────────┘         │
│                                                                │
│  ┌──────────────────────────────────────────┐                │
│  │ validar-plan-estudios                   │                │
│  │                                          │                │
│  │ - Valida prerequisitos globales         │                │
│  │ - Genera recomendaciones (IA)           │                │
│  │ - Verifica carga académica              │                │
│  └──────────────────────────────────────────┘                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
         │
         │ Response JSON (análisis)
         │
         ↓
        Flask (agrega datos + cursos)
         │
         ↓
      Next.js (renderiza UI)
```

---

## Flujo de Datos: Nivel 1 (Drag & Drop Simple)

```
Usuario arrastra curso
        │
        ↓
Next.js detecta drop
        │
        ├─→ POST /api/mallas/{id}/cursos
        │   - curso_id
        │   - posicion_x, posicion_y
        │   - semestre
        │
        ↓
Flask Backend
        │
        ├─→ Valida datos
        ├─→ Busca curso en CURSOS_DB
        ├─→ Agrega a malla en memoria
        │
        ↓
Response JSON
        │
        ├─→ { exito: true, curso: {...} }
        │
        ↓
Next.js actualiza UI
        │
        ↓
Canvas renderiza tarjeta de curso
```

---

## Flujo de Datos: Nivel 2 (Con Análisis de Prerequisitos)

```
Usuario arrastra curso
        │
        ↓
Next.js detecta drop
        │
        ├─→ POST /api/mallas/{id}/cursos-con-prerequisitos
        │   - curso_id
        │   - posicion_x, posicion_y
        │   - semestre
        │
        ↓
Flask Backend
        │
        ├─→ Valida datos
        ├─→ Llama a FastAPI
        │
        ↓
FastAPI Microservicio
        │
        ├─→ POST /analizar-prerequisitos
        ├─→ Obtiene curso del CURSOS_DB
        ├─→ Identifica prerequisitos
        ├─→ Analiza faltantes
        ├─→ Calcula complejidad
        │
        ↓
Response JSON (análisis)
        │
        {
          "curso_id": "WEB102",
          "tiene_prerequisitos": true,
          "prerequisitos": [
            {
              "id": "WEB101",
              "nombre": "...",
              "presente_en_malla": false
            },
            {
              "id": "BD101",
              "nombre": "...",
              "presente_en_malla": false
            }
          ],
          "analisis_complejidad": {...}
        }
        │
        ↓
Flask Backend
        │
        ├─→ Agrega curso principal
        ├─→ Agrega prerequisitos faltantes
        ├─→ Posiciona automáticamente
        │
        ↓
Response JSON
        │
        {
          "exito": true,
          "curso_principal": {...},
          "prerequisitos_agregados": [...],
          "analisis": {...}
        }
        │
        ↓
Next.js actualiza UI
        │
        ├─→ Renderiza curso principal
        ├─→ Renderiza prerequisitos
        ├─→ Actualiza estadísticas
        ├─→ Muestra recomendaciones
        │
        ↓
Canvas muestra toda la estructura
```

---

## Stack de Tecnologías

### Backend (Python)
```
Flask 3.0.0
├── Flask-CORS (comunicación frontend)
├── Werkzeug 3.0.1
└── requests (llamadas a FastAPI)

FastAPI 0.104.1
├── uvicorn (servidor ASGI)
├── Pydantic (validación)
└── python-multipart
```

### Frontend (TypeScript/React)
```
Next.js 14.0.0
├── React 18.2.0
├── Tailwind CSS 3.3.0
├── axios (cliente HTTP)
└── TypeScript 5.2.0
```

---

## Estructura de Módulos Python

```
backend/
│
├── app/
│   └── app.py              # Flask app + blueprints
│
├── models/
│   ├── modelos.py          # Dataclasses (Curso, Malla, etc)
│   └── base_datos.py       # DB simulada + operaciones
│
├── routes/
│   ├── cursos.py           # Blueprint cursos
│   └── malla.py            # Blueprint malla
│
└── wsgi.py                 # Entry point

microservicios/fastapi_analytics/
│
└── main.py                 # FastAPI app + endpoints
```

---

## Patrones de Comunicación

### 1. Comunicación Síncrona (Flask ↔ FastAPI)
```python
# Flask llama a FastAPI
response = requests.post(
    'http://localhost:8001/analizar-prerequisitos',
    json={...},
    timeout=5
)
```

### 2. CORS Configuration
```python
# Flask permite requests desde:
- http://localhost:3000 (Next.js)
- http://localhost:8000
```

### 3. Manejo de Errores
```
Next.js → Flask → FastAPI
   ↓       ↓        ↓
 200/404  200/404  200/404
   ↓       ↓        ↓
JSON Response propagado al cliente
```

---

## Ventajas de esta Arquitectura

| Aspecto | Ventaja |
|--------|---------|
| **Un Lenguaje (Python)** | Reutilizar modelos entre Flask y FastAPI |
| **Separación de Concerns** | Flask API + FastAPI Análisis |
| **Escalabilidad** | FastAPI puede crecer independientemente |
| **Performance** | FastAPI es más rápido para tareas pesadas |
| **Integración IA/ML** | Fácil agregar librerías Python (numpy, sklearn) |
| **Frontend Moderno** | Next.js + TypeScript + Tailwind |

---

## Comparación con Alternativas

### vs Nest.js + FastAPI
```
Flask + FastAPI:
  ✅ Un lenguaje (Python)
  ✅ Modelos compartidos
  ❌ Menos type safety

Nest.js + FastAPI:
  ✅ TypeScript completo
  ❌ Dos lenguajes
  ❌ Menos integración Python
```

### vs Monolito Django
```
Flask + FastAPI:
  ✅ Microservicios
  ✅ Mayor escalabilidad
  ❌ Más complejo

Django:
  ✅ Todo en uno
  ✅ Más simple
  ❌ Menos escalable
```

---

## Deployment (Futuro)

```
Docker
  ├── Container Flask (puerto 5000)
  ├── Container FastAPI (puerto 8001)
  └── Container Next.js (puerto 3000)

Kubernetes (escalado)
  ├── Pod Flask (replicas)
  ├── Pod FastAPI (replicas)
  └── Pod Next.js (replicas)
```

---

**Versión:** 1.0.0  
**Actualizado:** Enero 2026
