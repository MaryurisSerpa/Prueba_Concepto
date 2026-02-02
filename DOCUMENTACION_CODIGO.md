# 📚 Documentación del Código - Malla Académica PoC

## 🎯 Resumen General

Este proyecto es un diseñador de mallas académicas con:
- **Backend Flask** (Puerto 5000): API REST para gestión de cursos y mallas
- **Backend FastAPI** (Puerto 8002): Backend alternativo con misma funcionalidad
- **Frontend Next.js** (Puerto 3001): Interfaz drag & drop moderna

---

## 🔵 BACKEND FLASK

### 📁 `backend/app/app.py`
**Propósito:** Aplicación principal Flask, punto de entrada del servidor

#### Funciones:

**`index()`**
- **Qué hace:** Muestra información del API (bienvenida y endpoints disponibles)
- **Ruta:** GET `/`
- **Retorna:** JSON con mensaje, versión y lista de endpoints

**`health()`**
- **Qué hace:** Verifica que el servidor está funcionando (health check)
- **Ruta:** GET `/health`
- **Retorna:** Status "healthy"

**`not_found(error)`**
- **Qué hace:** Maneja errores 404 (rutas no encontradas)
- **Retorna:** JSON con mensaje de error

**`internal_error(error)`**
- **Qué hace:** Maneja errores 500 (errores internos del servidor)
- **Retorna:** JSON con mensaje de error

---

### 📁 `backend/routes/cursos.py`
**Propósito:** Rutas para gestión de cursos

#### Funciones:

**`obtener_cursos()`**
- **Qué hace:** Lista todos los cursos disponibles en el sistema
- **Ruta:** GET `/api/cursos`
- **Retorna:** Array de cursos con código, nombre, créditos, prerequisitos, etc.

**`obtener_curso(curso_id)`**
- **Qué hace:** Obtiene los detalles de un curso específico
- **Ruta:** GET `/api/cursos/{curso_id}`
- **Ejemplo:** `/api/cursos/PROG101`
- **Retorna:** Objeto del curso o error 404 si no existe

---

### 📁 `backend/routes/malla.py`
**Propósito:** Rutas para gestión de mallas académicas

#### Funciones Auxiliares:

**`obtener_prerequisitos_recursivos(curso_id, visitados)`**
- **Qué hace:** Obtiene TODOS los prerequisitos de un curso de forma recursiva
- **Ejemplo:** Si agregas "Desarrollo Web Backend", necesita "Bases de Datos", que a su vez necesita "Programación"
- **Retorna:** Lista de prerequisitos con su profundidad (nivel de dependencia)

**`calcular_nivel_minimo(curso_id)`**
- **Qué hace:** Calcula en qué nivel (semestre) mínimo puede ubicarse un curso según sus prerequisitos
- **Lógica:** Si un curso requiere 3 prerequisitos en cadena, debe ir mínimo en nivel 4
- **Retorna:** Número de nivel mínimo

#### Rutas Principales:

**`obtener_malla(malla_id)`**
- **Qué hace:** Obtiene una malla académica completa con todos sus cursos
- **Ruta:** GET `/api/mallas/{malla_id}`
- **Retorna:** Objeto de malla con cursos, créditos totales, nombre, etc.

**`actualizar_malla(malla_id)`**
- **Qué hace:** Actualiza metadatos de la malla (nombre, créditos programa, niveles)
- **Ruta:** PUT `/api/mallas/{malla_id}`
- **Recibe:** JSON con nombre, creditos_programa, numero_niveles, estado
- **Uso:** Cuando guardas la configuración de la malla

**`agregar_curso_malla(malla_id)`**
- **Qué hace:** Agrega un curso simple a la malla (Nivel 1: drag & drop básico)
- **Ruta:** POST `/api/mallas/{malla_id}/cursos`
- **Recibe:** curso_id, posicion_x, posicion_y, semestre
- **Retorna:** Curso agregado con ID único

**`agregar_curso_con_prerequisitos(malla_id)`**
- **Qué hace:** Agrega un curso Y TODOS sus prerequisitos automáticamente (Nivel 2: inteligente)
- **Ruta:** POST `/api/mallas/{malla_id}/cursos-con-prerequisitos`
- **Lógica:** 
  1. Analiza prerequisitos del curso
  2. Agrega los prerequisitos primero en niveles anteriores
  3. Agrega el curso principal
- **Retorna:** Lista de todos los cursos agregados

**`actualizar_posicion_curso(malla_id, curso_malla_id)`**
- **Qué hace:** Actualiza posición o nivel de un curso ya agregado
- **Ruta:** PUT `/api/mallas/{malla_id}/cursos/{curso_malla_id}`
- **Uso:** Cuando mueves un curso en la interfaz

**`eliminar_curso_malla(malla_id, curso_malla_id)`**
- **Qué hace:** Elimina un curso de la malla
- **Ruta:** DELETE `/api/mallas/{malla_id}/cursos/{curso_malla_id}`
- **Retorna:** Confirmación de eliminación

---

### 📁 `backend/models/modelos.py`
**Propósito:** Define las estructuras de datos (dataclasses)

#### Clases:

**`Curso`**
- **Qué es:** Representa un curso académico
- **Campos:** id, nombre, codigo, creditos, semestre, descripcion, prerequisitos, dificultad, horas

**`MallaCurso`**
- **Qué es:** Representa un curso colocado en una malla específica
- **Campos:** id, curso_id, posicion_x, posicion_y, semestre (nivel)

**`Malla`**
- **Qué es:** Representa una malla académica completa
- **Campos:** id, nombre, programa, cursos (lista de MallaCurso), creditos_programa, numero_niveles

---

### 📁 `backend/models/base_datos.py`
**Propósito:** Base de datos simulada en memoria (sin SQL)

#### Clase `BaseDatos`:

**`obtener_cursos()`**
- **Qué hace:** Retorna lista de todos los cursos disponibles
- **Datos:** 10 cursos preconfigurados (PROG101, MATH101, BD101, etc.)

**`obtener_curso(curso_id)`**
- **Qué hace:** Busca y retorna un curso por su ID
- **Retorna:** Objeto Curso o None si no existe

**`obtener_malla(malla_id)`**
- **Qué hace:** Busca y retorna una malla por su ID
- **Retorna:** Objeto Malla o None

**`agregar_curso_malla(...)`**
- **Qué hace:** Agrega un curso a una malla en memoria
- **Genera:** ID único para el curso en la malla (ej: MALLA_PROG101_0)
- **Retorna:** Tupla (curso_agregado, error)

**`actualizar_posicion_curso(...)`**
- **Qué hace:** Actualiza posición de un curso en la malla
- **Modifica:** posicion_x, posicion_y, semestre en memoria

**`eliminar_curso_malla(...)`**
- **Qué hace:** Elimina un curso de la malla en memoria
- **Retorna:** Tupla (exito, error)

---

## 🟢 BACKEND FASTAPI

### 📁 `backend_fastapi/main.py`
**Propósito:** Backend alternativo con FastAPI (misma funcionalidad que Flask)

#### Funciones Principales:

**`root()`**
- **Ruta:** GET `/`
- **Qué hace:** Muestra info del backend FastAPI

**`obtener_cursos()`**
- **Ruta:** GET `/api/cursos`
- **Qué hace:** Igual que Flask, lista todos los cursos

**`obtener_curso(curso_id)`**
- **Ruta:** GET `/api/cursos/{curso_id}`
- **Qué hace:** Obtiene un curso específico

**`obtener_malla(malla_id)`**
- **Ruta:** GET `/api/mallas/{malla_id}`
- **Qué hace:** Obtiene malla académica

**`agregar_curso_malla(malla_id, ...)`**
- **Ruta:** POST `/api/mallas/{malla_id}/cursos`
- **Qué hace:** Agrega curso simple

**`agregar_curso_con_prerequisitos(malla_id, ...)`**
- **Ruta:** POST `/api/mallas/{malla_id}/cursos-con-prerequisitos`
- **Qué hace:** Agrega curso con prerequisitos automáticamente

---

## ⚛️ FRONTEND NEXT.JS

### 📁 `frontend/app/page.tsx`
**Propósito:** Componente principal de la interfaz

#### Estados Principales:

**`backendActivo`**
- **Qué es:** Selector entre Flask (5000) o FastAPI (8002)
- **Uso:** Permite cambiar entre backends sin recargar

**`carrito`**
- **Qué es:** Lista de cursos seleccionados para agregar
- **Uso:** Panel horizontal arriba con cursos disponibles

**`cursosMalla`**
- **Qué es:** Objeto con cursos organizados por nivel
- **Estructura:** `{ 1: [curso1, curso2], 2: [curso3], ... }`

**`numeroniveles`**
- **Qué es:** Cantidad de niveles (semestres) de la malla
- **Rango:** 1-12 niveles

#### Funciones Principales:

**`useEffect()` - Verificación inicial**
- **Qué hace:** Al cargar, verifica que Flask y FastAPI estén activos
- **Muestra:** Estado de conexión (verde si OK, rojo si error)

**`cargarCursos()`**
- **Qué hace:** Obtiene lista de cursos desde el backend
- **Cuándo:** Al iniciar la app

**`cargarMalla()`**
- **Qué hace:** Obtiene la malla guardada y organiza cursos por nivel
- **Cuándo:** Al iniciar y después de cambios

**`agregarAlCarrito(curso)`**
- **Qué hace:** Agrega un curso al carrito (panel horizontal)
- **Verifica:** Que no esté ya en el carrito

**`handleDragStart(e, curso, mallaId)`**
- **Qué hace:** Inicia el drag (arrastrar) de un curso
- **Guarda:** Información del curso en el evento drag

**`handleDragOver(e)`**
- **Qué hace:** Permite soltar (drop) en el área
- **Necesario:** Para que funcione el drag & drop

**`handleDrop(e, nivel)`**
- **Qué hace:** Ejecuta cuando sueltas un curso en un nivel
- **Lógica:**
  1. Obtiene datos del curso arrastrado
  2. Verifica si tiene prerequisitos (⚠️)
  3. Llama a endpoint con/sin prerequisitos
  4. Actualiza la UI

**`eliminarCursoMalla(mallaId)`**
- **Qué hace:** Elimina un curso de la malla
- **Llama:** DELETE al backend
- **Actualiza:** Recarga la malla

**`getCursoInfo(cursoId)`**
- **Qué hace:** Busca información completa de un curso por su ID
- **Uso:** Para mostrar detalles en las tarjetas

**`creditosPorNivel(nivel)`**
- **Qué hace:** Suma créditos de todos los cursos en un nivel
- **Retorna:** Total de créditos del nivel

**`horasPorNivel(nivel)`**
- **Qué hace:** Suma horas de todos los cursos en un nivel
- **Retorna:** Total de horas semanales

**`validarCoherencia(...)`**
- **Qué hace:** Valida si la malla está coherente académicamente
- **Verifica:** 
  - Créditos no excedan el programa
  - Créditos mínimos cumplidos
- **Retorna:** Estado (ok/warning/error) y mensaje

---

### 📁 `frontend/lib/api.ts`
**Propósito:** Cliente HTTP para comunicación con backends

#### Objeto `apiClient`:

**`get(endpoint)`**
- **Qué hace:** Hace petición GET al backend
- **Ejemplo:** `apiClient.get('/api/cursos')`
- **Retorna:** Promesa con respuesta JSON

**`post(endpoint, data)`**
- **Qué hace:** Hace petición POST al backend
- **Ejemplo:** `apiClient.post('/api/mallas/MALLA001/cursos', {...})`
- **Envía:** Datos en formato JSON

**`put(endpoint, data)`**
- **Qué hace:** Hace petición PUT al backend
- **Uso:** Actualizar recursos

**`delete(endpoint)`**
- **Qué hace:** Hace petición DELETE al backend
- **Uso:** Eliminar cursos

**Nota:** `baseURL` es dinámico, cambia entre Flask (5000) y FastAPI (8002) según selector

---

### 📁 `frontend/lib/types.ts`
**Propósito:** Define tipos TypeScript para todo el frontend

#### Tipos:

**`Curso`**
- **Define:** Estructura de un curso
- **Campos:** id, nombre, codigo, creditos, prerequisitos, etc.

**`MallaCurso`**
- **Define:** Curso colocado en la malla
- **Campos:** id, curso_id, posicion_x, posicion_y, semestre

**`Malla`**
- **Define:** Malla académica completa
- **Campos:** id, nombre, cursos[], creditos_programa, numero_niveles

---

## 🔄 Flujo de Datos

### Flujo Drag & Drop Simple (Nivel 1):

```
1. Usuario arrastra curso desde carrito
   ↓
2. handleDragStart() guarda info del curso
   ↓
3. Usuario suelta en un nivel
   ↓
4. handleDrop() detecta el evento
   ↓
5. Llama a POST /api/mallas/{id}/cursos
   ↓
6. Backend guarda curso en memoria
   ↓
7. Frontend recarga la malla
   ↓
8. UI muestra el curso en el nivel
```

### Flujo con Prerequisitos (Nivel 2):

```
1. Usuario arrastra curso con ⚠️
   ↓
2. handleDrop() detecta que tiene prerequisitos
   ↓
3. Llama a POST /api/mallas/{id}/cursos-con-prerequisitos
   ↓
4. Backend ejecuta obtener_prerequisitos_recursivos()
   ↓
5. Backend agrega prerequisitos en niveles anteriores
   ↓
6. Backend agrega el curso principal
   ↓
7. Retorna lista de todos los cursos agregados
   ↓
8. Frontend recarga y muestra todos los cursos
```

---

## 📊 Datos de Ejemplo

El sistema incluye 10 cursos preconfigurados:

- **PROG101** - Introducción a la Programación (sin prerequisitos)
- **PROG102** - POO (requiere PROG101)
- **BD101** - Bases de Datos (requiere PROG101)
- **WEB101** - Desarrollo Web Frontend (requiere PROG101)
- **WEB102** - Desarrollo Web Backend (requiere WEB101 + BD101)
- Y más...

---

## 🎨 Diseño Visual Actual

**Colores:**
- Headers niveles: Gris #969592
- Tarjetas: Fondo blanco, borde gris claro
- Placeholders vacíos: Azul suave (bg-blue-50) con borde punteado
- Badges prerequisitos: Azul (bg-blue-500)
- Hover: Borde azul

**Layout:**
- Carrito: Horizontal arriba (scroll si hay muchos cursos)
- Malla: Grid de niveles abajo (hasta 12 niveles sin scroll)
- Placeholders: 4 cuadros por nivel vacío con texto "Arrastra un curso aquí"

---

## 🚀 Comandos Útiles

**Iniciar Flask:**
```powershell
cd backend
venv\Scripts\activate
python wsgi.py
```

**Iniciar FastAPI:**
```powershell
cd backend_fastapi
venv\Scripts\activate
python -m uvicorn main:app --reload --port 8002
```

**Iniciar Frontend:**
```powershell
cd frontend
npm run dev
```

---

**Versión:** 1.0.0  
**Última actualización:** Febrero 2026
