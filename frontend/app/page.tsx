'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { apiClient } from '@/lib/api';
import { Curso, Malla, MallaCurso } from '@/lib/types';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

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
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  
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

  const handleDragStart = (e: React.DragEvent, curso: Curso | CursoEnCarrito, mallaCursoId?: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cursoId', curso.id);
    if (mallaCursoId) {
      e.dataTransfer.setData('mallaCursoId', mallaCursoId);
    }
  };

  const handleDrop = async (e: React.DragEvent, nivel: number) => {
    e.preventDefault();
    const cursoId = e.dataTransfer.getData('cursoId');
    const mallaCursoId = e.dataTransfer.getData('mallaCursoId');
    
    if (!malla || !cursoId) return;

    // Si ya está en la malla (moviendo entre niveles)
    if (mallaCursoId) {
      // Validar que no se mueva antes de sus prerequisitos
      const cursoMalla = malla.cursos.find(c => c.id === mallaCursoId);
      if (cursoMalla) {
        const curso = cursos.find(c => c.id === cursoMalla.curso_id);
        if (curso && curso.prerequisitos.length > 0) {
          // Encontrar el nivel máximo de los prerequisitos
          const nivelesPrereq = curso.prerequisitos
            .map(prereqId => {
              const prereqEnMalla = malla.cursos.find(c => c.curso_id === prereqId);
              return prereqEnMalla ? prereqEnMalla.semestre : 0;
            })
            .filter(n => n > 0);
          
          if (nivelesPrereq.length > 0) {
            const nivelMaxPrereq = Math.max(...nivelesPrereq);
            if (nivel <= nivelMaxPrereq) {
              alert(`❌ No se puede mover el curso a Nivel ${nivel}\n\n` +
                    `Este curso tiene prerequisitos en Nivel ${nivelMaxPrereq}.\n` +
                    `Debe estar en Nivel ${nivelMaxPrereq + 1} o posterior.`);
              return;
            }
          }
        }
      }
      
      try {
        // Actualizar el semestre del curso existente
        const res = await apiClient.put(`/api/mallas/${malla.id}/cursos/${mallaCursoId}`, {
          semestre: nivel,
          posicion_x: 50,
          posicion_y: nivel * 100
        });

        if (res.exito) {
          // Actualizar la malla con el nuevo semestre
          const cursosActualizados = malla.cursos.map(c => 
            c.id === mallaCursoId ? { ...c, semestre: nivel } : c
          );
          setMalla({ ...malla, cursos: cursosActualizados });
        }
      } catch (err) {
        console.error('Error al mover curso:', err);
      }
      return;
    }

    // Verificar si ya está en la malla (nuevo desde carrito)
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
        
        // Mostrar información de prerequisitos agregados
        const info = res.info_niveles;
        if (res.prerequisitos_agregados && res.prerequisitos_agregados.length > 0) {
          if (info.ajustado) {
            alert(`✅ Curso agregado exitosamente!\n\n` +
                  `🔄 Nivel ajustado: ${info.nivel_solicitado} → ${info.nivel_usado}\n` +
                  `📚 ${res.prerequisitos_agregados.length} prerequisito(s) agregados automáticamente\n` +
                  `📊 Profundidad del árbol: ${info.profundidad_arbol} nivel(es)\n` +
                  `🎯 Nivel mínimo requerido: ${info.nivel_minimo}`);
          } else {
            alert(`✅ Curso agregado exitosamente!\n\n` +
                  `📚 ${res.prerequisitos_agregados.length} prerequisito(s) agregados automáticamente\n` +
                  `📊 Profundidad del árbol: ${info.profundidad_arbol} nivel(es)\n` +
                  `🎯 Nivel mínimo: ${info.nivel_minimo}`);
          }
        } else if (info.ajustado) {
          alert(`✅ Curso agregado!\n\n🔄 Nivel ajustado: ${info.nivel_solicitado} → ${info.nivel_usado}`);
        }
        
        // Quitar del carrito si está ahí
        quitarDelCarrito(cursoId);
      }
    } catch (err: any) {
      console.error('Error al agregar curso:', err);
      alert(`❌ ${err.message || 'Error al agregar el curso'}`);
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

  // Calcular horas por nivel y total
  const horasPorNivel = (nivel: number): number => {
    const cursosNivel = cursosMalla[nivel] || [];
    return cursosNivel.reduce((sum, mc) => {
      const curso = getCursoInfo(mc.curso_id);
      return sum + (curso?.horas || 0);
    }, 0);
  };

  const totalHorasMalla = Object.keys(cursosMalla).reduce((total, nivel) => {
    return total + horasPorNivel(Number(nivel));
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
            <Listbox value={creditosPrograma} onChange={setCreditosPrograma}>
              <div className="relative w-24">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors">
                  <span className="block truncate font-medium">{creditosPrograma}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {[36, 48, 60, 72].map((credito) => (
                      <Listbox.Option key={credito} value={credito} className={({ active }: {active: boolean}) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}>
                        {({ selected }: {selected: boolean}) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{credito}</span>
                            {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="font-semibold text-gray-700">Número de niveles:</label>
            <Listbox value={numeroniveles} onChange={setNumeroNiveles}>
              <div className="relative w-20">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors">
                  <span className="block truncate font-medium">{numeroniveles}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {[4, 6, 8, 10].map((nivel) => (
                      <Listbox.Option key={nivel} value={nivel} className={({ active }: {active: boolean}) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}>
                        {({ selected }: {selected: boolean}) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{nivel}</span>
                            {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="font-semibold text-gray-700">Periodo de vigencia:</label>
            <Listbox value={periodoVigencia} onChange={setPeriodoVigencia}>
              <div className="relative w-32">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors">
                  <span className="block truncate font-medium">{periodoVigencia}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {['202410', '202420', '202510', '202520'].map((periodo) => (
                      <Listbox.Option key={periodo} value={periodo} className={({ active }: {active: boolean}) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}>
                        {({ selected }: {selected: boolean}) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{periodo}</span>
                            {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
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
                        draggable
                        onDragStart={(e) => handleDragStart(e, curso, mallaCurso.id)}
                        className="bg-cyan-500 rounded-lg p-3 mb-2 relative group cursor-move
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
                        <p className="text-xs text-white/90 mt-1">{curso.creditos} créditos | {curso.horas || 48} horas</p>
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
                
                {/* Footer con créditos y horas del nivel */}
                <div className="bg-gray-200 text-center py-2 border-t border-gray-300">
                  <div className="text-sm font-semibold text-gray-700">
                    <span>Créditos: {creditosPorNivel(nivel)}</span>
                    <span className="mx-2">|</span>
                    <span>Horas: {horasPorNivel(nivel)}</span>
                  </div>
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
              {/* Estadísticas de créditos y horas */}
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm opacity-80">Total Créditos:</span>
                  <span className="text-xl font-bold ml-2">{totalCreditosMalla} / {creditosPrograma}</span>
                </div>
                <div className="border-l border-white/30 pl-6">
                  <span className="text-sm opacity-80">Total Horas:</span>
                  <span className="text-xl font-bold ml-2">{totalHorasMalla}</span>
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
                onClick={() => {
                  setModalAbierto(false);
                  setFiltroBusqueda(''); // Limpiar filtro al cerrar
                }}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-500 transition-all text-xl"
              >
                ×
              </button>
            </div>
            
            {/* Campo de búsqueda */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o descripción..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {filtroBusqueda && (
                <p className="text-sm text-gray-600 mt-2">
                  {cursosDisponibles.filter(curso => 
                    curso.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
                    curso.codigo.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
                    (curso.descripcion && curso.descripcion.toLowerCase().includes(filtroBusqueda.toLowerCase()))
                  ).length} cursos encontrados
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {cursosDisponibles
                .filter(curso => {
                  if (!filtroBusqueda) return true;
                  const busqueda = filtroBusqueda.toLowerCase();
                  return curso.nombre.toLowerCase().includes(busqueda) ||
                         curso.codigo.toLowerCase().includes(busqueda) ||
                         (curso.descripcion && curso.descripcion.toLowerCase().includes(busqueda));
                })
                .map((curso) => (
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
              
              {/* Mensaje cuando no hay resultados */}
              {cursosDisponibles.filter(curso => {
                if (!filtroBusqueda) return true;
                const busqueda = filtroBusqueda.toLowerCase();
                return curso.nombre.toLowerCase().includes(busqueda) ||
                       curso.codigo.toLowerCase().includes(busqueda) ||
                       (curso.descripcion && curso.descripcion.toLowerCase().includes(busqueda));
              }).length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 font-medium">No se encontraron cursos</p>
                  <p className="text-gray-400 text-sm mt-1">Intenta con otra búsqueda</p>
                </div>
              )}
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

