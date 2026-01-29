'use client';

import React, { useState, useEffect } from 'react';
import { Curso, Malla, MallaCurso } from '@/lib/types';
import { apiClient } from '@/lib/api';
import CursoItem from './CursoItem';
import CursosDisponibles from './CursosDisponibles';

interface MallaDesignProps {
  mallaId: string;
}

export default function MallaDesign({ mallaId }: MallaDesignProps) {
  const [malla, setMalla] = useState<Malla | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nivelIntegracion, setNivelIntegracion] = useState<'nivel1' | 'nivel2'>('nivel1');
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [mallaRes, cursosRes] = await Promise.all([
          apiClient.get(`/api/mallas/${mallaId}`),
          apiClient.get('/api/cursos')
        ]);

        setMalla(mallaRes.malla);
        setCursos(cursosRes.cursos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [mallaId]);

  const handleDragStart = (e: React.DragEvent, cursoId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cursoId', cursoId);
    e.dataTransfer.setData('tipo', 'disponible');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const posicion_x = e.clientX - rect.left;
    const posicion_y = e.clientY - rect.top;
    const cursoId = e.dataTransfer.getData('cursoId');
    const tipo = e.dataTransfer.getData('tipo');

    if (!malla || !cursoId) return;

    // Determinar semestre basado en posición vertical
    const semestre = Math.max(1, Math.ceil(posicion_y / 200));

    try {
      if (nivelIntegracion === 'nivel1') {
        // Nivel 1: Drag & drop simple
        const res = await apiClient.post(`/api/mallas/${malla.id}/cursos`, {
          curso_id: cursoId,
          posicion_x: Math.round(posicion_x),
          posicion_y: Math.round(posicion_y),
          semestre,
        });

        if (res.exito) {
          setMalla({
            ...malla,
            cursos: [...malla.cursos, res.curso]
          });
        }
      } else {
        // Nivel 2: Con análisis de prerequisitos
        const res = await apiClient.post(
          `/api/mallas/${malla.id}/cursos-con-prerequisitos`,
          {
            curso_id: cursoId,
            posicion_x: Math.round(posicion_x),
            posicion_y: Math.round(posicion_y),
            semestre,
          }
        );

        if (res.exito) {
          // Agregar curso principal
          const cursosActualizados = [...malla.cursos, res.curso_principal];
          
          // Agregar prerequisitos
          if (res.prerequisitos_agregados) {
            cursosActualizados.push(...res.prerequisitos_agregados);
          }

          setMalla({
            ...malla,
            cursos: cursosActualizados
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar curso');
    }
  };

  const handleEliminarCurso = async (cursoMallaId: string) => {
    if (!malla) return;

    try {
      const res = await apiClient.delete(
        `/api/mallas/${malla.id}/cursos/${cursoMallaId}`
      );

      if (res.exito) {
        setMalla({
          ...malla,
          cursos: malla.cursos.filter(c => c.id !== cursoMallaId)
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar curso');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  if (!malla) {
    return <div className="p-8 text-center">Malla no encontrada</div>;
  }

  return (
    <div className="flex h-screen gap-4 p-4 bg-gray-100">
      {/* Panel de cursos disponibles */}
      <CursosDisponibles
        cursos={cursos}
        onDragStart={handleDragStart}
      />

      {/* Área de diseño */}
      <div className="flex-1 flex flex-col">
        {/* Controles */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <div className="flex gap-4 items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{malla.nombre}</h2>
              <p className="text-sm text-gray-600">{malla.programa}</p>
            </div>

            {/* Toggle entre niveles */}
            <div className="flex gap-2">
              <button
                onClick={() => setNivelIntegracion('nivel1')}
                className={`px-4 py-2 rounded font-semibold transition ${
                  nivelIntegracion === 'nivel1'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                Nivel 1: Drag & Drop
              </button>
              <button
                onClick={() => setNivelIntegracion('nivel2')}
                className={`px-4 py-2 rounded font-semibold transition ${
                  nivelIntegracion === 'nivel2'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                Nivel 2: Con Prerequisitos
              </button>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold">Cursos: {malla.cursos.length}</p>
              <p className="text-sm text-gray-600">
                Créditos: {malla.cursos.reduce((sum, mc) => {
                  const curso = cursos.find(c => c.id === mc.curso_id);
                  return sum + (curso?.creditos || 0);
                }, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Canvas de malla */}
        <div
          className="flex-1 malla-container"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Renderizar cursos en la malla */}
          {malla.cursos.map((mallaCurso) => {
            const cursoData = cursos.find(c => c.id === mallaCurso.curso_id);
            return (
              <CursoItem
                key={mallaCurso.id}
                mallaCurso={mallaCurso}
                curso={cursoData}
                isSelected={cursoSeleccionado === mallaCurso.id}
                onSelect={() => setCursoSeleccionado(mallaCurso.id)}
                onEliminar={() => handleEliminarCurso(mallaCurso.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
