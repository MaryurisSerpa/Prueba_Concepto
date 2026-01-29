'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Curso, Malla, MallaCurso } from '@/lib/types';

interface CursoEnCarrito extends Curso {
  tienePrereq?: boolean;
  tieneCoreq?: boolean;
}

export default function Home() {
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [mensaje, setMensaje] = useState('Verificando conexión con servicios...');
  
  // Configuración del programa
  const [creditosPrograma, setCreditosPrograma] = useState(48);
  const [numeroniveles, setNumeroNiveles] = useState(4);
  const [periodoVigencia, setPeriodoVigencia] = useState('202420');
  
  // Datos
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);
  const [carrito, setCarrito] = useState<CursoEnCarrito[]>([]);
  const [carritoIndex, setCarritoIndex] = useState(0);
  const [malla, setMalla] = useState<Malla | null>(null);
  const [cursosMalla, setCursosMalla] = useState<{[nivel: number]: MallaCurso[]}>({});
  const [modalAbierto, setModalAbierto] = useState(false);
  
  const MALLA_ID = 'MALLA001';

  useEffect(() => {
    const verificarServicios = async () => {
      try {
        const flaskRes = await apiClient.get('/health');
        const fastApiRes = await fetch('http://localhost:8001/').then(r => r.json());
        
        if (flaskRes.status && fastApiRes.mensaje) {
          // Cargar datos
          const [mallaRes, cursosRes] = await Promise.all([
            apiClient.get(`/api/mallas/${MALLA_ID}`),
            apiClient.get('/api/cursos')
          ]);
          
          setMalla(mallaRes.malla);
          setCursosDisponibles(cursosRes.cursos);
          
          // Organizar cursos por nivel
          const porNivel: {[nivel: number]: MallaCurso[]} = {};
          for (let i = 1; i <= numeroniveles; i++) {
            porNivel[i] = mallaRes.malla.cursos.filter((c: MallaCurso) => c.semestre === i);
          }
          setCursosMalla(porNivel);
          
          setEstado('listo');
          setMensaje('Todos los servicios están conectados');
        }
      } catch (err) {
        setEstado('error');
        setMensaje('Error de conexión con los servicios');
      }
    };

    verificarServicios();
  }, []);

  // Actualizar cursos por nivel cuando cambia la malla
  useEffect(() => {
    if (malla) {
      const porNivel: {[nivel: number]: MallaCurso[]} = {};
      for (let i = 1; i <= numeroniveles; i++) {
        porNivel[i] = malla.cursos.filter((c: MallaCurso) => c.semestre === i);
      }
      setCursosMalla(porNivel);
    }
  }, [malla, numeroniveles]);

  const agregarAlCarrito = (curso: Curso) => {
    if (!carrito.find(c => c.id === curso.id)) {
      setCarrito([...carrito, { 
        ...curso, 
        tienePrereq: curso.prerequisitos.length > 0,
        tieneCoreq: false 
      }]);
    }
  };

  const quitarDelCarrito = (cursoId: string) => {
    setCarrito(carrito.filter(c => c.id !== cursoId));
    if (carritoIndex >= carrito.length - 1) {
      setCarritoIndex(Math.max(0, carrito.length - 2));
    }
  };

  const creditosCarrito = carrito.reduce((sum, c) => sum + c.creditos, 0);

  const handleDragStart = (e: React.DragEvent, curso: Curso | CursoEnCarrito) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cursoId', curso.id);
  };

  const handleDrop = async (e: React.DragEvent, nivel: number) => {
    e.preventDefault();
    const cursoId = e.dataTransfer.getData('cursoId');
    
    if (!malla || !cursoId) return;

    // Verificar si ya está en la malla
    if (malla.cursos.find(c => c.curso_id === cursoId)) {
      alert('Este curso ya está en la malla');
      return;
    }

    try {
      const res = await apiClient.post(`/api/mallas/${malla.id}/cursos-con-prerequisitos`, {
        curso_id: cursoId,
        posicion_x: 50,
        posicion_y: nivel * 100,
        semestre: nivel,
      });

      if (res.exito) {
        const cursosActualizados = [...malla.cursos, res.curso_principal];
        if (res.prerequisitos_agregados) {
          cursosActualizados.push(...res.prerequisitos_agregados);
        }
        setMalla({ ...malla, cursos: cursosActualizados });
        
        // Quitar del carrito si está ahí
        quitarDelCarrito(cursoId);
      }
    } catch (err) {
      console.error('Error al agregar curso:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const eliminarCursoMalla = async (cursoMallaId: string) => {
    if (!malla) return;
    
    try {
      const res = await apiClient.delete(`/api/mallas/${malla.id}/cursos/${cursoMallaId}`);
      if (res.exito) {
        setMalla({
          ...malla,
          cursos: malla.cursos.filter(c => c.id !== cursoMallaId)
        });
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const getCursoInfo = (cursoId: string): Curso | undefined => {
    return cursosDisponibles.find(c => c.id === cursoId);
  };

  if (estado === 'cargando') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center bg-white/20 backdrop-blur-lg rounded-3xl p-10 shadow-2xl">
          <div className="animate-spin text-5xl mb-4">⚙️</div>
          <h1 className="text-3xl font-bold text-white">Cargando...</h1>
          <p className="text-white/80 mt-2">{mensaje}</p>
        </div>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-400 to-red-600">
        <div className="text-center max-w-md p-8 bg-white rounded-3xl shadow-2xl">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Conexión</h1>
          <p className="text-gray-700 mb-4">{mensaje}</p>
          <div className="bg-gray-100 p-4 rounded-2xl text-left text-sm">
            <p>1. Ejecuta Flask: <code className="bg-gray-800 text-green-400 px-2 py-1 rounded-lg">python backend/wsgi.py</code></p>
            <p className="mt-2">2. Ejecuta FastAPI: <code className="bg-gray-800 text-green-400 px-2 py-1 rounded-lg">python -m uvicorn main:app --port 8001</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex">
      {/* Main Content - Left Side */}
      <div className="flex-1 p-6">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 mb-6 shadow-xl">
          <h1 className="text-4xl font-bold text-center text-white drop-shadow-lg">
            ✨ Diseño de Malla Académica
          </h1>
        </header>

        {/* Panel de Configuración */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 mb-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            ⚙️ Configuración del Programa
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-full shadow-sm hover:shadow-md transition-all">
              <label className="font-medium text-sm text-gray-700">Créditos</label>
              <select 
                value={creditosPrograma}
                onChange={(e) => setCreditosPrograma(Number(e.target.value))}
                className="bg-white px-4 py-2 rounded-full border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value={36}>36</option>
                <option value={48}>48</option>
                <option value={60}>60</option>
                <option value={72}>72</option>
              </select>
            </div>
            
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 rounded-full shadow-sm hover:shadow-md transition-all">
              <label className="font-medium text-sm text-gray-700">Niveles</label>
              <select 
                value={numeroniveles}
                onChange={(e) => setNumeroNiveles(Number(e.target.value))}
                className="bg-white px-4 py-2 rounded-full border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-colors"
              >
                <option value={4}>4</option>
                <option value={6}>6</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
              </select>
            </div>
            
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-teal-50 px-4 py-3 rounded-full shadow-sm hover:shadow-md transition-all">
              <label className="font-medium text-sm text-gray-700">Periodo</label>
              <select 
                value={periodoVigencia}
                onChange={(e) => setPeriodoVigencia(e.target.value)}
                className="bg-white px-4 py-2 rounded-full border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
              >
                <option value="202410">202410</option>
                <option value="202420">202420</option>
                <option value="202510">202510</option>
                <option value="202520">202520</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 mb-6">
          <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
            📦 Agregar Agrupación
          </button>
          <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
            📋 Nuevo requisito
          </button>
          <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
            🔗 Relacionar cursos
          </button>
        </div>

        {/* Grid de Niveles */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl">
          <div className="flex">
            {Array.from({ length: numeroniveles }, (_, i) => i + 1).map((nivel) => (
              <div 
                key={nivel}
                className="flex-1 border-r border-gray-200 last:border-r-0 group/nivel"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, nivel)}
              >
                {/* Header del nivel */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-4 font-bold text-lg shadow-md">
                  📚 Nivel {nivel}
                </div>
                
                {/* Contenido del nivel */}
                <div className="min-h-[450px] p-3 bg-gradient-to-b from-gray-50 to-white group-hover/nivel:bg-gradient-to-b group-hover/nivel:from-indigo-50 group-hover/nivel:to-white transition-all duration-300">
                  {cursosMalla[nivel]?.map((mallaCurso) => {
                    const curso = getCursoInfo(mallaCurso.curso_id);
                    if (!curso) return null;
                    
                    return (
                      <div 
                        key={mallaCurso.id}
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl p-3 mb-3 relative group cursor-pointer
                                   shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300"
                      >
                        {/* Badges */}
                        <div className="flex gap-1 mb-2">
                          {curso.prerequisitos.length > 0 && (
                            <span className="text-xs bg-white/30 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium">
                              🔒 pre-req
                            </span>
                          )}
                        </div>
                        
                        {/* Info del curso */}
                        <p className="font-bold text-white text-sm drop-shadow">{curso.nombre}</p>
                        <p className="text-xs text-white/90 mt-1">💎 {curso.creditos} créditos</p>
                        <p className="text-xs text-white/80">{curso.codigo}</p>
                        
                        {/* Botón eliminar */}
                        <button
                          onClick={() => eliminarCursoMalla(mallaCurso.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full text-sm font-bold
                                     opacity-0 group-hover:opacity-100 shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-200"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  
                  {/* Zona de drop vacía */}
                  {(!cursosMalla[nivel] || cursosMalla[nivel].length === 0) && (
                    <div className="h-full flex items-center justify-center text-gray-400 border-3 border-dashed border-gray-300 rounded-2xl min-h-[120px] 
                                    hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300">
                      <div className="text-center">
                        <span className="text-3xl">📥</span>
                        <p className="mt-2 font-medium">Arrastra cursos aquí</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carrito de Cursos - Right Sidebar */}
      <div className="w-80 bg-white/95 backdrop-blur-lg shadow-2xl p-5 flex flex-col border-l border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
            🛒 Carrito de cursos
          </h2>
          <span className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
            {carrito.length}
          </span>
        </div>
        
        {/* Curso visible en carrito */}
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={() => setCarritoIndex(Math.max(0, carritoIndex - 1))}
            className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all disabled:opacity-40 disabled:hover:scale-100"
            disabled={carritoIndex === 0 || carrito.length === 0}
          >
            ‹
          </button>
          
          <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 min-h-[120px] shadow-inner">
            {carrito.length > 0 && carrito[carritoIndex] ? (
              <div 
                draggable
                onDragStart={(e) => handleDragStart(e, carrito[carritoIndex])}
                className="cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
              >
                <div className="flex gap-2 mb-2">
                  {carrito[carritoIndex].tienePrereq && (
                    <span className="text-xs bg-gradient-to-r from-orange-400 to-red-400 text-white px-3 py-1 rounded-full font-medium shadow">
                      🔒 pre-req
                    </span>
                  )}
                </div>
                <p className="font-bold text-gray-800">{carrito[carritoIndex].nombre}</p>
                <p className="text-sm text-indigo-600 font-medium mt-1">💎 {carrito[carritoIndex].creditos} créditos</p>
                <p className="text-sm text-gray-500">{carrito[carritoIndex].codigo}</p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <span className="text-3xl">📭</span>
                  <p className="mt-2 text-sm">Carrito vacío</p>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setCarritoIndex(Math.min(carrito.length - 1, carritoIndex + 1))}
            className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all disabled:opacity-40 disabled:hover:scale-100"
            disabled={carritoIndex >= carrito.length - 1 || carrito.length === 0}
          >
            ›
          </button>
        </div>
        
        {/* Stats del carrito */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Cursos:</span>
            <span className="font-bold text-indigo-600">{carrito.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Créditos:</span>
            <span className="font-bold text-purple-600">{creditosCarrito}</span>
          </div>
        </div>
        
        {/* Botón agregar */}
        <button 
          onClick={() => setModalAbierto(true)}
          className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg
                     shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
        >
          ➕ Agregar cursos
        </button>
        
        {/* Lista de cursos en carrito */}
        <div className="flex-1 mt-4 overflow-auto">
          <h3 className="font-semibold text-gray-700 mb-3">En carrito:</h3>
          <div className="space-y-2">
            {carrito.map((curso, idx) => (
              <div 
                key={curso.id}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  idx === carritoIndex 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setCarritoIndex(idx)}
              >
                <p className="font-medium text-sm truncate">{curso.nombre}</p>
                <p className={`text-xs ${idx === carritoIndex ? 'text-white/80' : 'text-gray-500'}`}>
                  {curso.creditos} créditos
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para agregar cursos */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[85vh] overflow-auto shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                📚 Seleccionar Cursos
              </h2>
              <button 
                onClick={() => setModalAbierto(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-500 transition-all"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {cursosDisponibles.map((curso) => (
                <div 
                  key={curso.id}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    carrito.find(c => c.id === curso.id) 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg' 
                      : 'bg-gray-100 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100'
                  }`}
                  onClick={() => {
                    if (carrito.find(c => c.id === curso.id)) {
                      quitarDelCarrito(curso.id);
                    } else {
                      agregarAlCarrito(curso);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{curso.nombre}</p>
                      <p className={`text-sm ${carrito.find(c => c.id === curso.id) ? 'text-white/80' : 'text-gray-600'}`}>
                        {curso.codigo}
                      </p>
                      <p className="text-sm font-medium mt-1">💎 {curso.creditos} créditos</p>
                      {curso.prerequisitos.length > 0 && (
                        <p className={`text-xs mt-1 ${carrito.find(c => c.id === curso.id) ? 'text-white/70' : 'text-orange-600'}`}>
                          🔒 Pre-req: {curso.prerequisitos.join(', ')}
                        </p>
                      )}
                    </div>
                    {carrito.find(c => c.id === curso.id) && (
                      <span className="text-2xl">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setModalAbierto(false)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                ✓ Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

