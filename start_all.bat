@echo off
echo.
echo ============================================================
echo   Malla Academica - Backends Independientes
echo   Comparacion: Flask vs FastAPI
echo ============================================================
echo.
echo Iniciando servicios...
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend" (
    echo ERROR: No se encuentra la carpeta backend
    echo Ejecuta este script desde la raiz del proyecto
    pause
    exit /b 1
)

echo [1/3] Iniciando Flask Backend (Puerto 5000)...
start "Flask Backend" cmd /k "cd backend && python wsgi.py"
timeout /t 3 /nobreak > nul

echo [2/3] Iniciando FastAPI Backend (Puerto 8002)...
start "FastAPI Backend" cmd /k "cd backend_fastapi && python -m uvicorn main:app --reload --port 8002"
timeout /t 3 /nobreak > nul

echo [3/3] Iniciando Next.js Frontend (Puerto 3000)...
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo ============================================================
echo   Servicios iniciados exitosamente!
echo ============================================================
echo.
echo   Flask Backend:   http://localhost:5000
echo   FastAPI Backend: http://localhost:8002
echo   Frontend:        http://localhost:3000
echo.
echo   Usa el selector en el header para cambiar entre backends
echo.
echo   Presiona cualquier tecla para cerrar esta ventana...
echo   (Las ventanas de los servicios seguiran abiertas)
echo ============================================================
pause > nul
