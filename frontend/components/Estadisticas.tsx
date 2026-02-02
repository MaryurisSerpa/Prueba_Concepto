'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface EstadisticasProps {
  mallaId: string;
}

export default function Estadisticas({ mallaId }: EstadisticasProps) {
  const [stats, setStats] = useState<any>(null);
  const [validacion, setValidacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarStats = async () => {
      try {
        // Nota: Este componente ya no se usa en la arquitectura actual
        // Los backends independientes no tienen endpoints de estadísticas separados
        // Las estadísticas se calculan en el frontend directamente
        
        setStats(null);
        setValidacion(null);
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarStats();
  }, [mallaId]);

  if (loading || !stats) {
    return <div className="p-4 text-center">Cargando estadísticas...</div>;
  }

  return (
    <div className="stats-panel space-y-4">
      <h3 className="text-lg font-bold">Estadísticas y Análisis</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded">
          <div className="text-sm text-gray-600">Total de Cursos</div>
          <div className="text-2xl font-bold">{stats.total_cursos_malla}</div>
        </div>

        <div className="bg-white p-3 rounded">
          <div className="text-sm text-gray-600">Total de Créditos</div>
          <div className="text-2xl font-bold">{stats.total_creditos}</div>
        </div>

        <div className="bg-white p-3 rounded">
          <div className="text-sm text-gray-600">Promedio de Créditos</div>
          <div className="text-2xl font-bold">{stats.promedio_creditos_semestre}</div>
        </div>

        <div className="bg-white p-3 rounded">
          <div className="text-sm text-gray-600">Carga Académica</div>
          <div className="text-xl font-bold">{stats.carga_academica}</div>
        </div>
      </div>

      {validacion && (
        <div className="bg-white p-4 rounded space-y-3">
          <h4 className="font-bold">Validaciones del Plan</h4>
          
          {validacion.recomendaciones && validacion.recomendaciones.length > 0 && (
            <div className="bg-blue-50 p-3 rounded">
              <h5 className="font-semibold text-blue-900 mb-2">Recomendaciones:</h5>
              <ul className="space-y-1">
                {validacion.recomendaciones.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm text-blue-800">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
