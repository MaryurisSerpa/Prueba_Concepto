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
  
  // Selección de backend
  const [backendActivo, setBackendActivo] = useState<'flask' | 'fastapi'>('flask');
  
  // Configuración del programa
  const [nombreMalla, setNombreMalla] = useState('');
  const [creditosPrograma, setCreditosPrograma] = useState(48);
  const [numeroniveles, setNumeroNiveles] = useState(4);
  const [periodoVigencia, setPeriodoVigencia] = useState('202420');
  const [estadoMalla, setEstadoMalla] = useState<'borrador' | 'publicado'>('borrador');
  
  // Datos
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);
  const [carrito, setCarrito] = useState<CursoEnCarrito[]>([]);
  const [carritoIndex, setCarritoIndex] = useState(0);
  const [malla, setMalla] = useState<Malla | null>(null);
  const [cursosMalla, setCursosMalla] = useState<{[nivel: number]: MallaCurso[]}>({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  
  const MALLA_ID = 'MALLA001';

  // Función para guardar la malla manualmente en estado borrador
  const guardarMalla = async () => {
    // Validar que el nombre no esté vacío
    if (!nombreMalla || nombreMalla.trim() === '') {
      alert(' Error: Debes ingresar un nombre para la malla antes de guardar');
      return;
    }
    
    try {
      // Guardar metadatos + estado como borrador
      await apiClient.put(`/api/mallas/${MALLA_ID}`, { 
        nombre: nombreMalla,
        creditos_programa: creditosPrograma,
        numero_niveles: numeroniveles,
        periodo_vigencia: periodoVigencia,
        estado: 'borrador',
        cursos: cursosMalla // Guardar TODOS los cursos
      });
      
      setEstadoMalla('borrador');
      
      // Mostrar resumen de lo guardado
      const totalCursosEnMalla = Object.values(cursosMalla).flat().length;
      alert(`✅ Malla guardada como BORRADOR\n\n📋 Resumen:\n• Nombre: ${nombreMalla}\n• Créditos configurados: ${creditosPrograma}\n• Niveles: ${numeroniveles}\n• Periodo: ${periodoVigencia}\n• Cursos agregados: ${totalCursosEnMalla}\n• Estado: BORRADOR\n\n💡 Puedes continuar editando en cualquier momento`);
    } catch (err) {
      console.error('Error al guardar malla:', err);
      alert(' Error al guardar la malla');
    }
  };

  // Cambiar URL base del API cuando cambia el backend
  useEffect(() => {
    const baseUrl = backendActivo === 'flask' ? 'http://localhost:5000' : 'http://localhost:8002';
    (apiClient as any).baseURL = baseUrl;
  }, [backendActivo]);

  useEffect(() => {
    const verificarServicios = async () => {
      try {
        const flaskRes = await apiClient.get('/health');
        
        if (flaskRes.status) {
          // Cargar datos
          const [mallaRes, cursosRes] = await Promise.all([
            apiClient.get(`/api/mallas/${MALLA_ID}`),
            apiClient.get('/api/cursos')
          ]);
          
          setMalla(mallaRes.malla);
          setCursosDisponibles(cursosRes.cursos);
          
          // Cargar configuración guardada de la malla
          if (mallaRes.malla.nombre) {
            setNombreMalla(mallaRes.malla.nombre);
          }
          if (mallaRes.malla.periodo_vigencia) {
            setPeriodoVigencia(mallaRes.malla.periodo_vigencia);
          }
          if (mallaRes.malla.creditos_programa) {
            setCreditosPrograma(mallaRes.malla.creditos_programa);
          }
          if (mallaRes.malla.numero_niveles) {
            setNumeroNiveles(mallaRes.malla.numero_niveles);
          }
          // Cargar estado si existe (borrador o publicado)
          if (mallaRes.malla.estado) {
            setEstadoMalla(mallaRes.malla.estado);
          }
          
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

  /**
   * Agrega un curso al carrito (panel horizontal superior).
   * 
   * Verifica que el curso no esté duplicado antes de agregarlo.
   * Marca si el curso tiene prerequisitos para mostrar el badge ⚠️.
   * 
   * @param curso - Objeto del curso a agregar
   * 
   * @example
   * <button onClick={() => agregarAlCarrito(curso)}>Agregar</button>
   */
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

  /**
   * Inicia el evento de arrastrar (drag) un curso.
   * 
   * Almacena el ID del curso en el dataTransfer para recuperarlo al soltar.
   * Si el curso ya está en la malla, también guarda su ID de malla.
   * 
   * @param e - Evento de drag de React
   * @param curso - Objeto del curso a arrastrar
   * @param mallaCursoId - ID opcional si el curso ya está en la malla
   * 
   * @example
   * // Arrastrar desde el carrito
   * onDragStart={(e) => handleDragStart(e, curso)}
   * 
   * // Arrastrar desde la malla (mover entre niveles)
   * onDragStart={(e) => handleDragStart(e, curso, "MALLA_PROG101_0")}
   */
  const handleDragStart = (e: React.DragEvent, curso: Curso | CursoEnCarrito, mallaCursoId?: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cursoId', curso.id);
    if (mallaCursoId) {
      e.dataTransfer.setData('mallaCursoId', mallaCursoId);
    }
  };

  /**
   * Maneja el evento de soltar (drop) un curso en un nivel.
   * 
   * Flujo:
   * 1. Recupera el curso desde dataTransfer
   * 2. Verifica si es movimiento dentro de malla o agregación nueva
   * 3. Si tiene prerequisitos (), llama al endpoint con análisis
   * 4. Si no, agrega solo el curso
   * 5. Actualiza la UI recargando la malla
   * 
   * @param e - Evento de drop de React
   * @param nivel - Número del nivel (semestre) donde se soltó el curso (1-12)
   * 
   * @example
   * // Zona de drop en nivel 3
   * onDrop={(e) => handleDrop(e, 3)}
   */
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
        const curso = cursosDisponibles.find(c => c.id === cursoMalla.curso_id);
        if (curso && curso.prerequisitos.length > 0) {
          // Encontrar el nivel máximo de los prerequisitos
          const nivelesPrereq = curso.prerequisitos
            .map((prereqId: string) => {
              const prereqEnMalla = malla.cursos.find(c => c.curso_id === prereqId);
              return prereqEnMalla ? prereqEnMalla.semestre : 0;
            })
            .filter((n: number) => n > 0);
          
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
    const cursoExistente = malla.cursos.find(c => c.curso_id === cursoId);
    if (cursoExistente) {
      const cursoInfo = getCursoInfo(cursoId);
      alert(`❌ Duplicidad no permitida\n\n` +
            `El curso "${cursoInfo?.nombre || 'desconocido'}" (${cursoInfo?.codigo || cursoId}) ` +
            `ya está agregado en Nivel ${cursoExistente.semestre}.\n\n` +
            `Cada curso solo puede aparecer una vez en la malla.`);
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

  /**
   * Elimina un curso de la malla académica.
   * 
   * Llama al endpoint DELETE y actualiza el estado local de la malla.
   * 
   * @param cursoMallaId - ID único del curso en la malla (ej: "MALLA_PROG101_0")
   * 
   * @example
   * <button onClick={() => eliminarCursoMalla("MALLA_PROG101_0")}>Eliminar</button>
   */
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

  /**
   * Obtiene la información completa de un curso por su ID.
   * 
   * Busca el curso en la lista de cursos disponibles.
   * Usado para mostrar detalles en las tarjetas de la malla.
   * 
   * @param cursoId - ID del curso a buscar (ej: "PROG101")
   * @returns Objeto Curso con toda la información o undefined si no existe
   * 
   * @example
   * const curso = getCursoInfo("PROG101");
   * if (curso) {
   *   console.log(curso.nombre, curso.creditos);
   * }
   */
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
            <p className="mt-2">2. Ejecuta FastAPI: <code className="bg-gray-800 text-green-400 px-2 py-1 rounded">cd backend_fastapi && python -m uvicorn main:app --reload --port 8002</code></p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular créditos por nivel y total
  /**
   * Calcula el total de créditos de todos los cursos en un nivel.
   * 
   * @param nivel - Número del nivel (1-12)
   * @returns Total de créditos en ese nivel
   * 
   * @example
   * const creditos = creditosPorNivel(1); // 12
   */
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
  /**
   * Calcula el total de horas semanales de todos los cursos en un nivel.
   * 
   * @param nivel - Número del nivel (1-12)
   * @returns Total de horas semanales en ese nivel
   * 
   * @example
   * const horas = horasPorNivel(1); // 16
   */
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      {/* Header Superior - Fondo azul claro degradado */}
      <header className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 py-8 px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              Diseño de Malla Curricular
            </h1>
            <p className="text-blue-100 text-lg font-medium">
              PROA – Programa de Optimización y Rediseño Académico
            </p>
          </div>
          
          {/* Toggle Visual Backend (estilo switch) */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg">
              <span className="text-white text-sm font-semibold tracking-wide">Backend:</span>
              <div className="relative inline-flex bg-white/30 rounded-full p-1">
                <button
                  onClick={() => setBackendActivo('flask')}
                  className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                    backendActivo === 'flask'
                      ? 'bg-white text-blue-600 shadow-lg scale-105'
                      : 'text-white hover:text-blue-100'
                  }`}
                >
                  Flask
                </button>
                <button
                  onClick={() => setBackendActivo('fastapi')}
                  className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                    backendActivo === 'fastapi'
                      ? 'bg-white text-blue-600 shadow-lg scale-105'
                      : 'text-white hover:text-blue-100'
                  }`}
                >
                  FastAPI
                </button>
              </div>
              {/* Indicador verde de estado activo */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  backendActivo === 'flask' ? 'bg-green-400' : 'bg-orange-400'
                } shadow-lg animate-pulse`}></div>
                <span className="text-white text-xs font-medium">Activo</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Card de Configuración - Full Width */}
      <div className="w-full px-2 py-4">
        <div className="bg-white rounded-lg shadow-xl border border-blue-100 p-4 mb-3">
            {/* Título de la card */}
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-100">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-800">Configuración de la malla</h2>
            </div>
          
          {/* Grid de inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Nombre de la malla */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Nombre de la malla
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nombreMalla}
                onChange={(e) => setNombreMalla(e.target.value)}
                className={`w-full border-2 rounded-lg px-4 py-3 font-medium focus:outline-none transition-all duration-200 ${
                  nombreMalla.trim() === '' 
                    ? 'border-red-300 bg-red-50 text-slate-800 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                    : 'border-gray-300 text-slate-800 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                }`}
                placeholder="Ej: Malla Académica Ingeniería 2024"
              />
              {nombreMalla.trim() === '' && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Este campo es requerido
                </p>
              )}
            </div>
            
            {/* Créditos del programa */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Créditos totales del programa
              </label>
              <Listbox value={creditosPrograma} onChange={setCreditosPrograma}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200">
                    <span className="block truncate font-bold text-gray-800">{creditosPrograma} créditos</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute z-10 mt-2 w-full overflow-auto rounded-lg bg-white py-1 shadow-2xl ring-1 ring-blue-200 focus:outline-none max-h-60">
                      {[36, 48, 60, 72, 84, 96].map((credito) => (
                        <Listbox.Option key={credito} value={credito} className={({ active }: {active: boolean}) => `relative cursor-pointer select-none py-3 pl-10 pr-4 ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}>
                          {({ selected }: {selected: boolean}) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-bold' : 'font-medium'}`}>{credito} créditos</span>
                              {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><CheckIcon className="h-6 w-6" aria-hidden="true" /></span>}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
            
            {/* Número de niveles */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Número de niveles
              </label>
              <Listbox value={numeroniveles} onChange={setNumeroNiveles}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200">
                    <span className="block truncate font-bold text-gray-800">{numeroniveles} niveles</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute z-10 mt-2 w-full overflow-auto rounded-lg bg-white py-1 shadow-2xl ring-1 ring-blue-200 focus:outline-none max-h-60">
                      {[4, 6, 8, 10, 12].map((nivel) => (
                        <Listbox.Option key={nivel} value={nivel} className={({ active }: {active: boolean}) => `relative cursor-pointer select-none py-3 pl-10 pr-4 ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}>
                          {({ selected }: {selected: boolean}) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-bold' : 'font-medium'}`}>{nivel} niveles</span>
                              {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><CheckIcon className="h-6 w-6" aria-hidden="true" /></span>}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
            
            {/* Periodo de vigencia */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Periodo de vigencia
              </label>
              <Listbox value={periodoVigencia} onChange={setPeriodoVigencia}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white py-3 pl-4 pr-10 text-left border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200">
                    <span className="block truncate font-bold text-gray-800">{periodoVigencia}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute z-10 mt-2 w-full overflow-auto rounded-xl bg-white py-1 shadow-2xl ring-1 ring-blue-200 focus:outline-none max-h-60">
                      {['202410', '202420', '202510', '202520', '202610', '202620'].map((periodo) => (
                        <Listbox.Option key={periodo} value={periodo} className={({ active }: {active: boolean}) => `relative cursor-pointer select-none py-3 pl-10 pr-4 ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}>
                          {({ selected }: {selected: boolean}) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-bold' : 'font-medium'}`}>{periodo}</span>
                              {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><CheckIcon className="h-6 w-6" aria-hidden="true" /></span>}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
          </div>
          
          {/* Botón Guardar Borrador */}
          <div className="mt-4 pt-3 border-t-2 border-blue-100 flex justify-end">
            <button 
              onClick={guardarMalla}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 transform hover:scale-105"
              title="Guarda la malla sin validaciones avanzadas para continuar editando después"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              💾 Guardar Borrador
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor para Carrito arriba y Malla abajo */}
      <div className="w-full px-2 pb-4">
        {/* Carrito de Cursos - Horizontal arriba */}
        <div className="mb-3">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-200 p-3">
            {/* Header con ícono, contadores y botón en una fila */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
                  <span className="text-2xl">🛒</span>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Carrito de Cursos</h2>
                  <p className="text-xs text-gray-500">Arrastra los cursos al diseñador de malla</p>
                </div>
                
                {/* Contadores */}
                <div className="flex gap-2 ml-4">
                  <div className="text-center bg-blue-50 rounded-lg px-3 py-1.5 border-2 border-blue-200">
                    <span className="text-lg font-extrabold text-blue-600">{carrito.length}</span>
                    <span className="text-xs font-semibold text-gray-600 uppercase ml-1">Cursos</span>
                  </div>
                  <div className="text-center bg-blue-50 rounded-lg px-3 py-1.5 border-2 border-blue-300">
                    <span className="text-lg font-extrabold text-blue-700">{creditosCarrito}</span>
                    <span className="text-xs font-semibold text-gray-600 uppercase ml-1">Créditos</span>
                  </div>
                </div>
              </div>
              
              {/* Botón agregar */}
              <button 
                onClick={() => setModalAbierto(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 transform hover:scale-105 text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Cursos
              </button>
            </div>
            
            {/* Lista de cursos - Horizontal con scroll */}
            <div className="overflow-x-auto scroll-smooth">
              {carrito.length > 0 ? (
                <div className="flex gap-3 pb-2">
                  {carrito.map((curso, idx) => (
                    <div 
                      key={`${curso.id}-${idx}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, curso)}
                      className={`flex-shrink-0 relative group cursor-grab active:cursor-grabbing
                                 bg-gradient-to-br rounded-lg p-4 shadow-lg hover:shadow-2xl 
                                 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
                                 animate-[slideIn_0.3s_ease-out]
                                 ${curso.tienePrereq 
                                   ? 'from-blue-100 to-blue-200 border-2 border-blue-400' 
                                   : 'from-blue-50 to-blue-100 border-2 border-blue-300'}`}
                      style={{ minWidth: '200px' }}
                    >
                      {/* Badge prerequisito */}
                      {curso.tienePrereq && (
                        <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                          ⚠️
                        </div>
                      )}
                      
                      {/* Contenido del curso */}
                      <div className="relative z-10">
                        <p className="font-extrabold text-gray-800 text-sm mb-1 line-clamp-2">{curso.nombre}</p>
                        <p className="text-xs text-gray-600 font-semibold">{curso.codigo}</p>
                        <div className="mt-2">
                          <div className="bg-white px-2 py-1 rounded-full inline-block">
                            <span className="text-blue-600 font-bold text-xs">{curso.creditos}c</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Efecto hover visual */}
                      <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                      ${curso.tienePrereq ? 'bg-blue-300/30' : 'bg-blue-200/30'}`}></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <div>
                      <p className="text-gray-600 font-semibold">El carrito está vacío</p>
                      <p className="text-gray-500 text-sm">Haz clic en "Agregar Cursos" para comenzar</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid de Niveles (Malla) - Debajo del carrito */}
        <div className="w-full">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Indicador de scroll */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs py-1 px-3 text-center font-medium">
            {numeroniveles > 12 && '← Desliza horizontalmente para ver todos los niveles →'}
            {numeroniveles <= 12 && `Plan de estudios - ${numeroniveles} niveles`}
          </div>
          <div className="overflow-x-auto scroll-smooth">
          <div className="flex">
            {Array.from({ length: numeroniveles }, (_, i) => i + 1).map((nivel) => (
              <div 
                key={nivel}
                className="flex-1 min-w-[110px] border-r border-gray-300 last:border-r-0 flex flex-col bg-gradient-to-b from-gray-50 to-white"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, nivel)}
              >
                {/* Header del nivel */}
                <div className="text-white text-center py-2.5 font-bold text-sm shadow-md border-b-2" style={{ backgroundColor: '#969592', borderColor: '#7a7773' }}>
                  <div className="text-xs opacity-80 uppercase tracking-wider">Nivel</div>
                  <div className="text-lg">{nivel}</div>
                </div>
                
                {/* Contenido del nivel */}
                <div className="flex-1 min-h-[320px] p-2 bg-slate-50/50 hover:bg-blue-50/30 transition-colors duration-200">
                  {cursosMalla[nivel]?.map((mallaCurso) => {
                    const curso = getCursoInfo(mallaCurso.curso_id);
                    if (!curso) return null;
                    
                    return (
                      <div 
                        key={mallaCurso.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, curso, mallaCurso.id)}
                        className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-2.5 mb-2 relative group cursor-move
                                   border-2 border-blue-200 shadow-md hover:shadow-xl hover:border-blue-400 hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200"
                      >
                        {/* Badge prereq */}
                        {curso.prerequisitos.length > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                            ⚠
                          </span>
                        )}
                        
                        {/* Info del curso */}
                        <p className="font-bold text-slate-800 text-xs leading-tight mb-1 pr-3">{curso.nombre}</p>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded">{curso.creditos}c</span>
                          <span className="text-xs text-slate-500">{curso.codigo}</span>
                        </div>
                        
                        {/* Botón eliminar */}
                        <button
                          onClick={() => eliminarCursoMalla(mallaCurso.id)}
                          className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white w-5 h-5 rounded-full text-xs font-bold
                                     opacity-0 group-hover:opacity-100 shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  
                  {/* Placeholders cuando está vacío */}
                  {(!cursosMalla[nivel] || cursosMalla[nivel].length === 0) && (
                    <>
                      {[1, 2, 3, 4].map((placeholder) => (
                        <div 
                          key={placeholder}
                          className="bg-blue-50 rounded-lg p-2.5 mb-2 border-2 border-dashed border-blue-200 h-[70px] flex items-center justify-center"
                        >
                          <p className="text-blue-300 text-xs font-medium text-center">Arrastra un curso aquí</p>
                        </div>
                      ))}
                    </>
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
          </div>
          
          {/* Footer con total de créditos de la malla */}
          <div className={`py-3 px-6 ${
            coherencia.estado === 'error' ? 'bg-gray-500' : 
            coherencia.estado === 'warning' ? 'bg-blue-400' : 
            'bg-blue-500'
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
                  coherencia.estado === 'ok' ? 'bg-blue-300' :
                  coherencia.estado === 'warning' ? 'bg-blue-400' :
                  'bg-gray-400'
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
                    coherencia.estado === 'ok' ? 'bg-blue-300' :
                    coherencia.estado === 'warning' ? 'bg-blue-400' :
                    'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min(100, (totalCreditosMalla / creditosPrograma) * 100)}%` }}
                />
              </div>
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
                  className="w-full px-4 py-3 pl-10 border-2 border-slate-300 rounded-lg focus:border-blue-400 focus:outline-none transition-colors"
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
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400'
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
                className="px-6 py-3 bg-slate-600 text-white rounded-lg font-medium shadow hover:bg-slate-700 hover:shadow-lg transition-all"
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

