## Guía de Ejecución - Malla Académica PoC

### Descripción General
Este es un proyecto de Prueba de Concepto que compara dos stacks:
- **Flask + FastAPI + Next.js** (Esta PoC)
- **Nest.js + FastAPI** (Referencia)

La arquitectura utiliza:
1. **Flask (Puerto 5000)**: Backend principal REST API
2. **FastAPI (Puerto 8001)**: Microservicio para análisis y prerequisitos
3. **Next.js (Puerto 3000)**: Frontend moderno

### ¿Por qué esta arquitectura?
- ✅ Mismo lenguaje Python para Flask y FastAPI permite compartir modelos
- ✅ FastAPI es ideal para análisis de datos e IA
- ✅ Separación clara de responsabilidades
- ✅ Comparación práctica con Nest.js

---

## 🚀 Ejecución Rápida (RECOMENDADO)

### Opción 1: Tres terminales separadas (mejor para desarrollo)

**Terminal 1 - Flask Backend (Puerto 5000)**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python wsgi.py
```

**Terminal 2 - FastAPI Microservicio (Puerto 8001)**
```bash
cd microservicios/fastapi_analytics
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

**Terminal 3 - Next.js Frontend (Puerto 3000)**
```bash
cd frontend
npm install
npm run dev
```

Accede en: **http://localhost:3000**

---

### Opción 2: Script unificado (más simple)
```bash
python run_all.py
```
(Requiere que npm esté en PATH)

---

## 📋 Estructura de Archivos

```
Prueba_Malla/
├── backend/                          # Flask (Puerto 5000)
│   ├── app/app.py                   # Aplicación principal
│   ├── models/
│   │   ├── modelos.py               # Dataclasses
│   │   └── base_datos.py            # Datos simulados
│   ├── routes/
│   │   ├── cursos.py                # Endpoints de cursos
│   │   └── malla.py                 # Endpoints de malla
│   ├── requirements.txt
│   └── wsgi.py                      # Entry point
│
├── microservicios/fastapi_analytics/ # FastAPI (Puerto 8001)
│   ├── main.py                      # Microservicio
│   └── requirements.txt
│
├── frontend/                         # Next.js (Puerto 3000)
│   ├── app/page.tsx                 # Página principal
│   ├── components/                  # Componentes React
│   ├── lib/                         # Utilidades
│   ├── styles/                      # CSS
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                        # Documentación completa
```

---

## 🎮 Uso de la Aplicación

### Nivel 1: Drag & Drop Simple
1. Selecciona el tab "Nivel 1: Drag & Drop"
2. Arrastra un curso desde el panel izquierdo
3. Suelta en el área de diseño
4. El curso aparecerá en la posición

### Nivel 2: Con Detección de Prerequisitos
1. Selecciona el tab "Nivel 2: Con Prerequisitos"
2. Arrastra un curso (especialmente los con ⚠️)
3. El sistema:
   - Analiza los prerequisitos automáticamente
   - Agrega los cursos requeridos
   - Calcula la carga académica
   - Muestra recomendaciones

---

## 🔌 Endpoints Principales

### Flask Backend (5000)
```
GET  /                                      # Info del servicio
GET  /health                                # Health check
GET  /api/cursos                            # Lista de cursos
GET  /api/cursos/{id}                       # Detalles de curso
GET  /api/mallas/{id}                       # Obtener malla
POST /api/mallas/{id}/cursos                # Agregar curso (Nivel 1)
POST /api/mallas/{id}/cursos-con-prerequisitos  # Con análisis (Nivel 2)
PUT  /api/mallas/{id}/cursos/{curso_id}   # Actualizar posición
DELETE /api/mallas/{id}/cursos/{curso_id} # Eliminar curso
```

### FastAPI Microservicio (8001)
```
GET  /                                      # Info del servicio
POST /analizar-prerequisitos                # Análisis (llamado por Flask)
GET  /estadisticas-malla/{id}              # Estadísticas
POST /validar-plan-estudios/{id}           # Validaciones
GET  /docs                                  # Swagger UI (interfaz interactiva)
```

---

## ✅ Verificar que todo funciona

```bash
# En otra terminal, prueba los servicios:

# Flask
curl http://localhost:5000/health

# FastAPI
curl http://localhost:8001/

# Frontend (debería cargar)
curl http://localhost:3000
```

---

## 🔍 Características Implementadas

### ✅ Completado
- [x] Interfaz drag & drop
- [x] Agregación simple de cursos (Nivel 1)
- [x] Análisis de prerequisitos (Nivel 2)
- [x] Integración Flask + FastAPI
- [x] Estadísticas en tiempo real
- [x] Validación de planes
- [x] Panel de control

### 📋 Datos Incluidos
- 10 cursos preconfigurados (PROG, MATH, BD, WEB)
- 1 malla académica (MALLA001)
- Prerequisitos complejos para pruebas

---

## 🛠️ Desarrollo y Debugging

### Logs útiles

**Flask con debug:**
```bash
cd backend
python -m flask run --debug
```

**FastAPI con logs:**
```bash
cd microservicios/fastapi_analytics
python -m uvicorn main:app --reload --log-level debug
```

### Problemas comunes

**Error: "Puerto ya en uso"**
- Cambia el puerto: `python -m uvicorn main:app --reload --port 8002`
- O mata el proceso anterior: `lsof -ti:5000 | xargs kill -9` (Linux/Mac)

**Error: "Módulo no encontrado"**
- Verifica que estés en el entorno virtual correcto
- Reinstala dependencias: `pip install -r requirements.txt`

---

## 📊 Comparación de Stacks

### Flask + FastAPI (Esta PoC)
✅ Un lenguaje (Python)  
✅ Compartir modelos fácilmente  
✅ Ideal para IA/ML  
❌ Dos procesos a mantener  

### Nest.js + FastAPI
✅ TypeScript completo  
❌ Dos lenguajes  
❌ Menos integración Python  

---

## 🚀 Próximas Mejoras

- [ ] Persistencia en BD real
- [ ] Autenticación
- [ ] Exportar a PDF
- [ ] Recomendaciones IA avanzadas
- [ ] Dockerizar servicios
- [ ] Tests automatizados

---

## 📞 Soporte

Para más información, consulta [README.md](README.md) en la raíz del proyecto.

**Versión:** 1.0.0  
**Última actualización:** Enero 2026
