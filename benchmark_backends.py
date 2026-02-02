import requests
import time
import statistics

def benchmark_endpoint(url, iterations=100):
    """Mide tiempo de respuesta de un endpoint"""
    tiempos = []
    errores = 0
    
    print(f"\n🔍 Probando: {url}")
    print(f"Iteraciones: {iterations}")
    
    for i in range(iterations):
        try:
            inicio = time.perf_counter()
            response = requests.get(url, timeout=5)
            fin = time.perf_counter()
            
            if response.status_code == 200:
                tiempos.append((fin - inicio) * 1000)  # Convertir a ms
            else:
                errores += 1
                
        except Exception as e:
            errores += 1
            if i < 3:  # Solo mostrar primeros errores
                print(f"❌ Error en iteración {i}: {e}")
    
    if tiempos:
        print(f"\n📊 Resultados:")
        print(f"  ✅ Exitosas: {len(tiempos)}/{iterations}")
        print(f"  ❌ Errores: {errores}")
        print(f"  ⚡ Promedio: {statistics.mean(tiempos):.2f} ms")
        print(f"  📈 Mediana: {statistics.median(tiempos):.2f} ms")
        print(f"  🐌 Más lento: {max(tiempos):.2f} ms")
        print(f"  🚀 Más rápido: {min(tiempos):.2f} ms")
        print(f"  📉 Desv. estándar: {statistics.stdev(tiempos):.2f} ms")
        
        return {
            'promedio': statistics.mean(tiempos),
            'mediana': statistics.median(tiempos),
            'exitosas': len(tiempos),
            'errores': errores,
            'max': max(tiempos),
            'min': min(tiempos)
        }
    return None

def benchmark_post(url, iterations=50):
    """Mide tiempo de respuesta de un endpoint POST"""
    tiempos = []
    errores = 0
    
    print(f"\n🔍 Probando POST: {url}")
    print(f"Iteraciones: {iterations}")
    
    for i in range(iterations):
        try:
            inicio = time.perf_counter()
            response = requests.post(url, json={
                "curso_id": "PROG101",
                "nivel": 1,
                "posicion": 0
            }, timeout=5)
            fin = time.perf_counter()
            
            if response.status_code in [200, 201]:
                tiempos.append((fin - inicio) * 1000)
            else:
                errores += 1
        except Exception as e:
            errores += 1
            if i < 3:
                print(f"❌ Error: {e}")
    
    if tiempos:
        print(f"\n📊 Resultados POST:")
        print(f"  ✅ Exitosas: {len(tiempos)}/{iterations}")
        print(f"  ❌ Errores: {errores}")
        print(f"  ⚡ Promedio: {statistics.mean(tiempos):.2f} ms")
        print(f"  📈 Mediana: {statistics.median(tiempos):.2f} ms")
        
        return {
            'promedio': statistics.mean(tiempos),
            'exitosas': len(tiempos),
            'errores': errores
        }
    return None

# EJECUTAR BENCHMARKS
print("=" * 60)
print("🏁 BENCHMARK: Flask vs FastAPI")
print("=" * 60)
print("\n⏳ Esto tomará unos segundos...\n")

# Test 1: Listar cursos (GET simple)
print("\n" + "=" * 60)
print("TEST 1: GET /api/cursos (listar cursos)")
print("=" * 60)
flask_cursos = benchmark_endpoint("http://localhost:5000/api/cursos", 100)
fastapi_cursos = benchmark_endpoint("http://localhost:8002/api/cursos", 100)

# Test 2: Obtener malla (GET con lógica)
print("\n" + "=" * 60)
print("TEST 2: GET /api/mallas/MALLA001 (obtener malla)")
print("=" * 60)
flask_malla = benchmark_endpoint("http://localhost:5000/api/mallas/MALLA001", 100)
fastapi_malla = benchmark_endpoint("http://localhost:8002/api/mallas/MALLA001", 100)

# Test 3: POST agregar curso
print("\n" + "=" * 60)
print("TEST 3: POST /api/mallas/MALLA001/cursos (agregar curso)")
print("=" * 60)
flask_post = benchmark_post("http://localhost:5000/api/mallas/MALLA001/cursos", 50)
fastapi_post = benchmark_post("http://localhost:8002/api/mallas/MALLA001/cursos", 50)

# RESUMEN COMPARATIVO
print("\n" + "=" * 60)
print("🏆 RESUMEN COMPARATIVO")
print("=" * 60)

def comparar(nombre, flask_data, fastapi_data):
    if flask_data and fastapi_data:
        mejora = ((flask_data['promedio'] - fastapi_data['promedio']) / flask_data['promedio']) * 100
        ganador = "FastAPI" if fastapi_data['promedio'] < flask_data['promedio'] else "Flask"
        simbolo = "🟢" if ganador == "FastAPI" else "🔵"
        
        print(f"\n{nombre}:")
        print(f"  Flask:   {flask_data['promedio']:.2f} ms")
        print(f"  FastAPI: {fastapi_data['promedio']:.2f} ms")
        print(f"  {simbolo} Ganador: {ganador} ({abs(mejora):.1f}% {'más rápido' if mejora > 0 else 'más lento'})")

comparar("📦 GET /api/cursos", flask_cursos, fastapi_cursos)
comparar("🗂️ GET /api/mallas/MALLA001", flask_malla, fastapi_malla)
comparar("➕ POST /api/mallas/MALLA001/cursos", flask_post, fastapi_post)

print("\n" + "=" * 60)
print("✅ BENCHMARK COMPLETADO")
print("=" * 60)

# Calcular ganador general
if flask_cursos and fastapi_cursos and flask_malla and fastapi_malla:
    flask_avg = (flask_cursos['promedio'] + flask_malla['promedio']) / 2
    fastapi_avg = (fastapi_cursos['promedio'] + fastapi_malla['promedio']) / 2
    
    print(f"\n🎯 CONCLUSIÓN:")
    if fastapi_avg < flask_avg:
        mejora = ((flask_avg - fastapi_avg) / flask_avg) * 100
        print(f"   FastAPI es {mejora:.1f}% más rápido en promedio general")
    else:
        mejora = ((fastapi_avg - flask_avg) / fastapi_avg) * 100
        print(f"   Flask es {mejora:.1f}% más rápido en promedio general")
