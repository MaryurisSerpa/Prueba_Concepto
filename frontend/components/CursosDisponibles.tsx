'use client';

import React from 'react';
import { Curso } from '@/lib/types';

interface CursosDisponiblesProps {
  cursos: Curso[];
  onDragStart: (e: React.DragEvent, cursoId: string) => void;
}

export default function CursosDisponibles({
  cursos,
  onDragStart,
}: CursosDisponiblesProps) {
  const getDifficultyColor = (dificultad: string) => {
    switch (dificultad) {
      case 'facil':
        return 'bg-green-100 border-green-300';
      case 'intermedio':
        return 'bg-yellow-100 border-yellow-300';
      case 'difícil':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-blue-100 border-blue-300';
    }
  };

  return (
    <div className="w-80 bg-white rounded-lg shadow-lg p-4 overflow-y-auto">
      <h3 className="text-lg font-bold mb-4 sticky top-0 bg-white pb-2">
        Cursos Disponibles
      </h3>

      <div className="space-y-2">
        {cursos.map((curso) => (
          <div
            key={curso.id}
            draggable
            onDragStart={(e) => onDragStart(e, curso.id)}
            className={`p-3 border-2 rounded cursor-move transition hover:shadow-lg ${getDifficultyColor(
              curso.dificultad
            )}`}
          >
            <div className="font-semibold text-sm">{curso.nombre}</div>
            <div className="text-xs text-gray-600 mt-1">
              {curso.codigo} • {curso.creditos} créditos
            </div>
            {curso.prerequisitos.length > 0 && (
              <div className="text-xs text-orange-600 mt-1">
                 {curso.prerequisitos.length} prerequisito(s)
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">{curso.descripcion}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
