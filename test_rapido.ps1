Write-Host "`n🏁 BENCHMARK RÁPIDO - Flask vs FastAPI`n" -ForegroundColor Cyan

# Verificar que los servicios estén corriendo
Write-Host "🔍 Verificando servicios..." -ForegroundColor Yellow
$flask_ok = $false
$fastapi_ok = $false

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 2
    $flask_ok = $true
    Write-Host "✅ Flask corriendo en puerto 5000" -ForegroundColor Green
} catch {
    Write-Host "❌ Flask NO está corriendo (puerto 5000)" -ForegroundColor Red
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8002/" -TimeoutSec 2
    $fastapi_ok = $true
    Write-Host "✅ FastAPI corriendo en puerto 8002" -ForegroundColor Green
} catch {
    Write-Host "❌ FastAPI NO está corriendo (puerto 8002)" -ForegroundColor Red
}

if (-not $flask_ok -or -not $fastapi_ok) {
    Write-Host "`n⚠️  Por favor inicia ambos servicios primero:" -ForegroundColor Yellow
    Write-Host "   Terminal 1: cd backend; python wsgi.py" -ForegroundColor White
    Write-Host "   Terminal 2: cd backend_fastapi; python -m uvicorn main:app --port 8002" -ForegroundColor White
    exit
}

Write-Host "`n⏳ Ejecutando 50 requests a cada servicio...`n" -ForegroundColor Cyan

# Test Flask
$tiempos_flask = @()
Write-Host "Probando Flask..." -ForegroundColor Yellow
$barra = 0
1..50 | ForEach-Object {
    $inicio = Get-Date
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/cursos" -TimeoutSec 5
        $fin = Get-Date
        $tiempos_flask += ($fin - $inicio).TotalMilliseconds
        
        # Barra de progreso simple
        if ($_ % 10 -eq 0) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    } catch {
        Write-Host "x" -NoNewline -ForegroundColor Red
    }
}
Write-Host ""

# Test FastAPI
$tiempos_fastapi = @()
Write-Host "Probando FastAPI..." -ForegroundColor Yellow
1..50 | ForEach-Object {
    $inicio = Get-Date
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8002/api/cursos" -TimeoutSec 5
        $fin = Get-Date
        $tiempos_fastapi += ($fin - $inicio).TotalMilliseconds
        
        if ($_ % 10 -eq 0) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    } catch {
        Write-Host "x" -NoNewline -ForegroundColor Red
    }
}
Write-Host "`n"

# Calcular estadísticas
$avg_flask = [math]::Round(($tiempos_flask | Measure-Object -Average).Average, 2)
$min_flask = [math]::Round(($tiempos_flask | Measure-Object -Minimum).Minimum, 2)
$max_flask = [math]::Round(($tiempos_flask | Measure-Object -Maximum).Maximum, 2)

$avg_fastapi = [math]::Round(($tiempos_fastapi | Measure-Object -Average).Average, 2)
$min_fastapi = [math]::Round(($tiempos_fastapi | Measure-Object -Minimum).Minimum, 2)
$max_fastapi = [math]::Round(($tiempos_fastapi | Measure-Object -Maximum).Maximum, 2)

# Mostrar resultados
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RESULTADOS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n🔵 FLASK (Puerto 5000):" -ForegroundColor Blue
Write-Host "   Promedio: $avg_flask ms" -ForegroundColor White
Write-Host "   Mínimo:   $min_flask ms" -ForegroundColor Green
Write-Host "   Máximo:   $max_flask ms" -ForegroundColor Red

Write-Host "`n🟢 FASTAPI (Puerto 8002):" -ForegroundColor Green
Write-Host "   Promedio: $avg_fastapi ms" -ForegroundColor White
Write-Host "   Mínimo:   $min_fastapi ms" -ForegroundColor Green
Write-Host "   Máximo:   $max_fastapi ms" -ForegroundColor Red

# Comparación
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🏆 COMPARACIÓN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$diferencia = [math]::Round((($avg_flask - $avg_fastapi) / $avg_flask) * 100, 1)

if ($avg_fastapi -lt $avg_flask) {
    Write-Host "`n🎯 FastAPI es $([math]::Abs($diferencia))% más rápido" -ForegroundColor Green
    Write-Host "   FastAPI: $avg_fastapi ms vs Flask: $avg_flask ms" -ForegroundColor White
    
    # Gráfico visual simple
    $ratio = [math]::Min([math]::Floor(($avg_flask / $avg_fastapi) * 10), 30)
    Write-Host "`n   Flask:   " -NoNewline
    Write-Host ("█" * 10) -ForegroundColor Blue
    Write-Host "   FastAPI: " -NoNewline
    Write-Host ("█" * [math]::Max(1, (10 - $ratio))) -ForegroundColor Green
    
} elseif ($avg_flask -lt $avg_fastapi) {
    Write-Host "`n🎯 Flask es $([math]::Abs($diferencia))% más rápido" -ForegroundColor Blue
    Write-Host "   Flask: $avg_flask ms vs FastAPI: $avg_fastapi ms" -ForegroundColor White
} else {
    Write-Host "`n🤝 Ambos tienen rendimiento similar" -ForegroundColor Yellow
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Test completado - $($tiempos_flask.Count) requests por servicio" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
