'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Curso, Malla, MallaCurso } from '@/lib/types';

// Información del proyecto PoC PROA
const PROYECTO_INFO = {
  nombre: 'PROA - Programa de Optimización y Rediseño Académico',
  desarrollador: 'Maryuris Serpa',
  stack: {
    backend: 'Flask + FastAPI',
    frontend: 'Next.js + TypeScript'
  },
  version: '1.0.0'
};

interface CursoEnCarrito extends Curso {
  tienePrereq?: boolean;
  tieneCoreq?: boolean;
}

// Función para validar coherencia académica
const validarCoherencia = (
  cursosMalla: {[nivel: number]: MallaCurso[]}, 
  cursosInfo: Curso[],
  totalCreditos: number,
  creditosObjetivo: number
): { estado: 'ok' | 'warning' | 'error', mensaje: string } => {
  // Verificar créditos
  if (totalCreditos > creditosObjetivo) {
    return { estado: 'error', mensaje: `Excede ${totalCreditos - creditosObjetivo} créditos del objetivo` };
  }
  if (totalCreditos < creditosObjetivo * 0.8) {
    return { estado: 'warning', mensaje: `Faltan ${creditosObjetivo - totalCreditos} créditos para el objetivo` };
  }
  return { estado: 'ok', mensaje: 'Malla coherente académicamente' };
};

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
        <div className="text-center bg-white/20 backdrop-blur-lg rounded-xl p-10 shadow-2xl">
          <div className="animate-spin text-5xl mb-4">
            <svg className="w-12 h-12 mx-auto text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Cargando...</h1>
          <p className="text-white/80 mt-2">{mensaje}</p>
        </div>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-400 to-red-600">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-2xl">
          <div className="text-6xl mb-4 text-red-500">X</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Conexión</h1>
          <p className="text-gray-700 mb-4">{mensaje}</p>
          <div className="bg-gray-100 p-4 rounded-lg text-left text-sm">
            <p>1. Ejecuta Flask: <code className="bg-gray-800 text-green-400 px-2 py-1 rounded">python backend/wsgi.py</code></p>
            <p className="mt-2">2. Ejecuta FastAPI: <code className="bg-gray-800 text-green-400 px-2 py-1 rounded">python -m uvicorn main:app --port 8001</code></p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular créditos por nivel y total
  const creditosPorNivel = (nivel: number): number => {
    const cursosNivel = cursosMalla[nivel] || [];
    return cursosNivel.reduce((sum, mc) => {
      const curso = getCursoInfo(mc.curso_id);
      return sum + (curso?.creditos || 0);
    }, 0);
  };

  const totalCreditosMalla = Object.keys(cursosMalla).reduce((total, nivel) => {
    return total + creditosPorNivel(Number(nivel));
  }, 0);

  // Calcular coherencia académica
  const coherencia = validarCoherencia(cursosMalla, cursosDisponibles, totalCreditosMalla, creditosPrograma);
  
  // Calcular duración estimada del programa
  const nivelesUsados = Object.keys(cursosMalla).filter(n => cursosMalla[Number(n)]?.length > 0).length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header - Nombre de la página (ocupa toda la parte superior) */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 py-4 px-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              DISEÑO DE MALLA CURRICULAR
            </h1>
            <p className="text-blue-200 text-sm">{PROYECTO_INFO.nombre}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-white font-medium">Desarrollador: {PROYECTO_INFO.desarrollador}</p>
            <p className="text-blue-200">Stack: {PROYECTO_INFO.stack.backend} | {PROYECTO_INFO.stack.frontend}</p>
          </div>
        </div>
      </header>

      {/* Configuración del Programa (ocupa toda la parte superior) */}
      <div className="bg-white border-b border-gray-300 py-4 px-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-gray-700">Créditos del programa:</label>
            <select 
              value={creditosPrograma}
              onChange={(e) => setCreditosPrograma(Number(e.target.value))}
              className="bg-white px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value={36}>36</option>
              <option value={48}>48</option>
              <option value={60}>60</option>
              <option value={72}>72</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="font-semibold text-gray-700">Número de niveles:</label>
            <select 
              value={numeroniveles}
              onChange={(e) => setNumeroNiveles(Number(e.target.value))}
              className="bg-white px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="font-semibold text-gray-700">Periodo de vigencia:</label>
            <select 
              value={periodoVigencia}
              onChange={(e) => setPeriodoVigencia(e.target.value)}
              className="bg-white px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="202410">202410</option>
              <option value="202420">202420</option>
              <option value="202510">202510</option>
              <option value="202520">202520</option>
            </select>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-blue-700 hover:shadow-lg transition-all">
              Agregar Agrupación
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-green-700 hover:shadow-lg transition-all">
              Nuevo requisito
            </button>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-orange-700 hover:shadow-lg transition-all">
              Relacionar cursos
            </button>
          </div>
        </div>
      </div>

      {/* Carrito de Cursos - Horizontal en la parte inferior del header */}
      <div className="bg-gray-200 border-b border-gray-300 py-3 px-6">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg text-gray-800 whitespace-nowrap">Carrito de cursos:</h2>
          
          {/* Cursos en el carrito - Horizontal */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto py-2">
            {carrito.length > 0 ? (
              carrito.map((curso, idx) => (
                <div 
                  key={curso.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, curso)}
                  className={`flex-shrink-0 bg-white border-2 rounded-lg p-3 cursor-grab active:cursor-grabbing
                             shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200
                             ${curso.tienePrereq ? 'border-orange-400' : 'border-blue-400'}`}
                  style={{ minWidth: '160px' }}
                >
                  {curso.tienePrereq && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium mb-1 inline-block">
                      pre-req
                    </span>
                  )}
                  <p className="font-bold text-gray-800 text-sm">{curso.nombre}</p>
                  <p className="text-xs text-gray-600">{curso.codigo}</p>
                  <p className="text-xs text-blue-600 font-medium">{curso.creditos} créditos</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No hay cursos en el carrito. Haz clic en "Agregar cursos" para comenzar.</p>
            )}
          </div>
          
          {/* Stats y botón */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">{carrito.length}</span> cursos | 
              <span className="font-semibold ml-1">{creditosCarrito}</span> créditos
            </div>
            <button 
              onClick={() => setModalAbierto(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-blue-700 hover:shadow-lg transition-all whitespace-nowrap"
            >
              + Agregar cursos
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Niveles (Malla) */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex">
            {Array.from({ length: numeroniveles }, (_, i) => i + 1).map((nivel) => (
              <div 
                key={nivel}
                className="flex-1 border-r border-gray-200 last:border-r-0 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, nivel)}
              >
                {/* Header del nivel */}
                <div className="bg-blue-600 text-white text-center py-3 font-bold text-base shadow-sm">
                  Nivel {nivel}
                </div>
                
                {/* Contenido del nivel */}
                <div className="flex-1 min-h-[350px] p-3 bg-gray-50 hover:bg-blue-50 transition-colors duration-200">
                  {cursosMalla[nivel]?.map((mallaCurso) => {
                    const curso = getCursoInfo(mallaCurso.curso_id);
                    if (!curso) return null;
                    
                    return (
                      <div 
                        key={mallaCurso.id}
                        className="bg-cyan-500 rounded-lg p-3 mb-2 relative group cursor-pointer
                                   shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200"
                      >
                        {/* Badge prereq */}
                        {curso.prerequisitos.length > 0 && (
                          <span className="text-xs bg-white/30 text-white px-2 py-0.5 rounded font-medium mb-1 inline-block">
                            pre-req
                          </span>
                        )}
                        
                        {/* Info del curso */}
                        <p className="font-bold text-white text-sm">{curso.nombre}</p>
                        <p className="text-xs text-white/90 mt-1">{curso.creditos} créditos</p>
                        <p className="text-xs text-white/80">{curso.codigo}</p>
                        
                        {/* Botón eliminar */}
                        <button
                          onClick={() => eliminarCursoMalla(mallaCurso.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-sm font-bold
                                     opacity-0 group-hover:opacity-100 shadow-lg hover:bg-red-600 transition-all duration-200"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  
                  {/* Zona de drop vacía */}
                  {(!cursosMalla[nivel] || cursosMalla[nivel].length === 0) && (
                    <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg min-h-[100px] 
                                    hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                      <p className="text-center font-medium">Arrastra cursos aquí</p>
                    </div>
                  )}
                </div>
                
                {/* Footer con créditos del nivel */}
                <div className="bg-gray-200 text-center py-2 border-t border-gray-300">
                  <span className="text-sm font-semibold text-gray-700">
                    Créditos: {creditosPorNivel(nivel)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer con total de créditos de la malla */}
          <div className={`py-3 px-6 ${
            coherencia.estado === 'error' ? 'bg-red-600' : 
            coherencia.estado === 'warning' ? 'bg-amber-500' : 
            'bg-blue-700'
          } text-white`}>
            <div className="flex justify-between items-center">
              {/* Estadísticas de créditos */}
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm opacity-80">Total Créditos:</span>
                  <span className="text-xl font-bold ml-2">{totalCreditosMalla} / {creditosPrograma}</span>
                </div>
                <div className="border-l border-white/30 pl-6">
                  <span className="text-sm opacity-80">Niveles usados:</span>
                  <span className="text-xl font-bold ml-2">{nivelesUsados} / {numeroniveles}</span>
                </div>
                <div className="border-l border-white/30 pl-6">
                  <span className="text-sm opacity-80">Cursos:</span>
                  <span className="text-xl font-bold ml-2">{malla?.cursos.length || 0}</span>
                </div>
              </div>
              
              {/* Indicador de coherencia */}
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-lg font-medium ${
                  coherencia.estado === 'ok' ? 'bg-green-500' :
                  coherencia.estado === 'warning' ? 'bg-amber-600' :
                  'bg-red-500'
                }`}>
                  {coherencia.estado === 'ok' ? 'Coherente' : 
                   coherencia.estado === 'warning' ? 'Revisar' : 'Excedido'}
                </div>
                <span className="text-sm max-w-xs">{coherencia.mensaje}</span>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="mt-3">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    coherencia.estado === 'ok' ? 'bg-green-400' :
                    coherencia.estado === 'warning' ? 'bg-amber-300' :
                    'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(100, (totalCreditosMalla / creditosPrograma) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para agregar cursos */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Seleccionar Cursos
              </h2>
              <button 
                onClick={() => setModalAbierto(false)}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-500 transition-all text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {cursosDisponibles.map((curso) => (
                <div 
                  key={curso.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-2 ${
                    carrito.find(c => c.id === curso.id) 
                      ? 'bg-green-100 border-green-500' 
                      : 'bg-gray-50 border-gray-200 hover:border-blue-400'
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
                      <p className="font-bold text-gray-800">{curso.nombre}</p>
                      <p className="text-sm text-gray-600">{curso.codigo}</p>
                      <p className="text-sm font-medium text-blue-600 mt-1">{curso.creditos} créditos</p>
                      {curso.prerequisitos.length > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          Pre-req: {curso.prerequisitos.join(', ')}
                        </p>
                      )}
                    </div>
                    {carrito.find(c => c.id === curso.id) && (
                      <span className="text-green-500 text-2xl font-bold">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setModalAbierto(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 hover:shadow-lg transition-all"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

