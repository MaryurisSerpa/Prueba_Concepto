# 🧪 Testing y Validación - Malla Académica PoC

## Verificación Manual de la PoC

### 1. Verificar Conexión de Servicios

```powershell
# Terminal auxiliar - Verificar Flask
curl http://localhost:5000/health
# Respuesta esperada:
# {"status":"healthy","service":"malla-academica-backend"}

# Verificar FastAPI
curl http://localhost:8001/
# Respuesta esperada:
# {"mensaje":"Microservicio de Análisis..."}

# Verificar Next.js
curl http://localhost:3000
# Respuesta esperada: HTML page
```

---

## 2. Testear Flask Backend

### 2.1 Obtener Cursos

```bash
GET http://localhost:5000/api/cursos

# Respuesta esperada:
{
  "exito": true,
  "total": 10,
  "cursos": [
    {
      "id": "PROG101",
      "nombre": "Introducción a la Programación",
      "codigo": "PROG101",
      "creditos": 3,
      "semestre": 1,
      "prerequisitos": [],
      "dificultad": "facil"
    },
    ...
  ]
}
```

### 2.2 Obtener Malla

```bash
GET http://localhost:5000/api/mallas/MALLA001

# Respuesta esperada:
{
  "exito": true,
  "malla": {
    "id": "MALLA001",
    "nombre": "Ingeniería de Sistemas",
    "programa": "Ingeniería de Sistemas",
    "cursos": [],
    "descripcion": "..."
  }
}
```

### 2.3 Agregar Curso (Nivel 1)

```bash
POST http://localhost:5000/api/mallas/MALLA001/cursos

Body:
{
  "curso_id": "PROG101",
  "posicion_x": 150,
  "posicion_y": 100,
  "semestre": 1
}

# Respuesta esperada:
{
  "exito": true,
  "mensaje": "Curso agregado a la malla",
  "curso": {
    "id": "MALLA_PROG101_0",
    "curso_id": "PROG101",
    "posicion_x": 150,
    "posicion_y": 100,
    "semestre": 1
  }
}
```

### 2.4 Agregar Curso con Prerequisitos (Nivel 2)

```bash
POST http://localhost:5000/api/mallas/MALLA001/cursos-con-prerequisitos

Body:
{
  "curso_id": "WEB102",
  "posicion_x": 300,
  "posicion_y": 200,
  "semestre": 4
}

# Respuesta esperada (múltiples cursos):
{
  "exito": true,
  "mensaje": "Curso y sus prerequisitos agregados",
  "curso_principal": {...},
  "prerequisitos_agregados": [
    {"id": "MALLA_WEB101_1", "curso_id": "WEB101", ...},
    {"id": "MALLA_BD101_2", "curso_id": "BD101", ...}
  ],
  "analisis": {...}
}
```

### 2.5 Eliminar Curso

```bash
DELETE http://localhost:5000/api/mallas/MALLA001/cursos/MALLA_PROG101_0

# Respuesta esperada:
{
  "exito": true,
  "mensaje": "Curso eliminado de la malla"
}
```

---

## 3. Testear FastAPI Microservicio

### 3.1 Documentación Interactiva

```
Abre en el navegador: http://localhost:8001/docs
```

Aquí puedes testear todos los endpoints directamente.

### 3.2 Analizar Prerequisitos

```bash
POST http://localhost:8001/analizar-prerequisitos

Body:
{
  "curso_id": "WEB102",
  "malla_id": "MALLA001",
  "posicion_x": 300,
  "posicion_y": 200,
  "semestre": 4
}

# Respuesta esperada:
{
  "curso_id": "WEB102",
  "curso_nombre": "Desarrollo Web Backend",
  "tiene_prerequisitos": true,
  "prerequisitos": [
    {
      "id": "WEB101",
      "nombre": "Desarrollo Web Frontend",
      "codigo": "WEB101",
      "creditos": 3,
      "dificultad": "intermedio",
      "presente_en_malla": false
    },
    {
      "id": "BD101",
      "nombre": "Bases de Datos I",
      "codigo": "BD101",
      "creditos": 3,
      "dificultad": "intermedio",
      "presente_en_malla": false
    }
  ],
  "analisis_complejidad": {
    "nivel_prerequisitos": 2,
    "prerequisitos_faltantes": 2,
    "creditos_requeridos": 6,
    "puede_agregarse": false
  }
}
```

### 3.3 Estadísticas de Malla

```bash
GET http://localhost:8001/estadisticas-malla/MALLA001

# Respuesta esperada (con cursos en la malla):
{
  "total_cursos_malla": 3,
  "total_creditos": 10,
  "promedio_creditos_semestre": 3.33,
  "cursos_por_dificultad": {
    "facil": 1,
    "intermedio": 2,
    "difícil": 0
  },
  "carga_academica": "Ligera"
}
```

### 3.4 Validar Plan de Estudios

```bash
POST http://localhost:8001/validar-plan-estudios/MALLA001

# Respuesta esperada:
{
  "malla_id": "MALLA001",
  "validaciones": {
    "tiene_cursos_basicos": true,
    "tiene_cursos_intermedios": true,
    "tiene_especializacion": false,
    "prerequisitos_validos": true,
    "total_creditos": 10,
    "total_semestres": 2
  },
  "es_plan_valido": true,
  "recomendaciones": [
    "Agregue cursos de especialización como Desarrollo Web o Algoritmos Avanzados",
    "El plan tiene pocos créditos. Considere agregar más cursos."
  ]
}
```

---

## 4. Testear Frontend Next.js

### Test Manual en Navegador

#### 4.1 Página carga correctamente
- [ ] Abre http://localhost:3000
- [ ] Se muestra "Bienvenido a Malla Académica"
- [ ] Panel lateral muestra cursos disponibles
- [ ] Área de diseño está en blanco

#### 4.2 Drag & Drop Nivel 1
- [ ] Click en "Nivel 1: Drag & Drop"
- [ ] Arrastra "Introducción a la Programación"
- [ ] Suelta en el área blanca
- [ ] Curso aparece como tarjeta azul
- [ ] Panel actualiza estadísticas

#### 4.3 Drag & Drop Nivel 2
- [ ] Click en "Nivel 2: Con Prerequisitos"
- [ ] Arrastra "Desarrollo Web Backend" (tiene ⚠️)
- [ ] El sistema agrega automáticamente:
  - [ ] WEB101 (prerequisito)
  - [ ] BD101 (prerequisito)
  - [ ] WEB102 (curso principal)
- [ ] Tarjetas posicionadas automáticamente
- [ ] Panel muestra análisis

#### 4.4 Eliminar Curso
- [ ] Pasa mouse sobre una tarjeta
- [ ] Haz click en la "×"
- [ ] Curso desaparece
- [ ] Estadísticas actualizan

#### 4.5 Estadísticas
- [ ] Mostrar créditos totales
- [ ] Mostrar carga académica
- [ ] Mostrar recomendaciones

---

## 5. Casos de Prueba Específicos

### Caso 1: Árbol de Prerequisitos Profundo

```
Agregar: PROG104 (Algoritmos Avanzados)
├── Requiere: PROG103 (Estructuras de Datos)
│   ├── Requiere: PROG101 (Intro a Programación)
│   └── Requiere: [sin más]
└── [sin más]

Resultado esperado:
- 3 cursos agregados automáticamente
- Posicionados en cascada
- Todos los semestres asignados correctamente
```

### Caso 2: Prerequisitos Múltiples

```
Agregar: WEB102 (Web Backend)
├── Requiere: WEB101 (Web Frontend)
│   ├── Requiere: PROG102 (POO)
│   └── [sin más]
└── Requiere: BD101 (Bases Datos I)
    ├── Requiere: PROG101 (Intro Prog)
    └── [sin más]

Resultado esperado:
- 5 cursos agregados automáticamente
- Todos con dependencias correctas
- Plan de estudios válido
```

### Caso 3: Curso sin Prerequisitos

```
Agregar: MATH101 (Cálculo I)
- Sin prerequisitos

Resultado esperado:
- 1 curso agregado
- Ningún prerequisito agregado
- Análisis muestra: "tiene_prerequisitos": false
```

### Caso 4: Validación de Plan

```
Pasos:
1. Agregar: PROG101, MATH101
2. Verificar panel de validación
3. Agregar: PROG102
4. Verificar que PROG101 está presente (puede agregarse)

Resultado esperado:
- Plan válido cuando todos los prerequisitos están presentes
- Recomendaciones apropiadas basadas en el contenido
```

---

## 6. Pruebas de Error

### 6.1 Curso no existe

```bash
POST http://localhost:5000/api/mallas/MALLA001/cursos

Body:
{
  "curso_id": "FAKE999",
  "posicion_x": 100,
  "posicion_y": 100,
  "semestre": 1
}

# Respuesta esperada:
{
  "exito": false,
  "error": "Curso no encontrado"
}
# Status: 404
```

### 6.2 Malla no existe

```bash
GET http://localhost:5000/api/mallas/FAKE999

# Respuesta esperada:
{
  "exito": false,
  "error": "Malla no encontrada"
}
# Status: 404
```

### 6.3 Datos inválidos

```bash
POST http://localhost:5000/api/mallas/MALLA001/cursos

Body:
{
  "curso_id": "PROG101",
  "posicion_x": "abc",  # ← Inválido
  "posicion_y": 100,
  "semestre": 1
}

# Respuesta esperada:
{
  "exito": false,
  "error": "Datos inválidos"
}
# Status: 400
```

### 6.4 FastAPI no responde

```
Si FastAPI está caído y intentas Nivel 2:

# Respuesta esperada:
{
  "exito": false,
  "error": "Error conectando con microservicio: ..."
}
# Status: 503
```

---

## 7. Checklist de Validación

### ✅ Backend (Flask)
- [ ] Servidor inicia en puerto 5000
- [ ] CORS habilitado
- [ ] GET /api/cursos devuelve 10 cursos
- [ ] GET /api/mallas/MALLA001 devuelve malla vacía
- [ ] POST agregar curso funciona
- [ ] POST agregar con prerequisitos llama a FastAPI
- [ ] DELETE elimina curso
- [ ] PUT actualiza posición

### ✅ Microservicio (FastAPI)
- [ ] Servidor inicia en puerto 8001
- [ ] Documentación en /docs funciona
- [ ] POST /analizar-prerequisitos funciona
- [ ] GET /estadisticas-malla devuelve stats
- [ ] POST /validar-plan-estudios devuelve validaciones
- [ ] CORS permite comunicación con Flask

### ✅ Frontend (Next.js)
- [ ] Página carga en localhost:3000
- [ ] Detecta servicios activos
- [ ] Drag & Drop Nivel 1 funciona
- [ ] Drag & Drop Nivel 2 funciona
- [ ] Estadísticas se actualizan
- [ ] Panel de recomendaciones funciona

### ✅ Integración
- [ ] Flask ↔ FastAPI comunican
- [ ] Next.js ↔ Flask comunican
- [ ] Datos se propagan correctamente
- [ ] Errores se manejan gracefully

---

## 8. Performance Esperado

| Operación | Tiempo Esperado |
|-----------|-----------------|
| GET /cursos | < 50ms |
| POST agregar curso (Nivel 1) | < 100ms |
| POST con prerequisitos (Nivel 2) | < 500ms |
| Drag & Drop UI | < 16ms (60 FPS) |

---

## 9. Datos de Prueba Recomendados

### Orden de prueba (básico → avanzado)

1. **PROG101** - Sin prerequisitos ✅ Básico
2. **MATH101** - Sin prerequisitos ✅ Básico
3. **PROG102** - Requiere PROG101 ✅ Intermedio
4. **BD101** - Requiere PROG101 ✅ Intermedio
5. **WEB101** - Requiere PROG102 ✅ Intermedio
6. **WEB102** - Requiere WEB101 + BD101 ✅ Avanzado
7. **PROG104** - Requiere PROG103 ✅ Avanzado

---

## 10. Problemas Conocidos y Soluciones

### Problema: "puerto ya en uso"

```powershell
# Encontrar proceso en puerto 5000
netstat -ano | findstr :5000

# Matar proceso
taskkill /PID <numero> /F
```

### Problema: "ModuleNotFoundError"

```powershell
# Verificar que está en venv
where python

# Reinstalar dependencias
pip install -r requirements.txt
```

### Problema: CORS error

```
Error: "Access to XMLHttpRequest blocked by CORS policy"

Solución: 
- Verificar Flask tiene CORS habilitado
- Verificar URL en frontend es correcta
- Revisar configuración en app.py
```

### Problema: FastAPI no responde

```
Error: "Error conectando con microservicio"

Solución:
- Verificar FastAPI está en puerto 8001
- Verificar firewall no bloquea localhost:8001
- Revisar logs del servidor FastAPI
```

---

## 11. Automatización de Tests (Futuro)

```python
# pytest - Tests unitarios
def test_agregar_curso():
    response = client.post('/api/mallas/MALLA001/cursos', ...)
    assert response.status_code == 201

# selenium - Tests E2E
def test_drag_and_drop():
    driver.get('http://localhost:3000')
    # Drag & Drop actions...
```

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2026
