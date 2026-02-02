# 🚀 Quick Start - Malla Académica

## Inicio en 5 minutos - Backends Independientes

### 1. Abre 3 terminales (PowerShell en Windows)

---

## 📍 Terminal 1: Flask Backend (Puerto 5000)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python wsgi.py
```

**✅ Listo cuando veas:**
```
Running on http://0.0.0.0:5000
```

---

## 📍 Terminal 2: FastAPI Backend (Puerto 8002)

```powershell
cd backend_fastapi
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8002
```

**✅ Listo cuando veas:**
```
Uvicorn running on http://0.0.0.0:8002
```

---

## 📍 Terminal 3: Next.js Frontend

```powershell
cd frontend
npm install
npm run dev
```

**✅ Listo cuando veas:**
```
▲ Next.js 14
  - Local:        http://localhost:3000
```

---

## 🎉 ¡Abre el navegador!

Accede a: **http://localhost:3000**

---

## 🔄 Cambiar entre Backends

En el **header del frontend** encontrarás:

```
Backend: [Flask] [FastAPI]
```

- **Click en Flask** → Usa el backend Flask (puerto 5000)
- **Click en FastAPI** → Usa el backend FastAPI (puerto 8002)

¡El cambio es instantáneo sin recargar la página!

---

## 🎮 Prueba las Funcionalidades

### Drag & Drop con Validación
1. Haz click en "+ Agregar cursos" 
2. Selecciona cursos del catálogo
3. Arrastra desde el carrito a un nivel
4. El sistema:
   - Agrega prerequisitos automáticamente
   - Valida duplicidad
   - Ajusta niveles si es necesario
   - Calcula créditos y horas

### Mover Cursos entre Niveles
1. Arrastra un curso ya agregado
2. Suéltalo en otro nivel
3. El sistema valida que no vaya antes de sus prerequisitos

### Auto-guardado
- Escribe un nuevo nombre de malla
- Se guarda automáticamente después de 1 segundo

---

## 🔗 URLs Útiles

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:3000 |
| **Flask Backend** | http://localhost:5000 |
| **FastAPI Backend** | http://localhost:8002 |
| **FastAPI Docs** | http://localhost:8002/docs |
| **Flask Health** | http://localhost:5000/health |

---

## 🆘 Troubleshooting

### "El puerto ya está en uso"
```powershell
# Mata el proceso (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "ModuleNotFoundError"
```powershell
# Verifica que estés en el venv correcto
which python  # o where python en Windows
```

### "npm: No se reconoce el término"
```powershell
# Node.js no está instalado
# Descargalo de: https://nodejs.org
```

### FastAPI no responde
```powershell
# Instala las dependencias
cd microservicios/fastapi_analytics
pip install -r requirements.txt
```

---

## 📊 Datos de Prueba

### Cursos sin Prerequisitos (fácil)
- **PROG101**: Introducción a la Programación
- **MATH101**: Cálculo I
- **MATH102**: Álgebra Lineal

### Cursos con Prerequisitos (intermedio)
- **PROG102**: Requiere PROG101
- **BD101**: Requiere PROG101
- **WEB101**: Requiere PROG102

### Cursos Avanzados (difícil)
- **PROG104**: Requiere PROG103
- **WEB102**: Requiere WEB101 + BD101

---

## 🔍 Verificar Conexión

```powershell
# En otra terminal
curl http://localhost:5000/health
curl http://localhost:8001/
```

Ambos deben responder con JSON ✅

---

## 📚 Más Información

Ver [README.md](../README.md) para documentación completa

---

**Versión:** 1.0.0  
**Stack:** Flask + FastAPI + Next.js  
**Enero 2026**
