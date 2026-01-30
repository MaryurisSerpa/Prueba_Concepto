// Tipos para la aplicación
export interface Curso {
  id: string;
  nombre: string;
  codigo: string;
  creditos: number;
  semestre: number;
  descripcion?: string;
  prerequisitos: string[];
  dificultad: 'facil' | 'intermedio' | 'difícil';
  horas?: number;  // Horas estipuladas del curso
}

export interface MallaCurso {
  id: string;
  curso_id: string;
  posicion_x: number;
  posicion_y: number;
  semestre: number;
}

export interface Malla {
  id: string;
  nombre: string;
  programa: string;
  cursos: MallaCurso[];
  descripcion?: string;
  fecha_creacion?: string;
}

export interface CursoArrastrado {
  curso_id: string;
  posicion_x: number;
  posicion_y: number;
  semestre: number;
}

export interface PrerequisitosAnalysis {
  curso_id: string;
  curso_nombre: string;
  tiene_prerequisitos: boolean;
  prerequisitos: any[];
  analisis_complejidad: {
    nivel_prerequisitos: number;
    prerequisitos_faltantes: number;
    creditos_requeridos: number;
    puede_agregarse: boolean;
  };
}
