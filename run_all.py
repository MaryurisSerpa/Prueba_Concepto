"""
Script para ejecutar todos los servicios - Backends Independientes
Uso: python run_all.py
"""
import subprocess
import sys
import os
import time
from threading import Thread

def run_flask():
    """Ejecutar Flask backend"""
    print("\n" + "="*50)
    print("🔵 Iniciando Flask Backend (Puerto 5000)...")
    print("="*50)
    os.chdir('backend')
    subprocess.run([sys.executable, 'wsgi.py'])

def run_fastapi():
    """Ejecutar FastAPI backend"""
    print("\n" + "="*50)
    print("🟠 Iniciando FastAPI Backend (Puerto 8002)...")
    print("="*50)
    os.chdir(os.path.join('..', 'backend_fastapi'))
    subprocess.run([sys.executable, '-m', 'uvicorn', 'main:app', '--reload', '--port', '8002'])

def run_nextjs():
    """Ejecutar Next.js frontend"""
    print("\n" + "="*50)
    print("🟦 Iniciando Next.js Frontend (Puerto 3000)...")
    print("="*50)
    os.chdir(os.path.join('..', 'frontend'))
    subprocess.run(['npm', 'run', 'dev'])

if __name__ == '__main__':
    print("\n🚀 Iniciando Malla Académica - Backends Independientes\n")
    print("🎯 Objetivo: Comparar Flask vs FastAPI con el mismo frontend\n")
    
    # Crear threads para cada servicio
    threads = [
        Thread(target=run_flask, daemon=True),
        Thread(target=run_fastapi, daemon=True),
        Thread(target=run_nextjs, daemon=True),
    ]
    
    for thread in threads:
        thread.start()
        time.sleep(2)
    
    print("\n" + "="*50)
    print("✅ Todos los servicios se están iniciando...")
    print("="*50)
    print("\nServicios disponibles:")
    print("🔵 Flask Backend:   http://localhost:5000")
    print("🟠 FastAPI Backend: http://localhost:8002")
    print("🟦 Next.js Frontend: http://localhost:3000")
    print("\n🔄 Usa el selector en el header del frontend para cambiar entre backends")
    print("\nPresiona Ctrl+C para detener todos los servicios.")
    print("="*50 + "\n")
    
    try:
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        print("\n\n❌ Deteniendo servicios...")
        sys.exit(0)
