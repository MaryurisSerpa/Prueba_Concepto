'use client';

import React from 'react';
import { Curso, MallaCurso } from '@/lib/types';

interface CursoItemProps {
  mallaCurso: MallaCurso;
  curso?: Curso;
  isSelected: boolean;
  onSelect: () => void;
  onEliminar: () => void;
}

export default function CursoItem({
  mallaCurso,
  curso,
  isSelected,
  onSelect,
  onEliminar,
}: CursoItemProps) {
  if (!curso) return null;

  return (
    <div
      className={`curso-card ${isSelected ? 'curso-card.seleccionado' : ''}`}
      style={{
        left: `${mallaCurso.posicion_x}px`,
        top: `${mallaCurso.posicion_y}px`,
      }}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-sm">{curso.nombre}</div>
          <div className="text-xs opacity-90">{curso.codigo}</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEliminar();
          }}
          className="text-xl font-bold hover:bg-red-600 rounded-full w-6 h-6 flex items-center justify-center transition"
        >
          ×
        </button>
      </div>

      <div className="text-xs opacity-90 space-y-1">
        <div>💳 {curso.creditos} créditos</div>
        <div>📚 Semestre {mallaCurso.semestre}</div>
        {curso.prerequisitos.length > 0 && (
          <div>🔗 {curso.prerequisitos.length} prereq(s)</div>
        )}
      </div>
    </div>
  );
}
