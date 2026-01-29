# 🚀 Quick Start - Malla Académica

## Inicio en 5 minutos

### 1. Abre 3 terminales (PowerShell en Windows)

---

## 📍 Terminal 1: Flask Backend

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

## 📍 Terminal 2: FastAPI Microservicio

```powershell
cd microservicios/fastapi_analytics
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

**✅ Listo cuando veas:**
```
Uvicorn running on http://0.0.0.0:8001
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

## 🎮 Prueba las Funcionalidades

### Nivel 1: Drag & Drop
1. Click en "Nivel 1: Drag & Drop"
2. Arrastra un curso desde el panel
3. Suelta en el área blanca
4. ¡Curso agregado! ✅

### Nivel 2: Con Prerequisitos
1. Click en "Nivel 2: Con Prerequisitos"
2. Arrastra un curso con ⚠️ (tiene requisitos)
3. El sistema automáticamente:
   - Agrega los prerequisitos
   - Calcula estadísticas
   - Muestra recomendaciones

---

## 🔗 URLs Útiles

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:3000 |
| **Flask API** | http://localhost:5000 |
| **FastAPI Docs** | http://localhost:8001/docs |
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
